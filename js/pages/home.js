import { initLayout, $, $$, card, skeletons, reveal, pic, tag, icon, socials, loadProducts, reduced, esc } from "../ui.js";
import { CATEGORIES } from "../config.js";

await initLayout("home");

// hero wordmark letters + glint follows pointer
$("#heroWord").innerHTML = [..."Bine"].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join("");
$$(".hero-spark").forEach((s) => (s.innerHTML = icon.sparkle));
const hero = $("#hero");
if (!reduced) {
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    hero.style.setProperty("--gx", x + "%");
    hero.style.setProperty("--gy", y + "%");
    $$(".float-card", hero).forEach((c, i) => {
      const k = (i + 1) * 10;
      c.style.setProperty("--px", `${(x - 50) / k}px`);
      c.style.setProperty("--py", `${(y - 50) / k}px`);
    });
  });
}

// marquee
const BRANDS = ["Nike", "Jordan", "Adidas", "New Balance", "Stone Island", "Moncler", "The North Face", "Essentials", "Balenciaga", "Prada", "Louis Vuitton", "Chrome Hearts"];
const mq = (list) => {
  const row = list.map((b) => `<span class="mq-item">${esc(b)}${icon.sparkle}</span>`).join("");
  return row + row;
};
$("#mq1").innerHTML = mq(BRANDS);

// products
const rail = $("#rail");
rail.innerHTML = skeletons(5);
const products = await loadProducts();
const byNew = [...products].sort((a, b) => b.createdAt - a.createdAt);

const featured = [...products.filter((p) => p.featured), ...byNew].filter((p, i, a) => a.indexOf(p) === i).slice(0, 3);
$("#floats").innerHTML = featured
  .map((p, i) => `<a class="float-card f${i + 1}" href="product.html?id=${encodeURIComponent(p.id)}" tabindex="-1">${pic(p)}</a>`)
  .join("");

rail.innerHTML = byNew.slice(0, 10).map(card).join("") || `<p class="sub">Скоро здесь появятся товары.</p>`;

$("#cats").innerHTML = CATEGORIES.map((c, i) => {
  const n = products.filter((p) => p.cat === c).length;
  return `<a class="cat" href="catalog.html?cat=${encodeURIComponent(c)}" data-reveal style="--d:${i}">
    <span class="cat-top"><span>${n} ${n % 10 === 1 && n % 100 !== 11 ? "товар" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "товара" : "товаров"}</span>${icon.arrow}</span>
    <b>${c}</b></a>`;
}).join("");
reveal();

// rail: buttons, drag, progress
const step = () => rail.firstElementChild?.getBoundingClientRect().width + 20 || 300;
$("#railPrev").addEventListener("click", () => rail.scrollBy({ left: -step() * 2, behavior: "smooth" }));
$("#railNext").addEventListener("click", () => rail.scrollBy({ left: step() * 2, behavior: "smooth" }));
const bar = $("#railBar");
const prog = () => {
  const max = rail.scrollWidth - rail.clientWidth;
  const vis = rail.clientWidth / rail.scrollWidth;
  bar.style.width = vis * 100 + "%";
  bar.style.transform = `translateX(${max ? (rail.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0}%)`;
};
rail.addEventListener("scroll", prog, { passive: true });
addEventListener("resize", prog);
prog();
let down = null;
rail.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") return;
  down = { x: e.clientX, left: rail.scrollLeft, moved: false };
});
addEventListener("pointermove", (e) => {
  if (!down) return;
  const dx = e.clientX - down.x;
  if (Math.abs(dx) > 5) {
    down.moved = true;
    rail.classList.add("drag");
  }
  rail.scrollLeft = down.left - dx;
});
addEventListener("pointerup", () => {
  down = null;
  setTimeout(() => rail.classList.remove("drag"), 0);
});
