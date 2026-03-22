import { useState, useEffect } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { collection, query, where, orderBy, limit, getDocs, startAfter, httpsCallable } from '../firebase.js';

const PAGE_SIZE = 20;

export default function NotificationsScreen({
  user, db, functions, setScreen, prevScreen, setToast, viewProfile,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [lastDoc, setLastDoc]             = useState(null);
  const [hasMore, setHasMore]             = useState(true);

  // ── Load on mount + mark all read ──
  useEffect(() => {
    if (!db || !user) return;
    loadPage(true);
    markAllRead();
  }, [db, user]);

  async function loadPage(isFirst = false) {
    if (isFirst) {
      setLoading(true);
      setNotifications([]);
      setLastDoc(null);
      setHasMore(true);
    } else {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
    }

    try {
      const base = [
        collection(db, "notifications"),
        where("recipientId", "==", user.uid),
        orderBy("createdAt", "desc"),
      ];

      const q = isFirst || !lastDoc
        ? query(...base, limit(PAGE_SIZE))
        : query(...base, startAfter(lastDoc), limit(PAGE_SIZE));

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (isFirst) setNotifications(docs);
      else setNotifications(prev => [...prev, ...docs]);

      if (snap.docs.length > 0) setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length >= PAGE_SIZE);
    } catch (e) {
      console.warn("NotificationsScreen loadPage error:", e);
    }

    if (isFirst) setLoading(false);
    else setLoadingMore(false);
  }

  async function markAllRead() {
    if (!functions) return;
    try {
      const fn = httpsCallable(functions, "markNotificationsRead");
      await fn({});
    } catch (e) {
      console.warn("markAllRead error:", e);
    }
  }

  // ── Tap handler ──
  function handleTap(notif) {
    if (notif.type === "follow") {
      viewProfile(notif.actorId);
    } else {
      setScreen("feed");
    }
  }

  // ── Relative time formatter ──
  function fmtTime(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // ── Avatar renderer ──
  function renderAvatar(notif) {
    const size = 40;
    if (notif.actorAvatarUrl) {
      return (
        <img src={notif.actorAvatarUrl} alt="" referrerPolicy="no-referrer"
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
            border: "1.5px solid rgba(201,169,110,0.25)", flexShrink: 0 }} />
      );
    }
    const initial = (notif.actorName || "?")[0].toUpperCase();
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.06))",
        border: "1.5px solid rgba(201,169,110,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: DISPLAY, fontSize: "1rem", fontWeight: 700, color: B.goldL }}>
        {initial}
      </div>
    );
  }

  // ── Type icon badge ──
  function typeIcon(type) {
    if (type === "follow") {
      return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
    }
    if (type === "like") {
      return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
    }
    if (type === "comment") {
      return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={B.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    }
    return null;
  }

  // ── Action text for subtitle ──
  function actionText(type) {
    if (type === "follow") return "started following you";
    if (type === "like") return "prayed for your prayer";
    if (type === "comment") return "commented on your prayer";
    return "";
  }

  // ── Notification row ──
  function NotifRow({ notif, index }) {
    const isUnread = notif.read === false;
    return (
      <div onClick={() => handleTap(notif)}
        style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          background: isUnread ? "rgba(201,169,110,0.07)" : "rgba(255,255,255,0.025)",
          border: `1px solid ${isUnread ? "rgba(201,169,110,0.18)" : "rgba(201,169,110,0.07)"}`,
          borderLeft: isUnread ? "3px solid rgba(201,169,110,0.55)" : "1px solid rgba(201,169,110,0.07)",
          borderRadius: 12, padding: "14px 16px",
          cursor: "pointer", transition: "all 0.2s",
          animation: `fadeUp .5s ${index * 0.04}s ease both`, opacity: 0,
        }}>
        {/* Avatar with type badge */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {renderAvatar(notif)}
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            width: 18, height: 18, borderRadius: "50%",
            background: B.nightM, border: "1.5px solid rgba(201,169,110,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {typeIcon(notif.type)}
          </div>
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: SANS, fontSize: "0.82rem",
            color: isUnread ? "rgba(255,248,232,0.85)" : "rgba(255,248,232,0.55)",
            lineHeight: 1.45,
          }}>
            <span style={{ fontWeight: 600, color: isUnread ? B.goldL : "rgba(255,248,232,0.6)" }}>{notif.actorName || "Someone"}</span>
            {" "}{actionText(notif.type)}
          </div>

          {/* Post preview (like/comment only) */}
          {notif.postPreview && (
            <div style={{
              fontFamily: SERIF, fontStyle: "italic",
              fontSize: "0.75rem", color: "rgba(255,248,232,0.28)",
              lineHeight: 1.35, marginTop: 4,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              "{notif.postPreview}"
            </div>
          )}

          {/* Timestamp */}
          <div style={{
            fontFamily: SANS, fontSize: "0.66rem",
            color: "rgba(255,248,232,0.22)", marginTop: 5,
          }}>
            {fmtTime(notif.createdAt)}
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, fontFamily: SANS,
        background: `linear-gradient(180deg, ${B.night} 0%, ${B.nightM} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{GFONTS}{CSS}</style>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem",
          color: "rgba(255,248,232,0.35)", animation: "fadeUp .6s ease both" }}>
          Gathering your notifications...
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: SANS,
      background: `linear-gradient(180deg, ${B.night} 0%, ${B.nightM} 100%)` }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 80px" }}>

          {/* Back button */}
          <button onClick={() => setScreen(prevScreen || "map")}
            style={{ background: "rgba(26,22,18,0.55)", backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(201,169,110,0.12)", borderRadius: 999,
              padding: "8px 20px", cursor: "pointer",
              color: "rgba(180,165,148,0.55)", fontFamily: SANS, fontSize: "0.78rem",
              marginBottom: 28, transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: 6,
              animation: "fadeUp .6s ease both" }}
            onMouseEnter={e => e.target.style.color = B.gold}
            onMouseLeave={e => e.target.style.color = "rgba(180,165,148,0.55)"}>
            Back to village
          </button>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 28,
            animation: "fadeUp .6s .1s ease both", opacity: 0 }}>
            <h1 style={{ fontFamily: DISPLAY, fontSize: "1.5rem", fontWeight: 700,
              color: B.goldL, margin: "0 0 6px",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
              Notifications
            </h1>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem",
              color: "rgba(255,248,232,0.35)", margin: 0 }}>
              Recent activity from your community
            </p>
          </div>

          {/* Empty state */}
          {notifications.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 60,
              animation: "fadeUp .6s .2s ease both", opacity: 0 }}>
              <div style={{ fontSize: "2rem", marginBottom: 12, opacity: 0.3 }}></div>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem",
                color: "rgba(255,248,232,0.25)", lineHeight: 1.6, margin: 0 }}>
                No notifications yet
              </p>
              <p style={{ fontFamily: SANS, fontSize: "0.72rem",
                color: "rgba(255,248,232,0.15)", marginTop: 8 }}>
                When someone follows you, prays for your prayer, or leaves encouragement, it will appear here.
              </p>
            </div>
          )}

          {/* Notification list */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notifications.map((notif, i) => (
                <NotifRow key={notif.id} notif={notif} index={i} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && notifications.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={() => loadPage(false)} disabled={loadingMore}
                style={{ background: "rgba(201,169,110,0.08)",
                  border: "1px solid rgba(201,169,110,0.15)", borderRadius: 999,
                  padding: "8px 24px", cursor: loadingMore ? "wait" : "pointer",
                  fontFamily: SANS, fontSize: "0.74rem", fontWeight: 600,
                  color: B.gold, transition: "all 0.2s",
                  opacity: loadingMore ? 0.5 : 1 }}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}

          {/* End of notifications */}
          {!hasMore && notifications.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 24, padding: "16px 0" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.78rem",
                color: "rgba(255,248,232,0.2)", margin: 0 }}>
                You're all caught up
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
