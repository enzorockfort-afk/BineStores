import { initLayout, $, esc, icon, toast, burst, lang } from "../ui.js";
import { api, errorText } from "../api.js";
import { SHOP } from "../config.js";
import { compressFile, compress, isImageFile } from "../images.js";

const user = await initLayout("china");
const form = $("#form");
const F = form.elements;
const MAX = 3;

const MESS = [
  ["telegram", "Telegram", icon.tg],
  ["phone", "Звонок", '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>'],
].filter(([k]) => k === "phone" || SHOP[k]);
$("#messengers").style.gridTemplateColumns = `repeat(${Math.min(MESS.length, 4)}, 1fr)`;
$("#messengers").innerHTML = MESS.map(
  ([k, t, i], n) => `<label class="opt"><input type="radio" name="messenger" value="${k}"${n ? "" : " checked"}><span class="opt-body">${i}<b>${t}</b></span></label>`
).join("");

if (user) {
  const prof = (await api.profile.get().catch(() => null)) || {};
  F.name.value = prof.name || user.name || "";
  F.phone.value = prof.phone || "";
}
F.phone.addEventListener("focus", () => !F.phone.value && (F.phone.value = "+373 "));
form.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));

/* ---------------- photos ---------------- */
let photos = [];
function renderPhotos() {
  $("#imgs").innerHTML = photos
    .map(
      (p, i) => `<div class="img-tile${p.busy ? " busy" : ""}">${p.data ? `<img src="${p.data}" alt="Фото ${i + 1}">` : ""}
      ${p.busy ? "" : `<button type="button" data-rm="${i}" aria-label="Удалить фото ${i + 1}">${icon.close}</button>`}</div>`
    )
    .join("");
  $("#drop").hidden = photos.length >= MAX;
}
async function addFiles(files) {
  const list = [...files].filter(isImageFile).slice(0, MAX - photos.length);
  if (!list.length) return;
  const slots = list.map(() => ({ busy: true }));
  photos.push(...slots);
  renderPhotos();
  await Promise.all(
    list.map(async (f, k) => {
      try {
        let data = await compressFile(f, 1000, 0.75);
        if (data.length > 260_000) data = await compress(data, 800, 0.65);
        Object.assign(slots[k], { data, busy: false });
      } catch {
        photos.splice(photos.indexOf(slots[k]), 1);
        toast(`Не удалось обработать ${f.name}. Попробуйте JPG или PNG`, "error");
      }
      renderPhotos();
    })
  );
}
$("#files").addEventListener("change", (e) => {
  addFiles(e.target.files);
  e.target.value = "";
});
const drop = $("#drop");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => (e.preventDefault(), drop.classList.add("over"))));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("over")));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});
document.addEventListener("paste", (e) => e.clipboardData?.files.length && addFiles(e.clipboardData.files));
$("#imgs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (!b) return;
  photos.splice(+b.dataset.rm, 1);
  renderPhotos();
});

/* ---------------- submit ---------------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = (n) => String(F[n].value || "").trim();
  const bad = [];
  if (v("title").length < 2) bad.push("title");
  if (v("name").length < 2) bad.push("name");
  if (v("phone").replace(/\D/g, "").length < 8) bad.push("phone");
  if (bad.length) {
    bad.forEach((n) => F[n].setAttribute("aria-invalid", "true"));
    F[bad[0]].focus();
    $("#err").textContent = "Заполните отмеченные поля";
    return;
  }
  if (!F.agree.checked) {
    F.agree.focus();
    $("#err").textContent = "Подтвердите согласие на обработку данных";
    return;
  }
  if (photos.some((p) => p.busy)) return ($("#err").textContent = "Дождитесь загрузки фото");
  $("#err").textContent = "";

  const btn = $("#submit");
  btn.classList.add("loading");
  const req = {
    number: "Z-" + Date.now().toString(36).slice(-5).toUpperCase(),
    title: v("title"),
    link: v("link"),
    size: v("size"),
    color: v("color"),
    qty: Math.max(1, Math.round(+v("qty") || 1)),
    budget: Math.round(+v("budget")) || 0,
    comment: v("comment"),
    photos: photos.map((p) => p.data),
    contact: { name: v("name"), phone: v("phone"), via: form.querySelector("[name=messenger]:checked")?.value || "" },
    consentAt: Date.now(),
  };
  try {
    const saved = await api.requests.create(req);
    if (user) api.profile.save({ phone: req.contact.phone }).catch(() => {});
    done(saved);
  } catch (err) {
    btn.classList.remove("loading");
    toast(errorText(err), "error");
  }
});

function done(r) {
  $("#formView").hidden = true;
  const v = $("#doneView");
  v.hidden = false;
  const text = encodeURIComponent(
    lang === "ro"
      ? `Bună ziua! Cererea ${r.number}: ${r.title}${r.size ? `, mărimea ${r.size}` : ""}`
      : `Здравствуйте! Заявка ${r.number}: ${r.title}${r.size ? `, размер ${r.size}` : ""}`
  );
  const msg = SHOP.telegram ? `https://t.me/${SHOP.telegram}?text=${text}` : "";
  v.innerHTML = `<section class="success">
    <div class="success-orb">${icon.check}</div>
    <h1 class="chrome-t">Заявка отправлена</h1>
    <span class="num">${esc(r.number)}</span>
    <p>Мы свяжемся с вами в течение дня, назовём цену и срок доставки.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
      ${msg ? `<a class="btn btn-chrome" href="${msg}" target="_blank" rel="noopener">${icon.tg} Написать менеджеру</a>` : ""}
      ${user ? `<a class="btn btn-ghost" href="account.html#orders">Мои заявки</a>` : ""}
      <a class="btn btn-ghost" href="china.html">Ещё одна заявка</a>
    </div>
  </section>`;
  scrollTo(0, 0);
  const o = $(".success-orb").getBoundingClientRect();
  setTimeout(() => burst(o.left + o.width / 2, o.top + o.height / 2, 18), 500);
}
