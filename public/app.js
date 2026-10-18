// =============================================
// USERNAME — Persist in localStorage
// =============================================
const modal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const usernameSubmit = document.getElementById("usernameSubmit");
const navUsername = document.getElementById("navUsername");
const navAvatar = document.getElementById("navAvatar");

function getUsername() {
  return localStorage.getItem("streamforge_username");
}

function setUsername(name) {
  localStorage.setItem("streamforge_username", name);
}

function applyUsername(name) {
  navUsername.textContent = name;
  navAvatar.textContent = name.charAt(0).toUpperCase();
}

// Show modal if no username stored
if (!getUsername()) {
  modal.classList.remove("hidden");
} else {
  modal.classList.add("hidden");
  applyUsername(getUsername());
}

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") usernameSubmit.click();
});

usernameSubmit.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) {
    usernameInput.focus();
    return;
  }
  setUsername(name);
  applyUsername(name);
  modal.classList.add("hidden");
  loadVideos();
});

// =============================================
// VIDEO CATALOG — Fetch & render
// =============================================
const videoGrid = document.getElementById("videoGrid");

async function loadVideos() {
  try {
    const res = await fetch("/api/video");
    const videos = await res.json();

    videoGrid.innerHTML = "";

    if (!videos.length) {
      videoGrid.innerHTML = `<p style="color:var(--text-secondary)">No videos found. Run the seed script!</p>`;
      return;
    }

    videos.forEach((video) => {
      const card = createVideoCard(video);
      videoGrid.appendChild(card);
    });
  } catch (err) {
    videoGrid.innerHTML = `<p style="color:var(--text-secondary)">Failed to load videos. Is the server running?</p>`;
  }
}

function createVideoCard(video) {
  const card = document.createElement("div");
  card.className = "video-card";
  card.setAttribute("data-id", video._id);

  const thumbSrc = video.thumbnail
    ? `/thumbnails/${video.thumbnail}`
    : `https://picsum.photos/seed/${video._id}/560/315`;

  card.innerHTML = `
    <div class="video-card-thumb">
      <img src="${thumbSrc}" alt="${video.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${video._id}/560/315'" />
      <div class="play-overlay">
        <div class="play-icon">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <span class="video-card-badge">${video.genre || "Video"}</span>
    </div>
    <div class="video-card-info">
      <h3 class="video-card-title">${video.title}</h3>
      <div class="video-card-meta">
        <span>${video.year || "—"}</span>
        <span>${video.duration || "—"}</span>
      </div>
      <p class="video-card-desc">${video.description || ""}</p>
    </div>
  `;

  card.addEventListener("click", () => {
    window.location.href = `/watch.html?id=${video._id}`;
  });

  return card;
}

// Load videos on page load (unless waiting for username)
if (getUsername()) {
  loadVideos();
}
