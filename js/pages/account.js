import { initLayout, $, $$, esc, money, art, icon, toast, card, reveal, fmtDate, STATUS, loadProducts, qs } from "../ui.js?v=18";
import { api, errorText } from "../api.js?v=18";
import { favs, onStoreChange } from "../store.js?v=18";
import { orderHtml, requestHtml } from "../orders-view.js?v=18";

await initLayout("account");
const view = $("#view");

/* ---------------- auth ---------------- */
function authView(mode = "in") {
  view.innerHTML = `
  <section class="auth">
    <div class="auth-art" aria-hidden="true"><img src="assets/logo.jpg" alt=""></div>
    <div class="auth-box">
      <div class="tabs" role="tablist">
        <span class="tab-pill" id="pill"></span>
        <button role="tab" data-mode="in" aria-selected="${mode === "in"}">Вход</button>
        <button role="tab" data-mode="up" aria-selected="${mode === "up"}">Регистрация</button>
      </div>
      <h1 class="auth-title chrome-t" id="aTitle"></h1>
      <p class="auth-sub" id="aSub"></p>
      <form id="aForm" novalidate>
        <label class="field" id="nameField"><span>Имя</span><input class="input" name="uname" autocomplete="name"></label>
        <label class="field"><span>Email</span><input class="input" name="email" type="email" autocomplete="email" required></label>
        <label class="field" id="passField"><span>Пароль</span>
          <span class="pass-wrap"><input class="input" name="password" type="password" autocomplete="current-password" required minlength="6">
          <button type="button" class="ic-btn" id="eye" aria-label="Показать пароль">${icon.eye}</button></span></label>
        <div class="stack" id="upChecks" style="gap:10px">
          <label class="consent check"><input type="checkbox" name="age"> <span>Мне исполнилось 16 лет</span></label>
          <label class="consent check"><input type="checkbox" name="agree"> <span>Принимаю <a href="terms.html" target="_blank">условия</a> и даю согласие на обработку данных по <a href="privacy.html" target="_blank">политике конфиденциальности</a></span></label>
        </div>
        <p class="form-err" id="aErr" role="alert"></p>
        <button class="btn btn-chrome btn-block" id="aSubmit"></button>
        <button type="button" class="link-btn" id="forgot">Забыли пароль?</button>
      </form>
    </div>
  </section>`;

  const f = $("#aForm");
  const F = f.elements;
  const setMode = (m) => {
    mode = m;
    $$(".tabs [data-mode]").forEach((b) => b.setAttribute("aria-selected", b.dataset.mode === m));
    const on = $(`.tabs [data-mode="${m === "reset" ? "in" : m}"]`);
    $("#pill").style.cssText = `left:${on.offsetLeft}px;width:${on.offsetWidth}px`;
    $("#nameField").hidden = m !== "up";
    $("#upChecks").hidden = m !== "up";
    $("#passField").hidden = m === "reset";
    $("#forgot").hidden = m !== "in";
    F.password.autocomplete = m === "up" ? "new-password" : "current-password";
    $("#aTitle").textContent = { in: "С возвращением", up: "Новый аккаунт", reset: "Сброс пароля" }[m];
    $("#aSub").textContent = {
      in: "Заказы, избранное и быстрое оформление.",
      up: "Следите за заказами и сохраняйте избранное.",
      reset: "Пришлём ссылку для нового пароля на email.",
    }[m];
    $("#aSubmit").textContent = { in: "Войти", up: "Создать аккаунт", reset: "Отправить ссылку" }[m];
    $("#aErr").textContent = "";
  };
  $(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (b) setMode(b.dataset.mode);
  });
  $("#forgot").addEventListener("click", () => setMode("reset"));
  $("#eye").addEventListener("click", () => {
    const show = F.password.type === "password";
    F.password.type = show ? "text" : "password";
    $("#eye").innerHTML = show ? icon.eyeOff : icon.eye;
    $("#eye").setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
  });
  f.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = F.email.value.trim();
    const pass = F.password.value;
    const name = F.uname.value.trim();
    const bad = [];
    if (!/^\S+@\S+\.\S+$/.test(email)) bad.push(F.email);
    if (mode !== "reset" && pass.length < 6) bad.push(F.password);
    if (mode === "up" && name.length < 2) bad.push(F.uname);
    if (bad.length) {
      bad.forEach((i) => i.setAttribute("aria-invalid", "true"));
      bad[0].focus();
      $("#aErr").textContent = mode === "up" && pass.length < 6 ? "Пароль — минимум 6 символов" : "Проверьте отмеченные поля";
      return;
    }
    if (mode === "up" && !F.age.checked) return ($("#aErr").textContent = "Регистрация доступна с 16 лет");
    if (mode === "up" && !F.agree.checked) return ($("#aErr").textContent = "Подтвердите согласие с условиями и политикой");
    const btn = $("#aSubmit");
    btn.classList.add("loading");
    try {
      if (mode === "in") await api.auth.signIn(email, pass);
      else if (mode === "up") {
        await api.auth.signUp(email, pass, name);
        await api.profile.save({ ageConfirmed: true, consentAt: Date.now() }).catch(() => {});
      }
      else {
        await api.auth.resetPassword(email);
        toast("Ссылка отправлена на " + email);
        setMode("in");
      }
    } catch (err) {
      $("#aErr").textContent = errorText(err);
    }
    btn.classList.remove("loading");
  });
  requestAnimationFrame(() => setMode(mode));
}

/* ---------------- dashboard ---------------- */
async function dash(user) {
  const tabs = [
    ["orders", "Заказы", icon.box],
    ["favorites", "Избранное", icon.heart],
    ["profile", "Профиль", icon.user],
  ];
  view.innerHTML = `
  <div class="wrap">
    <div class="page-head">
      <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span>Личный кабинет</span></nav>
      <h1 class="page-title chrome-t">Привет</h1>
    </div>
    <div class="acc-layout">
      <nav class="acc-nav" aria-label="Разделы кабинета">
        <div class="acc-user"><span class="avatar">${esc((user.name || user.email)[0].toUpperCase())}</span><span><b>${esc(user.name || "")}</b><small>${esc(user.email)}</small></span></div>
        ${tabs.map(([k, t, i]) => `<a href="#${k}" data-tab="${k}">${i}${t}<span class="n" id="n-${k}"></span></a>`).join("")}
        ${user.isAdmin ? `<a href="admin.html">${icon.grid}Админ-панель</a><a href="crm.html">${icon.chart}CRM</a>` : ""}
        <button id="logout">${icon.logout}Выйти</button>
      </nav>
      <section class="panel" id="panel"></section>
    </div>
  </div>`;
  $("#logout").addEventListener("click", async () => {
    await api.auth.signOut();
    toast("Вы вышли из аккаунта");
  });

  const orders = await api.orders.mine().catch(() => []);
  const reqs = await api.requests.mine().catch(() => []);
  $("#n-orders").textContent = orders.length + reqs.length || "";
  const products = await loadProducts();
  const favCount = () => ($("#n-favorites").textContent = favs.ids().length || "");
  favCount();

  const panels = {
    orders() {
      if (!orders.length && !reqs.length)
        return `<h2>Мои заказы</h2><div class="empty-state"><div class="empty-orb">${icon.box}</div><p>Заказов пока нет</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn-ghost" href="catalog.html">В каталог</a><a class="btn btn-ghost" href="china.html">Заказать из Китая</a></div></div>`;
      return `${orders.length ? `<h2>Мои заказы</h2><div class="orders">${orders.map((o, i) => orderHtml(o, i)).join("")}</div>` : ""}
        ${reqs.length ? `<h2 style="margin-top:${orders.length ? "48px" : "0"}">Заявки под заказ</h2><div class="orders">${reqs.map((r, i) => requestHtml(r, i)).join("")}</div>` : ""}`;
    },
    favorites() {
      const list = products.filter((p) => favs.has(p.id));
      return `<h2>Избранное</h2>${
        list.length
          ? `<div class="grid">${list.map(card).join("")}</div>`
          : `<div class="empty-state"><div class="empty-orb">${icon.heart}</div><p>Сохраняйте вещи сердечком</p><a class="btn btn-ghost" href="catalog.html">В каталог</a></div>`
      }`;
    },
    profile() {
      return `<h2>Профиль</h2>
      <form id="pForm" class="stack" style="max-width:640px" novalidate>
        <div class="row2">
          <label class="field"><span>Имя</span><input class="input" name="pname" autocomplete="name"></label>
          <label class="field"><span>Телефон</span><input class="input" name="phone" type="tel" autocomplete="tel"></label>
        </div>
        <label class="field"><span>Город</span><input class="input" name="city" autocomplete="address-level2"></label>
        <label class="field"><span>Адрес доставки</span><input class="input" name="address" autocomplete="street-address"></label>
        <label class="field"><span>Email</span><input class="input" value="${esc(user.email)}" disabled></label>
        <div><button class="btn btn-chrome" id="pSave">Сохранить</button></div>
      </form>
      <div class="danger-zone" style="max-width:640px">
        <b>Удалить аккаунт</b>
        <p>Удалятся профиль, избранное и вход. История заказов хранится для учёта; её удаление — по запросу, см. <a href="privacy.html" style="text-decoration:underline">политику конфиденциальности</a>.</p>
        <button class="btn btn-danger btn-sm" id="delAcc">Удалить аккаунт</button>
      </div>`;
    },
  };

  async function show() {
    const tab = panels[location.hash.slice(1)] ? location.hash.slice(1) : "orders";
    $$(".acc-nav [data-tab]").forEach((a) => a.setAttribute("aria-current", a.dataset.tab === tab));
    const panel = $("#panel");
    panel.innerHTML = panels[tab]();
    panel.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(.16,1,.3,1)" });
    reveal(panel);
    if (tab === "orders") $(".order", panel)?.setAttribute("open", "");
    if (tab === "profile") {
      const prof = (await api.profile.get().catch(() => null)) || {};
      const F = $("#pForm").elements;
      F.pname.value = prof.name || user.name || "";
      F.phone.value = prof.phone || "";
      F.city.value = prof.city || "";
      F.address.value = prof.address || "";
      $("#pForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const b = $("#pSave");
        b.classList.add("loading");
        try {
          await api.profile.save({ name: F.pname.value.trim(), phone: F.phone.value.trim(), city: F.city.value.trim(), address: F.address.value.trim() });
          toast("Профиль сохранён");
        } catch (err) {
          toast(errorText(err), "error");
        }
        b.classList.remove("loading");
      });
      let armed = false;
      $("#delAcc").addEventListener("click", async (e) => {
        const b = e.currentTarget;
        if (!armed) {
          armed = true;
          b.textContent = "Нажмите ещё раз, чтобы удалить навсегда";
          setTimeout(() => {
            armed = false;
            b.textContent = "Удалить аккаунт";
          }, 5000);
          return;
        }
        b.classList.add("loading");
        try {
          await api.auth.deleteAccount();
          localStorage.removeItem("binestore-fav");
          toast("Аккаунт удалён");
        } catch (err) {
          b.classList.remove("loading");
          toast(err?.code === "auth/requires-recent-login" ? "Выйдите и войдите снова, затем повторите удаление" : errorText(err), "error");
        }
      });
    }
  }
  onStoreChange(() => {
    favCount();
    if (location.hash === "#favorites") show();
  });
  addEventListener("hashchange", show);
  show();
}

let last;
api.auth.onChange((u) => {
  const key = u ? u.uid + u.name : "";
  if (key === last) return;
  const wasOut = last === "";
  last = key;
  if (!u) return authView(location.hash === "#register" ? "up" : "in");
  const next = qs("next");
  if (wasOut && next && /^[\w-]+\.html$/.test(next)) return (location.href = next);
  if (wasOut) toast("Вы вошли как " + (u.name || u.email));
  dash(u);
});
