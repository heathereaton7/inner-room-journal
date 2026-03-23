import { useState, useEffect } from 'react';
import { B, SERIF, SANS, DISPLAY, GFONTS } from '../constants.js';
import { CSS } from '../styles.js';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, httpsCallable, startAfter } from '../firebase.js';
import PostCard from '../components/PostCard.jsx';

const PAGE_SIZE = 20;

export default function FeedScreen({
  user, db, functions, setScreen, prevScreen, setToast, addCandles, viewProfile,
  trackMission, onBack,
}) {
  const [feedPosts, setFeedPosts]       = useState([]);
  const [feedLoading, setFeedLoading]   = useState(true);
  const [feedMode, setFeedMode]         = useState("following");
  const [hasFollows, setHasFollows]     = useState(false);
  const [prayedIds, setPrayedIds]       = useState(new Set());
  const [expandedCmt, setExpandedCmt]   = useState(null);
  const [cmtCache, setCmtCache]         = useState({});
  const [cmtText, setCmtText]           = useState("");
  const [cmtLoading, setCmtLoading]     = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [lastDoc, setLastDoc]           = useState(null);
  const [hasMore, setHasMore]           = useState(true);
  const [followingIds, setFollowingIds] = useState([]);

  // ── Load feed on mount ──
  useEffect(() => {
    if (!db || !user) return;
    loadFeed();
  }, [db, user]);

  async function loadFeed(mode) {
    setFeedLoading(true);
    setFeedPosts([]);
    setLastDoc(null);
    setHasMore(true);

    try {
      // Step 1: Get who user follows
      let fIds = followingIds;
      if (fIds.length === 0) {
        const fSnap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
        fIds = fSnap.docs.map(d => d.data().followingId).slice(0, 30);
        setFollowingIds(fIds);
        setHasFollows(fIds.length > 0);
      }

      const useMode = mode || (fIds.length > 0 ? "following" : "recent");
      setFeedMode(useMode);

      // Step 2: Query posts
      let q;
      if (useMode === "following" && fIds.length > 0) {
        q = query(collection(db, "posts"), where("authorId", "in", fIds), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      } else {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFeedPosts(posts);

      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }
      setHasMore(snap.docs.length >= PAGE_SIZE);

      // If following mode returned nothing, auto-switch to recent
      if (useMode === "following" && posts.length === 0 && fIds.length > 0) {
        setFeedMode("recent");
        const fallbackQ = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
        const fallbackSnap = await getDocs(fallbackQ);
        const fallbackPosts = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFeedPosts(fallbackPosts);
        if (fallbackSnap.docs.length > 0) setLastDoc(fallbackSnap.docs[fallbackSnap.docs.length - 1]);
        setHasMore(fallbackSnap.docs.length >= PAGE_SIZE);
        await checkLiked(fallbackPosts);
      } else {
        await checkLiked(posts);
      }
    } catch (e) {
      console.warn("loadFeed error:", e);
    }
    setFeedLoading(false);
  }

  async function checkLiked(posts) {
    if (!user || posts.length === 0) return;
    try {
      const checks = await Promise.all(posts.map(p => getDoc(doc(db, "posts", p.id, "likes", user.uid))));
      const ids = new Set();
      checks.forEach((s, i) => { if (s.exists()) ids.add(posts[i].id); });
      setPrayedIds(prev => {
        const merged = new Set(prev);
        ids.forEach(id => merged.add(id));
        return merged;
      });
    } catch (_) {}
  }

  async function loadMore() {
    if (!db || !lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      let q;
      if (feedMode === "following" && followingIds.length > 0) {
        q = query(collection(db, "posts"), where("authorId", "in", followingIds), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
      } else {
        q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
      }
      const snap = await getDocs(q);
      const morePosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFeedPosts(prev => [...prev, ...morePosts]);
      if (snap.docs.length > 0) setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length >= PAGE_SIZE);
      await checkLiked(morePosts);
    } catch (e) {
      console.warn("loadMore error:", e);
    }
    setLoadingMore(false);
  }

  // ── Pray toggle ──
  async function togglePray(postId) {
    if (!functions || !user) return;
    const already = prayedIds.has(postId);
    try {
      const fn = httpsCallable(functions, already ? "unlikePost" : "likePost");
      const result = await fn({ postId });
      setPrayedIds(prev => { const n = new Set(prev); already ? n.delete(postId) : n.add(postId); return n; });
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: result.data.newLikesCount } : p));
      if (!already){ addCandles(2, "You lifted this prayer"); if(trackMission){trackMission("daily_pray_3");trackMission("weekly_pray_10");} }
    } catch (e) {
      if (e.code === "functions/already-exists") setToast({ msg: "Already praying for this", emoji: "\uD83D\uDE4F" });
      else setToast({ msg: e.message || "Failed", emoji: "\u274C" });
    }
  }

  // ── Comments ──
  async function loadCmts(postId) {
    if (!db) return;
    try {
      const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"), limit(50));
      const snap = await getDocs(q);
      setCmtCache(prev => ({ ...prev, [postId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
    } catch (e) { console.warn("loadCmts error:", e); }
  }

  async function submitCmt(postId) {
    if (!functions || !user || !cmtText.trim()) return;
    setCmtLoading(true);
    try {
      const fn = httpsCallable(functions, "addComment");
      await fn({ postId, content: cmtText.trim() });
      setCmtText("");
      await loadCmts(postId);
      if(trackMission) trackMission("daily_comment");
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    } catch (e) {
      setToast({ msg: e.message || "Could not post comment", emoji: "\u274C" });
    }
    setCmtLoading(false);
  }

  // ── Loading state ──
  if (feedLoading) {
    return (
      <div style={{ position: "fixed", inset: 0, fontFamily: SANS, background: `linear-gradient(180deg, ${B.night} 0%, ${B.nightM} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{GFONTS}{CSS}</style>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem", color: "rgba(255,248,232,0.35)", animation: "fadeUp .6s ease both" }}>Loading your feed...</div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: SANS, background: `linear-gradient(180deg, ${B.night} 0%, ${B.nightM} 100%)` }}>
      <style>{GFONTS}{CSS}</style>
      <div style={{ height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 22px 80px" }}>

          {/* Back button */}
          <button onClick={() => onBack ? onBack() : setScreen(prevScreen || "map")} style={{ background: "rgba(26,22,18,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(201,169,110,0.12)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", color: "rgba(180,165,148,0.55)", fontFamily: SANS, fontSize: "0.78rem", marginBottom: 28, transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 6, animation: "fadeUp .6s ease both" }} onMouseEnter={e => e.target.style.color = B.gold} onMouseLeave={e => e.target.style.color = "rgba(180,165,148,0.55)"}>
            {onBack ? "Back to Upper Room" : "Back to village"}
          </button>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp .6s .1s ease both", opacity: 0 }}>
            <h1 style={{ fontFamily: DISPLAY, fontSize: "1.5rem", fontWeight: 700, color: B.goldL, margin: "0 0 6px", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Your Feed</h1>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.82rem", color: "rgba(255,248,232,0.35)", margin: 0 }}>
              {feedMode === "following" ? "Posts from people you follow" : "Recent posts from the community"}
            </p>
          </div>

          {/* Filter tabs (only if user has follows) */}
          {hasFollows && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, animation: "fadeUp .6s .15s ease both", opacity: 0 }}>
              {["following", "recent"].map(m => (
                <button key={m} onClick={() => { if (m !== feedMode) loadFeed(m); }} style={{ background: feedMode === m ? "rgba(201,169,110,0.12)" : "transparent", border: `1px solid ${feedMode === m ? "rgba(201,169,110,0.25)" : "rgba(201,169,110,0.08)"}`, borderRadius: 999, padding: "6px 18px", cursor: "pointer", fontFamily: SANS, fontSize: "0.72rem", fontWeight: 600, color: feedMode === m ? B.goldL : "rgba(255,248,232,0.3)", transition: "all 0.2s", textTransform: "capitalize" }}>{m}</button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {feedPosts.length === 0 && !feedLoading && (
            <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeUp .6s .2s ease both", opacity: 0 }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem", color: "rgba(255,248,232,0.3)", lineHeight: 1.6, margin: 0 }}>
                {hasFollows ? "No recent posts from people you follow." : "No posts yet. Follow someone from their profile to see their prayers here."}
              </p>
            </div>
          )}

          {/* Post cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {feedPosts.map((post, idx) => (
              <PostCard key={post.id}
                post={post} idx={idx} user={user}
                prayed={prayedIds.has(post.id)}
                commentsOpen={expandedCmt === post.id}
                comments={cmtCache[post.id] || []}
                commentText={expandedCmt === post.id ? cmtText : ""}
                commentLoading={cmtLoading}
                onTogglePray={() => togglePray(post.id)}
                onToggleComments={() => {
                  if (expandedCmt === post.id) { setExpandedCmt(null); }
                  else { setExpandedCmt(post.id); setCmtText(""); if (!cmtCache[post.id]) loadCmts(post.id); }
                }}
                onCommentTextChange={setCmtText}
                onSubmitComment={() => submitCmt(post.id)}
                onAuthorTap={viewProfile}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && feedPosts.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={loadMore} disabled={loadingMore} style={{ background: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)", borderRadius: 999, padding: "8px 24px", cursor: loadingMore ? "wait" : "pointer", fontFamily: SANS, fontSize: "0.74rem", fontWeight: 600, color: B.gold, transition: "all 0.2s", opacity: loadingMore ? 0.5 : 1 }}>{loadingMore ? "Loading..." : "Load more"}</button>
            </div>
          )}

          {/* End of feed */}
          {!hasMore && feedPosts.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 24, padding: "16px 0" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: "0.78rem", color: "rgba(255,248,232,0.2)", margin: 0 }}>You're all caught up</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
