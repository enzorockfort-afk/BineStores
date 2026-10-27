/* Корзина и избранное — localStorage + синхронизация избранного с профилем. */
const CART = "binestore-cart-v2";
const FAV = "binestore-fav";
const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || [];
  } catch {
    return [];
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const subs = new Set();
const emit = () => subs.forEach((cb) => cb());
export const onStoreChange = (cb) => (subs.add(cb), () => subs.delete(cb));
window.addEventListener("storage", (e) => (e.key === CART || e.key === FAV) && emit());

/* item: {id, size, qty, brand, name, price, stock, thumb} */
export const cart = {
  items: () => read(CART),
  count: () => read(CART).reduce((s, i) => s + i.qty, 0),
  total: () => read(CART).reduce((s, i) => s + i.price * i.qty, 0),
  add(p, size) {
    const items = read(CART);
    const f = items.find((i) => i.id === p.id && i.size === size);
    if (f) f.qty++;
    else items.push({ id: p.id, size, qty: 1, brand: p.brand, name: p.name, price: p.price, stock: p.stock, thumb: p.thumbs?.[0] || "" });
    write(CART, items);
    emit();
  },
  setQty(idx, qty) {
    const items = read(CART);
    if (!items[idx]) return;
    qty <= 0 ? items.splice(idx, 1) : (items[idx].qty = qty);
    write(CART, items);
    emit();
  },
  clear() {
    write(CART, []);
    emit();
  },
};

let syncFav = null;
export const favs = {
  ids: () => read(FAV),
  has: (id) => read(FAV).includes(id),
  toggle(id) {
    const list = read(FAV);
    const i = list.indexOf(id);
    i >= 0 ? list.splice(i, 1) : list.push(id);
    write(FAV, list);
    emit();
    syncFav?.(list);
    return i < 0;
  },
  async attach(api) {
    if (!api.auth.current()) return (syncFav = null);
    const prof = (await api.profile.get().catch(() => null)) || {};
    const merged = [...new Set([...(prof.favorites || []), ...read(FAV)])];
    write(FAV, merged);
    emit();
    syncFav = (list) => api.profile.save({ favorites: list }).catch(() => {});
    syncFav(merged);
  },
};
