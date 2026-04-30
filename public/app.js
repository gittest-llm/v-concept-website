const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const introLoader = document.querySelector("[data-intro-loader]");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealNodes = document.querySelectorAll(".reveal");
const countNodes = document.querySelectorAll("[data-count]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll(".project-card");
const form = document.querySelector("[data-consult-form]");
const formStatus = document.querySelector("[data-form-status]");
const videoButton = document.querySelector("[data-video-button]");
const videoDialog = document.querySelector("[data-video-dialog]");
const closeVideo = document.querySelector("[data-close-video]");

function bootIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

bootIcons();
window.addEventListener("load", bootIcons);

if (introLoader) {
  document.body.classList.add("intro-active");
  window.setTimeout(() => {
    introLoader.classList.add("is-exiting");
  }, 900);

  window.setTimeout(() => {
    introLoader.classList.add("is-hidden");
    document.body.classList.remove("intro-active");
  }, 1180);
}

function syncHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

menuToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", Boolean(isOpen));
  menuToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav?.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

revealNodes.forEach((node) => revealObserver.observe(node));

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.65 }
);

countNodes.forEach((node) => countObserver.observe(node));

function animateCount(node) {
  const target = Number(node.dataset.count || 0);
  const duration = target > 100 ? 1200 : 900;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    projectCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector("button[type='submit']");
  const payload = Object.fromEntries(new FormData(form).entries());

  formStatus.textContent = "Đang gửi...";
  formStatus.classList.remove("is-error");
  submitButton.disabled = true;

  if (window.location.hostname.endsWith("github.io")) {
    window.setTimeout(() => {
      form.reset();
      formStatus.textContent = "Đã ghi nhận thông tin. V-Concept sẽ liên hệ lại sớm nhất.";
      submitButton.disabled = false;
    }, 450);
    return;
  }

  try {
    const response = await fetch("api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Không gửi được yêu cầu.");
    }

    form.reset();
    formStatus.textContent = "Đã gửi. V-Concept sẽ liên hệ lại sớm nhất.";
  } catch (error) {
    formStatus.textContent = "Không gửi được lúc này. Vui lòng thử lại sau.";
    formStatus.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
  }
});

videoButton?.addEventListener("click", () => {
  if (typeof videoDialog?.showModal === "function") {
    videoDialog.showModal();
    bootIcons();
  }
});

closeVideo?.addEventListener("click", () => {
  videoDialog?.close();
});

videoDialog?.addEventListener("click", (event) => {
  if (event.target === videoDialog) {
    videoDialog.close();
  }
});
