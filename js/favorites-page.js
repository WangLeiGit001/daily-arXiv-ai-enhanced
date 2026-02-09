let currentPaperIndex = 0;
let currentFavorites = [];

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
}

function updateFavoriteButton(paper) {
  const btn = document.getElementById("favoriteButton");
  const iconOutline = document.getElementById("favoriteIconOutline");
  const iconFilled = document.getElementById("favoriteIconFilled");
  const textSpan = document.getElementById("favoriteButtonText");
  if (!btn || !paper) return;
  const id = paper.id || paper.url;
  const isFavorited = currentFavorites.some(
    item => (item.id || item.url) === id
  );
  if (iconOutline) iconOutline.style.display = isFavorited ? "none" : "block";
  if (iconFilled) iconFilled.style.display = isFavorited ? "block" : "none";
  if (textSpan) textSpan.textContent = isFavorited ? "已收藏" : "收藏";
  btn.title = isFavorited ? "取消收藏" : "收藏";
}

function renderFavorites() {
  const container = document.getElementById("favoritesContainer");
  const emptyEl = document.getElementById("favoritesEmpty");
  if (!container || !emptyEl) return;

  if (!currentFavorites || currentFavorites.length === 0) {
    container.innerHTML = "";
    container.style.display = "none";
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";
  container.style.display = "grid";
  container.className = "paper-container";
  container.innerHTML = "";

  currentFavorites.forEach((paper, index) => {
    const paperCard = document.createElement("div");
    paperCard.className = "paper-card";
    paperCard.dataset.id = paper.id || paper.url;

    const categoryTags = paper.allCategories
      ? paper.allCategories.map(cat => `<span class="category-tag">${cat}</span>`).join("")
      : `<span class="category-tag">${paper.category || ""}</span>`;

    paperCard.innerHTML = `
      <div class="paper-card-index">${index + 1}</div>
      <div class="paper-card-header">
        <h3 class="paper-card-title">${paper.title || "Untitled"}</h3>
        <p class="paper-card-authors">${paper.authors || ""}</p>
        <div class="paper-card-categories">
          ${categoryTags}
        </div>
      </div>
      <div class="paper-card-body">
        <p class="paper-card-summary">${paper.summary || ""}</p>
        <div class="paper-card-footer">
          <div class="footer-left">
            <span class="paper-card-date">${formatDate(paper.date)}</span>
          </div>
          <span class="paper-card-link">Details</span>
        </div>
      </div>
    `;

    paperCard.addEventListener("click", () => {
      currentPaperIndex = index;
      showPaperDetails(paper, index + 1);
    });

    container.appendChild(paperCard);
  });
}

function showPaperDetails(paper, paperIndex) {
  const modal = document.getElementById("paperModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  modalBody.scrollTop = 0;
  const title = paper.title || "Untitled";
  modalTitle.innerHTML = paperIndex
    ? `<span class="paper-index-badge">${paperIndex}</span> ${title}`
    : title;

  const categoryDisplay = paper.allCategories
    ? paper.allCategories.join(", ")
    : paper.category || "";

  const modalContent = `
    <div class="paper-details">
      <p><strong>Authors: </strong>${paper.authors || ""}</p>
      <p><strong>Categories: </strong>${categoryDisplay}</p>
      <p><strong>Date: </strong>${formatDate(paper.date)}</p>
      <h3>TL;DR</h3>
      <p>${paper.summary || ""}</p>
      <div class="paper-sections">
        ${paper.motivation ? `<div class="paper-section"><h4>Motivation</h4><p>${paper.motivation}</p></div>` : ""}
        ${paper.method ? `<div class="paper-section"><h4>Method</h4><p>${paper.method}</p></div>` : ""}
        ${paper.result ? `<div class="paper-section"><h4>Result</h4><p>${paper.result}</p></div>` : ""}
        ${paper.conclusion ? `<div class="paper-section"><h4>Conclusion</h4><p>${paper.conclusion}</p></div>` : ""}
      </div>
      ${paper.details ? `<h3>Abstract</h3><p class="original-abstract">${paper.details}</p>` : ""}
      <div class="pdf-preview-section">
        <div class="pdf-header">
          <h3>PDF Preview</h3>
          <button class="pdf-expand-btn" onclick="togglePdfSize(this)">
            <svg class="expand-icon" viewBox="0 0 24 24" width="24" height="24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            <svg class="collapse-icon" viewBox="0 0 24 24" width="24" height="24" style="display: none;">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            </svg>
          </button>
        </div>
        <div class="pdf-container">
          <iframe src="${(paper.url || "").replace("abs", "pdf")}" width="100%" height="800px" frameborder="0"></iframe>
        </div>
      </div>
    </div>
  `;

  modalBody.innerHTML = modalContent;

  document.getElementById("paperLink").href = paper.url || "#";
  document.getElementById("pdfLink").href = (paper.url || "").replace("abs", "pdf");
  document.getElementById("htmlLink").href = (paper.url || "").replace("abs", "html");

  const githubLink = document.getElementById("githubLink");
  if (paper.code_url) {
    githubLink.href = paper.code_url;
    githubLink.style.display = "flex";
    githubLink.title = "View Code on GitHub";
  } else {
    githubLink.style.display = "none";
  }

  const favoriteButton = document.getElementById("favoriteButton");
  updateFavoriteButton(paper);
  if (favoriteButton) {
    favoriteButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = paper.id || paper.url;
      const exists = currentFavorites.some(item => (item.id || item.url) === id);
      if (exists) {
        FavoritesStore.removeById(id);
        currentFavorites = currentFavorites.filter(
          item => (item.id || item.url) !== id
        );
      } else {
        FavoritesStore.add(paper);
        currentFavorites.unshift(paper);
      }
      updateFavoriteButton(paper);
      renderFavorites();
      updatePaperPosition();
    };
  }

  updatePaperPosition();
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updatePaperPosition() {
  const paperPosition = document.getElementById("paperPosition");
  if (paperPosition && currentFavorites.length > 0) {
    paperPosition.textContent = `${currentPaperIndex + 1} / ${currentFavorites.length}`;
  }
}

function closeModal() {
  const modal = document.getElementById("paperModal");
  const modalBody = document.getElementById("modalBody");
  modalBody.scrollTop = 0;
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function navigateToPreviousPaper() {
  if (currentFavorites.length === 0) return;
  currentPaperIndex = currentPaperIndex > 0 ? currentPaperIndex - 1 : currentFavorites.length - 1;
  const paper = currentFavorites[currentPaperIndex];
  showPaperDetails(paper, currentPaperIndex + 1);
}

function navigateToNextPaper() {
  if (currentFavorites.length === 0) return;
  currentPaperIndex = currentPaperIndex < currentFavorites.length - 1 ? currentPaperIndex + 1 : 0;
  const paper = currentFavorites[currentPaperIndex];
  showPaperDetails(paper, currentPaperIndex + 1);
}

function togglePdfSize(button) {
  const pdfContainer = button.closest(".pdf-preview-section").querySelector(".pdf-container");
  const iframe = pdfContainer.querySelector("iframe");
  const expandIcon = button.querySelector(".expand-icon");
  const collapseIcon = button.querySelector(".collapse-icon");

  if (pdfContainer.classList.contains("expanded")) {
    pdfContainer.classList.remove("expanded");
    iframe.style.height = "800px";
    expandIcon.style.display = "block";
    collapseIcon.style.display = "none";
    const overlay = document.querySelector(".pdf-overlay");
    if (overlay) overlay.remove();
  } else {
    pdfContainer.classList.add("expanded");
    iframe.style.height = "90vh";
    expandIcon.style.display = "none";
    collapseIcon.style.display = "block";
    const overlay = document.createElement("div");
    overlay.className = "pdf-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", () => {
      togglePdfSize(button);
    });
  }
}

function initEventListeners() {
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.querySelector(".paper-modal").addEventListener("click", (event) => {
    const modal = document.querySelector(".paper-modal");
    const pdfContainer = modal.querySelector(".pdf-container");
    if (event.target === modal) {
      if (pdfContainer && pdfContainer.classList.contains("expanded")) {
        const expandButton = modal.querySelector(".pdf-expand-btn");
        if (expandButton) togglePdfSize(expandButton);
        event.stopPropagation();
      } else {
        closeModal();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const paperModal = document.getElementById("paperModal");
      if (paperModal.classList.contains("active")) closeModal();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const paperModal = document.getElementById("paperModal");
      if (paperModal.classList.contains("active")) {
        event.preventDefault();
        if (event.key === "ArrowLeft") navigateToPreviousPaper();
        if (event.key === "ArrowRight") navigateToNextPaper();
      }
    }
  });

  const backToTopButton = document.getElementById("backToTop");
  if (backToTopButton) {
    const updateBackToTopVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollTop > 300) {
        backToTopButton.classList.add("visible");
      } else {
        backToTopButton.classList.remove("visible");
      }
    };
    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
    backToTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

async function initFavoritesPage() {
  initEventListeners();
  currentFavorites = await FavoritesStore.syncFromApi();
  renderFavorites();
}

document.addEventListener("DOMContentLoaded", initFavoritesPage);
