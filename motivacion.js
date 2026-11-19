'use strict';
/* ============================================================
   motivacion.js — Seguimiento del ciático y motivación (19/11/2026)
   ------------------------------------------------------------
   · "⚡ Me dolió la pierna" en cada ejercicio del día  → legFlags1
   · "💊 ¿Tomaste algo para el dolor hoy?" (0 / 1 / 2 / 3+) → medLog1
   · Tarjeta de progreso estilo Duolingo: racha, semana, pastillas y medallas → badges1
   Las tres claves se sincronizan con Martín (sync.js).
   La medicación se baja SOLO según indique el médico: la app festeja,
   nunca castiga ni empuja a aguantar el dolor.
   ============================================================ */

const MED_OPTS = [{ n: 0, t: 'Nada', e: '🎉' }, { n: 1, t: '1 pastilla', e: '💊' }, { n: 2, t: '2', e: '💊' }, { n: 3, t: '3 o más', e: '💊' }];
const MED_NOTE = 'Bajá la medicación solo como te indique tu médico. Si necesitás la pastilla, tomala: anotarlo también suma.';

/* ---------- helpers de fecha ---------- */
function mDateKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mDaysAgo(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; }
function mWeekStart(d) { const x = new Date(d); x.setHours(12, 0, 0, 0); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; } // lunes

/* ---------- datos ---------- */
function legFlags() { const v = S.g('legFlags1', {}); return v && typeof v === 'object' ? v : {}; }
function medLog() { const v = S.g('medLog1', {}); return v && typeof v === 'object' ? v : {}; }
function badgesEarned() { const v = S.g('badges1', {}); return v && typeof v === 'object' ? v : {}; }
function legFlagsToday() { return legFlags()[todayStr()] || {}; }

/* ---------- ⚡ Me dolió la pierna ---------- */
function legFlagButtonHtml(exName) {
  const on = !!legFlagsToday()[exName];
  return `<button type="button" class="leg-flag${on ? ' on' : ''}" data-ex="${esc(exName)}" aria-pressed="${on}" onclick="toggleLegFlag(this)">${on ? '⚡ Me dolió la pierna · marcado' : '⚡ Me dolió la pierna'}</button>`;
}
function toggleLegFlag(btn) {
  const name = btn.dataset.ex, all = legFlags(), day = todayStr(), today = { ...(all[day] || {}) };
  if (today[name]) delete today[name]; else today[name] = Date.now();
  all[day] = today;
  // guardo solo los últimos 120 días
  const keys = Object.keys(all).sort(); while (keys.length > 120) delete all[keys.shift()];
  S.s('legFlags1', all);
  const on = !!today[name];
  btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
  btn.textContent = on ? '⚡ Me dolió la pierna · marcado' : '⚡ Me dolió la pierna';
  if (on) tst('⚡ Anotado. Si sigue molestando, pasá al siguiente ejercicio.', 3500);
}
function legFlagsForDay(day) { // nombres marcados hoy que están en ese día de rutina
  const t = legFlagsToday(); return (day?.exercises || []).map((e) => e.name).filter((n) => t[n]);
}
function legRankingHtml(days = 28) {
  const from = mDateKey(mDaysAgo(days - 1)), count = {};
  Object.entries(legFlags()).forEach(([d, m]) => { if (d >= from) Object.keys(m || {}).forEach((n) => { count[n] = (count[n] || 0) + 1; }); });
  const rows = Object.entries(count).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return '';
  return `<div class="card" style="margin-bottom:12px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">⚡ Ejercicios que le dieron dolor de pierna <span style="font-weight:400;color:var(--text2)">· últimas 4 semanas</span></div>
    ${rows.map(([n, c]) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:5px 0;border-top:1px solid var(--border)"><span>${esc(n)}</span><strong style="color:var(--red)">${c} ${c === 1 ? 'vez' : 'veces'}</strong></div>`).join('')}
    <div style="font-size:11.5px;color:var(--text2);margin-top:8px">Si un ejercicio aparece seguido, conviene cambiarlo.</div></div>`;
}

/* ---------- 💊 medicación ---------- */
function medPickerHtml(id) {
  const cur = medLog()[todayStr()];
  return `<div class="fld"><label>💊 ¿Tomaste algo para el dolor hoy? (tramadol u otro)</label>
    <input type="hidden" id="${id}" value="${cur ? cur.n : ''}">
    <div class="med-pick" role="radiogroup">${MED_OPTS.map((o) => `<button type="button" role="radio" aria-checked="${cur && cur.n === o.n}" class="${cur && cur.n === o.n ? 'on' : ''}" data-n="${o.n}" onclick="pickMed('${id}',this)"><span aria-hidden="true">${o.e}</span>${o.t}</button>`).join('')}</div>
    <div class="med-note">${MED_NOTE}</div></div>`;
}
function pickMed(id, btn) {
  const box = btn.closest('.med-pick'); box.querySelectorAll('button').forEach((b) => { const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
  const inp = document.getElementById(id); if (inp) inp.value = btn.dataset.n;
}
function saveMedFromPicker(id) {
  const raw = document.getElementById(id)?.value; if (raw === '' || raw == null) return null;
  const all = medLog(), n = Math.max(0, Math.min(3, Number(raw)));
  all[todayStr()] = { n, ts: Date.now() };
  const keys = Object.keys(all).sort(); while (keys.length > 400) delete all[keys.shift()];
  S.s('medLog1', all); return n;
}
function medLabel(n) { return n === 0 ? 'sin pastilla 🎉' : n >= 3 ? '3 o más pastillas' : n + (n === 1 ? ' pastilla' : ' pastillas'); }
function medStats(weeksBack = 0) { // promedio por día anotado en una semana (lunes a domingo)
  const start = mWeekStart(mDaysAgo(weeksBack * 7)), m = medLog(); let sum = 0, days = 0, zero = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const v = m[mDateKey(d)]; if (v) { sum += v.n; days++; if (v.n === 0) zero++; } }
  return { avg: days ? Math.round(sum / days * 10) / 10 : null, days, zero };
}

/* ---------- 🔥 racha y semana ---------- */
function activityDays() {
  const s = new Set();
  painLog().forEach((e) => e.date && s.add(e.date));
  Object.keys(medLog()).forEach((d) => s.add(d));
  (gymHist || []).forEach((h) => h.ts && s.add(mDateKey(new Date(h.ts))));
  return s;
}
function currentStreak() {
  const s = activityDays(); let n = 0, i = s.has(todayStr()) ? 0 : 1; // si hoy todavía no anotó, la racha sigue viva desde ayer
  while (s.has(mDateKey(mDaysAgo(i)))) { n++; i++; }
  return n;
}
function sessionsThisWeek() { const from = mWeekStart(new Date()).getTime() - 12 * 3600e3; return (gymHist || []).filter((h) => h.ts >= from).length; }

/* ---------- 🏅 medallas ---------- */
const BADGES = [
  { id: 'primer_entreno', e: '🌱', t: 'Primer entrenamiento', d: 'Hiciste tu primera sesión.' },
  { id: 'semana_2', e: '💪', t: 'Semana cumplida', d: '2 entrenamientos en una misma semana.' },
  { id: 'semana_3', e: '🏆', t: 'Semana perfecta', d: '3 entrenamientos en una misma semana.' },
  { id: 'diez_entrenos', e: '🔟', t: '10 entrenamientos', d: 'Ya llevás 10 sesiones.' },
  { id: 'racha_7', e: '🔥', t: 'Racha de 7 días', d: '7 días seguidos anotando cómo estás.' },
  { id: 'racha_30', e: '🌟', t: 'Racha de 30 días', d: '30 días seguidos anotando.' },
  { id: 'sin_pastilla_1', e: '🎉', t: 'Un día sin pastilla', d: 'Un día entero sin necesitar medicación.' },
  { id: 'sin_pastilla_7', e: '🌈', t: '7 días sin pastilla', d: '7 días (no hace falta seguidos) sin medicación.' },
  { id: 'menos_pastillas', e: '📉', t: 'Menos pastillas', d: 'Una semana con menos pastillas por día que la anterior.' },
  { id: 'pierna_tranquila', e: '🦵', t: 'Pierna tranquila', d: '7 días anotados sin dolor de pierna.' },
];
function badgeChecks() {
  const hist = gymHist || [], m = medLog(), byWeek = {};
  hist.forEach((h) => { if (h.ts) { const k = mDateKey(mWeekStart(new Date(h.ts))); byWeek[k] = (byWeek[k] || 0) + 1; } });
  const maxWeek = Math.max(0, ...Object.values(byWeek));
  const zeroDays = Object.values(m).filter((v) => v && v.n === 0).length;
  const w0 = medStats(0), w1 = medStats(1);
  // pierna tranquila: 7 días seguidos (hasta hoy o ayer) con dolor anotado y sin pierna
  const pains = painLog(), flags = legFlags(); let calm = 0;
  for (let i = 0; i < 30 && calm < 7; i++) {
    const d = mDateKey(mDaysAgo(i)), es = pains.filter((e) => e.date === d);
    if (!es.length) { if (i === 0) continue; break; }
    if (es.some((e) => e.leg) || Object.keys(flags[d] || {}).length) break;
    calm++;
  }
  return {
    primer_entreno: hist.length >= 1, semana_2: maxWeek >= 2, semana_3: maxWeek >= 3, diez_entrenos: hist.length >= 10,
    racha_7: currentStreak() >= 7, racha_30: currentStreak() >= 30,
    sin_pastilla_1: zeroDays >= 1, sin_pastilla_7: zeroDays >= 7,
    menos_pastillas: w0.days >= 3 && w1.days >= 3 && w0.avg < w1.avg,
    pierna_tranquila: calm >= 7,
  };
}
function checkBadges(celebrate = true) {
  const have = badgesEarned(), ok = badgeChecks(), nuevos = BADGES.filter((b) => ok[b.id] && !have[b.id]);
  if (!nuevos.length) return [];
  nuevos.forEach((b) => { have[b.id] = Date.now(); });
  S.s('badges1', have);
  if (celebrate) setTimeout(() => showBadgeCelebration(nuevos), 400);
  return nuevos;
}
function showBadgeCelebration(list) {
  const b = list[0];
  oOv2(`<div class="badge-cele"><div class="badge-burst" aria-hidden="true">${'✨🎉⭐'.repeat(3)}</div>
    <div class="badge-big">${b.e}</div><div class="mt" style="text-align:center;margin-bottom:6px">¡Nueva medalla!</div>
    <div style="text-align:center;font-size:17px;font-weight:700">${esc(b.t)}</div>
    <div style="text-align:center;font-size:14px;color:var(--text1);margin:6px 0 16px">${esc(b.d)}</div>
    ${list.length > 1 ? `<div style="text-align:center;font-size:13px;color:var(--text2);margin-bottom:12px">Y también: ${list.slice(1).map((x) => x.e + ' ' + esc(x.t)).join(' · ')}</div>` : ''}
    <button class="btn b-lg b-p" style="width:100%" onclick="cOv2()">¡Vamos! 💪</button></div>`);
  navigator.vibrate?.([30, 40, 30]);
}

/* ---------- tarjeta de progreso ---------- */
function progressCardHtml() {
  const streak = currentStreak(), ses = sessionsThisWeek(), goal = 3, w0 = medStats(0), w1 = medStats(1), have = badgesEarned();
  const dots = Array.from({ length: goal }, (_, i) => `<span class="mp-dot${i < ses ? ' on' : ''}">${i < ses ? '✓' : ''}</span>`).join('');
  let med = '<span style="color:var(--text2)">Anotá cada día si tomaste algo</span>';
  if (w0.avg != null) {
    const trend = w1.avg == null ? '' : w0.avg < w1.avg ? ` <span style="color:var(--green)">↓ venías de ${w1.avg}</span>` : w0.avg > w1.avg ? ` <span style="color:var(--text2)">(venías de ${w1.avg})</span>` : ' <span style="color:var(--text2)">igual que la semana pasada</span>';
    med = `<strong>${w0.avg}</strong> por día${trend}${w0.zero ? ` · <strong>${w0.zero}</strong> ${w0.zero === 1 ? 'día' : 'días'} sin pastilla 🎉` : ''}`;
  }
  const earned = BADGES.filter((b) => have[b.id]).length;
  return `<div class="card prog-card-m">
    <div class="mp-top"><div><div class="mp-streak">🔥 ${streak} ${streak === 1 ? 'día' : 'días'}</div><div class="mp-sub">${streak ? 'de racha anotando cómo estás' : 'Anotá hoy cómo estás y arrancá tu racha'}</div></div>
      <button type="button" class="mp-badges" onclick="openBadges()" aria-label="Ver medallas">🏅 ${earned}/${BADGES.length}</button></div>
    <div class="mp-row"><span>Entrenos esta semana</span><span class="mp-dots">${dots}</span></div>
    <div class="mp-row"><span>💊 Pastillas</span><span style="text-align:right">${med}</span></div>
    ${!medLog()[todayStr()] ? `<button type="button" class="btn b-md b-g" style="width:100%;margin-top:10px" onclick="openPainLog()">Anotar dolor y pastillas de hoy</button>` : ''}
  </div>`;
}
function openBadges() {
  const have = badgesEarned();
  oOv2(`<div class="mt">🏅 Tus medallas</div>
    <div class="badge-grid">${BADGES.map((b) => `<div class="badge-item${have[b.id] ? ' on' : ''}"><div class="badge-ic">${have[b.id] ? b.e : '🔒'}</div><div class="badge-t">${esc(b.t)}</div><div class="badge-d">${esc(b.d)}</div></div>`).join('')}</div>
    <div class="med-note" style="margin-top:12px">${MED_NOTE}</div>
    <button class="btn b-md b-g" style="width:100%;margin-top:12px" onclick="cOv2()">Cerrar</button>`);
}

/* ---------- resumen para Martín ---------- */
function medSummaryLines(days = 7) {
  const m = medLog(), out = [];
  for (let i = days - 1; i >= 0; i--) { const d = mDaysAgo(i), v = m[mDateKey(d)]; if (v) out.push(`${d.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric' })}: ${medLabel(v.n)}`); }
  if (!out.length) return ['💊 *Medicación*', '• No anotó.'];
  const w0 = medStats(0), w1 = medStats(1);
  return ['💊 *Medicación para el dolor*', ...out.map((x) => '• ' + x), w0.avg != null ? `Promedio esta semana: ${w0.avg} por día${w1.avg != null ? ` (anterior ${w1.avg})` : ''}` : ''].filter(Boolean);
}
