const KEY = 'habit-tracker-v1';
const $ = id => document.getElementById(id);
let habits = load();
let editingId = null;

function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(d) ? d : []; }
  catch (e) { return []; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(habits)); } catch (e) {} }

function dkey(d) { const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return dkey(d); }
const today = () => daysAgo(0);

function streak(h) {
  let n = 0, i = h.log.includes(today()) ? 0 : 1;
  while (h.log.includes(daysAgo(i))) { n++; i++; }
  return n;
}
function weekCount(h) { let c = 0; for (let i = 0; i < 7; i++) if (h.log.includes(daysAgo(i))) c++; return c; }

function validate(name) {
  name = name.trim();
  if (!name) return 'Enter a habit name.';
  if (name.length < 2) return 'Use at least 2 characters.';
  if (habits.some(h => h.id !== editingId && h.name.toLowerCase() === name.toLowerCase())) return 'You already track a habit with that name.';
  return '';
}

function addHabit(name, category, goal) {
  habits.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name.trim(), category, goal: +goal, log: [] });
}
function updateHabit(id, name, category, goal) {
  const h = habits.find(x => x.id === id);
  if (h) { h.name = name.trim(); h.category = category; h.goal = +goal; }
}
function deleteHabit(id) {
  const h = habits.find(x => x.id === id);
  if (!h || !confirm('Delete "' + h.name + '"? Its history will be lost.')) return;
  habits = habits.filter(x => x.id !== id);
  if (editingId === id) resetForm();
}
function toggleToday(id) {
  const h = habits.find(x => x.id === id), t = today();
  h.log = h.log.includes(t) ? h.log.filter(d => d !== t) : h.log.concat(t);
}
function startEdit(id) {
  const h = habits.find(x => x.id === id);
  editingId = id;
  $('name').value = h.name; $('category').value = h.category; $('goal').value = h.goal;
  $('formTitle').textContent = 'Edit habit'; $('submitBtn').textContent = 'Save changes'; $('cancelBtn').hidden = false;
  $('error').textContent = ''; $('name').focus();
}
function resetForm() {
  editingId = null; $('habitForm').reset(); $('error').textContent = '';
  $('formTitle').textContent = 'Add a habit'; $('submitBtn').textContent = 'Add habit'; $('cancelBtn').hidden = true;
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function render() {
  const q = $('search').value.trim().toLowerCase(), st = $('fStatus').value, cat = $('fCat').value, t = today();
  const shown = habits.filter(h => (!q || h.name.toLowerCase().includes(q)) && (cat === 'all' || h.category === cat) &&
    (st === 'all' || (st === 'done') === h.log.includes(t)));
  const list = $('list'); list.innerHTML = '';

  if (!habits.length) list.append(Object.assign(el('li', 'empty', 'No habits yet. Add your first one to start a streak.'), {}));
  else if (!shown.length) list.append(el('li', 'empty', 'No habits match your search or filters.'));

  shown.forEach(h => {
    const done = h.log.includes(t), s = streak(h), wk = weekCount(h), pct = Math.min(100, Math.round(wk / h.goal * 100));
    const li = el('li', done ? 'done' : '');
    const chk = el('button', 'check', '✓'); chk.type = 'button';
    chk.setAttribute('aria-pressed', done); chk.setAttribute('aria-label', (done ? 'Undo today for ' : 'Mark done today: ') + h.name);
    chk.onclick = () => { toggleToday(h.id); save(); render(); };
    const info = el('div');
    info.append(el('div', 'name', h.name));
    const meta = el('div', 'meta');
    meta.append(el('span', 'tag', h.category), el('span', 'streak' + (s ? ' on' : ''), (s ? '🔥 ' : '') + s + '-day streak'));
    info.append(meta);
    const prog = el('div', 'prog');
    const days = el('div', 'days'); days.setAttribute('aria-hidden', 'true');
    for (let i = 6; i >= 0; i--) days.append(el('i', h.log.includes(daysAgo(i)) ? 'on' : ''));
    const bar = el('div', 'bar'); const fill = el('b'); fill.style.width = pct + '%'; bar.append(fill);
    prog.append(days, bar, el('span', '', wk + '/' + h.goal + ' this week'));
    const acts = el('div', 'acts');
    const ed = el('button', 'ghost', 'Edit'); ed.type = 'button'; ed.onclick = () => startEdit(h.id);
    const del = el('button', 'danger', 'Delete'); del.type = 'button'; del.onclick = () => { deleteHabit(h.id); save(); render(); };
    acts.append(ed, del);
    li.append(chk, info, prog, acts);
    list.append(li);
  });

  const total = habits.length, dn = habits.filter(h => h.log.includes(t)).length;
  $('ring').style.setProperty('--p', total ? dn / total * 100 : 0);
  $('ringText').textContent = dn + '/' + total;
  $('todaySub').textContent = !total ? 'Add a habit to begin' : dn === total ? 'All done. Nice work.' : (total - dn) + ' left today';
}

$('habitForm').addEventListener('submit', e => {
  e.preventDefault();
  const err = validate($('name').value);
  if (err) { $('error').textContent = err; $('name').focus(); return; }
  if (editingId) updateHabit(editingId, $('name').value, $('category').value, $('goal').value);
  else addHabit($('name').value, $('category').value, $('goal').value);
  save(); resetForm(); render();
});
$('name').addEventListener('input', () => { $('error').textContent = ''; });
$('cancelBtn').addEventListener('click', resetForm);
['search', 'fStatus', 'fCat'].forEach(id => $(id).addEventListener('input', render));

$('dateLine').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
render();