// Scroll-reveal
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// Mobile menu
const burger = document.querySelector(".nav__burger");
const links = document.querySelector(".nav__links");
burger.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  })
);

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Analytics goal events — the only two that matter: scoping-call, sustentus-referral.
// Wire gtag/Plausible/Fathom here once an analytics provider is chosen.
document.querySelectorAll("[data-goal]").forEach((el) =>
  el.addEventListener("click", () => {
    const goal = el.dataset.goal;
    if (window.plausible) window.plausible(goal);
    if (window.gtag) window.gtag("event", goal);
  })
);
