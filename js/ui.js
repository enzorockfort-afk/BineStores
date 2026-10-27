import { api } from "./api.js";
import { SHOP, COMPANY } from "./config.js";
import { cart, favs, onStoreChange } from "./store.js";

/* ---------------- helpers ---------------- */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = new Intl.NumberFormat("ru-RU");
export const money = (n) => nf.format(n || 0) + " " + SHOP.currency;
export const fmtDate = (t) =>
  new Date(t).toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
export const STATUS = { stock: "В наличии", china: "Из Китая" };
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
export const qs = (k) => new URLSearchParams(location.search).get(k);

export const icon = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 12.2H6.2L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  truck: '<svg viewBox="0 0 24 24"><path d="M2.5 6.5h11v10h-11zM13.5 10h4.2l3.3 3.4v3.1h-7.5"/><circle cx="6.5" cy="17.5" r="1.9"/><circle cx="17" cy="17.5" r="1.9"/></svg>',
  plane: '<svg viewBox="0 0 24 24"><path d="M10.5 13.5 3 11l1.5-1.5 7.5 1L17 5.5a1.8 1.8 0 0 1 2.5 2.5L14.5 13l1 7.5L14 22l-2.5-7.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6l-7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>',
  tg: '<svg viewBox="0 0 24 24"><path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15Z"/><path d="m9 13 8-6"/></svg>',
  wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 19Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2Z"/></svg>',
  vb: '<svg viewBox="0 0 24 24"><path d="M12 3c5 0 8 2 8 7.5S17 18 12 18l-4 3v-3.5C5 16.5 4 14 4 10.5 4 5 7 3 12 3Z"/><path d="M13 7a3 3 0 0 1 3 3"/></svg>',
  ig: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".7"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3.5h16V16"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.6 6.9C4 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1"/></svg>',
  star: '<svg viewBox="0 0 24 24" class="fill"><path d="M12 1.5c.6 5.5 2 8.3 10.5 10.5C14 14.2 12.6 17 12 22.5 11.4 17 10 14.2 1.5 12 10 9.8 11.4 7 12 1.5Z"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" class="fill"><path d="M12 1.5c.6 5.5 2 8.3 10.5 10.5C14 14.2 12.6 17 12 22.5 11.4 17 10 14.2 1.5 12 10 9.8 11.4 7 12 1.5Z"/></svg>',
};

/* ---------------- product visuals ---------------- */
function hue(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
export function art(p, cls = "") {
  return `<div class="art ${cls}" style="--h:${hue(p.brand)}" role="img" aria-label="${esc(p.brand + " " + p.name)}">
    <span class="art-word">${esc(p.brand)}</span><i class="art-spark">${icon.sparkle}</i></div>`;
}
export function pic(p, i = 0, cls = "") {
  const src = p.thumbs?.[i];
  return src ? `<img class="${cls}" src="${src}" alt="${esc(p.brand + " " + p.name)}" loading="lazy" decoding="async">` : art(p, cls);
}
export const tag = (s) => `<span class="tag tag-${s}">${STATUS[s] || ""}</span>`;
const sale = (p) => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const priceHtml = (p) =>
  `<span class="price-now">${money(p.price)}</span>${p.oldPrice > p.price ? `<s>${money(p.oldPrice)}</s>` : ""}`;

export function card(p, i = 0) {
  const off = sale(p);
  return `<article class="card" data-reveal style="--d:${i % 8}">
    <a class="card-media" href="product.html?id=${encodeURIComponent(p.id)}" data-tilt>
      ${pic(p, 0, "m1")}${p.thumbs?.[1] ? pic(p, 1, "m2") : ""}
      <span class="card-glint"></span>
      <span class="card-tags">${off ? `<span class="tag tag-sale">−${off}%</span>` : ""}</span>
    </a>
    <button class="fav-btn" data-fav="${esc(p.id)}" aria-pressed="${favs.has(p.id)}" aria-label="В избранное">${icon.heart}</button>
    <a class="card-info" href="product.html?id=${encodeURIComponent(p.id)}">
      <span class="card-brand">${esc(p.brand)}</span>
      <span class="card-name">${esc(p.name)}</span>
      <span class="card-price">${priceHtml(p)}</span>
    </a>
  </article>`;
}
export const skeletons = (n) =>
  Array.from({ length: n }, () => `<div class="card skel"><div class="card-media sk"></div><div class="sk sk-line"></div><div class="sk sk-line short"></div></div>`).join("");

/* ---------------- feedback ---------------- */
let toastWrap;
export function toast(msg, type = "") {
  toastWrap ||= document.body.appendChild(Object.assign(document.createElement("div"), { className: "toasts", role: "status" }));
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.innerHTML = `<i>${type === "error" ? "!" : icon.check}</i><span>${esc(msg)}</span>`;
  toastWrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 2600);
}

export function burst(x, y, n = 12) {
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.className = "burst";
    s.innerHTML = icon.sparkle;
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const r = 40 + Math.random() * 50;
    s.style.cssText = `left:${x}px;top:${y}px;--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;--s:${0.4 + Math.random() * 0.7}`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

export function flyToCart(fromEl) {
  const target = $("#cartBtn");
  if (!fromEl || !target || reduced) return bumpCart();
  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const ghost = fromEl.cloneNode(true);
  ghost.className = "fly-ghost";
  ghost.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  ghost
    .animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1, borderRadius: "14px" },
        { transform: `translate(${dx * 0.5}px,${dy - 120}px) scale(.45)`, opacity: 0.9, offset: 0.55 },
        { transform: `translate(${dx}px,${dy}px) scale(.06)`, opacity: 0.3, borderRadius: "50%" },
      ],
      { duration: 800, easing: "cubic-bezier(.5,0,.2,1)" }
    )
    .finished.then(() => {
      ghost.remove();
      bumpCart();
      burst(b.left + b.width / 2, b.top + b.height / 2, 8);
    });
}
function bumpCart() {
  const b = $("#cartBtn");
  b?.classList.remove("bump");
  void b?.offsetWidth;
  b?.classList.add("bump");
}

/* ---------------- motion ---------------- */
let io;
export function reveal(root = document) {
  io ||= new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  $$("[data-reveal]:not(.in)", root).forEach((el) => (reduced ? el.classList.add("in") : io.observe(el)));
  $$("[data-split]:not(.split)", root).forEach(split);
  $$("[data-tilt]", root).forEach(tilt);
  $$("[data-magnetic]", root).forEach(magnetic);
}

function split(el) {
  el.classList.add("split");
  const words = el.innerHTML.split(/(<br\s*\/?>)|\s+/).filter(Boolean);
  let i = 0;
  el.innerHTML = words
    .map((w) => (/^<br/.test(w) ? w : `<span class="w"><span style="--i:${i++}">${w}</span></span>`))
    .join(" ");
  el.setAttribute("data-reveal", "");
  reduced ? el.classList.add("in") : io.observe(el);
}

function tilt(el) {
  if (!fine || reduced || el.dataset.tiltOn) return;
  el.dataset.tiltOn = 1;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  });
}

function magnetic(el) {
  if (!fine || reduced || el.dataset.magOn) return;
  el.dataset.magOn = 1;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
  });
  el.addEventListener("pointerleave", () => (el.style.transform = ""));
}

function transitions() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
    if (reduced) return;
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => (location.href = url.href), 420);
  });
  addEventListener("pageshow", (e) => e.persisted && document.body.classList.remove("leaving"));
}

function preloader() {
  let seen = false;
  try {
    seen = sessionStorage.getItem("bs-intro");
    sessionStorage.setItem("bs-intro", 1);
  } catch {}
  if (seen || reduced) return;
  const el = document.createElement("div");
  el.className = "intro";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<video src="assets/intro.webm" muted playsinline autoplay preload="auto"></video>
    <button class="intro-skip" type="button" tabindex="-1">Пропустить</button>`;
  document.body.appendChild(el);
  document.documentElement.classList.add("lock");
  const v = el.querySelector("video");
  let done = false;
  const finish = (delay = 250) => {
    if (done) return;
    done = true;
    setTimeout(() => el.classList.add("out"), delay);
    setTimeout(() => {
      el.remove();
      document.documentElement.classList.remove("lock");
    }, delay + 800);
  };
  v.addEventListener("ended", () => finish());
  v.addEventListener("error", () => finish(0));
  el.querySelector(".intro-skip").addEventListener("click", () => finish(0));
  v.play()?.catch(() => finish(0));
  setTimeout(() => finish(0), 4500);
}

/* ---------------- layout ---------------- */
const NAV = [
  ["index.html", "Главная", "home"],
  ["catalog.html", "Каталог", "catalog"],
  ["china.html", "Под заказ", "china"],
  ["delivery.html", "Доставка", "delivery"],
];

function header(active) {
  return `
  <a class="skip" href="#main">Перейти к содержимому</a>
  <header class="hdr" id="hdr">
    <a class="logo" href="index.html" aria-label="Bine Store — главная">
      <img src="assets/logo.jpg" alt="" width="38" height="38"><span class="logo-word">Bine</span><span class="logo-sub">store</span>
    </a>
    <nav class="hdr-nav" aria-label="Основная навигация">
      ${NAV.map(([h, t, k]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ""}><span data-text="${t}">${t}</span></a>`).join("")}
    </nav>
    <div class="hdr-actions">
      <button class="ic-btn" id="searchBtn" aria-label="Поиск">${icon.search}</button>
      <a class="ic-btn hide-sm" href="account.html#favorites" aria-label="Избранное">${icon.heart}<b class="badge" id="favCount"></b></a>
      <a class="ic-btn" href="account.html" id="accBtn" aria-label="Личный кабинет">${icon.user}</a>
      <button class="ic-btn cart-ic" id="cartBtn" aria-label="Корзина">${icon.bag}<b class="badge" id="cartCount"></b></button>
      <button class="ic-btn burger" id="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span></button>
    </div>
  </header>

  <div class="menu" id="menu" aria-hidden="true">
    <nav>${NAV.map(([h, t], i) => `<a href="${h}" style="--i:${i}">${t}</a>`).join("")}
      <a href="account.html#favorites" style="--i:${NAV.length}">Избранное</a>
      <a href="account.html" style="--i:${NAV.length + 1}">Личный кабинет</a></nav>
    <div class="menu-foot">${socials()}</div>
  </div>

  <div class="search-ov" id="searchOv" aria-hidden="true" role="dialog" aria-label="Поиск">
    <button class="ic-btn search-close" id="searchClose" aria-label="Закрыть поиск">${icon.close}</button>
    <form class="search-form" action="catalog.html">
      <input name="q" id="searchInput" placeholder="Nike, Jordan, худи…" autocomplete="off" aria-label="Поиск товаров">
      <button class="ic-btn" aria-label="Найти">${icon.arrow}</button>
    </form>
    <div class="search-res" id="searchRes"></div>
  </div>

  <div class="scrim" id="scrim" hidden></div>
  <aside class="drawer" id="drawer" aria-hidden="true" aria-label="Корзина">
    <div class="drawer-head"><h2>Корзина <sup id="drawerCount"></sup></h2>
      <button class="ic-btn" id="drawerClose" aria-label="Закрыть корзину">${icon.close}</button></div>
    <div class="drawer-body" id="drawerBody"></div>
    <div class="drawer-foot" id="drawerFoot"></div>
  </aside>`;
}

export function socials(cls = "") {
  const l = [
    SHOP.telegram && ["Telegram", `https://t.me/${SHOP.telegram}`, icon.tg],
    SHOP.whatsapp && ["WhatsApp", `https://wa.me/${SHOP.whatsapp}`, icon.wa],
    SHOP.viber && ["Viber", `viber://chat?number=%2B${SHOP.viber}`, icon.vb],
    SHOP.instagram && ["Instagram", `https://instagram.com/${SHOP.instagram}`, icon.ig],
  ].filter(Boolean);
  return `<div class="socials ${cls}">${l.map(([t, h, i]) => `<a href="${h}" target="_blank" rel="noopener" aria-label="${t}">${i}<span>${t}</span></a>`).join("")}</div>`;
}

function footer() {
  return `
  <footer class="ftr">
    <div class="ftr-mega" aria-hidden="true"><span>BINE</span><i>${icon.sparkle}</i></div>
    <div class="ftr-grid">
      <div class="ftr-col">
        <h3>Магазин</h3>
        <a href="catalog.html">Каталог</a><a href="catalog.html?sale=1">Скидки</a><a href="china.html">Под заказ из Китая</a>
      </div>
      <div class="ftr-col">
        <h3>Покупателям</h3>
        <a href="delivery.html">Доставка и оплата</a><a href="delivery.html#how">Как заказать</a><a href="account.html">Личный кабинет</a><a href="account.html#orders">Мои заказы</a>
      </div>
      <div class="ftr-col">
        <h3>Связаться</h3>
        ${socials("socials-col")}
      </div>
      <div class="ftr-col">
        <h3>Документы</h3>
        <a href="privacy.html">Конфиденциальность</a><a href="terms.html">Условия использования</a><a href="returns.html">Возврат и обмен</a><a href="cookies.html">Cookie</a>
      </div>
    </div>
    <div class="ftr-legal">
      <img src="assets/logo.jpg" alt="Bine Store" width="56" height="56" loading="lazy">
      <p>${companyLine()}</p>
    </div>
    <div class="ftr-bottom">
      <span>© ${new Date().getFullYear()} ${esc(SHOP.name)}. Товарные знаки принадлежат их владельцам.</span>
      <span class="ftr-bottom-links"><button class="link-plain" id="cookieSettings">Настройки cookie</button>
      <button class="to-top" id="toTop">${icon.up}<span>Наверх</span></button></span>
    </div>
  </footer>`;
}

export function companyLine() {
  const c = COMPANY;
  return [c.name, c.idno && `IDNO ${c.idno}`, c.address || `${SHOP.city}, Молдова`, c.email, c.phone].filter(Boolean).map(esc).join(" · ");
}

/* ---------------- cookie notice ---------------- */
const CONSENT = "bs-consent";
export function consent() {
  try {
    return JSON.parse(localStorage.getItem(CONSENT));
  } catch {
    return null;
  }
}
function cookieBanner(force = false) {
  if (!force && consent()) return;
  $("#cookieBar")?.remove();
  const el = document.createElement("div");
  el.className = "cookie";
  el.id = "cookieBar";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Файлы cookie");
  el.innerHTML = `<p>Мы используем только необходимые cookie и локальное хранилище — для корзины, входа и работы сайта. Рекламных и аналитических трекеров нет. <a href="cookies.html">Подробнее</a></p>
    <div class="cookie-btns">
      <button class="btn btn-ghost btn-sm" data-c="necessary">Только необходимые</button>
      <button class="btn btn-ghost btn-sm" data-c="all">Принять все</button>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    try {
      localStorage.setItem(CONSENT, JSON.stringify({ level: b.dataset.c, at: Date.now() }));
    } catch {}
    el.classList.add("out");
    setTimeout(() => el.remove(), 400);
  });
}

/* ---------------- cart drawer ---------------- */
function renderDrawer() {
  const items = cart.items();
  $("#drawerCount").textContent = items.length ? cart.count() : "";
  if (!items.length) {
    $("#drawerBody").innerHTML = `<div class="empty-state">
      <div class="empty-orb">${icon.bag}</div><p>Корзина пуста</p>
      <a class="btn btn-ghost" href="catalog.html">Перейти в каталог</a></div>`;
    $("#drawerFoot").innerHTML = "";
    return;
  }
  $("#drawerBody").innerHTML = `<ul class="line-items">${items
    .map(
      (it, i) => `<li class="line">
        <a class="line-pic" href="product.html?id=${encodeURIComponent(it.id)}">${it.thumb ? `<img src="${it.thumb}" alt="${esc(it.brand + " " + it.name)}">` : art(it, "art-sm")}</a>
        <div class="line-info"><a href="product.html?id=${encodeURIComponent(it.id)}"><b>${esc(it.brand)}</b> ${esc(it.name)}</a>
          <small>Размер ${esc(it.size)} · ${STATUS[it.stock]}</small>
          <div class="qty"><button data-q="${i}" data-d="-1" aria-label="Меньше">${icon.minus}</button><span>${it.qty}</span><button data-q="${i}" data-d="1" aria-label="Больше">${icon.plus}</button></div>
        </div>
        <span class="line-sum">${money(it.price * it.qty)}</span>
      </li>`
    )
    .join("")}</ul>`;
  $("#drawerFoot").innerHTML = `
    <div class="sum-row"><span>Итого</span><b>${money(cart.total())}</b></div>
    <p class="note">${icon.pin} Встреча в Кишинёве — бесплатно</p>
    <a class="btn btn-chrome btn-block" href="checkout.html" data-magnetic>Оформить заказ</a>`;
}
export function openDrawer() {
  renderDrawer();
  $("#drawerBody").classList.add("fresh");
  setTimeout(() => $("#drawerBody").classList.remove("fresh"), 700);
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#scrim").hidden = false;
  document.documentElement.classList.add("lock");
  $("#drawerClose").focus();
}
function closeOverlays() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
  $("#searchOv").classList.remove("open");
  $("#searchOv").setAttribute("aria-hidden", "true");
  $("#menu").classList.remove("open");
  $("#menu").setAttribute("aria-hidden", "true");
  $("#burger").setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  $("#scrim").hidden = true;
  document.documentElement.classList.remove("lock");
}

/* ---------------- search ---------------- */
let allProducts;
// "Из Китая" is handled by the request form, so the public catalog shows in-stock items only
export const loadProducts = () => (allProducts ||= api.products.list().then((l) => l.filter((p) => p.stock !== "china")).catch(() => []));
async function runSearch(q) {
  const box = $("#searchRes");
  q = q.trim().toLowerCase();
  if (!q) return (box.innerHTML = "");
  const list = (await loadProducts()).filter((p) => (p.brand + " " + p.name + " " + p.cat).toLowerCase().includes(q)).slice(0, 6);
  box.innerHTML = list.length
    ? list
        .map(
          (p, i) => `<a class="sres" href="product.html?id=${encodeURIComponent(p.id)}" style="--i:${i}">
          <span class="sres-pic">${pic(p)}</span><span><b>${esc(p.brand)}</b><br>${esc(p.name)}</span><em>${money(p.price)}</em></a>`
        )
        .join("") + `<a class="sres-all" href="catalog.html?q=${encodeURIComponent(q)}">Все результаты ${icon.arrow}</a>`
    : `<p class="sres-empty">Ничего не нашлось. Напишите нам — найдём под заказ.</p>`;
}

/* ---------------- init ---------------- */
export async function initLayout(active) {
  document.body.insertAdjacentHTML("afterbegin", header(active));
  document.body.insertAdjacentHTML("beforeend", footer());
  preloader();
  transitions();
  requestAnimationFrame(() => document.body.classList.add("ready"));

  const hdr = $("#hdr");
  let lastY = scrollY;
  addEventListener(
    "scroll",
    () => {
      const y = scrollY;
      hdr.classList.toggle("scrolled", y > 10);
      hdr.classList.toggle("hide", y > 240 && y > lastY && !document.body.classList.contains("menu-open"));
      lastY = y;
      document.documentElement.style.setProperty("--scroll", Math.min(1, y / (document.body.scrollHeight - innerHeight || 1)));
    },
    { passive: true }
  );

  const counts = () => {
    const c = cart.count();
    const f = favs.ids().length;
    $("#cartCount").textContent = c || "";
    $("#favCount").textContent = f || "";
    if ($("#drawer").classList.contains("open")) renderDrawer();
  };
  onStoreChange(counts);
  counts();

  $("#cartBtn").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeOverlays);
  $("#scrim").addEventListener("click", closeOverlays);
  $("#drawerBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    const it = cart.items()[b.dataset.q];
    cart.setQty(+b.dataset.q, it.qty + +b.dataset.d);
  });
  $("#burger").addEventListener("click", () => {
    const open = !$("#menu").classList.contains("open");
    if (!open) return closeOverlays();
    $("#menu").classList.add("open");
    $("#menu").setAttribute("aria-hidden", "false");
    $("#burger").setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    document.documentElement.classList.add("lock");
  });
  $("#searchBtn").addEventListener("click", () => {
    $("#searchOv").classList.add("open");
    $("#searchOv").setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lock");
    setTimeout(() => $("#searchInput").focus(), 50);
    loadProducts();
  });
  $("#searchClose").addEventListener("click", closeOverlays);
  $("#menu").addEventListener("click", (e) => e.target.closest("a") && closeOverlays());

  // full-size photo viewer for request photos
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-zoom]");
    if (!b) return;
    const d = document.createElement("dialog");
    d.className = "lightbox";
    d.innerHTML = `<img src="${b.querySelector("img").src}" alt="${esc(b.querySelector("img").alt)}"><button class="ic-btn" aria-label="Закрыть">${icon.close}</button>`;
    document.body.appendChild(d);
    d.addEventListener("click", () => d.close());
    d.addEventListener("close", () => d.remove());
    d.showModal();
  });
  let st;
  $("#searchInput").addEventListener("input", (e) => {
    clearTimeout(st);
    st = setTimeout(() => runSearch(e.target.value), 120);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOverlays();
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      $("#searchBtn").click();
    }
  });
  $("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
  $("#cookieSettings").addEventListener("click", () => cookieBanner(true));
  setTimeout(() => cookieBanner(), 1200);

  // keep keyboard focus inside open overlays
  addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const box = [$("#drawer"), $("#searchOv"), $("#menu")].find((x) => x.classList.contains("open"));
    if (!box) return;
    const f = $$("a[href],button:not([disabled]),input,select,textarea", box).filter((x) => x.offsetParent !== null);
    const nav = box === $("#menu") ? [$("#burger"), ...f] : f;
    if (!nav.length) return;
    const first = nav[0], last = nav[nav.length - 1];
    if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
    else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
    else if (!box.contains(document.activeElement) && document.activeElement !== $("#burger")) (e.preventDefault(), first.focus());
  });

  // favorites anywhere on the page
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]");
    if (!b) return;
    e.preventDefault();
    const on = favs.toggle(b.dataset.fav);
    $$(`[data-fav="${CSS.escape(b.dataset.fav)}"]`).forEach((x) => x.setAttribute("aria-pressed", on));
    b.classList.remove("pop");
    void b.offsetWidth;
    b.classList.add("pop");
    if (on) {
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 8);
    }
    toast(on ? "Добавлено в избранное" : "Удалено из избранного");
  });

  let favUid;
  api.auth.onChange((u) => {
    const a = $("#accBtn");
    a.classList.toggle("is-in", !!u);
    a.innerHTML = u ? `<span class="avatar">${esc((u.name || u.email)[0].toUpperCase())}</span>` : icon.user;
    a.setAttribute("aria-label", u ? "Личный кабинет" : "Войти");
    // sync favorites only when the signed-in user actually changes
    if ((u?.uid || null) !== favUid) {
      favUid = u?.uid || null;
      favs.attach(api);
    }
  });

  reveal();
  return api.auth.current();
}
