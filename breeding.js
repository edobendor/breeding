/* Ben Dor breeding evaluations: one short form per variety code, kept on the phone until it is sent.
   Two stages: the mother tree in the breeding block (few fields) and the grafted trees (more fields).
   It has its own users, grouped in teams (Ben Dor, Cultirex...). A team sees only its own records;
   a manager sees every team. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dshow = s => String(s || '').split('-').reverse().join('.');
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));
const API = (window.FR_CONFIG && window.FR_CONFIG.apiUrl) || '../api';
const MOCK = API === '../api';
// 7C-07-10, 07C07-10 and 7c 7 10 are the same variety: letters and numbers are compared without zeros and separators
const ckey = s => (String(s || '').toUpperCase().match(/[A-Z]+|\d+/g) || []).map(t => /^\d+$/.test(t) ? String(parseInt(t, 10)) : t).join('-');

// ---------- languages ----------
const L = {
  af: {
    title: "Teling", loginTitle: "Meld aan", user: "Gebruikersnaam", pin: "Persoonlike kode", login: "Meld aan", logout: "Meld af",
    badLogin: "Verkeerde gebruikersnaam of kode", locked: "Hierdie gebruiker is gesluit. Kontak die bestuurder.", offline: "Geen verbinding met die bediener nie", allTeams: "Alle spanne",
    code: "Seleksiekode", open: "Maak oop", recent: "Bestaande seleksies", searchHint: "Tik deel van die kode en kies uit die lys. Koppeltekens en nulle maak nie saak nie.", searchPh: "Soek of tik nuwe kode", newVar: "Nuwe seleksie:",
    pickOne: "Verskeie soortgelyke kodes. Kies een uit die lys.", newCode: "Nuwe kode, nie in die lys nie. As jy 'n bestaande seleksie bedoel het, kies dit:",
    noMatch: "Geen bestaande seleksie pas nie.", none: "Nog geen evaluasies nie", evals: "evaluasies", typeCode: "Tik 'n seleksiekode",
    back: "Terug", backNoSave: "Terug sonder om te stoor", newEval: "+ Nuwe evaluasie", history: "Geskiedenis",
    stage: "Stadium", mother: "Moederboom", graft: "Ge\u00ebnt", when: "Tyd van evaluasie", harvest: "By oes", storage: "Na koelopberging",
    dHarvest: "Oesdatum", dStorage: "Datum uit koelopberging", photos: "Foto's", takePhoto: "\ud83d\udcf7 Kamera", addPhoto: "Galery",
    decision: "Besluit (opsioneel)", d_keep: "Hou dop", d_graft: "Ent", d_advance: "Bevorder", d_discard: "Verwerp", save: "Stoor",
    saved: "Gestoor", savedOffline: "Op die foon gestoor, word gestuur wanneer daar ontvangs is", nothing: "Niks om te stoor nie: voeg 'n foto of ten minste een waarde by",
    installTitle: "Installeer op hierdie foon", installBtn: "Installeer die toepassing", installIos: "Op iPhone: maak oop in Safari, tik die Deel-knoppie, dan \"Voeg by tuisskerm\".",
    installHint: "Om as toepassing te installeer: maak hierdie adres in Chrome self oop (nie binne WhatsApp of 'n ander toepassing nie).",
    badValue: "waarde buite perke", badPhoto: "Die foto kon nie gelees word nie", bigVideo: "Die videolêer is te groot. Neem korter of in laer kwaliteit op", rawPhoto: "Foto bygevoeg sonder voorskou", edit: "Wysig", editing: "Wysig evaluasie", badVideo: "Die video kon nie bygevoeg word nie", waitWifi: "video's wag vir Wi-Fi", sendNow: "Stuur nou", sendingVid: "video's word gestuur, hou die toepassing oop", waitNet: "video's wag vir ontvangs", lostFile: "Een foto of video het verlore gegaan op die foon, voeg dit asseblief weer by", noStore: "Die foon kon die foto of video nie stoor nie. Niks is gestoor nie, probeer weer of verwyder die video",
    f_plot: "Ligging", ph_plot: "Perseel / blok / ry", f_size: "Vruggrootte (mm)", f_sizeClass: "Grootteklasse", ph_sizeClass: "bv. A/AA/B", f_brix: "Brix", f_firm: "Druk (kg)",
    f_yield: "Verwagte opbrengs", h_yield: "1 = laag \u00b7 3 = medium \u00b7 5 = baie hoog", f_taste: "Smaak",
    h_taste: "Kalibrasie: 4 = African Rose \u00b7 6 = Laetitia \u00b7 8 = Ruby Sun \u00b7 10 = Flavor King", f_tasteNote: "Smaak en tekstuur", ph_tasteNote: "bv. krakerig, aromaties, suur onder die skil",
    f_skin: "Skilkleur", f_flesh: "Vleiskleur", f_fruitSet: "Vrugset", h_fruitSet: "1 = swak \u00b7 5 = oorvloedig", f_tree: "Boom", ph_tree: "Groeikrag, gesondheid, groeiwyse",
    f_bloom: "Blom", ph_bloom: "Volblom saam met...", f_weeks: "Weke in koelopberging", f_shrivel: "Verrimpeling", f_ib: "Interne verbruining",
    f_pos: "Positiewe", f_neg: "Negatiewe", f_note: "Notas",
    c_R: "Rooi", c_P: "Pers", c_B: "Swart", c_Y: "Geel", c_G: "Groen", c_O: "Oranje", c_M: "Gespikkel", c_W: "Wit", c_RY: "Rooi-geel",
    l_none: "Geen", l_light: "Lig", l_heavy: "Beduidend",
    n_size: "Grootte", n_mm: "mm", n_yield: "Opbrengs", n_weeks: "weke gestoor", n_firm: "Druk", n_set: "Set"
  },
  he: {
    title: 'טיפוח', loginTitle: 'כניסה', user: 'שם משתמש', pin: 'קוד אישי', login: 'כניסה', logout: 'יציאה',
    badLogin: 'שם משתמש או קוד שגויים', locked: 'המשתמש ננעל. פנה למנהל.', offline: 'אין חיבור לשרת', allTeams: 'כל הצוותים',
    code: 'קוד זן', open: 'פתח', recent: 'זנים קיימים', searchHint: 'הקלד חלק מהקוד ובחר מהרשימה. אין צורך במקפים או באפסים.', searchPh: 'חיפוש או קוד חדש', newVar: 'זן חדש:', pickOne: 'יש כמה זנים דומים. בחר מהרשימה.', newCode: 'קוד חדש, לא קיים ברשימה. אם התכוונת לזן קיים, בחר אותו:', noMatch: 'אין זן קיים שמתאים.', none: 'אין עדיין הערכות', evals: 'הערכות', typeCode: 'הקלד קוד זן',
    back: 'חזרה', backNoSave: 'חזרה בלי לשמור', newEval: '+ הערכה חדשה', history: 'היסטוריה',
    noneFor: 'אין עדיין הערכות לקוד הזה. אם הקוד קיים בכתיב אחר, בדוק ברשימה במסך הראשי.',
    stage: 'שלב', mother: 'עץ אם', graft: 'מורכב', when: 'מועד ההערכה', harvest: 'בקטיף', storage: 'אחרי קירור',
    dHarvest: 'תאריך קטיף', dStorage: 'תאריך הוצאה מקירור', photos: 'תמונות', takePhoto: '📷 מצלמה', addPhoto: 'גלריה',
    decision: 'החלטה (לא חובה)', d_keep: 'להמשיך לעקוב', d_graft: 'להרכיב', d_advance: 'לקדם', d_discard: 'לפסול', save: 'שמור',
    saved: 'נשמר', savedOffline: 'נשמר בטלפון, יישלח כשתהיה קליטה', nothing: 'אין מה לשמור: הוסף תמונה או נתון אחד לפחות',
    installTitle: 'התקנה בטלפון', installBtn: 'התקנת האפליקציה', installIos: 'באייפון: לפתוח ב-Safari, ללחוץ על כפתור השיתוף ואז "הוסף למסך הבית".', installHint: 'כדי להתקין כאפליקציה: לפתוח את הכתובת הזאת בדפדפן Chrome עצמו (לא מתוך וואטסאפ ולא מתוך אפליקציית דיווח שטח).',
    badValue: 'ערך לא סביר', badPhoto: 'לא ניתן לקרוא את התמונה', bigVideo: 'קובץ הסרטון גדול מדי. צלם קצר יותר או באיכות נמוכה יותר', rawPhoto: 'התמונה נוספה ללא תצוגה מקדימה', edit: 'עריכה', editing: 'עריכת הערכה', badVideo: 'לא ניתן להוסיף את הסרטון', waitWifi: 'סרטונים ממתינים ל-Wi-Fi', sendNow: 'שלח עכשיו', sendingVid: 'סרטונים נשלחים, השאירו את האפליקציה פתוחה', waitNet: 'סרטונים ממתינים לקליטה', lostFile: 'תמונה או סרטון אבדו בטלפון, נא להוסיף שוב', noStore: 'הטלפון לא הצליח לשמור את התמונה או הסרטון. דבר לא נשמר, נסו שוב או הסירו את הסרטון',
    f_plot: 'מיקום', ph_plot: 'אתר / חלקה / שורה', f_size: 'גודל פרי (מ"מ)', f_sizeClass: 'מיון גודל', ph_sizeClass: 'למשל A/AA/B', f_brix: 'בריקס', f_firm: 'מוצקות (ק"ג)',
    f_yield: 'צפי יבול', h_yield: '1 = נמוך · 3 = בינוני · 5 = גבוה מאוד', f_taste: 'טעם',
    h_taste: 'כיול: 4 = African Rose · 6 = Laetitia · 8 = Ruby Sun · 10 = Flavor King', f_tasteNote: 'תיאור טעם ומרקם', ph_tasteNote: 'למשל: פריך, ארומטי, חמצמץ ליד הקליפה',
    f_skin: 'צבע קליפה', f_flesh: 'צבע ציפה', f_fruitSet: 'חנטה', h_fruitSet: '1 = דלה · 5 = שופעת', f_tree: 'עץ', ph_tree: 'עוצמה, בריאות, צורת גידול',
    f_bloom: 'פריחה', ph_bloom: 'פריחה מלאה יחד עם...', f_weeks: 'שבועות בקירור', f_shrivel: 'כמישה', f_ib: 'השחמה פנימית',
    f_pos: 'יתרונות', f_neg: 'חסרונות', f_note: 'הערות',
    c_R: 'אדום', c_P: 'סגול', c_B: 'שחור', c_Y: 'צהוב', c_G: 'ירוק', c_O: 'כתום', c_M: 'מנומר', c_W: 'לבן', c_RY: 'אדום-צהוב',
    l_none: 'אין', l_light: 'קלה', l_heavy: 'משמעותית',
    n_size: 'גודל', n_mm: 'מ"מ', n_yield: 'יבול', n_weeks: 'שבועות קירור', n_firm: 'מוצקות', n_set: 'חנטה'
  },
  en: {
    title: 'Breeding', loginTitle: 'Sign in', user: 'User name', pin: 'Personal code', login: 'Sign in', logout: 'Sign out',
    badLogin: 'Wrong user name or code', locked: 'This user is locked. Contact the manager.', offline: 'No connection to the server', allTeams: 'All teams',
    code: 'Variety code', open: 'Open', recent: 'Existing varieties', searchHint: 'Type part of the code and pick from the list. Hyphens and zeros do not matter.', searchPh: 'Search or type a new code', newVar: 'New variety:', pickOne: 'Several similar codes. Pick one from the list.', newCode: 'New code, not in the list. If you meant an existing variety, pick it:', noMatch: 'No existing variety matches.', none: 'No evaluations yet', evals: 'evaluations', typeCode: 'Type a variety code',
    back: 'Back', backNoSave: 'Back without saving', newEval: '+ New evaluation', history: 'History',
    noneFor: 'No evaluations for this code yet. If the code exists in another spelling, check the list on the main screen.',
    stage: 'Stage', mother: 'Mother tree', graft: 'Grafted', when: 'Evaluation time', harvest: 'At harvest', storage: 'After cold storage',
    dHarvest: 'Harvest date', dStorage: 'Date out of cold storage', photos: 'Photos', takePhoto: '📷 Camera', addPhoto: 'Gallery',
    decision: 'Decision (optional)', d_keep: 'Keep following', d_graft: 'Graft', d_advance: 'Advance', d_discard: 'Discard', save: 'Save',
    saved: 'Saved', savedOffline: 'Saved on the phone, will be sent when there is reception', nothing: 'Nothing to save: add a photo or at least one value',
    installTitle: 'Install on this phone', installBtn: 'Install the app', installIos: 'On iPhone: open in Safari, tap the Share button, then "Add to Home Screen".', installHint: 'To install as an app: open this address in Chrome itself (not inside WhatsApp or another app).',
    badValue: 'value out of range', badPhoto: 'The photo could not be read', bigVideo: 'The video file is too large. Record a shorter one or in lower quality', rawPhoto: 'Photo added without a preview', edit: 'Edit', editing: 'Edit evaluation', badVideo: 'The video could not be added', waitWifi: 'videos waiting for Wi-Fi', sendNow: 'Send now', sendingVid: 'videos being sent, keep the app open', waitNet: 'videos waiting for reception', lostFile: 'A photo or video was lost on the phone, please add it again', noStore: 'The phone could not store the photo or video. Nothing was saved, try again or remove the video',
    f_plot: 'Location', ph_plot: 'Site / block / row', f_size: 'Fruit size (mm)', f_sizeClass: 'Size classes', ph_sizeClass: 'e.g. A/AA/B', f_brix: 'Brix', f_firm: 'Pressure (kg)',
    f_yield: 'Yield expectation', h_yield: '1 = low · 3 = medium · 5 = very high', f_taste: 'Taste',
    h_taste: 'Calibration: 4 = African Rose · 6 = Laetitia · 8 = Ruby Sun · 10 = Flavor King', f_tasteNote: 'Taste and texture', ph_tasteNote: 'e.g. crunchy, aromatic, acidic under the skin',
    f_skin: 'Skin colour', f_flesh: 'Flesh colour', f_fruitSet: 'Fruit set', h_fruitSet: '1 = poor · 5 = abundant', f_tree: 'Tree', ph_tree: 'Vigour, health, growth habit',
    f_bloom: 'Bloom', ph_bloom: 'Full bloom together with...', f_weeks: 'Weeks in cold storage', f_shrivel: 'Shrivel', f_ib: 'Internal browning',
    f_pos: 'Positives', f_neg: 'Negatives', f_note: 'Notes',
    c_R: 'Red', c_P: 'Purple', c_B: 'Black', c_Y: 'Yellow', c_G: 'Green', c_O: 'Orange', c_M: 'Dapple', c_W: 'White', c_RY: 'Red-yellow',
    l_none: 'None', l_light: 'Light', l_heavy: 'Significant',
    n_size: 'Size', n_mm: 'mm', n_yield: 'Yield', n_weeks: 'weeks stored', n_firm: 'Pressure', n_set: 'Set'
  }
};
let lang = localStorage.getItem('br_lang') || '';
const curLang = () => lang || (cultirex() ? 'af' : 'he');   // no language chosen yet: Afrikaans on a Cultirex phone, Hebrew otherwise
const t = k => (L[curLang()][k]) ?? L.en[k] ?? L.he[k] ?? k;
// Cultirex users get their own sign-in screen (a Cape photo) and Afrikaans in the language list.
// Before sign-in the team is not known yet, so the device remembers the last team that signed in.
const cultirex = () => B.token ? myTeam() === 'Cultirex' : (localStorage.getItem('br_lastteam') || (/^he/i.test(navigator.language || '') ? '' : 'Cultirex')) === 'Cultirex';

// The header carries the team's own name: Cultirex users see Cultirex, not Ben Dor.
const teamName = () => { const x = myTeam(); return x === 'Ben Dor' && curLang() === 'he' ? 'בן דור' : x; };
const title = () => (B.token && teamName() ? teamName() + ' - ' : '') + t('title');

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), Math.min(9000, Math.max(3000, String(msg).length * 70)));   // a long message stays long enough to read
}

// ---------- what is asked at each stage ----------
const STAGES = ['mother', 'graft'], KINDS = ['harvest', 'storage'], LEVELS = ['none', 'light', 'heavy'];
const FIELDS = {
  plot: { t: 'text' }, size: { t: 'num', step: '1', min: 15, max: 120 }, sizeClass: { t: 'text' },
  brix: { t: 'num', step: '0.1', min: 4, max: 35 }, firm: { t: 'num', step: '0.1', min: 0, max: 15 },
  yield: { t: 'scale', n: 5 }, taste: { t: 'scale', n: 10 }, tasteNote: { t: 'text' },
  skin: { t: 'chips', opts: ['R', 'P', 'B', 'Y', 'G', 'O', 'M'], pre: 'c_' }, flesh: { t: 'chips', opts: ['R', 'Y', 'O', 'W', 'G', 'RY'], pre: 'c_' },
  fruitSet: { t: 'scale', n: 5 }, tree: { t: 'text' }, bloom: { t: 'text' },
  weeks: { t: 'num', step: '1', min: 0, max: 40 }, shrivel: { t: 'chips', opts: LEVELS, pre: 'l_' }, ib: { t: 'chips', opts: LEVELS, pre: 'l_' },
  pos: { t: 'text' }, neg: { t: 'text' }, note: { t: 'text' }
};
const LAYOUT = {
  'mother/harvest': ['size', 'brix', 'yield', 'taste', 'tasteNote', 'note'],
  'mother/storage': ['weeks', 'brix', 'taste', 'shrivel', 'ib', 'note'],
  'graft/harvest': ['plot', 'size', 'sizeClass', 'brix', 'firm', 'yield', 'taste', 'tasteNote', 'skin', 'flesh', 'fruitSet', 'tree', 'bloom', 'pos', 'neg', 'note'],
  'graft/storage': ['plot', 'weeks', 'brix', 'firm', 'taste', 'tasteNote', 'shrivel', 'ib', 'pos', 'neg', 'note']
};
const DECISIONS = { mother: ['keep', 'graft', 'discard'], graft: ['keep', 'advance', 'discard'] };

// ---------- state ----------
const LS = 'br_state_v2' + (MOCK ? '_mock' : '');
const EMPTY = { token: null, me: null, team: '', codes: [], all: {}, cache: {}, evals: [], photos: [] };
let B = (() => { try { return Object.assign({}, EMPTY, JSON.parse(localStorage.getItem(LS))); } catch (e) { return { ...EMPTY }; } })();
function persist() {
  try { localStorage.setItem(LS, JSON.stringify(B)); }
  catch (e) { B.cache = {}; try { localStorage.setItem(LS, JSON.stringify(B)); } catch (e2) { /* phone storage full: keep working from memory */ } }
}
// Finding a variety must not depend on how the code was typed: 13C0402, 13c-4-2 and 13C04-02 all find 13C04-02.
const plain = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const loose = s => plain(s).replace(/0/g, '');
function matches(q) {
  const list = B.codes.filter(c => c.team === myTeam()), p = plain(q), l = loose(q);
  if (!p) return list;                                   // nothing typed: the whole list, every variety of the team
  const a = list.filter(c => plain(c.code).startsWith(p));
  const b = list.filter(c => !a.includes(c) && loose(c.code).startsWith(l));
  const d = list.filter(c => !a.includes(c) && !b.includes(c) && loose(c.code).includes(l));
  return a.concat(b, d);
}
function codesOf(team) {
  const m = new Map();
  for (const e of B.all[team] || []) {
    const k = ckey(e.code);
    if (!m.has(k)) m.set(k, { team, code: e.code, last: '', stage: e.stage, n: 0, decision: '' });
    const c = m.get(k); c.n++;
    if (e.date >= c.last) { c.last = e.date; c.stage = e.stage; if (e.decision) c.decision = e.decision; }
  }
  return [...m.values()].sort((x, y) => x.code.localeCompare(y.code, 'en', { numeric: true }));   // by code: AR-1-2-3 before AR-1-2-13
}
let view = 'home', cur = '', busy = false;
let form = null;      // { code, stage, kind, date, vals, decision, photos: [{id, blob, thumb}] }
const myTeam = () => (B.me && B.me.admin ? B.team : '') || (B.me && B.me.team) || '';
const tkey = (team, code) => team + '|' + ckey(code);

// ---------- photo storage on the phone ----------
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('br_media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('m');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
// A write counts only when the whole transaction is finished: a phone can accept the request and then fail to write the file itself.
async function mtx(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('m', mode), q = fn(tx.objectStore('m'));
    tx.oncomplete = () => res(q.result); tx.onabort = tx.onerror = () => rej(tx.error || q.error || new Error('storage'));
    q.onerror = () => rej(q.error);
  });
}
// A file picked from the gallery or the camera is only a pointer to the phone's own file, which the app may lose.
// It is read into the app's memory first, in pieces, so that what is stored is the content itself.
async function ownCopy(f) {
  try {
    const parts = [];
    for (let from = 0; from < f.size; from += 8388608) parts.push(await f.slice(from, from + 8388608).arrayBuffer());
    return new Blob(parts, { type: f.type || 'application/octet-stream' });
  } catch (e) { return f; }     // the phone refuses to hand over the content now: the file itself is tried, and saving checks that it was really stored
}
const mput = (id, blob) => mtx('readwrite', s => s.put(blob, id));
const mget = id => mtx('readonly', s => s.get(id));
const mdel = id => mtx('readwrite', s => s.delete(id));
const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
// A phone photo is 4-10 MB. It is reduced to about 1600 px for the archive, plus a tiny preview kept in the sheet.
// Some phones hand over a format the fast decoder refuses (HEIC, a very large picture): the plain image element is tried next.
async function bitmap(file) {
  try { return await createImageBitmap(file); }
  catch (e) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), i = new Image();
      i.onload = () => { URL.revokeObjectURL(url); i.naturalWidth ? res(i) : rej(new Error('decode')); };
      i.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); };
      i.src = url;
    });
  }
}
function videoThumb(blob) {
  return new Promise(res => {
    const v = document.createElement('video'), url = URL.createObjectURL(blob);
    const end = out => { clearTimeout(tm); URL.revokeObjectURL(url); res(out); };
    const tm = setTimeout(() => end(null), 9000);
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    v.onloadeddata = () => { v.currentTime = Math.min(0.6, (v.duration || 1) / 2); };
    v.onseeked = () => {
      try {
        const k = 320 / Math.max(v.videoWidth, v.videoHeight), c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b => end(b), 'image/jpeg', 0.7);
      } catch (e) { end(null); }
    };
    v.onerror = () => end(null);
  });
}
const BIG_VIDEOS = true;   // true only once the Google script that accepts videos in pieces is deployed
const MAX_VIDEO = BIG_VIDEOS ? 200 * 1024 * 1024 : 25e6, MAX_RAW = 15e6, ONE_GO = BIG_VIDEOS ? 20e6 : Infinity;   // one request to the server carries about 50 MB; a larger file travels in pieces
const fileExt = (f, d) => (/\.([a-z0-9]{2,4})$/i.exec(f.name || '') || [0, (f.type || '').split('/')[1] || d])[1].toLowerCase().replace('quicktime', 'mov');
const sizeTxt = f => `${f.type || fileExt(f, '?')}, ${(f.size / 1e6).toFixed(1)} MB`;
async function scaled(file, max, q) {
  const img = file instanceof Blob ? await bitmap(file) : file;   // a picture already decoded is used as it is
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', q));
}

// ---------- previews kept on the phone ----------
// The small previews of every photo of the team are stored on the phone, a page of rows at a time,
// so a variety opens with its photos at once and also without reception. Only new rows are asked for later.
const PAGE = 40, TH = {};
let thBusy = false;
async function thumbsLoad(team) {
  if (TH[team]) return TH[team];
  const o = TH[team] = { pages: [] };
  try { const n = (await mget('thn:' + team)) || 0; for (let i = 0; i < n; i++) o.pages[i] = (await mget('th:' + team + ':' + i)) || []; } catch (e) { /* no storage: asked from the server each time */ }
  if (view === 'card' && myTeam() === team) render();
  return o;
}
async function syncThumbs(team) {
  if (thBusy || !team) return; thBusy = true;
  try {
    const o = await thumbsLoad(team);
    let i = o.pages.length && o.pages[o.pages.length - 1].length < PAGE ? o.pages.length - 1 : o.pages.length;   // the last page may have grown
    for (;;) {
      const j = await api('bthumbs', { team, from: i * PAGE, n: PAGE });
      if (!j.ok) break;
      if (j.total < o.pages.reduce((a, p) => a + p.length, 0)) { o.pages = []; i = 0; await mput('thn:' + team, 0); continue; }   // rows were removed in the sheet: start again
      if (!j.photos.length) break;
      o.pages[i] = j.photos; await mput('th:' + team + ':' + i, j.photos); await mput('thn:' + team, o.pages.length);
      if (view === 'card' && myTeam() === team) render();
      if ((i + 1) * PAGE >= j.total) break;
      i++;
    }
  } catch (e) { /* offline: what the phone already has is used */ }
  thBusy = false;
}

// A large video goes up in pieces; the server says how large a piece is. If the connection drops, the video starts again next time.
let upPct = null;
async function upBig(p, blob) {
  try {
    const s = await api('bupstart', { photo: { ...p, mime: blob.type || 'video/mp4', size: blob.size } });
    if (!s.ok) return false;
    if (s.done) return true;
    const n = s.chunk || 8388608;
    for (let from = 0; from < blob.size;) {
      upPct = Math.round(from / blob.size * 100); renderTop();
      const j = await api('bupchunk', { id: p.id, from, data: await toB64(blob.slice(from, from + n)) });
      if (!j.ok || (!j.done && !(j.next > from))) return false;
      if (j.done) return true;
      from = j.next;
    }
    return false;
  } finally { upPct = null; }
}

// ---------- server ----------
async function api(action, payload = {}) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, btoken: B.token, ...payload }) });
  const j = await r.json();
  if (j.error === 'auth' && action !== 'blogin') { B.token = null; B.me = null; persist(); render(); throw new Error('auth'); }
  return j;
}
const waiting = () => B.evals.length + B.photos.length;
// Videos are heavy. On mobile data they wait on the phone and go by themselves once the phone is on Wi-Fi;
// "Send now" sends them anyway. A phone that does not say what it is connected to (iPhone) sends at once.
// Evaluations and photos never wait, and they always go before the videos.
let sendVideosNow = false;
const vidName = p => /\.(mp4|mov|webm|m4v|3gp)$/i.test(p.name || '');
const onMobileData = () => { const c = navigator.connection; return !!c && (c.type === 'cellular' || c.saveData === true); };
const heldVideos = () => (onMobileData() && !sendVideosNow ? B.photos.filter(vidName) : []);
function sendQueue() { const held = heldVideos(); return B.photos.filter(p => !vidName(p)).concat(B.photos.filter(p => vidName(p) && !held.includes(p))); }
function drawVbar() {
  let el = $('#vbar');
  if (!el) { el = document.createElement('div'); el.id = 'vbar'; el.style.cssText = 'display:none;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;background:#fff4d6;color:#4a3800;font-size:14px'; $('#app').before(el); }
  const vids = B.token ? B.photos.filter(vidName).length : 0, held = B.token ? heldVideos().length : 0;
  el.style.display = vids ? 'flex' : 'none';
  if (!vids) { sendVideosNow = false; return; }
  el.innerHTML = held ? `<span>\ud83c\udfa5 ${held} \u00b7 ${esc(t('waitWifi'))}</span><button type="button" data-act="sendNow" style="border:0;border-radius:8px;padding:6px 12px;background:#4a3800;color:#fff;font:inherit;white-space:nowrap">${esc(t('sendNow'))}</button>`
    : `<span>\ud83c\udfa5 ${vids} \u00b7 ${esc(t(navigator.onLine ? 'sendingVid' : 'waitNet'))}</span>`;
}
// what was just sent stays visible in the variety's history even before the server copy is read again
function keep(team, code, list, rec) { const k = tkey(team, code), c = B.cache[k] || (B.cache[k] = { evals: [], photos: [] }); if (!c[list].some(x => x.id === rec.id)) c[list].push(rec); }
async function sync() {
  if (busy || !B.token || !(B.evals.length + sendQueue().length)) return;
  busy = true; renderTop();
  try {
    if (B.evals.length) {
      const j = await api('bsave', { evals: B.evals });
      if (j.ok) {
        B.evals.filter(e => j.done.includes(e.id)).forEach(e => {
          const { edit, ...rec } = e;
          if (edit) {   // a correction replaces the copy kept on the phone
            const all = B.all[e.team] || [], i = all.findIndex(x => x.id === e.id); if (i >= 0) all[i] = rec;
            const c = B.cache[tkey(e.team, e.code)]; if (c && c.evals) c.evals = c.evals.filter(x => x.id !== e.id);
          }
          keep(e.team, e.code, 'evals', rec);
        });
        B.evals = B.evals.filter(e => !j.done.includes(e.id)); persist();
      }
    }
    for (const p of sendQueue()) {          // one file per request; photos first, then the videos that may go now
      const blob = await mget(p.id);
      if (!blob || !blob.size) { B.photos = B.photos.filter(x => x.id !== p.id); persist(); toast(`${t('lostFile')} (${p.code})`); continue; }
      let sent;
      if (blob.size > ONE_GO) sent = await upBig(p, blob);
      else { const j = await api('bsave', { photos: [{ ...p, mime: blob.type, data: await toB64(blob) }] }); sent = j.ok && (j.done || []).includes(p.id); }   // the server lists what it really stored
      if (!sent) break;
      keep(p.team, p.code, 'photos', p); B.photos = B.photos.filter(x => x.id !== p.id); persist(); await mdel(p.id); renderTop();
    }
  } catch (e) { /* no reception: everything stays on the phone and is sent later */ }
  busy = false; renderTop();
  if (view === 'card') { render(); loadCode(cur); }
  if (!(B.evals.length + sendQueue().length)) loadCodes();
}
async function loadCodes() {
  const team = myTeam();
  try {
    const j = await api('ball', { team });
    if (j.ok) { B.all[team] = j.evals; B.codes = codesOf(team); persist(); if (view === 'home') drawRecent(); if (view === 'card') render(); syncThumbs(team); }
  } catch (e) { /* offline: the copy on the phone is used */ }
}
async function loadCode(code) {
  const team = myTeam(), k = tkey(team, code);
  try {
    const j = await api('bphotos', { code, team });
    if (j.ok) {
      B.cache[k] = { evals: (B.cache[k] || {}).evals || [], photos: j.photos };
      const ks = Object.keys(B.cache); while (ks.length > 25) delete B.cache[ks.shift()];
      persist(); if (view === 'card' && ckey(cur) === ckey(code)) render();
    }
  } catch (e) { /* offline: text is shown, photos when there is reception */ }
}

// ---------- install to the home screen ----------
// A browser only opens its install dialog after a tap, so there is a button. iPhones have no dialog:
// they get the two Safari steps. Inside WhatsApp or another app's window nothing can be installed,
// so a hint says to open the address in the browser itself.
let installEvt = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (view !== 'form') render(); });
window.addEventListener('appinstalled', () => { installEvt = null; if (view !== 'form') render(); });
function installCard() {
  if (standalone()) return '';
  const body = installEvt ? `<button class="btn" data-act="install" style="margin-top:0">⬇ ${esc(t('installBtn'))}</button>`
    : `<p class="muted" style="margin:0">${esc(t(isIos() ? 'installIos' : 'installHint'))}</p>`;
  return `<div class="card"><h2>${esc(t('installTitle'))}</h2>${body}</div>`;
}

// ---------- screens ----------
function renderTop() {
  const n = waiting();
  drawVbar();
  $('#top').innerHTML = `<div class="title">${esc(title())}</div><div class="right">
    ${B.token ? `<button data-act="sync">${busy ? '⟳' + (upPct != null ? ' ' + upPct + '%' : '') : n ? '⏳ ' + n : '✓'}</button>` : ''}
    <select id="langSel" aria-label="language"><option value="he"${curLang() === 'he' ? ' selected' : ''}>עברית</option><option value="en"${curLang() === 'en' ? ' selected' : ''}>English</option>${cultirex() || curLang() === 'af' ? `<option value="af"${curLang() === 'af' ? ' selected' : ''}>Afrikaans</option>` : ''}</select>
    ${B.token ? `<button data-act="logout">${esc(t('logout'))}</button>` : ''}</div>`;
}
function render() {
  document.documentElement.lang = curLang();
  document.documentElement.dir = curLang() === 'he' ? 'rtl' : 'ltr';
  document.body.classList.toggle('cape', !B.token && cultirex());
  document.title = title();
  renderTop();
  const app = $('#app');
  if (!B.token) { app.innerHTML = vLogin(); return; }
  app.innerHTML = ({ home: vHome, card: vCard, form: vForm })[view]();
  if (view === 'form') drawPhotos();
}
function vLogin() {
  return `<form id="loginForm" class="card"><h2>${esc(t('loginTitle'))}</h2>
    <label for="lUser">${esc(t('user'))}</label><input id="lUser" autocomplete="username" autocapitalize="none" value="${esc(localStorage.getItem('br_lastuser') || '')}" required>
    <label for="lPin">${esc(t('pin'))}</label><input id="lPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8" required>
    <button class="btn" id="loginBtn">${esc(t('login'))}</button></form>${installCard()}`;
}
function vHome() {
  const teams = B.me.admin && B.me.teams && B.me.teams.length > 1
    ? `<select id="teamSel" style="margin-bottom:12px">${B.me.teams.map(x => `<option${myTeam() === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>` : '';
  return `${installCard()}${teams}<div class="card">
    <form id="find"><input id="code" class="codein" autocomplete="off" autocapitalize="characters" placeholder="${esc(t('searchPh'))}" aria-label="${esc(t('code'))}">
    <button class="btn" id="newBtn" style="display:none"></button></form>
    <div id="recent" style="margin-top:12px">${recentHtml()}</div></div>`;
}
function recentHtml() {
  const q = $('#code') ? $('#code').value : '', list = matches(q);
  if (!list.length && plain(q)) return `<div class="muted">${esc(t('noMatch'))}</div>`;
  const total = B.codes.filter(c => c.team === myTeam()).length;
  return list.length ? `<div class="muted" style="margin-bottom:4px">${list.length === total ? total : list.length + ' / ' + total}</div><ul class="list">${list.map(c => `<li data-act="open" data-code="${esc(c.code)}" style="cursor:pointer"><span><span class="code">${esc(c.code)}</span><br><span class="muted">${dshow(c.last)} · ${esc(t(c.stage))} · ${c.n} ${esc(t('evals'))}</span></span>
    ${c.decision ? `<span class="pill ${c.decision === 'discard' ? 'bad' : 'ok'}">${esc(t('d_' + c.decision))}</span>` : ''}</li>`).join('')}</ul>` : `<div class="muted">${esc(t('none'))}</div>`;
}
function drawRecent() {
  const el = $('#recent'); if (el) el.innerHTML = recentHtml();
  const b = $('#newBtn'), q = $('#code') ? $('#code').value.trim().toUpperCase().replace(/\s+/g, '-') : '';
  if (!b) return;
  const known = !ckey(q) || matches(q).length > 0;      // while the list still offers something, the list is the way in
  b.style.display = known ? 'none' : ''; b.textContent = `${t('newVar')} ${q}`;     // the button exists only for a code that is not in the list (Enter opens any typed code)
}

// everything known about one code: what the server has plus what is still waiting on this phone
function history(code) {
  const team = myTeam(), k = ckey(code), kept = B.cache[tkey(team, code)] || { evals: [], photos: [] };
  const mine = x => x.team === team && ckey(x.code) === k;
  const stored = (B.all[team] || []).filter(e => ckey(e.code) === k);
  const c = { evals: stored.concat((kept.evals || []).filter(e => !stored.some(x => x.id === e.id))), photos: (kept.photos || []).slice() };
  const ids = new Set(c.evals.map(e => e.id));       // previews kept on the phone fill in what was not asked from the server yet
  (TH[team] ? TH[team].pages : []).forEach(pg => (pg || []).forEach(p => { if (ids.has(p.evalId) && !c.photos.some(x => x.id === p.id)) c.photos.push(p); }));
  const pend = B.evals.filter(mine);   // a correction still waiting on the phone is shown instead of the stored copy
  const evals = c.evals.filter(e => !pend.some(x => x.id === e.id)).concat(pend.map(e => ({ ...e, local: true })));
  const photos = c.photos.concat(B.photos.filter(p => mine(p) && !c.photos.some(x => x.id === p.id)).map(p => ({ ...p, local: true })));
  const key = e => e.date + (e.kind === 'storage' ? '1' : '0');
  return { evals: evals.sort((a, b) => key(b).localeCompare(key(a))), photos };
}
const isVideo = p => /\.(mp4|mov|webm|m4v|3gp)$/i.test(p.name || '');
const BLANK = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';   // 1 px, when a video has no preview frame
function nums(e) {
  const out = [], has = k => e[k] != null && e[k] !== '';
  if (has('size')) out.push(`${esc(t('n_size'))} <b>${esc(e.size)}</b> ${esc(t('n_mm'))}`);
  if (has('sizeClass')) out.push(`<b>${esc(e.sizeClass)}</b>`);
  if (has('brix')) out.push(`${esc(t('f_brix'))} <b>${esc(e.brix)}</b>`);
  if (has('firm')) out.push(`${esc(t('n_firm'))} <b>${esc(e.firm)}</b>`);
  if (has('yield')) out.push(`${esc(t('n_yield'))} <b>${esc(e.yield)}</b>/5`);
  if (has('taste')) out.push(`${esc(t('f_taste'))} <b>${esc(e.taste)}</b>/10`);
  if (has('fruitSet')) out.push(`${esc(t('n_set'))} <b>${esc(e.fruitSet)}</b>/5`);
  if (has('weeks')) out.push(`<b>${esc(e.weeks)}</b> ${esc(t('n_weeks'))}`);
  if (has('shrivel')) out.push(`${esc(t('f_shrivel'))}: <b>${esc(t('l_' + e.shrivel))}</b>`);
  if (has('ib')) out.push(`${esc(t('f_ib'))}: <b>${esc(t('l_' + e.ib))}</b>`);
  if (has('skin')) out.push(`${esc(t('f_skin'))}: ${esc(t('c_' + e.skin))}`);
  if (has('flesh')) out.push(`${esc(t('f_flesh'))}: ${esc(t('c_' + e.flesh))}`);
  return out.join(' · ');
}
function vCard() {
  const h = history(cur);
  const texts = e => ['plot', 'tasteNote', 'tree', 'bloom', 'pos', 'neg', 'note'].filter(k => e[k]).map(k => `<div><span class="muted">${esc(t('f_' + k))}:</span> ${esc(e[k])}</div>`).join('');
  return `<button class="back" data-act="home">${esc(t('back'))}</button>
  <div class="card"><h2 class="code" style="font-size:26px;text-align:center">${esc(cur)}</h2>
    <button class="btn" data-act="new">${esc(t('newEval'))}</button></div>
  <div class="card"><h2>${esc(t('history'))} (${h.evals.length})</h2>
    ${h.evals.length ? h.evals.map(e => `<div class="ev"><div class="h"><span>${dshow(e.date)} · ${esc(t(e.stage))} · ${esc(t(e.kind))}${e.local ? ' ⏳' : ''}</span>
      ${e.decision ? `<span class="pill ${e.decision === 'discard' ? 'bad' : 'ok'}">${esc(t('d_' + e.decision))}</span>` : ''}</div>
      <div class="nums">${nums(e)}</div>${texts(e)}
      <div class="muted" style="font-size:13px;display:flex;justify-content:space-between;align-items:center"><span>${esc(e.evaluator || '')}</span><button type="button" data-act="edit" data-id="${esc(e.id)}" style="border:0;background:none;color:inherit;font:inherit;text-decoration:underline;padding:6px 0;cursor:pointer">✎ ${esc(t('edit'))}</button></div>
      <div class="thumbs">${h.photos.filter(p => p.evalId === e.id).map(p => `<span class="t${isVideo(p) ? ' vid' : ''}" title="${esc(p.name || '')}"><img src="data:image/jpeg;base64,${p.thumb || BLANK}" data-act="zoom" data-id="${p.id}" data-local="${p.local ? 1 : ''}" data-video="${isVideo(p) ? 1 : ''}" alt=""></span>`).join('')}</div></div>`).join('')
    : `<div class="muted">${esc(t('newCode'))}</div><div class="chips" style="margin-top:8px">${matches(cur).slice(0, 8).map(c => `<button data-act="open" data-code="${esc(c.code)}"><span class="code">${esc(c.code)}</span></button>`).join('')}</div>`}</div>`;
}
function fieldHtml(k) {
  const f = FIELDS[k], v = form.vals[k] ?? '';
  let inner;
  if (f.t === 'num') inner = `<input data-f="${k}" type="number" inputmode="decimal" step="${f.step}" value="${esc(v)}">`;
  else if (f.t === 'text') inner = `<input data-f="${k}" value="${esc(v)}" placeholder="${esc(L[curLang()]['ph_' + k] || '')}" maxlength="300">`;
  else if (f.t === 'scale') inner = `<div class="scale n${f.n}">${Array.from({ length: f.n }, (_, i) => `<button type="button" data-act="pick" data-f="${k}" data-v="${i + 1}" class="${String(v) === String(i + 1) ? 'sel' : ''}">${i + 1}</button>`).join('')}</div>`;
  else inner = `<div class="chips">${f.opts.map(o => `<button type="button" data-act="pick" data-f="${k}" data-v="${o}" class="${v === o ? 'sel' : ''}">${esc(t(f.pre + o))}</button>`).join('')}</div>`;
  const hint = L[curLang()]['h_' + k];
  return `<label>${esc(t('f_' + k))}</label>${inner}${hint ? `<div class="hint">${esc(hint)}</div>` : ''}`;
}
function vForm() {
  const seg = (name, list, val) => `<div class="seg">${list.map(k => `<button type="button" data-act="seg" data-name="${name}" data-v="${k}" class="${val === k ? 'sel' : ''}">${esc(t(k))}</button>`).join('')}</div>`;
  return `<button class="back" data-act="card">${esc(t('backNoSave'))}</button>
  <form id="evalForm" class="card"><h2 class="code">${esc(form.code)}</h2>${form.editId ? `<div class="muted" style="text-align:center">${esc(t('editing'))}</div>` : ''}
    <label>${esc(t('stage'))}</label>${seg('stage', STAGES, form.stage)}
    <label>${esc(t('when'))}</label>${seg('kind', KINDS, form.kind)}
    <label for="fDate">${esc(t(form.kind === 'harvest' ? 'dHarvest' : 'dStorage'))}</label><input id="fDate" type="date" value="${form.date}" max="${dstr(new Date())}">
    <label>${esc(t('photos'))}</label>
    <div style="display:flex;gap:8px">
      <button type="button" class="btn sec" data-act="takePhoto" style="margin-top:0;flex:1">${esc(t('takePhoto'))}</button>
      <button type="button" class="btn sec" data-act="addPhoto" style="margin-top:0;flex:1">${esc(t('addPhoto'))}</button>
    </div>
    <input id="fCam" type="file" accept="image/*,video/*" capture="environment" hidden>
    <input id="fFiles" type="file" accept="image/*,video/*" multiple hidden>
    ${form.editId ? `<div class="thumbs">${history(form.code).photos.filter(p => p.evalId === form.editId).map(p => `<span class="t${isVideo(p) ? ' vid' : ''}"><img src="data:image/jpeg;base64,${p.thumb || BLANK}" alt=""></span>`).join('')}</div>` : ''}
    <div id="fThumbs" class="thumbs"></div>
    ${LAYOUT[form.stage + '/' + form.kind].map(fieldHtml).join('')}
    <label>${esc(t('decision'))}</label><div class="chips">${DECISIONS[form.stage].map(k => `<button type="button" data-act="decide" data-v="${k}" class="${form.decision === k ? 'sel' : ''}">${esc(t('d_' + k))}</button>`).join('')}</div>
    <button class="btn" id="saveBtn">${esc(t('save'))}</button></form>`;
}
function drawPhotos() {
  const el = $('#fThumbs'); if (!el) return;
  el.innerHTML = form.photos.map(p => `<div class="t${/^(mp4|mov|webm|m4v|3gp)$/.test(p.ext) ? ' vid' : ''}"><img src="data:image/jpeg;base64,${p.thumb || BLANK}" alt=""><button type="button" class="x" data-act="rmPhoto" data-id="${p.id}">✕</button></div>`).join('');
}
function readForm() {
  if (!form || !$('#evalForm')) return;
  $$('#evalForm [data-f]').forEach(i => { if (i.tagName === 'INPUT') form.vals[i.dataset.f] = i.value.trim(); });
  form.date = $('#fDate').value || form.date;
}
function openCode(code) {
  code = String(code || '').trim().toUpperCase().replace(/\s+/g, '-');
  if (!ckey(code)) return toast(t('typeCode'));
  const list = B.codes.filter(c => c.team === myTeam());
  let known = list.find(c => ckey(c.code) === ckey(code));          // keep one spelling per variety
  if (!known) {
    const m = list.filter(c => loose(c.code) === loose(code));       // typed without hyphens or zeros
    if (m.length > 1) { drawRecent(); return toast(t('pickOne')); }
    known = m[0];
  }
  cur = known ? known.code : code; view = 'card'; render(); window.scrollTo(0, 0); loadCode(cur);
}

// ---------- actions ----------
const actions = {
  sync() { sync(); },
  sendNow() { sendVideosNow = true; drawVbar(); sync(); },
  async install() { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { /* closed */ } installEvt = null; render(); },
  logout() { if (waiting() && !confirm('⏳ ' + waiting())) return; B = { ...EMPTY, evals: B.evals, photos: B.photos }; persist(); view = 'home'; render(); },
  home() { view = 'home'; render(); loadCodes(); },
  card() { view = 'card'; form = null; render(); },
  open(el) { openCode(el.dataset.code); },
  new() {
    const last = history(cur).evals[0];
    form = { code: cur, stage: last ? last.stage : 'mother', kind: 'harvest', date: dstr(new Date()), vals: {}, decision: '', photos: [] };
    if (last && last.plot) form.vals.plot = last.plot;
    view = 'form'; render(); window.scrollTo(0, 0);
  },
  edit(el) {     // the stored evaluation opens in the same form; saving rewrites it and adds any new photos to it
    const e = history(cur).evals.find(x => x.id === el.dataset.id); if (!e) return;
    const vals = {}; Object.keys(FIELDS).forEach(k => { if (e[k] != null && e[k] !== '') vals[k] = String(e[k]); });
    form = { code: e.code || cur, stage: STAGES.includes(e.stage) ? e.stage : 'mother', kind: KINDS.includes(e.kind) ? e.kind : 'harvest', date: e.date || dstr(new Date()), vals, decision: e.decision || '', photos: [], editId: e.id, orig: e };
    view = 'form'; render(); window.scrollTo(0, 0);
  },
  seg(el) { readForm(); form[el.dataset.name] = el.dataset.v; if (el.dataset.name === 'stage') form.decision = ''; render(); },
  pick(el) { readForm(); const k = el.dataset.f; form.vals[k] = form.vals[k] === el.dataset.v ? '' : el.dataset.v; $$(`[data-act=pick][data-f="${k}"]`).forEach(b => b.classList.toggle('sel', b.dataset.v === form.vals[k])); },
  decide(el) { form.decision = form.decision === el.dataset.v ? '' : el.dataset.v; $$('[data-act=decide]').forEach(b => b.classList.toggle('sel', b.dataset.v === form.decision)); },
  takePhoto() { $('#fCam').click(); },      // one camera button for a photo or a video; a picker that allows several files only shows the gallery on Android
  addPhoto() { $('#fFiles').click(); },
  rmPhoto(el) { form.photos = form.photos.filter(p => p.id !== el.dataset.id); drawPhotos(); },
  async zoom(el) {
    const v = $('#view'), video = !!el.dataset.video; v.hidden = false; v.innerHTML = `<img src="${el.src}" alt="">${video ? '<div class="wait">⟳</div>' : ''}`;
    try {
      let src = '';
      if (el.dataset.local) { const b = await mget(el.dataset.id); if (b) src = URL.createObjectURL(b); }
      else {
        const j = await api('bphoto', { id: el.dataset.id, team: myTeam() });
        if (j.ok && j.big) {                    // a large video comes down in pieces
          const parts = [];
          for (let from = 0; from < j.size;) {
            if (v.hidden) return;
            const w = v.querySelector('.wait'); if (w) w.textContent = Math.round(from / j.size * 100) + '%';
            const q = await api('bpart', { id: el.dataset.id, team: myTeam(), from });
            if (!q.ok || !(q.next > from)) { parts.length = 0; break; }
            parts.push(await (await fetch('data:application/octet-stream;base64,' + q.data)).blob()); from = q.next;
          }
          if (parts.length) src = URL.createObjectURL(new Blob(parts, { type: j.mime }));
        } else if (j.ok) src = video ? URL.createObjectURL(await (await fetch(`data:${j.mime};base64,${j.data}`)).blob()) : `data:${j.mime};base64,${j.data}`;
      }
      if (src && !v.hidden) v.innerHTML = video ? `<video src="${src}" controls autoplay playsinline></video>` : `<img src="${src}" alt="">`;
    } catch (e) { /* offline: the small preview stays */ }
  }
};
document.addEventListener('click', e => {
  if (e.target.closest('#view video')) return;
  if (e.target.closest('#view')) { $('#view').hidden = true; $('#view').innerHTML = ''; return; }
  const el = e.target.closest('[data-act]'); if (el) actions[el.dataset.act]?.(el);
});
document.addEventListener('input', e => { if (e.target.id === 'code') drawRecent(); });
document.addEventListener('change', async e => {
  if (e.target.id === 'langSel') { readForm(); lang = e.target.value; localStorage.setItem('br_lang', lang); render(); return; }
  if (e.target.id === 'teamSel') { B.team = e.target.value; B.codes = []; persist(); render(); thumbsLoad(myTeam()); loadCodes(); return; }
  if (!['fFiles', 'fCam'].includes(e.target.id)) return;
  for (const f of [...e.target.files]) {
    if (!f.size) { toast(`${t('badPhoto')} (0 MB)`); continue; }
    if (/^video\//.test(f.type) || /\.(mp4|mov|webm|m4v|3gp)$/i.test(f.name || '')) {
      if (f.size > MAX_VIDEO) { toast(`${t('bigVideo')} (${(f.size / 1e6).toFixed(0)} MB, max ${Math.round(MAX_VIDEO / 1e6)} MB)`); continue; }
      try {
        const tb = await videoThumb(f);
        form.photos.push({ id: uid(), blob: await ownCopy(f), thumb: tb ? await toB64(tb) : '', ext: /^(mp4|mov|webm|m4v|3gp)$/.test(fileExt(f, 'mp4')) ? fileExt(f, 'mp4') : 'mp4' });
      } catch (err) { toast(`${t('badVideo')} (${sizeTxt(f)}; ${String(err && err.message || err).slice(0, 60)})`); }
      drawPhotos(); continue;
    }
    try {
      const img = await bitmap(f);
      const blob = await scaled(img, 2400, 0.9);   // full photo close to the camera's own quality
      let thumb = '';                              // a preview sharp enough for a phone screen; it lives in a sheet cell, which holds 50,000 characters
      for (const q of [0.72, 0.6, 0.48, 0.36]) { thumb = await toB64(await scaled(img, 320, q)); if (thumb.length < 45000) break; }
      if (thumb.length >= 45000) thumb = await toB64(await scaled(img, 240, 0.4));
      if (!blob) throw new Error('canvas');
      form.photos.push({ id: uid(), blob, thumb, ext: 'jpg' });
    } catch (err) {
      // the phone cannot open this picture format: the file is kept as it is, without a preview, rather than lost
      if (f.size <= MAX_RAW) { form.photos.push({ id: uid(), blob: await ownCopy(f), thumb: '', ext: fileExt(f, 'jpg') }); toast(`${t('rawPhoto')} (${sizeTxt(f)})`); }
      else toast(`${t('badPhoto')} (${sizeTxt(f)})`);
    }
    drawPhotos();
  }
  e.target.value = ''; drawPhotos();
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  if (e.target.id === 'loginForm') {
    const btn = $('#loginBtn'); btn.disabled = true;
    try {
      const user = $('#lUser').value.trim();
      const j = await api('blogin', { user, pin: $('#lPin').value });
      if (j.ok) {
        localStorage.setItem('br_lastuser', user);
        B.token = j.token; B.me = j.me; B.team = j.me.team; B.codes = []; B.cache = {};
        localStorage.setItem('br_lastteam', j.me.team);
        if (!lang) { lang = j.me.team === 'Ben Dor' ? 'he' : j.me.team === 'Cultirex' ? 'af' : 'en'; localStorage.setItem('br_lang', lang); }   // first sign-in: Cultirex starts in Afrikaans, other partners in English
        persist(); view = 'home'; render(); loadCodes(); sync(); return;
      }
      toast(t(j.error === 'locked' ? 'locked' : 'badLogin'));
    } catch (err) { toast(t('offline')); }
    btn.disabled = false; $('#lPin').value = '';
    return;
  }
  if (e.target.id === 'find') return openCode($('#code').value);
  if (e.target.id !== 'evalForm') return;
  readForm();
  const keys = LAYOUT[form.stage + '/' + form.kind], vals = {};
  for (const k of keys) {
    const f = FIELDS[k], v = form.vals[k];
    if (v == null || v === '') continue;
    if (f.t === 'num') { const n = parseFloat(v); if (isNaN(n) || n < f.min || n > f.max) return toast(`${t('f_' + k)}: ${t('badValue')} (${f.min}-${f.max})`); vals[k] = n; }
    else vals[k] = v;
  }
  if (!form.editId && !Object.keys(vals).length && !form.photos.length) return toast(t('nothing'));
  const id = form.editId || uid(), team = myTeam();
  let rec = { id, team, code: form.code, stage: form.stage, kind: form.kind, date: form.date, season: form.date.slice(0, 4), decision: form.decision, evaluator: B.me.name, ...vals };
  try {       // every file is stored on the phone and read back before the evaluation is accepted
    for (const p of form.photos) { await mput(p.id, p.blob); const back = await mget(p.id); if (!back || back.size !== p.blob.size) throw new Error('storage'); }
  } catch (err) {
    for (const p of form.photos) { try { await mdel(p.id); } catch (e2) { /* nothing was stored */ } }
    return toast(t('noStore'));
  }
  let n0 = 0;
  if (form.editId) {
    // a correction: fields of this form that were emptied are cleared, anything the form does not show stays as it was
    const { local, edit, ...orig } = form.orig, cleared = {}; keys.forEach(k => { cleared[k] = ''; });
    const queued = B.evals.find(x => x.id === id);          // not sent yet: the waiting record itself is replaced
    rec = { ...orig, ...cleared, ...rec, evaluator: orig.evaluator || B.me.name };
    if (!queued || queued.edit) rec.edit = true;
    B.evals = B.evals.filter(x => x.id !== id);
    n0 = history(form.code).photos.filter(p => p.evalId === id).length;
  }
  B.evals.push(rec);
  form.photos.forEach((p, i) => B.photos.push({ id: p.id, evalId: id, team, code: form.code, name: `${form.code}_${form.date}_${form.stage}_${form.kind}_${n0 + i + 1}.${p.ext || 'jpg'}`, thumb: p.thumb }));
  if (!B.codes.some(c => c.team === team && ckey(c.code) === ckey(form.code))) B.codes.unshift({ team, code: form.code, last: form.date, stage: form.stage, n: 1, decision: form.decision });
  persist(); form = null; view = 'card'; render(); window.scrollTo(0, 0);
  toast(t(navigator.onLine ? 'saved' : 'savedOffline'));
  sync();
});
window.addEventListener('online', sync);
if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', () => { drawVbar(); sync(); });   // back on Wi-Fi: the waiting videos go
document.addEventListener('visibilitychange', () => { if (!document.hidden) { drawVbar(); sync(); } });
setInterval(sync, 60000);
if ('serviceWorker' in navigator && !MOCK) navigator.serviceWorker.register('sw.js').catch(() => {});

render();
if (B.token) { thumbsLoad(myTeam()); loadCodes(); sync(); }
