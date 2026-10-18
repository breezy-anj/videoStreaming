// =============================================
// USERNAME — Read from localStorage
// =============================================
const navUsername = document.getElementById("navUsername");
const navAvatar = document.getElementById("navAvatar");

function getUsername() {
  return localStorage.getItem("streamforge_username") || "Guest";
}

const username = getUsername();
navUsername.textContent = username;
navAvatar.textContent = username.charAt(0).toUpperCase();

// =============================================
// GET VIDEO ID FROM URL
// =============================================
const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");

if (!videoId) {
  window.location.href = "/";
}

// =============================================
// DOM REFS
// =============================================
const videoPlayer = document.getElementById("videoPlayer");
const playerLoading = document.getElementById("playerLoading");
const videoTitle = document.getElementById("videoTitle");
const videoMeta = document.getElementById("videoMeta");
const videoBadge = document.getElementById("videoBadge");
const videoYear = document.getElementById("videoYear");
const videoDuration = document.getElementById("videoDuration");
const videoDesc = document.getElementById("videoDesc");
const bufferFill = document.getElementById("bufferFill");
const bufferLabel = document.getElementById("bufferLabel");
const bufferChunks = document.getElementById("bufferChunks");
const commentList = document.getElementById("commentList");
const commentInput = document.getElementById("commentInput");
const commentSubmit = document.getElementById("commentSubmit");
const commentCount = document.getElementById("commentCount");

// =============================================
// LOAD VIDEO METADATA
// =============================================
let videoFilename = null;

async function loadVideoMeta() {
  try {
    const res = await fetch(`/api/video/meta/${videoId}`);
    const video = await res.json();

    document.title = `${video.title} — StreamForge`;
    videoTitle.textContent = video.title;
    videoBadge.textContent = video.genre || "Video";
    videoYear.textContent = video.year || "—";
    videoDuration.textContent = video.duration || "—";
    videoDesc.textContent = video.description || "";
    videoFilename = video.filename;

    // Kick off the MSE player now that we have the filename
    initMSE(videoFilename);
  } catch (err) {
    videoTitle.textContent = "Failed to load video info.";
  }
}

// =============================================
// MSE PLAYER — Core streaming engine
// =============================================
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
const KEEP_BEHIND_SEC = 30;          // Keep 30s behind playhead in buffer

let mediaSource = null;
let sourceBuffer = null;
let fetchedBytes = 0;
let totalBytes = 0;
let isFetching = false;
let isDone = false;

function initMSE(filename) {
  if (!window.MediaSource) {
    videoPlayer.src = `/api/video/stream/${filename}`;
    playerLoading.classList.add("hidden");
    return;
  }

  mediaSource = new MediaSource();
  videoPlayer.src = URL.createObjectURL(mediaSource);

  mediaSource.addEventListener("sourceopen", () => {
    // The codec string for H.264/AAC MP4 — this must match your video encoding
    const mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

    if (!MediaSource.isTypeSupported(mimeType)) {
      console.warn("Codec not supported, falling back to direct src");
      videoPlayer.src = `/api/video/stream/${filename}`;
      playerLoading.classList.add("hidden");
      return;
    }

    sourceBuffer = mediaSource.addSourceBuffer(mimeType);

    sourceBuffer.addEventListener("updateend", () => {
      // When the buffer finishes processing a chunk, fetch the next one
      if (!isDone && !isFetching) {
        fetchNextChunk(filename);
      }

      // Signal end of stream if we've loaded everything
      if (isDone && !sourceBuffer.updating) {
        try { mediaSource.endOfStream(); } catch (_) {}
      }

      updateBufferUI();
      garbageCollect();
    });

    // Fetch the very first chunk to get things started
    fetchNextChunk(filename);
  });
}

async function fetchNextChunk(filename) {
  if (isFetching || isDone) return;
  isFetching = true;

  const start = fetchedBytes;
  const end = start + CHUNK_SIZE - 1;

  try {
    const res = await fetch(`/api/video/stream/${filename}`, {
      headers: { Range: `bytes=${start}-${end}` },
    });

    if (res.status === 206) {
      // Parse total file size from Content-Range header: "bytes 0-X/TOTAL"
      const contentRange = res.headers.get("Content-Range");
      if (contentRange && totalBytes === 0) {
        totalBytes = parseInt(contentRange.split("/")[1], 10);
      }

      const data = await res.arrayBuffer();
      fetchedBytes += data.byteLength;

      // If we've received everything, mark as done
      if (fetchedBytes >= totalBytes) {
        isDone = true;
      }

      // Append to source buffer (this triggers 'updateend' when done)
      if (sourceBuffer && !sourceBuffer.updating) {
        sourceBuffer.appendBuffer(data);
      }

      // Hide loading overlay on first chunk
      playerLoading.classList.add("hidden");
    } else {
      console.error("Unexpected status:", res.status);
      isDone = true;
    }
  } catch (err) {
    console.error("Fetch chunk error:", err);
    isDone = true;
  } finally {
    isFetching = false;
  }
}

// =============================================
// GARBAGE COLLECTION — Delete watched chunks
// =============================================
function garbageCollect() {
  if (!sourceBuffer || sourceBuffer.updating) return;
  const currentTime = videoPlayer.currentTime;
  if (currentTime > KEEP_BEHIND_SEC) {
    try {
      sourceBuffer.remove(0, currentTime - KEEP_BEHIND_SEC);
    } catch (_) {}
  }
}

// Run GC every 10 seconds passively
setInterval(garbageCollect, 10_000);

// =============================================
// BUFFER UI — Show how many MB are in buffer
// =============================================
function updateBufferUI() {
  if (!videoPlayer.buffered.length || !totalBytes) return;

  const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
  const totalDurationGuess = videoPlayer.duration || 1;
  const bufferPercent = Math.min((bufferedEnd / totalDurationGuess) * 100, 100);

  const bufferedMB = (fetchedBytes / (1024 * 1024)).toFixed(1);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  bufferFill.style.width = `${bufferPercent.toFixed(1)}%`;
  bufferLabel.textContent = `Buffer: ${bufferedMB}MB / ${totalMB}MB`;
  bufferChunks.textContent = `${Math.ceil(fetchedBytes / CHUNK_SIZE)} chunks`;
}

// Update buffer UI when video time updates
videoPlayer.addEventListener("timeupdate", updateBufferUI);

// =============================================
// PROGRESSIVE FETCH — Fetch ahead as video plays
// =============================================
videoPlayer.addEventListener("timeupdate", () => {
  if (isDone || isFetching || !sourceBuffer || sourceBuffer.updating) return;

  // Start fetching the next chunk when within 15s of buffered end
  let bufferedEnd = 0;
  if (videoPlayer.buffered.length) {
    bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
  }

  const currentTime = videoPlayer.currentTime;
  if (bufferedEnd - currentTime < 15) {
    fetchNextChunk(videoFilename);
  }
});

// =============================================
// COMMENTS
// =============================================
async function loadComments() {
  try {
    const res = await fetch(`/api/comments/${videoId}`);
    const comments = await res.json();

    commentCount.textContent = comments.length;

    if (!comments.length) {
      commentList.innerHTML = `
        <div class="no-comments">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>No comments yet. Be the first!</p>
        </div>`;
      return;
    }

    commentList.innerHTML = "";
    comments.forEach((c) => {
      commentList.appendChild(buildCommentEl(c));
    });
  } catch (err) {
    console.error("Failed to load comments:", err);
  }
}

function buildCommentEl(comment) {
  const el = document.createElement("div");
  el.className = "comment-item";

  const timeAgo = formatTimeAgo(new Date(comment.createdAt));

  el.innerHTML = `
    <div class="comment-avatar">${comment.username.charAt(0).toUpperCase()}</div>
    <div class="comment-body">
      <div class="comment-username">${escapeHTML(comment.username)}</div>
      <div class="comment-text">${escapeHTML(comment.text)}</div>
      <div class="comment-time">${timeAgo}</div>
    </div>
  `;
  return el;
}

commentSubmit.addEventListener("click", async () => {
  const text = commentInput.value.trim();
  if (!text) return;

  commentSubmit.disabled = true;
  commentSubmit.textContent = "Posting...";

  try {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, username, text }),
    });

    if (res.ok) {
      commentInput.value = "";
      // Prepend the new comment optimistically
      const newComment = { username, text, createdAt: new Date().toISOString() };
      const noComments = commentList.querySelector(".no-comments");
      if (noComments) noComments.remove();

      const el = buildCommentEl(newComment);
      commentList.prepend(el);

      // Update count
      commentCount.textContent = parseInt(commentCount.textContent || 0) + 1;
    }
  } catch (err) {
    console.error("Failed to post comment:", err);
  } finally {
    commentSubmit.disabled = false;
    commentSubmit.textContent = "Post Comment";
  }
});

// =============================================
// UTILS
// =============================================
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// =============================================
// INIT
// =============================================
loadVideoMeta();
loadComments();
