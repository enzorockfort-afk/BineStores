/* Уведомления на сайте.
   Админ: новый заказ или заявка с сайта. Клиент: сменился статус его заказа или заявки.
   Что уже видели — хранится в браузере, поэтому при первом входе старое не всплывает. */
import { api } from "./api.js?v=18";
import { ORDER_STATUSES, REQUEST_STATUSES } from "./config.js?v=18";
import { lang, t } from "./i18n.js?v=18";

const BELL = '<svg viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const ro = () => lang === "ro";

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function save(key, st) {
  try {
    localStorage.setItem(key, JSON.stringify(st));
  } catch {}
}

/* текст уведомления собирается при показе — так он на языке сайта */
function text(n) {
  const num = n.num || "";
  if (n.kind === "new-order") return { title: `Новый заказ ${num}`, sub: [n.name, n.sum].filter(Boolean).join(" · ") };
  if (n.kind === "new-request") return { title: `Новая заявка ${num}`, sub: [n.name, n.item].filter(Boolean).join(" · ") };
  const st = n.col === "orders" ? ORDER_STATUSES[n.status] : REQUEST_STATUSES[n.status];
  if (ro()) return { title: `${n.col === "orders" ? "Comanda" : "Cererea"} ${num}`, sub: `Status: ${t(st || n.status)}` };
  return { title: `${n.col === "orders" ? "Заказ" : "Заявка"} ${num}`, sub: `Статус: ${st || n.status}` };
}

/* mount — элемент, перед которым ставится колокольчик; toast — всплывашка страницы */
export function startNotify(user, { mount, toast, onNew, admin = !!user?.isAdmin }) {
  if (!user || !mount || !api.watch) return () => {};
  const key = `bs-notif-${admin ? "admin" : "user"}-${user.uid}`;
  const fresh = !load(key);
  const st = load(key) || { seen: {}, items: [] };
  const primed = { orders: !fresh, requests: !fresh };
  const href = (n) => (admin ? `crm.html#${n.col}` : "account.html#orders");

  mount.insertAdjacentHTML(
    "beforebegin",
    `<div class="notif" id="notif">
      <button class="ic-btn" id="notifBtn" aria-label="Уведомления" aria-expanded="false">${BELL}<b class="badge" id="notifCount"></b></button>
      <div class="notif-panel" id="notifPanel" hidden>
        <div class="notif-head"><b>Уведомления</b><button class="link-plain" id="notifPerm" hidden>Включить в браузере</button></div>
        <div class="notif-list" id="notifList"></div>
      </div>
    </div>`
  );
  const box = document.getElementById("notif");
  const btn = document.getElementById("notifBtn");
  const panel = document.getElementById("notifPanel");
  const perm = document.getElementById("notifPerm");

  function render() {
    const unread = st.items.filter((n) => !n.read).length;
    document.getElementById("notifCount").textContent = unread || "";
    perm.hidden = !("Notification" in window) || Notification.permission !== "default";
    document.getElementById("notifList").innerHTML = st.items.length
      ? st.items
          .map((n) => {
            const x = text(n);
            const when = new Date(n.at).toLocaleString(ro() ? "ro-RO" : "ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
            return `<a class="notif-item${n.read ? "" : " unread"}" href="${href(n)}"><b>${esc(x.title)}</b><span>${esc(x.sub)}</span><small>${when}</small></a>`;
          })
          .join("")
      : `<p class="notif-empty">${admin ? "Новых заказов пока нет" : "Здесь появятся статусы ваших заказов"}</p>`;
  }

  function push(n) {
    st.items.unshift({ ...n, at: Date.now(), read: false });
    st.items = st.items.slice(0, 30);
    const x = text(n);
    toast?.(`${x.title} — ${x.sub}`);
    onNew?.(n);
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      const note = new Notification(x.title, { body: x.sub, icon: "assets/logo.jpg", tag: n.col + n.id });
      note.onclick = () => (focus(), (location.href = href(n)));
    }
  }

  function onList(col, list) {
    for (const d of list) {
      const id = `${col}:${d.id}`;
      const was = st.seen[id];
      st.seen[id] = d.status;
      if (!primed[col]) continue;
      const num = d.number || "";
      if (admin) {
        // заказы, созданные вручную в CRM, не уведомляем
        if (was === undefined && !d.num && d.status === "new")
          push({
            kind: col === "orders" ? "new-order" : "new-request",
            col,
            id: d.id,
            num,
            name: d.contact?.name || "",
            sum: col === "orders" && d.total ? `${d.total} лей` : "",
            item: d.title || "",
          });
      } else if (was !== d.status && (was !== undefined || d.status !== "new")) {
        push({ kind: "status", col, id: d.id, num, status: d.status });
      }
    }
    primed[col] = true;
    save(key, st);
    render();
  }

  btn.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open);
    if (open) {
      render();
      st.items.forEach((n) => (n.read = true));
      save(key, st);
      document.getElementById("notifCount").textContent = "";
    }
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !box.contains(e.target)) (panel.hidden = true), btn.setAttribute("aria-expanded", "false");
  });
  perm.addEventListener("click", () => Notification.requestPermission().then(render));

  render();
  const stops = ["orders", "requests"].map((col) => api.watch(col, !admin, (list) => onList(col, list)));
  return () => (stops.forEach((s) => s()), box.remove());
}
