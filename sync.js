/* ============================================================
   sync.js — Sincronización en vivo Lucía ↔ Martín (Firebase)
   ------------------------------------------------------------
   Usa el proyecto de Firebase de "Nuestro Hogar" (app-casa-261f3),
   pero en una colección propia: gym/lucia/kv/{clave}.

   ▸ Lucía (alumna): sus datos del gym se suben solos cada vez que
     guarda algo. Si no hay internet, Firestore los guarda en el
     iPhone y los sube cuando vuelve la conexión.
   ▸ Martín (entrenador): ve los datos de Lucía en vivo y puede
     cambiarle la rutina. Los cambios le llegan a ella al instante.

   La app sigue funcionando igual sin conectar: todo esto es opcional.
   La seguridad la ponen las reglas de Firestore (firestore.rules de
   Nuestro Hogar), no este archivo.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAVvQ4_JoouZ-3jDEFOaVzwVSgz1dxRpxk',
  authDomain:        'app-casa-261f3.firebaseapp.com',
  projectId:         'app-casa-261f3',
  storageBucket:     'app-casa-261f3.firebasestorage.app',
  messagingSenderId: '159310526936',
  appId:             '1:159310526936:web:27100ffce1bab07579daad',
};

// Solo se nombra a la alumna. Cualquier otra cuenta intenta entrar como entrenador,
// y quién puede leer o escribir lo deciden las reglas de Firestore (que no son públicas).
// Así el mail del entrenador no queda en el código, que es público en GitHub.
const ATHLETE_EMAIL = 'luciia0295@gmail.com';
const ATHLETE_ID = 'lucia';

// Solo datos del gym. Nunca claves de IA, chats ni nada personal fuera del entrenamiento.
const SYNC_KEYS = [
  'rt2', 'arid', 'sets2', 'wts2', 'setPerf3', 'gymCycles1', 'ghst2',
  'gymWeekLog', 'activeWeekId', 'gymProfile', 'gymPlan1', 'gymPlanHorizon1',
  'cardio1', 'painLog1', 'nutData', 'coachProfile1',
  'exVideos1', 'lucia_seeded_v1', 'lucia_mig_v2', 'lucia_mig_v3', 'lucia_mig_v4',
];
const SYNC_SET = new Set(SYNC_KEYS);
const ROUTINE_KEYS = new Set(['rt2', 'arid', 'gymPlan1', 'gymPlanHorizon1', 'gymCycles1']);
const LIVE_KEYS = new Set(['sets2', 'setPerf3', 'wts2', 'ghst2', 'cardio1', 'painLog1']);
const MAX_VALUE_CHARS = 900000; // Firestore admite ~1 MB por documento
const META_KEY = 'lucia_sync_meta_v1';

/* ---------- Estado local ---------- */
function loadMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch { return {}; }
}
const meta = Object.assign({ linked: false, linkedEmail: '', dev: '', keyTs: {}, pending: [] }, loadMeta());
if (!meta.dev) meta.dev = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
function saveMeta() { meta.pending = [...dirty]; try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch {} }

const state = {
  ready: false,       // SDK cargado
  user: null,         // { email, name }
  role: null,         // 'athlete' | 'coach' | null
  status: 'off',      // off | connecting | waiting | live | error | denied
  error: '',
  lastAthleteTs: 0,   // última vez que Lucía guardó algo
  lastAthleteKey: '',
  online: navigator.onLine,
};

let fb = null;            // { app, auth, db, fs, authMod }
let unsubKv = null;
let unsubRoot = null;
let applying = false;     // true mientras aplicamos datos remotos (no re-subir)
// Claves cambiadas que falta subir. Se guardan en el teléfono: si la app se cierra
// antes de conectar (o sin internet), se suben la próxima vez.
const dirty = new Set(Array.isArray(meta.pending) ? meta.pending : []);
saveMeta();
let pushTimer = null;
let pendingRemote = new Map(); // cambios remotos esperando que se cierre un modal
let pendingTimer = null;

const storageKey = (k) => (typeof S !== 'undefined' && S._p) ? S._p(k) : 'usr_lucia_' + k;
const isLinked = () => meta.linked && state.user && meta.linkedEmail === state.user.email;

/* ---------- Gancho desde S.s() ---------- */
window.__syncOnWrite = function (k) {
  if (applying || !SYNC_SET.has(k)) return;
  if (!meta.linked) return; // este teléfono todavía no se conectó nunca
  meta.keyTs[k] = Date.now();
  dirty.add(k);
  saveMeta();
  if (isLinked()) schedulePush();
};

function schedulePush(delay = 600) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushDirty, delay);
}

function kvCol() { return fb.fs.collection(fb.db, 'gym', ATHLETE_ID, 'kv'); }
function rootDoc() { return fb.fs.doc(fb.db, 'gym', ATHLETE_ID); }

function docPayload(k) {
  const raw = localStorage.getItem(storageKey(k));
  if (raw == null) return null;
  if (raw.length > MAX_VALUE_CHARS) {
    console.warn('[sync] valor demasiado grande, no se sube:', k, raw.length);
    return null;
  }
  return {
    v: raw,
    ts: meta.keyTs[k] || Date.now(),
    by: state.role === 'coach' ? 'martin' : 'lucia',
    dev: meta.dev,
    at: fb.fs.serverTimestamp(),
  };
}

function pushDirty() {
  if (!fb || !isLinked() || !dirty.size) return;
  const batch = fb.fs.writeBatch(fb.db);
  let n = 0;
  for (const k of dirty) {
    const p = docPayload(k);
    if (p) { batch.set(fb.fs.doc(kvCol(), k), p); n++; }
  }
  dirty.clear();
  saveMeta();
  if (!n) return;
  // Con la caché persistente, el commit queda en cola aunque no haya internet.
  batch.commit().catch((e) => setError(e));
  if (state.role === 'athlete') { state.lastAthleteTs = Date.now(); }
  paint();
}

/* ---------- Aplicar datos remotos ---------- */
function uiBusy() {
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
  return ['ov1', 'ov2'].some((id) => document.getElementById(id)?.classList.contains('on'));
}

function queueRemote(changes) {
  for (const [k, d] of changes) pendingRemote.set(k, d);
  flushRemote();
}

function flushRemote() {
  clearTimeout(pendingTimer);
  if (!pendingRemote.size) return;
  // Del lado de Lucía no le cambiamos la pantalla mientras escribe o tiene un modal abierto.
  if (state.role === 'athlete' && uiBusy()) { pendingTimer = setTimeout(flushRemote, 1500); return; }
  const changes = [...pendingRemote.entries()];
  pendingRemote = new Map();
  applyRemote(changes, false);
}

function applyRemote(changes, force) {
  const applied = [];
  applying = true;
  try {
    for (const [k, d] of changes) {
      if (!SYNC_SET.has(k) || typeof d.v !== 'string') continue;
      if (!force && (d.ts || 0) <= (meta.keyTs[k] || 0)) continue;
      try { localStorage.setItem(storageKey(k), d.v); } catch (e) { console.warn('[sync] no se pudo guardar', k, e); continue; }
      meta.keyTs[k] = d.ts || Date.now();
      dirty.delete(k);
      applied.push([k, d]);
    }
    saveMeta();
    if (applied.length) refreshApp();
  } finally {
    applying = false;
  }
  if (applied.length && state.role === 'athlete' && !force) {
    const fromCoach = applied.filter(([k, d]) => d.by === 'martin');
    if (fromCoach.some(([k]) => ROUTINE_KEYS.has(k))) safeToast('🔄 Martín actualizó tu rutina', 4500);
    else if (fromCoach.length) safeToast('🔄 Martín hizo un cambio', 3000);
  }
  // Al entrenador: aviso cuando Lucía cierra una sesión, con cómo se sintió.
  if (applied.length && state.role === 'coach' && !force) {
    const hist = applied.find(([k, d]) => k === 'ghst2' && d.by === 'lucia');
    if (hist) {
      try {
        const last = (JSON.parse(hist[1].v) || [])[0];
        if (last && last.ts && last.ts > (meta.lastSessTs || 0)) {
          meta.lastSessTs = last.ts; saveMeta();
          const feel = typeof sessionFeelLabel === 'function' && last.feel ? ' · ' + sessionFeelLabel(last.feel) : '';
          const pain = last.pain != null ? ` · dolor ${last.pain}/10${last.leg ? ' (pierna)' : ''}` : '';
          safeToast(`🏁 Lucía terminó ${last.dn || 'la sesión'}${feel}${pain}`, 7000);
        }
      } catch {}
    }
  }
  return applied.length;
}

function refreshApp() {
  try {
    if (typeof loadUserData === 'function') loadUserData();
    if (typeof curPage !== 'undefined' && curPage === 'gym' && typeof renderGym === 'function') {
      const scr = document.getElementById('scr');
      const top = scr ? scr.scrollTop : 0;
      renderGym();
      if (scr) scr.scrollTop = top;
    }
  } catch (e) { console.warn('[sync] refresco de pantalla falló', e); }
}

function safeToast(msg, ms) { try { if (typeof tst === 'function') tst(msg, ms); } catch {} }

function trackAthlete(d, k) {
  if (d.by === 'lucia' && (d.ts || 0) > state.lastAthleteTs) { state.lastAthleteTs = d.ts; state.lastAthleteKey = k; }
}

/* ---------- Vincular el dispositivo ---------- */
async function link() {
  const { fs } = fb;
  setStatus('connecting');
  const root = await fs.getDoc(rootDoc());
  const initialized = root.exists() && root.data().initialized === true;

  if (state.role === 'coach') {
    if (!initialized) { setStatus('waiting'); watchRoot(); return; }
    const snap = await fs.getDocs(kvCol());
    const changes = snap.docs.map((d) => [d.id, d.data()]);
    changes.forEach(([k, d]) => trackAthlete(d, k));
    meta.keyTs = {};
    dirty.clear();
    applyRemote(changes, true);
  } else {
    if (initialized) {
      // Ya hay datos en la nube (por ejemplo, reinstaló la app): la nube manda.
      const snap = await fs.getDocs(kvCol());
      const remote = new Map(snap.docs.map((d) => [d.id, d.data()]));
      applyRemote([...remote.entries()], true);
      SYNC_KEYS.forEach((k) => { if (!remote.has(k) && localStorage.getItem(storageKey(k)) != null) { meta.keyTs[k] = Date.now(); dirty.add(k); } });
    } else {
      SYNC_KEYS.forEach((k) => { if (localStorage.getItem(storageKey(k)) != null) { meta.keyTs[k] = Date.now(); dirty.add(k); } });
      await fs.setDoc(rootDoc(), { initialized: true, athlete: 'Lucía', createdAt: fs.serverTimestamp() }, { merge: true });
    }
  }
  meta.linked = true;
  meta.linkedEmail = state.user.email;
  saveMeta();
  pushDirty();
  listen();
}

function watchRoot() {
  if (unsubRoot) unsubRoot();
  unsubRoot = fb.fs.onSnapshot(rootDoc(), (d) => {
    if (d.exists() && d.data().initialized === true) {
      unsubRoot(); unsubRoot = null;
      link().catch(setError);
    }
  }, setError);
}

function listen() {
  if (unsubKv) unsubKv();
  unsubKv = fb.fs.onSnapshot(kvCol(), { includeMetadataChanges: false }, (snap) => {
    const changes = [];
    snap.docChanges().forEach((ch) => {
      if (ch.type === 'removed') return;
      const d = ch.doc.data();
      trackAthlete(d, ch.doc.id);
      if (d.dev === meta.dev) return; // es nuestro propio cambio
      changes.push([ch.doc.id, d]);
    });
    setStatus('live');
    if (changes.length) queueRemote(changes);
    else paint();
  }, setError);
}

function stopListening() {
  if (unsubKv) { unsubKv(); unsubKv = null; }
  if (unsubRoot) { unsubRoot(); unsubRoot = null; }
}

/* ---------- Firebase ---------- */
async function loadFirebase() {
  const [{ initializeApp }, fs, authMod] = await Promise.all([
    import('./vendor/firebase/firebase-app.js'),
    import('./vendor/firebase/firebase-firestore.js'),
    import('./vendor/firebase/firebase-auth.js'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG, 'lucia-gym');
  let db;
  try {
    db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  } catch (e) {
    console.warn('[sync] sin caché persistente', e);
    db = fs.getFirestore(app);
  }
  const auth = authMod.initializeAuth(app, {
    persistence: [authMod.indexedDBLocalPersistence, authMod.browserLocalPersistence],
    popupRedirectResolver: authMod.browserPopupRedirectResolver,
  });
  fb = { app, db, auth, fs, authMod };
  state.ready = true;
  authMod.getRedirectResult(auth).catch((e) => { if (e?.code !== 'auth/no-auth-event') console.warn('[sync] redirect', e); });
  authMod.onAuthStateChanged(auth, onAuth);
}

async function onAuth(user) {
  stopListening();
  if (!user) {
    state.user = null; state.role = null;
    setStatus('off');
    return;
  }
  const email = String(user.email || '').toLowerCase();
  state.user = { email, name: user.displayName || email };
  state.role = email === ATHLETE_EMAIL ? 'athlete' : 'coach';
  if (meta.linkedEmail && meta.linkedEmail !== email) { meta.linked = false; meta.keyTs = {}; dirty.clear(); saveMeta(); }
  try {
    if (isLinked()) { setStatus('connecting'); pushDirty(); listen(); }
    else await link();
  } catch (e) { setError(e); }
}

async function signIn() {
  if (!fb) { safeToast('Cargando… probá de nuevo en un segundo'); return; }
  const { authMod, auth } = fb;
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await authMod.signInWithPopup(auth, provider);
  } catch (e) {
    if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) {
      await authMod.signInWithRedirect(auth, provider);
    } else if (e.code !== 'auth/popup-closed-by-user') {
      setError(e);
    }
  }
}

async function signOut() {
  if (!fb) return;
  stopListening();
  meta.linked = false; meta.linkedEmail = ''; meta.keyTs = {}; dirty.clear();
  saveMeta();
  await fb.authMod.signOut(fb.auth).catch(() => {});
}

/* ---------- Estado y UI ---------- */
function setStatus(s) { state.status = s; if (s !== 'error') state.error = ''; paint(); }
function setError(e) {
  console.warn('[sync]', e);
  const code = e?.code || '';
  if (code === 'permission-denied' && state.role === 'coach' && !isLinked()) {
    // Una cuenta que no está en las reglas: no tiene acceso, no es un error de la app.
    stopListening();
    state.error = '';
    state.status = 'denied';
    paint();
    return;
  }
  state.error = code === 'permission-denied'
    ? 'Firebase no da permiso todavía: faltan publicar las reglas del gym.'
    : code === 'auth/unauthorized-domain'
      ? 'Falta autorizar este dominio en Firebase → Authentication → Dominios.'
      : (e?.message || String(e));
  state.status = 'error';
  paint();
}

function ago(ts) {
  if (!ts) return 'sin datos todavía';
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return 'recién';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d === 1 ? '' : 's'}`;
}

const STATUS_TXT = {
  off: 'Sin conectar',
  connecting: 'Conectando…',
  waiting: 'Esperando que Lucía conecte su app',
  live: 'Sincronizado en vivo',
  error: 'Error',
  denied: 'Esta cuenta no tiene acceso',
};

function h(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

window.syncConfigHtml = function () {
  const st = state;
  const dot = st.status === 'live' ? (st.online ? 'var(--green)' : 'var(--gold)') : st.status === 'error' || st.status === 'denied' ? 'var(--red, #ff5a5a)' : 'var(--text3)';
  const who = st.status === 'denied' ? 'Esta cuenta no está habilitada en Firebase para ver a Lucía.' : st.role === 'coach' ? 'Entrenador · ves y editás la app de Lucía' : st.role === 'athlete' ? 'Tus entrenamientos se comparten con Martín' : '';
  let body = '';
  if (!st.user) {
    body = `<div style="font-size:11px;color:var(--text2);margin-bottom:12px;line-height:1.6">Conectá tu cuenta de Google una sola vez. Así Martín ve tus entrenamientos y puede ajustarte la rutina. Sin internet la app sigue igual y sube todo cuando vuelve la conexión.</div>
      <button class="btn b-md b-p" style="width:100%;min-height:48px;margin-bottom:8px" onclick="LuciaSync.signIn()">Conectar con Google</button>`;
  } else {
    body = `<div style="font-size:12px;color:var(--text1);margin-bottom:6px"><strong>${h(st.user.name)}</strong></div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:6px">${h(st.user.email)}</div>
      ${who ? `<div style="font-size:11px;color:var(--text2);margin-bottom:10px">${who}</div>` : ''}
      ${st.role === 'coach' && st.status === 'live' ? `<div style="font-size:11px;color:var(--text2);margin-bottom:10px">Última actividad de Lucía: <strong>${ago(st.lastAthleteTs)}</strong></div>` : ''}
      ${st.role === 'coach' ? `<button class="btn b-md b-g" style="width:100%;min-height:48px;margin-bottom:8px" onclick="LuciaSync.repull()">⬇️ Volver a bajar todo de Lucía</button>` : ''}
      ${st.role === 'athlete' && st.status === 'live' ? `<button class="btn b-md b-g" style="width:100%;min-height:48px;margin-bottom:8px" onclick="LuciaSync.pushAll()">⬆️ Subir todo de nuevo</button>` : ''}
      <button class="btn b-md b-g" style="width:100%;min-height:48px;margin-bottom:8px" onclick="LuciaSync.signOut()">Desconectar</button>`;
  }
  return `<div class="sec-t">☁️ Conexión con Martín</div>
    <div id="sync-box">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;font-weight:700">
        <span style="width:9px;height:9px;border-radius:50%;background:${dot};flex-shrink:0"></span>
        <span>${STATUS_TXT[st.status] || st.status}${st.status === 'live' && !st.online ? ' · sin internet, se sube después' : ''}</span>
      </div>
      ${st.error ? `<div class="alert al-warn" style="margin-bottom:10px"><div class="al-i">⚠️</div><div class="al-t">${h(st.error)}</div></div>` : ''}
      ${body}
    </div>
    <div class="div"></div>`;
};

function paintConfig() {
  const box = document.getElementById('sync-box');
  if (!box) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = window.syncConfigHtml();
  const fresh = tmp.querySelector('#sync-box');
  if (fresh) box.replaceWith(fresh);
}

function paintBanner() {
  let el = document.getElementById('coach-banner');
  if (state.role !== 'coach' || !state.user || state.status === 'denied') { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'coach-banner';
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 78px);z-index:900;'
      + 'display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;font-size:11.5px;font-weight:700;'
      + 'background:rgba(16,18,28,.92);border:1px solid var(--line, rgba(255,255,255,.12));color:var(--text0,#fff);'
      + 'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 6px 22px rgba(0,0,0,.35);white-space:nowrap;max-width:calc(100vw - 32px);overflow:hidden;text-overflow:ellipsis;cursor:pointer';
    el.onclick = () => { if (typeof setProfileTab === 'function') setProfileTab('config'); };
    document.body.appendChild(el);
  }
  const fresh = Date.now() - state.lastAthleteTs < 3 * 60 * 1000;
  const training = fresh && LIVE_KEYS.has(state.lastAthleteKey);
  const dot = state.status !== 'live' ? 'var(--text3,#888)' : training ? 'var(--green,#10D29B)' : 'var(--blue,#4D8DFF)';
  const txt = state.status === 'live'
    ? (training ? 'Lucía está entrenando ahora' : `Lucía · ${ago(state.lastAthleteTs)}`)
    : STATUS_TXT[state.status];
  el.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0${training ? ';box-shadow:0 0 0 3px rgba(16,210,155,.25)' : ''}"></span><span>👀 Modo entrenador · ${h(txt)}</span>`;
}

function paint() { paintConfig(); paintBanner(); }
setInterval(paintBanner, 30000);
window.addEventListener('online', () => { state.online = true; paint(); });
window.addEventListener('offline', () => { state.online = false; paint(); });

window.LuciaSync = {
  signIn,
  signOut,
  state,
  async repull() {
    if (!fb || state.role !== 'coach') return;
    meta.linked = false; saveMeta();
    try { await link(); safeToast('⬇️ Datos de Lucía actualizados'); } catch (e) { setError(e); }
  },
  pushAll() {
    if (!isLinked()) return;
    SYNC_KEYS.forEach((k) => { if (localStorage.getItem(storageKey(k)) != null) { meta.keyTs[k] = Date.now(); dirty.add(k); } });
    saveMeta();
    pushDirty();
    safeToast('⬆️ Subiendo todo…');
  },
};

loadFirebase().catch((e) => { console.warn('[sync] no se pudo cargar Firebase', e); state.error = 'No se pudo cargar la conexión (¿sin internet?).'; });
