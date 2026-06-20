/* ================================================================== */
/* Student Course Portal — single-page frontend                       */
/* ================================================================== */

const state = {
  user: null,
  years: ['L1', 'L2', 'L3 ISIL', 'L3 SIQ'], // overwritten from /api/years on boot
  semesters: ['Semester 1', 'Semester 2'], // overwritten from /api/semesters on boot
};

const FILE_ICONS = {
  Course: '📘',
  TD: '📝',
  TP: '🧪',
  Exam: '🎓',
  Other: '📎',
};

/* ---------- tiny DOM + API helpers ---------- */

const $ = (sel) => document.querySelector(sel);
const view = () => $('#view');

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

async function api(path, options = {}) {
  const opts = { credentials: 'same-origin', ...options };
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(`/api${path}`, opts);
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

let toastTimer;
function toast(message, type = '') {
  const t = $('#toast');
  t.textContent = message;
  t.className = `toast ${type}`;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3000);
}

const isAdmin = () => state.user && state.user.role === 'admin';

/* ---------- routing (hash based) ---------- */

function go(hash) {
  if (location.hash === hash) router();
  else location.hash = hash;
}

function router() {
  const hash = location.hash || '#/';
  const [, route, param] = hash.split('/');
  if (route === 'login') return renderAuth('login');
  if (route === 'register') return renderAuth('register');
  if (route === 'admin') return renderAdminCourse(param); // param = course id or 'new'
  if (route === 'course') return renderCourse(param);
  return renderHome();
}

/* ---------- nav bar ---------- */

function renderNav() {
  const nav = $('#nav');
  nav.innerHTML = '';
  if (state.user) {
    nav.appendChild(
      el(`<span class="user-chip">${escapeHtml(state.user.name)}
            ${isAdmin() ? '<span class="badge">Admin</span>' : ''}</span>`)
    );
    if (isAdmin()) {
      const add = el('<button class="btn btn-ghost btn-sm">+ New Course</button>');
      add.onclick = () => go('#/admin/new');
      nav.appendChild(add);
    }
    const out = el('<button class="btn btn-ghost btn-sm">Log out</button>');
    out.onclick = async () => {
      await api('/auth/logout', { method: 'POST' });
      state.user = null;
      renderNav();
      go('#/');
      toast('Logged out');
    };
    nav.appendChild(out);
  } else {
    // Students don't need accounts; login is only for admins managing content.
    const login = el('<button class="btn btn-ghost btn-sm">Admin log in</button>');
    login.onclick = () => go('#/login');
    nav.append(login);
  }
}

/* ---------- Home / search ---------- */

let currentYear = ''; // active year filter on the home page ('' = all)
let currentSemester = ''; // active semester filter ('' = all)

function chipRow(values, allLabel, active, attr) {
  return ['', ...values]
    .map((v) => {
      const label = v || allLabel;
      const on = v === active ? ' active' : '';
      return `<button class="year-chip${on}" data-${attr}="${escapeHtml(v)}">${escapeHtml(label)}</button>`;
    })
    .join('');
}

async function renderHome() {
  view().innerHTML = `
    <section class="hero">
      <h1>Find your class, get your files</h1>
      <p>Browse by year and semester, then download lectures, TD, TP and past exams.</p>
      <div class="search-bar">
        <input id="search" type="search" placeholder="Search by course code, title, teacher, department…" />
        <button class="btn btn-primary" id="searchBtn">Search</button>
      </div>
      <div class="filter-row">
        <span class="filter-label">Year</span>
        <div class="year-chips" id="yearChips">${chipRow(state.years, 'All years', currentYear, 'year')}</div>
      </div>
      <div class="filter-row">
        <span class="filter-label">Semester</span>
        <div class="year-chips" id="semChips">${chipRow(state.semesters, 'All semesters', currentSemester, 'sem')}</div>
      </div>
    </section>
    <div class="section-head"><h2 id="listTitle">All courses</h2></div>
    <div id="courseList" class="grid"></div>`;

  const input = $('#search');
  const load = async () => {
    const q = input.value.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (currentYear) params.set('year', currentYear);
    if (currentSemester) params.set('semester', currentSemester);
    const qs = params.toString();
    const scope = [currentYear, currentSemester].filter(Boolean).join(' · ');
    const label = scope ? `${scope} courses` : 'All courses';
    $('#listTitle').textContent = q ? `Results for “${q}”${scope ? ` in ${scope}` : ''}` : label;
    try {
      const { courses } = await api(`/courses${qs ? `?${qs}` : ''}`);
      renderCourseList(courses);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  $('#yearChips').querySelectorAll('.year-chip').forEach((btn) => {
    btn.onclick = () => {
      currentYear = btn.dataset.year;
      $('#yearChips').querySelectorAll('.year-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      load();
    };
  });
  $('#semChips').querySelectorAll('.year-chip').forEach((btn) => {
    btn.onclick = () => {
      currentSemester = btn.dataset.sem;
      $('#semChips').querySelectorAll('.year-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      load();
    };
  });

  $('#searchBtn').onclick = () => load();
  let debounce;
  input.oninput = () => {
    clearTimeout(debounce);
    debounce = setTimeout(load, 250);
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') load(); };

  load();
}

function renderCourseList(courses) {
  const list = $('#courseList');
  if (!courses.length) {
    list.outerHTML = `<div class="empty" id="courseList">
        <span class="big">🔍</span>No courses found.
        ${isAdmin() ? 'Use “+ New Course” to add one.' : ''}
      </div>`;
    return;
  }
  list.innerHTML = '';
  for (const c of courses) {
    const meta = [
      c.year ? `<span class="tag year">🎓 ${escapeHtml(c.year)}</span>` : '',
      c.semester ? `<span class="tag sem">📅 ${escapeHtml(c.semester)}</span>` : '',
      c.department ? `<span class="tag">🏫 ${escapeHtml(c.department)}</span>` : '',
      c.teacher ? `<span class="tag">👩‍🏫 ${escapeHtml(c.teacher)}</span>` : '',
      `<span class="tag files">${c.fileCount} file${c.fileCount === 1 ? '' : 's'}</span>`,
    ].join('');
    const card = el(`
      <div class="course-card">
        <span class="code">${escapeHtml(c.code)}</span>
        <h3>${escapeHtml(c.title)}</h3>
        <p class="desc">${escapeHtml(c.description || 'No description provided.')}</p>
        <div class="meta-row">${meta}</div>
      </div>`);
    card.onclick = () => go(`#/course/${c.id}`);
    list.appendChild(card);
  }
}

/* ---------- Course detail ---------- */

async function renderCourse(id) {
  view().innerHTML = '<div class="empty"><span class="big">⏳</span>Loading…</div>';
  let data;
  try {
    data = await api(`/courses/${id}`);
  } catch (e) {
    view().innerHTML = `<div class="empty"><span class="big">😕</span>${escapeHtml(e.message)}</div>`;
    return;
  }
  const { course, files } = data;

  const back = '<button class="btn btn-back" id="back">← Back to courses</button>';
  const adminBtns = isAdmin()
    ? `<button class="btn btn-sm" id="editCourse">Edit</button>
       <button class="btn btn-sm btn-primary" id="uploadFile">+ Upload file</button>
       <button class="btn btn-sm btn-danger" id="delCourse">Delete course</button>`
    : '';

  view().innerHTML = `
    <div style="margin-bottom:14px">${back}</div>
    <div class="detail-head">
      <span class="code" style="color:var(--primary);font-weight:700">${escapeHtml(course.code)}</span>
      <h1>${escapeHtml(course.title)}</h1>
      <p style="color:var(--muted);margin:0">${escapeHtml(course.description || 'No description provided.')}</p>
      <div class="meta-row">
        ${course.year ? `<span class="tag year">🎓 ${escapeHtml(course.year)}</span>` : ''}
        ${course.department ? `<span class="tag">🏫 ${escapeHtml(course.department)}</span>` : ''}
        ${course.semester ? `<span class="tag">📅 ${escapeHtml(course.semester)}</span>` : ''}
        ${course.teacher ? `<span class="tag">👩‍🏫 ${escapeHtml(course.teacher)}</span>` : ''}
      </div>
      <div class="meta-row" style="margin-top:16px">${adminBtns}</div>
    </div>
    <div id="files"></div>`;

  $('#back').onclick = () => go('#/');
  if (isAdmin()) {
    $('#editCourse').onclick = () => go(`#/admin/${course.id}`);
    $('#delCourse').onclick = () => confirmDeleteCourse(course);
    $('#uploadFile').onclick = () => openUploadModal(course, () => renderCourse(id));
  }
  renderFiles(files, () => renderCourse(id));
}

function renderFiles(files, refresh) {
  const wrap = $('#files');
  if (!files.length) {
    wrap.innerHTML = `<div class="empty"><span class="big">📂</span>
      No files yet${isAdmin() ? ' — upload the first one above.' : '. Check back soon.'}</div>`;
    return;
  }
  const order = ['Course', 'TD', 'TP', 'Exam', 'Other'];
  const groups = {};
  for (const f of files) (groups[f.category] ??= []).push(f);

  wrap.innerHTML = '';
  for (const cat of order) {
    const items = groups[cat];
    if (!items) continue;
    const group = el(`<div class="file-group"><h3>${FILE_ICONS[cat]} ${cat}</h3></div>`);
    for (const f of items) {
      const row = el(`
        <div class="file-row">
          <span class="icon">${FILE_ICONS[f.category] || '📎'}</span>
          <div class="info">
            <strong>${escapeHtml(f.title)}</strong>
            <small>${escapeHtml(f.original_name)} · ${formatSize(f.size)}</small>
          </div>
          <div class="actions"></div>
        </div>`);
      const actions = row.querySelector('.actions');
      // Downloads are open to everyone — no account required.
      const dl = el('<a class="btn btn-sm btn-primary">Download</a>');
      dl.href = `/api/files/${f.id}/download`;
      actions.appendChild(dl);
      if (isAdmin()) {
        const edit = el('<button class="btn btn-sm">Edit</button>');
        edit.onclick = () => openFileEditModal(f, refresh);
        actions.appendChild(edit);

        const del = el('<button class="btn btn-sm btn-danger">Delete</button>');
        del.onclick = async () => {
          if (!confirm(`Delete “${f.title}”?`)) return;
          try {
            await api(`/files/${f.id}`, { method: 'DELETE' });
            toast('File deleted', 'success');
            refresh();
          } catch (e) { toast(e.message, 'error'); }
        };
        actions.appendChild(del);
      }
      group.appendChild(row);
    }
    wrap.appendChild(group);
  }
}

async function confirmDeleteCourse(course) {
  if (!confirm(`Delete course “${course.title}” and ALL its files? This cannot be undone.`)) return;
  try {
    await api(`/courses/${course.id}`, { method: 'DELETE' });
    toast('Course deleted', 'success');
    go('#/');
  } catch (e) { toast(e.message, 'error'); }
}

/* ---------- Upload modal ---------- */

function openUploadModal(course, onDone) {
  const modal = el(`
    <div class="modal-backdrop">
      <div class="modal">
        <h2>Upload file to ${escapeHtml(course.code)}</h2>
        <div class="form-error" hidden></div>
        <div class="field">
          <label>Category</label>
          <select id="u-cat">
            <option>Course</option><option>TD</option><option>TP</option>
            <option>Exam</option><option>Other</option>
          </select>
        </div>
        <div class="field">
          <label>Title (optional)</label>
          <input id="u-title" placeholder="e.g. Chapter 3 — Recursion" />
        </div>
        <div class="field">
          <label>File</label>
          <input id="u-file" type="file" required />
        </div>
        <div class="modal-actions">
          <button class="btn" id="u-cancel">Cancel</button>
          <button class="btn btn-primary" id="u-submit">Upload</button>
        </div>
      </div>
    </div>`);

  const close = () => (modalRoot().innerHTML = '');
  const errBox = modal.querySelector('.form-error');
  modal.querySelector('#u-cancel').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  modal.querySelector('#u-submit').onclick = async () => {
    const fileInput = modal.querySelector('#u-file');
    if (!fileInput.files.length) {
      errBox.textContent = 'Please choose a file.';
      errBox.hidden = false;
      return;
    }
    const fd = new FormData();
    fd.append('category', modal.querySelector('#u-cat').value);
    fd.append('title', modal.querySelector('#u-title').value.trim());
    fd.append('file', fileInput.files[0]);
    try {
      await api(`/courses/${course.id}/files`, { method: 'POST', body: fd });
      close();
      toast('File uploaded', 'success');
      onDone();
    } catch (e) {
      errBox.textContent = e.message;
      errBox.hidden = false;
    }
  };

  modalRoot().appendChild(modal);
}

/* ---------- Edit-file modal ---------- */

function openFileEditModal(file, onDone) {
  const cats = ['Course', 'TD', 'TP', 'Exam', 'Other']
    .map((c) => `<option${c === file.category ? ' selected' : ''}>${c}</option>`)
    .join('');

  const modal = el(`
    <div class="modal-backdrop">
      <div class="modal">
        <h2>Edit file</h2>
        <div class="form-error" hidden></div>
        <div class="field">
          <label>Category</label>
          <select id="e-cat">${cats}</select>
        </div>
        <div class="field">
          <label>Title</label>
          <input id="e-title" value="${escapeHtml(file.title)}" />
        </div>
        <div class="field">
          <label>Replace file (optional)</label>
          <input id="e-file" type="file" />
          <small style="color:var(--muted)">Current: ${escapeHtml(file.original_name)} · ${formatSize(file.size)}</small>
        </div>
        <div class="modal-actions">
          <button class="btn" id="e-cancel">Cancel</button>
          <button class="btn btn-primary" id="e-submit">Save changes</button>
        </div>
      </div>
    </div>`);

  const close = () => (modalRoot().innerHTML = '');
  const errBox = modal.querySelector('.form-error');
  modal.querySelector('#e-cancel').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };

  modal.querySelector('#e-submit').onclick = async () => {
    const title = modal.querySelector('#e-title').value.trim();
    if (!title) {
      errBox.textContent = 'Title is required.';
      errBox.hidden = false;
      return;
    }
    const fd = new FormData();
    fd.append('category', modal.querySelector('#e-cat').value);
    fd.append('title', title);
    const fileInput = modal.querySelector('#e-file');
    if (fileInput.files.length) fd.append('file', fileInput.files[0]);
    try {
      await api(`/files/${file.id}`, { method: 'PUT', body: fd });
      close();
      toast('File updated', 'success');
      onDone();
    } catch (e) {
      errBox.textContent = e.message;
      errBox.hidden = false;
    }
  };

  modalRoot().appendChild(modal);
}

const modalRoot = () => $('#modal-root');

/* ---------- Admin: create / edit course ---------- */

async function renderAdminCourse(param) {
  if (!isAdmin()) {
    view().innerHTML = `<div class="empty"><span class="big">🔒</span>
      Only admins can manage courses. <a class="switch-link" href="#/login">Log in as admin</a></div>`;
    return;
  }
  const isNew = param === 'new';
  let course = { code: '', title: '', description: '', department: '', year: '', semester: '', teacher: '' };
  if (!isNew) {
    try { course = (await api(`/courses/${param}`)).course; }
    catch (e) { view().innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`; return; }
  }

  const yearOptions = ['', ...state.years]
    .map((y) => `<option value="${escapeHtml(y)}"${y === (course.year || '') ? ' selected' : ''}>${escapeHtml(y || '— Unassigned —')}</option>`)
    .join('');

  // Include any legacy free-text semester value so editing doesn't drop it.
  const semValues = [...state.semesters];
  if (course.semester && !semValues.includes(course.semester)) semValues.unshift(course.semester);
  const semOptions = ['', ...semValues]
    .map((s) => `<option value="${escapeHtml(s)}"${s === (course.semester || '') ? ' selected' : ''}>${escapeHtml(s || '— Unassigned —')}</option>`)
    .join('');

  view().innerHTML = `
    <div class="panel wide">
      <h2>${isNew ? 'New course' : 'Edit course'}</h2>
      <p class="sub">Only administrators can add or change courses.</p>
      <div class="form-error" hidden></div>
      <div class="row-2">
        <div class="field"><label>Course code *</label>
          <input id="c-code" value="${escapeHtml(course.code)}" placeholder="CS101" /></div>
        <div class="field"><label>Department</label>
          <input id="c-dept" value="${escapeHtml(course.department)}" placeholder="Computer Science" /></div>
      </div>
      <div class="field"><label>Title *</label>
        <input id="c-title" value="${escapeHtml(course.title)}" placeholder="Introduction to Programming" /></div>
      <div class="field"><label>Description</label>
        <textarea id="c-desc" placeholder="What this course covers…">${escapeHtml(course.description)}</textarea></div>
      <div class="row-2">
        <div class="field"><label>Year</label>
          <select id="c-year">${yearOptions}</select></div>
        <div class="field"><label>Semester</label>
          <select id="c-sem">${semOptions}</select></div>
      </div>
      <div class="field"><label>Teacher</label>
        <input id="c-teacher" value="${escapeHtml(course.teacher)}" placeholder="Dr. Smith" /></div>
      <div class="modal-actions">
        <button class="btn" id="c-cancel">Cancel</button>
        <button class="btn btn-primary" id="c-save">${isNew ? 'Create course' : 'Save changes'}</button>
      </div>
    </div>`;

  const errBox = $('.form-error');
  $('#c-cancel').onclick = () => go(isNew ? '#/' : `#/course/${param}`);
  $('#c-save').onclick = async () => {
    const payload = {
      code: $('#c-code').value.trim(),
      title: $('#c-title').value.trim(),
      description: $('#c-desc').value.trim(),
      department: $('#c-dept').value.trim(),
      year: $('#c-year').value,
      semester: $('#c-sem').value.trim(),
      teacher: $('#c-teacher').value.trim(),
    };
    if (!payload.code || !payload.title) {
      errBox.textContent = 'Course code and title are required.';
      errBox.hidden = false;
      return;
    }
    try {
      const result = isNew
        ? await api('/courses', { method: 'POST', body: payload })
        : await api(`/courses/${param}`, { method: 'PUT', body: payload });
      toast(isNew ? 'Course created' : 'Course updated', 'success');
      go(`#/course/${result.course.id}`);
    } catch (e) {
      errBox.textContent = e.message;
      errBox.hidden = false;
    }
  };
}

/* ---------- Auth views ---------- */

function renderAuth(mode) {
  const isLogin = mode === 'login';
  view().innerHTML = `
    <div class="panel">
      <h2>${isLogin ? 'Admin log in' : 'Create your account'}</h2>
      <p class="sub">${isLogin
        ? 'Students don’t need an account — just browse and download. This login is for admins who manage courses and files.'
        : 'Create an account.'}</p>
      <div class="form-error" hidden></div>
      ${isLogin ? '' : `<div class="field"><label>Full name</label><input id="a-name" placeholder="Jane Student" /></div>`}
      <div class="field"><label>Email</label><input id="a-email" type="email" placeholder="you@school.edu" /></div>
      <div class="field"><label>Password</label><input id="a-pass" type="password" placeholder="••••••••" /></div>
      <button class="btn btn-primary btn-block" id="a-submit">${isLogin ? 'Log in' : 'Sign up'}</button>
    </div>`;

  const errBox = $('.form-error');

  const submit = async () => {
    const body = {
      email: $('#a-email').value.trim(),
      password: $('#a-pass').value,
    };
    if (!isLogin) body.name = $('#a-name').value.trim();
    try {
      const path = isLogin ? '/auth/login' : '/auth/register';
      const { user } = await api(path, { method: 'POST', body });
      state.user = user;
      renderNav();
      toast(`Welcome, ${user.name}!`, 'success');
      go('#/');
    } catch (e) {
      errBox.textContent = e.message;
      errBox.hidden = false;
    }
  };
  $('#a-submit').onclick = submit;
  view().querySelectorAll('input').forEach((i) => {
    i.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  });
}

/* ---------- boot ---------- */

async function boot() {
  $('#brand').onclick = () => go('#/');
  try {
    const { user } = await api('/auth/me');
    state.user = user;
  } catch { /* anonymous */ }
  try {
    const { years } = await api('/years');
    if (Array.isArray(years) && years.length) state.years = years;
  } catch { /* keep defaults */ }
  try {
    const { semesters } = await api('/semesters');
    if (Array.isArray(semesters) && semesters.length) state.semesters = semesters;
  } catch { /* keep defaults */ }
  renderNav();
  window.addEventListener('hashchange', router);
  router();
}

boot();
