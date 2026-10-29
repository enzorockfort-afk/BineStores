/* Доставка маршруткой: посылку передаём водителю в Кишинёве,
   клиент забирает её на автовокзале (автостанции) своего города.
   В сёлах — у водителя на остановке маршрутки, рейс и время сообщает менеджер. */
export const BUS_PRICE = 50;
export const POST_PRICE = 50;

// [русское название, румынское название]
export const CITIES = [
  ["Бельцы", "Bălți"], ["Комрат", "Comrat"], ["Кагул", "Cahul"], ["Унгены", "Ungheni"], ["Сороки", "Soroca"],
  ["Оргеев", "Orhei"], ["Анений Ной", "Anenii Noi"], ["Басарабяска", "Basarabeasca"], ["Бричаны", "Briceni"],
  ["Калараш", "Călărași"], ["Кантемир", "Cantemir"], ["Каушаны", "Căușeni"], ["Чадыр-Лунга", "Ceadîr-Lunga"],
  ["Чимишлия", "Cimișlia"], ["Криуляны", "Criuleni"], ["Дондюшаны", "Dondușeni"], ["Дрокия", "Drochia"],
  ["Единцы", "Edineț"], ["Фалешты", "Fălești"], ["Флорешты", "Florești"], ["Глодяны", "Glodeni"],
  ["Хынчешты", "Hîncești"], ["Яловены", "Ialoveni"], ["Леова", "Leova"], ["Ниспорены", "Nisporeni"],
  ["Окница", "Ocnița"], ["Отачь", "Otaci"], ["Резина", "Rezina"], ["Рышканы", "Rîșcani"], ["Сынжерей", "Sîngerei"],
  ["Страшены", "Strășeni"], ["Шолданешты", "Șoldănești"], ["Штефан Водэ", "Ștefan Vodă"], ["Тараклия", "Taraclia"],
  ["Теленешты", "Telenești"], ["Вулканешты", "Vulcănești"], ["Дурлешты", "Durlești"], ["Кодру", "Codru"],
];

const norm = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/^(г\.|город|с\.|село|or\.|orasul|mun\.|municipiul|s\.|satul)\s*/, "").replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");

export const findCity = (input) => CITIES.find((c) => c.some((n) => norm(n) === norm(input)));

/* где забрать посылку, отправленную маршруткой */
export function pickupPoint(input, lang = "ru") {
  if (!String(input || "").trim()) return "";
  const c = findCity(input);
  if (lang === "ro")
    return c
      ? `Ridici coletul la autogara din ${c[1]}, de la șoferul microbuzului. Ruta și ora ți le trimite managerul pe Telegram.`
      : "Ridici coletul de la șoferul microbuzului la stația din satul tău sau la autogara celui mai apropiat centru raional. Ruta și ora ți le trimite managerul pe Telegram.";
  return c
    ? `Заберёте посылку на автовокзале г. ${c[0]} у водителя маршрутки. Номер рейса и время пришлёт менеджер в Telegram.`
    : "Заберёте посылку у водителя маршрутки на остановке в вашем селе или на автовокзале ближайшего райцентра. Рейс и время пришлёт менеджер в Telegram.";
}
