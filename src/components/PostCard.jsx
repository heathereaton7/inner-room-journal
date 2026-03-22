import { B, SERIF, SANS } from '../constants.js';

export default function PostCard({
  post, idx, user, prayed, commentsOpen, comments,
  commentText, commentLoading,
  onTogglePray, onToggleComments, onCommentTextChange, onSubmitComment,
  onAuthorTap,
}) {
  const isOwn = post.authorId === user?.uid;

  return (
    <div style={{background:"rgba(26,22,18,0.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",border:"1px solid rgba(201,169,110,0.08)",borderRadius:12,padding:"15px 17px",animation:`fadeUp .4s ${0.05*idx}s ease both`,opacity:0}}>
      {/* Header: tag + date */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
        {(post.tag||post.tags?.[0])&&<span style={{fontSize:"0.6rem",background:"rgba(200,164,106,0.1)",color:B.gold,border:"1px solid rgba(200,164,106,0.2)",padding:"2px 8px",borderRadius:99,fontFamily:SANS,fontWeight:600}}>{post.tag||(post.tags?.[0]?post.tags[0][0].toUpperCase()+post.tags[0].slice(1):"")}</span>}
        <span style={{fontSize:"0.66rem",color:"rgba(255,248,232,0.25)",fontFamily:SANS,marginLeft:"auto"}}>{post.createdAt?.toDate?post.createdAt.toDate().toLocaleDateString():""}</span>
      </div>
      {/* Post text */}
      <p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.92rem",color:"rgba(255,248,232,0.7)",margin:"0 0 10px",lineHeight:1.65}}>{post.content}</p>
      {/* Author */}
      <div onClick={()=>onAuthorTap&&onAuthorTap(post.authorId)} style={{fontSize:"0.66rem",color:"rgba(255,248,232,0.25)",fontFamily:SANS,marginBottom:10,cursor:onAuthorTap?"pointer":"default"}}>by {post.authorName||"Anonymous"}</div>
      {/* Divider */}
      <div style={{height:1,background:"rgba(201,169,110,0.06)",marginBottom:10}}/>
      {/* Stats row */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
        <span style={{fontSize:"0.68rem",color:"rgba(201,169,110,0.45)",fontFamily:SANS}}>{post.likesCount||0} {(post.likesCount||0)===1?"person praying":"people praying"}</span>
        {(post.commentsCount||0)>0&&<span style={{fontSize:"0.68rem",color:"rgba(255,248,232,0.25)",fontFamily:SANS}}>{post.commentsCount} {post.commentsCount===1?"comment":"comments"}</span>}
      </div>
      {/* Action buttons */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {isOwn?
          <span style={{fontSize:"0.7rem",fontFamily:SANS,color:"rgba(255,248,232,0.3)"}}>Your prayer</span>
        :
          <button onClick={onTogglePray} style={{background:prayed?"rgba(90,138,106,0.2)":"rgba(90,138,106,0.08)",border:`1px solid ${prayed?"rgba(90,138,106,0.35)":"rgba(90,138,106,0.18)"}`,color:prayed?"#BED3C4":"rgba(190,211,196,0.6)",padding:"6px 16px",borderRadius:7,cursor:"pointer",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.25s",boxShadow:prayed?"0 0 12px rgba(90,138,106,0.15)":"none"}}>{prayed?"Praying":"Pray"}</button>
        }
        <div style={{flex:1}}/>
        <button onClick={onToggleComments} style={{background:"transparent",border:"1px solid rgba(201,169,110,0.1)",color:"rgba(255,248,232,0.35)",padding:"6px 14px",borderRadius:7,cursor:"pointer",fontSize:"0.72rem",fontFamily:SANS,fontWeight:500,transition:"all 0.2s"}}>{post.commentsCount||0} Comments</button>
      </div>
      {/* Comments section (expanded) */}
      {commentsOpen&&(
        <div style={{marginTop:12,borderTop:"1px solid rgba(201,169,110,0.06)",paddingTop:12,animation:"fadeUp .3s ease both"}}>
          {comments.length===0&&<p style={{fontFamily:SERIF,fontStyle:"italic",fontSize:"0.78rem",color:"rgba(255,248,232,0.2)",margin:"0 0 10px"}}>No words of encouragement yet</p>}
          {comments.length>0&&(
            <div style={{maxHeight:200,overflowY:"auto",marginBottom:10,display:"flex",flexDirection:"column",gap:8}}>
              {comments.map(c=>(
                <div key={c.id} style={{padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(201,169,110,0.04)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    <span style={{fontSize:"0.68rem",fontFamily:SANS,fontWeight:600,color:"rgba(201,169,110,0.5)"}}>{c.authorName||"Anonymous"}</span>
                    <span style={{fontSize:"0.6rem",color:"rgba(255,248,232,0.15)",fontFamily:SANS,marginLeft:"auto"}}>{c.createdAt?.toDate?c.createdAt.toDate().toLocaleDateString():""}</span>
                  </div>
                  <p style={{fontFamily:SERIF,fontSize:"0.82rem",color:"rgba(255,248,232,0.55)",margin:0,lineHeight:1.5}}>{c.content}</p>
                </div>
              ))}
            </div>
          )}
          {/* Comment input */}
          <div style={{display:"flex",gap:8}}>
            <input value={commentText} onChange={e=>onCommentTextChange(e.target.value)} placeholder="Add a word of encouragement..." onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSubmitComment();}}} style={{flex:1,background:"rgba(255,248,232,0.04)",border:"1px solid rgba(201,169,110,0.1)",borderRadius:7,color:B.goldL,fontSize:"0.8rem",fontFamily:SERIF,padding:"8px 12px",boxSizing:"border-box",transition:"border-color 0.2s"}} onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.3)"} onBlur={e=>e.target.style.borderColor="rgba(201,169,110,0.1)"}/>
            <button onClick={onSubmitComment} disabled={!commentText.trim()||commentLoading} style={{background:commentText.trim()?"rgba(90,138,106,0.25)":"transparent",border:`1px solid ${commentText.trim()?"rgba(90,138,106,0.35)":"rgba(255,255,255,0.06)"}`,color:commentText.trim()?"#BED3C4":"rgba(255,255,255,0.2)",padding:"8px 14px",borderRadius:7,cursor:commentText.trim()?"pointer":"default",fontSize:"0.74rem",fontFamily:SANS,fontWeight:600,transition:"all 0.2s"}}>{commentLoading?"...":"Send"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
