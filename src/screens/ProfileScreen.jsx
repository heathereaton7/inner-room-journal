import { useState, useEffect } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { doc, getDoc, httpsCallable } from '../firebase.js';

export default function ProfileScreen({
  user, db, functions, profileUserId,
  setScreen, prevScreen, setToast,
}) {
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user?.uid === profileUserId;

  // ── Load profile + follow state on mount ──
  useEffect(() => {
    if (!db || !profileUserId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Fetch profile doc
        const profileDoc = await getDoc(doc(db, "userProfiles", profileUserId));
        if (cancelled) return;
        if (!profileDoc.exists()) {
          setToast({ msg: "Profile not found", emoji: "\u274C" });
          setScreen(prevScreen || "map");
          return;
        }
        setProfile({ id: profileUserId, ...profileDoc.data() });

        // Check follow state (only for other users)
        if (user && user.uid !== profileUserId) {
          const followDoc = await getDoc(doc(db, "follows", `${user.uid}_${profileUserId}`));
          if (!cancelled) setIsFollowing(followDoc.exists());
        }
      } catch (e) {
        console.warn("ProfileScreen load error:", e);
        if (!cancelled) setToast({ msg: "Could not load profile", emoji: "\u274C" });
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [db, profileUserId, user]);

  // ── Follow / Unfollow handler ──
  async function handleFollowToggle() {
    if (!functions || !user || followLoading) return;
    setFollowLoading(true);
    try {
      const fnName = isFollowing ? "unfollowUser" : "followUser";
      const fn = httpsCallable(functions, fnName);
      await fn({ targetUserId: profileUserId });

      // Optimistic toggle for instant UI feedback
      setIsFollowing(!isFollowing);
      setProfile(prev => prev ? {
        ...prev,
        followersCount: (prev.followersCount || 0) + (isFollowing ? -1 : 1),
      } : prev);

      setToast({ msg: isFollowing ? "Unfollowed" : "Following!", emoji: isFollowing ? "\uD83D\uDC4B" : "\u2728" });

      // Refetch profile from backend to sync counters
      try {
        const freshDoc = await getDoc(doc(db, "userProfiles", profileUserId));
        if (freshDoc.exists()) {
          setProfile({ id: profileUserId, ...freshDoc.data() });
        }
      } catch (_) { /* optimistic state is fine as fallback */ }
    } catch (e) {
      const msg = e?.message || (isFollowing ? "Could not unfollow" : "Could not follow");
      setToast({ msg, emoji: "\u274C" });
    }
    setFollowLoading(false);
  }

  // ── Avatar renderer ──
  function renderAvatar() {
    const size = 72;
    const avatarUrl = profile?.avatarUrl || (isOwnProfile && user?.photoURL ? user.photoURL : null);

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: size, height: size, borderRadius: "50%",
            objectFit: "cover",
            border: `2px solid rgba(201,169,110,0.3)`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        />
      );
    }

    // Fallback: first letter in styled circle
    const initial = (profile?.username || "?")[0].toUpperCase();
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.08))",
        border: "2px solid rgba(201,169,110,0.3)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: DISPLAY, fontSize: "1.6rem", fontWeight: 700,
        color: B.goldL,
      }}>
        {initial}
      </div>
    );
  }

  // ── Stat cell ──
  function StatCell({ value, label, delay }) {
    return (
      <div style={{
        flex: 1, textAlign: "center", padding: "14px 0",
        animation: `fadeUp .6s ${delay}s ease both`, opacity: 0,
      }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: "1.4rem", fontWeight: 700,
          color: B.gold, lineHeight: 1,
        }}>
          {value ?? 0}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: "0.62rem", fontWeight: 500,
          color: "rgba(255,248,232,0.35)", textTransform: "uppercase",
          letterSpacing: "0.06em", marginTop: 4,
        }}>
          {label}
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, overflow: "hidden", fontFamily: SANS,
        background: `linear-gradient(180deg, ${B.night} 0%, ${B.nightM} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <style>{GFONTS}{CSS}</style>
        <div style={{
          fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem",
          color: "rgba(255,248,232,0.35)", animation: "fadeUp .6s ease both",
        }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ── Main render ──
  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden", fontFamily: SANS,
      background: `linear-gradient(180deg, ${B.night} 0%, ${B.nightM} 100%)`,
    }}>
      <style>{GFONTS}{CSS}</style>

      <div style={{
        height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "28px 22px 80px" }}>

          {/* Back button */}
          <button
            onClick={() => setScreen(prevScreen || "map")}
            style={{
              background: "rgba(26,22,18,0.55)", backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(201,169,110,0.12)", borderRadius: 999,
              padding: "8px 20px", cursor: "pointer",
              color: "rgba(180,165,148,0.55)", fontFamily: SANS, fontSize: "0.78rem",
              marginBottom: 36, transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: 6,
              animation: "fadeUp .6s ease both",
            }}
            onMouseEnter={e => e.target.style.color = B.gold}
            onMouseLeave={e => e.target.style.color = "rgba(180,165,148,0.55)"}
          >
            Back to village
          </button>

          {/* Profile card */}
          <div style={{
            textAlign: "center",
            animation: "fadeUp .6s .1s ease both", opacity: 0,
          }}>

            {/* Avatar */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              {renderAvatar()}
            </div>

            {/* Display name */}
            <h1 style={{
              fontFamily: DISPLAY, fontSize: "1.5rem", fontWeight: 700,
              color: B.goldL, margin: "0 0 6px",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}>
              {profile.username || "Anonymous Traveler"}
            </h1>

            {/* Subtitle */}
            {isOwnProfile && (
              <div style={{
                fontFamily: SANS, fontSize: "0.68rem", fontWeight: 500,
                color: "rgba(201,169,110,0.4)", textTransform: "uppercase",
                letterSpacing: "0.08em", marginBottom: 6,
              }}>
                Your profile
              </div>
            )}

            {/* Bio */}
            <p style={{
              fontFamily: SERIF, fontStyle: "italic", fontSize: "0.88rem",
              color: "rgba(255,248,232,0.5)", margin: "0 0 28px",
              lineHeight: 1.5, maxWidth: 300, marginLeft: "auto", marginRight: "auto",
            }}>
              {profile.bio || (isOwnProfile ? "No bio yet" : "")}
            </p>
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,169,110,0.1)",
            borderRadius: 16, marginBottom: 28,
            overflow: "hidden",
          }}>
            <StatCell value={profile.followersCount} label="Followers" delay={0.2} />
            <div style={{ width: 1, background: "rgba(201,169,110,0.08)", margin: "10px 0" }} />
            <StatCell value={profile.followingCount} label="Following" delay={0.25} />
            <div style={{ width: 1, background: "rgba(201,169,110,0.08)", margin: "10px 0" }} />
            <StatCell value={profile.postsCount} label="Posts" delay={0.3} />
          </div>

          {/* Follow / Following button (only for other users) */}
          {!isOwnProfile && user && (
            <div style={{
              textAlign: "center",
              animation: "fadeUp .6s .35s ease both", opacity: 0,
            }}>
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                style={{
                  background: isFollowing
                    ? "rgba(201,169,110,0.18)"
                    : "rgba(201,169,110,0.08)",
                  border: `1px solid ${isFollowing ? "rgba(201,169,110,0.35)" : "rgba(201,169,110,0.2)"}`,
                  borderRadius: 999, padding: "10px 36px",
                  cursor: followLoading ? "wait" : "pointer",
                  fontFamily: SANS, fontSize: "0.82rem", fontWeight: 600,
                  color: isFollowing ? B.goldL : B.gold,
                  letterSpacing: "0.03em",
                  transition: "all 0.25s ease",
                  opacity: followLoading ? 0.6 : 1,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
                onMouseEnter={e => {
                  if (!followLoading) {
                    e.currentTarget.style.background = isFollowing
                      ? "rgba(180,80,80,0.15)"
                      : "rgba(201,169,110,0.2)";
                    if (isFollowing) e.currentTarget.style.color = "rgba(220,120,120,0.8)";
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isFollowing
                    ? "rgba(201,169,110,0.18)"
                    : "rgba(201,169,110,0.08)";
                  e.currentTarget.style.color = isFollowing ? B.goldL : B.gold;
                }}
              >
                {followLoading
                  ? "..."
                  : isFollowing
                    ? "\u2713 Following"
                    : "Follow"
                }
              </button>
            </div>
          )}

          {/* Level badge */}
          {profile.level && (
            <div style={{
              textAlign: "center", marginTop: 24,
              animation: "fadeUp .6s .4s ease both", opacity: 0,
            }}>
              <span style={{
                fontFamily: SANS, fontSize: "0.68rem", fontWeight: 500,
                color: "rgba(201,169,110,0.35)", textTransform: "uppercase",
                letterSpacing: "0.06em",
                background: "rgba(201,169,110,0.06)",
                border: "1px solid rgba(201,169,110,0.08)",
                borderRadius: 999, padding: "5px 16px",
              }}>
                Level {profile.level}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
