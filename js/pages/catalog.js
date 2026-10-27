import { initLayout, $, $$, card, skeletons, reveal, esc, qs, icon } from "../ui.js";
import { CATEGORIES } from "../config.js";

await initLayout("catalog");

const grid = $("#grid");
grid.innerHTML = skeletons(8);
const { loadProducts } = await import("../ui.js");
const all = await loadProducts();

const S = {
  cat: qs("cat") || "",
  q: qs("q") || "",
  brands: new Set((qs("brand") || "").split(",").filter(Boolean)),
  sizes: new Set(),
  min: "",
  max: "",
  sale: qs("sale") === "1",
  sort: "new",
};

// static controls
$("#catTabs").innerHTML = ["", ...CATEGORIES]
  .map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${S.cat === c}">${c || "Все"}</button>`)
  .join("");
const brands = [...new Set(all.map((p) => p.brand))].sort();
$("#fBrands").innerHTML = brands
  .map((b) => `<label class="check"><input type="checkbox" value="${esc(b)}"${S.brands.has(b) ? " checked" : ""}> ${esc(b)} <em>${all.filter((p) => p.brand === b).length}</em></label>`)
  .join("");
const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "One size"];
const sizes = [...new Set(all.flatMap((p) => p.sizes || []))].sort((a, b) => {
  const ia = sizeOrder.indexOf(a), ib = sizeOrder.indexOf(b);
  if (ia >= 0 || ib >= 0) return (ia < 0 ? -1 : ia) - (ib < 0 ? -1 : ib) || 0;
  return parseFloat(a) - parseFloat(b);
});
$("#fSizes").innerHTML = sizes.map((s) => `<button class="chip" data-size="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join("");
$("#q").value = S.q;
$("#fSale").checked = S.sale;

function filtered() {
  const q = S.q.trim().toLowerCase();
  let list = all.filter(
    (p) =>
      (!S.cat || p.cat === S.cat) &&
      (!S.brands.size || S.brands.has(p.brand)) &&
      (!S.sizes.size || (p.sizes || []).some((s) => S.sizes.has(s))) &&
      (!S.min || p.price >= +S.min) &&
      (!S.max || p.price <= +S.max) &&
      (!S.sale || p.oldPrice > p.price) &&
      (!q || `${p.brand} ${p.name} ${p.cat}`.toLowerCase().includes(q))
  );
  const off = (p) => (p.oldPrice > p.price ? 1 - p.price / p.oldPrice : 0);
  const sorts = {
    new: (a, b) => b.createdAt - a.createdAt,
    asc: (a, b) => a.price - b.price,
    desc: (a, b) => b.price - a.price,
    sale: (a, b) => off(b) - off(a),
  };
  return list.sort(sorts[S.sort]);
}

function syncUrl() {
  const p = new URLSearchParams();
  if (S.cat) p.set("cat", S.cat);
  if (S.q) p.set("q", S.q);
  if (S.brands.size) p.set("brand", [...S.brands].join(","));
  if (S.sale) p.set("sale", "1");
  history.replaceState(null, "", "catalog.html" + (p.toString() ? "?" + p : ""));
}

function render() {
  const list = filtered();
  $("#count").textContent = list.length;
  $("#title").firstChild.textContent = S.cat || "Каталог";
  grid.innerHTML = list.map(card).join("");
  $("#empty").hidden = list.length > 0;
  $$("#catTabs .chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === S.cat));

  const chips = [];
  S.brands.forEach((b) => chips.push(["brand:" + b, b]));
  S.sizes.forEach((s) => chips.push(["size:" + s, "Размер " + s]));
  if (S.min || S.max) chips.push(["price", `${S.min || 0} – ${S.max || "∞"} лей`]);
  if (S.sale) chips.push(["sale", "Со скидкой"]);
  if (S.q) chips.push(["q", `«${S.q}»`]);
  $("#active").innerHTML = chips.map(([k, t]) => `<button class="chip" data-rm="${esc(k)}">${esc(t)} ${icon.close}</button>`).join("");
  syncUrl();
  reveal(grid);
}

// events
$("#catTabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  S.cat = b.dataset.cat;
  render();
});
$("#fBrands").addEventListener("change", (e) => {
  e.target.checked ? S.brands.add(e.target.value) : S.brands.delete(e.target.value);
  render();
});
$("#fSizes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-size]");
  if (!b) return;
  const s = b.dataset.size;
  S.sizes.has(s) ? S.sizes.delete(s) : S.sizes.add(s);
  b.setAttribute("aria-pressed", S.sizes.has(s));
  render();
});
let pt;
["pMin", "pMax"].forEach((id) =>
  $("#" + id).addEventListener("input", () => {
    clearTimeout(pt);
    pt = setTimeout(() => {
      S.min = $("#pMin").value;
      S.max = $("#pMax").value;
      render();
    }, 300);
  })
);
$("#fSale").addEventListener("change", (e) => ((S.sale = e.target.checked), render()));
let qt;
$("#q").addEventListener("input", (e) => {
  clearTimeout(qt);
  qt = setTimeout(() => ((S.q = e.target.value), render()), 200);
});
$("#sort").addEventListener("change", (e) => ((S.sort = e.target.value), render()));

function reset() {
  Object.assign(S, { cat: "", q: "", min: "", max: "", sale: false });
  S.brands.clear();
  S.sizes.clear();
  $$("#filters input[type=checkbox]").forEach((c) => (c.checked = false));
  $$("#fSizes .chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
  $("#pMin").value = $("#pMax").value = $("#q").value = "";
  render();
}
$("#reset").addEventListener("click", reset);
$("#active").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (!b) return;
  const k = b.dataset.rm;
  if (k.startsWith("brand:")) S.brands.delete(k.slice(6)), $$("#fBrands input").forEach((i) => i.value === k.slice(6) && (i.checked = false));
  else if (k.startsWith("size:")) S.sizes.delete(k.slice(5)), $$("#fSizes .chip").forEach((c) => c.dataset.size === k.slice(5) && c.setAttribute("aria-pressed", "false"));
  else if (k === "price") (S.min = S.max = ""), ($("#pMin").value = $("#pMax").value = "");
  else if (k === "sale") (S.sale = false), ($("#fSale").checked = false);
  else if (k === "q") (S.q = ""), ($("#q").value = "");
  render();
});

// mobile sheet
const sheet = $("#filters");
const scrim = $("#fScrim");
const openSheet = (on) => {
  sheet.classList.toggle("open", on);
  scrim.hidden = !on;
  document.documentElement.classList.toggle("lock", on);
};
$("#fOpen").addEventListener("click", () => openSheet(true));
$("#fClose").addEventListener("click", () => openSheet(false));
$("#fApply").addEventListener("click", () => openSheet(false));
scrim.addEventListener("click", () => openSheet(false));

render();
