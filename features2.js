// features2.js — Group Work, Resources/Formula Search, Attendance, Focus Mode, Export

// ── NAV TITLES UPDATE ──────────────────────────────────────────────
window.addEventListener('load', () => {
    const extra = {
        groupwork: ['👥 Group Work', 'Track document stages, slides & member tasks'],
        resources: ['📖 Resources & Formula Search', 'Textbooks · Videos · Formula finder'],
        attendance: ['📅 Attendance Tracker', 'Mark classes · Stay above 75%'],
    };
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', () => {
            const v = item.dataset.view;
            if (extra[v]) {
                document.getElementById('page-title').textContent = extra[v][0];
                document.getElementById('page-subtitle').textContent = extra[v][1];
            }
        });
    });

    initGroupWork();
    initResources();
    initAttendance();
    initFocusMode();
    initExport();
});

// ── 1. GROUP WORK TRACKER ──────────────────────────────────────────
function initGroupWork() {
    // Countdown timers
    function updateCountdowns() {
        const now = new Date();
        const docDl = new Date('2026-05-10T18:00:00'); // Sunday 6PM
        const presDl = new Date('2026-05-11T09:00:00'); // Monday 9AM

        function fmt(ms) {
            if (ms < 0) return '✅ Done';
            const h = Math.floor(ms / 3600000);
            const d = Math.floor(h / 24);
            if (d > 0) return `${d}d ${h % 24}h left`;
            const m = Math.floor((ms % 3600000) / 60000);
            return `${h}h ${m}m left`;
        }

        const dc = document.getElementById('gw-doc-countdown');
        const pc = document.getElementById('gw-pres-countdown');
        if (dc) dc.textContent = fmt(docDl - now);
        if (pc) pc.textContent = fmt(presDl - now);
    }
    updateCountdowns();
    setInterval(updateCountdowns, 60000);

    // Stage checkboxes
    const stages = JSON.parse(localStorage.getItem('gw_stages') || '{}');
    document.querySelectorAll('.gw-stage').forEach(el => {
        const key = el.dataset.stage;
        const check = el.querySelector('.gw-stage-check');
        if (stages[key]) { el.classList.add('done'); check.textContent = '✓'; }
        el.addEventListener('click', () => {
            stages[key] = !stages[key];
            localStorage.setItem('gw_stages', JSON.stringify(stages));
            el.classList.toggle('done', stages[key]);
            check.textContent = stages[key] ? '✓' : '○';
        });
    });

    // Members
    renderMembers();
    document.getElementById('gw-add-member')?.addEventListener('click', () => {
        const name = document.getElementById('gw-member-name')?.value.trim();
        const task = document.getElementById('gw-member-task')?.value.trim();
        if (!name) return;
        const members = JSON.parse(localStorage.getItem('gw_members') || '[]');
        members.push({ id: Date.now().toString(), name, task, done: false });
        localStorage.setItem('gw_members', JSON.stringify(members));
        renderMembers();
        document.getElementById('gw-member-name').value = '';
        document.getElementById('gw-member-task').value = '';
    });

    // Notes
    const notes = document.getElementById('gw-notes');
    if (notes) {
        notes.value = localStorage.getItem('gw_notes') || '';
        notes.addEventListener('input', () => localStorage.setItem('gw_notes', notes.value));
    }
}

function renderMembers() {
    const container = document.getElementById('gw-members');
    if (!container) return;
    const members = JSON.parse(localStorage.getItem('gw_members') || '[]');
    if (!members.length) {
        container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:8px">No members added yet.</div>';
        return;
    }
    container.innerHTML = members.map(m => `
        <div class="gw-member-card">
            <div class="gw-member-avatar">${m.name.charAt(0).toUpperCase()}</div>
            <div>
                <div class="gw-member-name">${m.name}</div>
                <div class="gw-member-task">${m.task || 'No section assigned'}</div>
            </div>
            <div class="gw-member-status">
                <button class="gw-ms-btn${m.done ? ' active' : ''}" data-id="${m.id}" data-field="done">${m.done ? '✓ Done' : 'Mark Done'}</button>
            </div>
            <button class="gw-member-del" data-id="${m.id}">✕</button>
        </div>`).join('');

    container.querySelectorAll('.gw-ms-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const members = JSON.parse(localStorage.getItem('gw_members') || '[]');
            const m = members.find(x => x.id === btn.dataset.id);
            if (m) { m.done = !m.done; localStorage.setItem('gw_members', JSON.stringify(members)); renderMembers(); }
        });
    });
    container.querySelectorAll('.gw-member-del').forEach(btn => {
        btn.addEventListener('click', () => {
            let members = JSON.parse(localStorage.getItem('gw_members') || '[]');
            members = members.filter(x => x.id !== btn.dataset.id);
            localStorage.setItem('gw_members', JSON.stringify(members));
            renderMembers();
        });
    });
}

// ── 2. RESOURCES + FORMULA SEARCH ─────────────────────────────────
const resourcesData = {
    U1: { name: 'Linear Algebra', items: [
        { type: 'book', icon: '📘', title: 'Linear Algebra Done Right', author: 'Axler', chapter: 'Ch 5–8: Eigenvalues & Inner Products' },
        { type: 'video', icon: '▶', title: '3Blue1Brown — Essence of Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
        { type: 'mit', icon: '🎓', title: 'MIT 18.06 Gilbert Strang', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/' },
    ]},
    U2: { name: 'Research Methodology', items: [
        { type: 'book', icon: '📘', title: 'Research Methods in Education', author: 'Cohen, Manion & Morrison', chapter: 'Ch 3–6: Design & Ethics' },
        { type: 'video', icon: '▶', title: 'Research Methodology Crash Course', url: 'https://www.youtube.com/watch?v=pIgm4FZSm9w' },
    ]},
    U3: { name: 'Complex Variables', items: [
        { type: 'book', icon: '📘', title: 'Complex Analysis', author: 'Churchill & Brown', chapter: 'Ch 5–7: Residues & Contour Integration' },
        { type: 'video', icon: '▶', title: 'Cauchy\'s Theorem Explained', url: 'https://www.youtube.com/watch?v=sD0NjbwqlYw' },
        { type: 'mit', icon: '🎓', title: 'MIT 18.04 Complex Variables', url: 'https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/' },
    ]},
    U4: { name: 'Abstract Integration', items: [
        { type: 'book', icon: '📘', title: 'Real Analysis', author: 'Royden & Fitzpatrick', chapter: 'Ch 11–18: Lebesgue Integration & Lp Spaces' },
        { type: 'video', icon: '▶', title: 'Measure Theory & Integration', url: 'https://www.youtube.com/watch?v=llnNaRzuvd4' },
    ]},
    U5: { name: 'Non-Linear Optimization', items: [
        { type: 'book', icon: '📘', title: 'Numerical Optimization', author: 'Nocedal & Wright', chapter: 'Ch 2–4: Line Search & KKT Conditions' },
        { type: 'video', icon: '▶', title: 'Gradient Descent Visualization', url: 'https://www.youtube.com/watch?v=IHZwWFHWa-w' },
        { type: 'khan', icon: '📗', title: 'Khan Academy Calculus & Optimization', url: 'https://www.khanacademy.org/math/multivariable-calculus' },
    ]},
    U6: { name: 'Fluid Dynamics', items: [
        { type: 'book', icon: '📘', title: 'An Introduction to Fluid Dynamics', author: 'Batchelor', chapter: 'Ch 1–4: Kinematics & Navier-Stokes' },
        { type: 'video', icon: '▶', title: 'Fluid Mechanics — MIT Lectures', url: 'https://www.youtube.com/watch?v=1FqXmVCGSx4' },
        { type: 'mit', icon: '🎓', title: 'MIT 2.20 Marine Hydrodynamics', url: 'https://ocw.mit.edu/courses/2-20-marine-hydrodynamics-13-021-spring-2005/' },
    ]},
    U7: { name: 'Regression Modelling', items: [
        { type: 'book', icon: '📘', title: 'Applied Linear Statistical Models', author: 'Kutner et al.', chapter: 'Ch 1–9: OLS, MLR, Model Selection' },
        { type: 'video', icon: '▶', title: 'StatQuest: Linear Regression', url: 'https://www.youtube.com/watch?v=nk2CQITm_eo' },
        { type: 'khan', icon: '📗', title: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability' },
    ]},
};

function initResources() {
    renderResourcesList();

    const searchEl = document.getElementById('formula-search');
    const clearBtn = document.getElementById('formula-search-clear');
    const resultsEl = document.getElementById('formula-search-results');

    if (!searchEl) return;

    searchEl.addEventListener('input', () => {
        const q = searchEl.value.trim().toLowerCase();
        if (!q || q.length < 2) { resultsEl.style.display = 'none'; return; }

        const results = [];
        if (typeof revisionData !== 'undefined' && typeof state !== 'undefined') {
            state.units.forEach(unit => {
                const data = revisionData[unit.id];
                if (!data) return;
                [...data.formulas.map(f => ({ name: f.title, expr: f.expr, unit: unit.name })),
                 ...data.theorems.map(t => ({ name: t.name, expr: t.statement, unit: unit.name }))
                ].forEach(item => {
                    if (item.name.toLowerCase().includes(q) || item.expr.toLowerCase().includes(q)) {
                        results.push(item);
                    }
                });
            });
        }

        if (!results.length) {
            resultsEl.innerHTML = '<div style="color:var(--text-dim);padding:8px;font-size:0.85rem">No matching formulas or theorems.</div>';
        } else {
            resultsEl.innerHTML = `<div style="color:var(--text-dim);font-size:0.75rem;margin-bottom:10px;font-family:var(--font-mono)">${results.length} result(s) for "${q}"</div>` +
                results.map(r => {
                    const hl = (s) => s.replace(new RegExp(q, 'gi'), m => `<span class="fsr-highlight">${m}</span>`);
                    return `<div class="fsr-item">
                        <div class="fsr-name">${hl(r.name)}</div>
                        <div class="fsr-expr">${hl(r.expr)}</div>
                        <div class="fsr-unit">${r.unit}</div>
                    </div>`;
                }).join('');
        }
        resultsEl.style.display = 'block';
    });

    clearBtn?.addEventListener('click', () => {
        searchEl.value = '';
        resultsEl.style.display = 'none';
    });
}

function renderResourcesList() {
    const container = document.getElementById('resources-list');
    if (!container) return;
    const readItems = JSON.parse(localStorage.getItem('read_resources') || '{}');

    container.innerHTML = Object.entries(resourcesData).map(([uid, udata]) => `
        <div class="res-unit-card" id="res-${uid}">
            <div class="res-unit-header">
                <div class="res-unit-color" style="background:${getUnitColor(uid)}"></div>
                <span class="res-unit-name">${udata.name}</span>
                <span class="res-unit-count">${udata.items.length} resources</span>
                <span class="res-unit-chevron">▶</span>
            </div>
            <div class="res-unit-body">
                ${udata.items.map((item, i) => {
                    const key = `${uid}_${i}`;
                    const isRead = readItems[key];
                    return `<div class="res-item${isRead ? ' read' : ''}">
                        <span class="res-icon">${item.icon}</span>
                        <div class="res-info">
                            <div class="res-title">${item.title}</div>
                            <div class="res-meta">${item.author || ''} ${item.chapter || ''}</div>
                            ${item.url ? `<a href="${item.url}" target="_blank" class="res-link">Open →</a>` : ''}
                        </div>
                        <button class="res-read-btn${isRead ? ' read' : ''}" data-key="${key}">${isRead ? '✓ Read' : 'Mark Read'}</button>
                    </div>`;
                }).join('')}
            </div>
        </div>`).join('');

    container.querySelectorAll('.res-unit-header').forEach(h => {
        h.addEventListener('click', () => h.closest('.res-unit-card').classList.toggle('open'));
    });

    container.querySelectorAll('.res-read-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const readItems = JSON.parse(localStorage.getItem('read_resources') || '{}');
            readItems[btn.dataset.key] = !readItems[btn.dataset.key];
            localStorage.setItem('read_resources', JSON.stringify(readItems));
            renderResourcesList();
        });
    });
}

function getUnitColor(uid) {
    const colors = { U1:'#38bdf8', U2:'#a78bfa', U3:'#fb7185', U4:'#34d399', U5:'#fbbf24', U6:'#f97316', U7:'#e879f9' };
    return colors[uid] || '#38bdf8';
}

// ── 3. ATTENDANCE TRACKER ──────────────────────────────────────────
const ATT_CLASSES = {
    U1: { name: 'Linear Algebra', color: '#38bdf8', sessions: ['Mon 8AM','Wed 8AM','Fri 8AM'] },
    U2: { name: 'Research Methodology', color: '#a78bfa', sessions: ['Tue 10AM','Thu 10AM'] },
    U3: { name: 'Complex Variables', color: '#fb7185', sessions: ['Mon 10AM','Wed 10AM','Fri 10AM'] },
    U4: { name: 'Abstract Integration', color: '#34d399', sessions: ['Tue 8AM','Thu 8AM'] },
    U5: { name: 'Non-Linear Optimization', color: '#fbbf24', sessions: ['Mon 2PM','Wed 2PM'] },
    U6: { name: 'Fluid Dynamics', color: '#f97316', sessions: ['Tue 2PM','Thu 2PM','Fri 2PM'] },
    U7: { name: 'Regression Modelling', color: '#e879f9', sessions: ['Mon 12PM','Wed 12PM','Fri 12PM'] },
};

function initAttendance() {
    const container = document.getElementById('attendance-units');
    if (!container) return;
    renderAttendance();
}

function renderAttendance() {
    const container = document.getElementById('attendance-units');
    if (!container) return;
    const att = JSON.parse(localStorage.getItem('attendance') || '{}');

    container.innerHTML = Object.entries(ATT_CLASSES).map(([uid, udata]) => {
        const sessions = att[uid] || {};
        const total = udata.sessions.length;
        const present = Object.values(sessions).filter(s => s === 'P' || s === 'O').length;
        const pct = total ? Math.round((present / total) * 100) : 0;
        const color = pct >= 75 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#fb7185';
        const flag = pct < 75 ? '⚠️' : '✓';

        return `<div class="att-unit-card" id="att-${uid}">
            <div class="att-unit-header">
                <div class="res-unit-color" style="background:${udata.color}"></div>
                <span style="flex:1;font-weight:600;font-size:0.9rem">${udata.name}</span>
                <div class="att-unit-bar-wrap" style="max-width:120px">
                    <div class="att-unit-bar" style="width:${pct}%;background:${color}"></div>
                </div>
                <span class="att-unit-pct" style="color:${color}">${pct}%</span>
                <span class="att-unit-flag">${flag}</span>
                <span class="res-unit-chevron">▶</span>
            </div>
            <div class="att-unit-body">
                <div style="font-size:0.78rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:12px">
                    ${present}/${total} classes attended — ${pct < 75 ? `⚠ Need ${Math.ceil(total*0.75)-present} more to reach 75%` : 'Above threshold ✓'}
                </div>
                <div class="att-class-grid">
                    ${udata.sessions.map((s, i) => {
                        const key = `${i}`;
                        const status = sessions[key] || '';
                        return `<div class="att-class-item">
                            <div class="att-class-date">${s}</div>
                            <div class="att-btns">
                                <button class="att-btn${status==='P'?' att-present':''}" data-uid="${uid}" data-key="${key}" data-val="P">✓</button>
                                <button class="att-btn${status==='M'?' att-missed':''}" data-uid="${uid}" data-key="${key}" data-val="M">✗</button>
                                <button class="att-btn${status==='O'?' att-online':''}" data-uid="${uid}" data-key="${key}" data-val="O">📺</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.att-unit-header').forEach(h => {
        h.addEventListener('click', () => h.closest('.att-unit-card').classList.toggle('open'));
    });

    container.querySelectorAll('.att-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const att = JSON.parse(localStorage.getItem('attendance') || '{}');
            const { uid, key, val } = btn.dataset;
            if (!att[uid]) att[uid] = {};
            att[uid][key] = att[uid][key] === val ? '' : val;
            localStorage.setItem('attendance', JSON.stringify(att));
            renderAttendance();
            // re-open the card
            setTimeout(() => {
                document.getElementById(`att-${uid}`)?.classList.add('open');
            }, 10);
        });
    });
}

// ── 4. FOCUS MODE ─────────────────────────────────────────────────
let focusInterval = null;
let focusSeconds = 25 * 60;
let focusRunning = false;
let focusCycle = 0;
const FOCUS_WORK = 25 * 60;
const FOCUS_BREAK = 5 * 60;
let focusIsBreak = false;

function initFocusMode() {
    document.getElementById('focus-fab')?.addEventListener('click', openFocus);
    document.getElementById('focus-exit')?.addEventListener('click', closeFocus);
    document.getElementById('focus-start-btn')?.addEventListener('click', startFocus);
    document.getElementById('focus-pause-btn')?.addEventListener('click', pauseFocus);
    document.getElementById('focus-reset-btn')?.addEventListener('click', resetFocus);
}

function openFocus() {
    document.getElementById('focus-overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateFocusDisplay();
}

function closeFocus() {
    document.getElementById('focus-overlay')?.classList.remove('active');
    document.body.style.overflow = '';
    pauseFocus();
}

function startFocus() {
    if (focusRunning) return;
    focusRunning = true;
    focusInterval = setInterval(() => {
        focusSeconds--;
        updateFocusDisplay();
        if (focusSeconds <= 0) {
            clearInterval(focusInterval);
            focusRunning = false;
            if (!focusIsBreak) {
                focusCycle++;
                updateFocusCycles();
                if (typeof logStudySession !== 'undefined') logStudySession('Focus Session', 25);
                if (typeof updateStudyScore !== 'undefined') updateStudyScore(5);
                focusIsBreak = true;
                focusSeconds = FOCUS_BREAK;
                document.getElementById('focus-timer-label').textContent = '☕ Break Time — 5 minutes';
                if (typeof sendNotif !== 'undefined') sendNotif('✅ Pomodoro Done!', 'Take a 5-minute break. You earned it!');
            } else {
                focusIsBreak = false;
                focusSeconds = FOCUS_WORK;
                document.getElementById('focus-timer-label').textContent = `Pomodoro • Session ${focusCycle + 1}`;
                if (typeof sendNotif !== 'undefined') sendNotif('⏰ Break Over!', 'Back to studying — stay focused!');
            }
            startFocus();
        }
    }, 1000);
}

function pauseFocus() {
    clearInterval(focusInterval);
    focusRunning = false;
}

function resetFocus() {
    pauseFocus();
    focusSeconds = FOCUS_WORK;
    focusIsBreak = false;
    updateFocusDisplay();
    document.getElementById('focus-timer-label').textContent = 'Pomodoro • Session 1';
}

function updateFocusDisplay() {
    const m = Math.floor(focusSeconds / 60).toString().padStart(2, '0');
    const s = (focusSeconds % 60).toString().padStart(2, '0');
    const el = document.getElementById('focus-timer-display');
    if (el) el.textContent = `${m}:${s}`;
}

function updateFocusCycles() {
    const cycles = document.querySelectorAll('.focus-cycle');
    cycles.forEach((c, i) => c.classList.toggle('done', i < (focusCycle % 4)));
}

// ── 5. EXPORT / PRINT ─────────────────────────────────────────────
function initExport() {
    document.getElementById('export-btn')?.addEventListener('click', showExportMenu);
}

function showExportMenu() {
    const menu = document.createElement('div');
    menu.style.cssText = 'position:fixed;bottom:70px;right:136px;background:var(--bg-elevated);border:1px solid var(--glass-border);border-radius:12px;padding:8px;z-index:200;min-width:200px;';
    menu.innerHTML = `
        <div style="padding:8px 12px;font-size:0.7rem;color:var(--text-dim);font-family:var(--font-mono);border-bottom:1px solid var(--glass-border);margin-bottom:6px">EXPORT OPTIONS</div>
        <button onclick="printTimetable()" style="display:block;width:100%;padding:10px 14px;background:none;border:none;color:var(--text-primary);text-align:left;cursor:pointer;font-size:0.85rem;border-radius:6px;font-family:var(--font-main)">🖨 Print Study Timetable</button>
        <button onclick="exportGrades()" style="display:block;width:100%;padding:10px 14px;background:none;border:none;color:var(--text-primary);text-align:left;cursor:pointer;font-size:0.85rem;border-radius:6px;font-family:var(--font-main)">📊 Export Grade Summary (CSV)</button>
        <button onclick="exportTasks()" style="display:block;width:100%;padding:10px 14px;background:none;border:none;color:var(--text-primary);text-align:left;cursor:pointer;font-size:0.85rem;border-radius:6px;font-family:var(--font-main)">📋 Export Tasks (JSON)</button>`;
    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 100);
}

function printTimetable() {
    // Switch to study plan view, then print
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-studyplan')?.classList.add('active');
    setTimeout(() => { window.print(); }, 300);
}

function exportGrades() {
    const cats = JSON.parse(localStorage.getItem('cat_scores') || '{}');
    const rows = ['Unit,CAT1,CAT2,Total CAT %,Notes'];
    const units = ['Linear Algebra','Research Methodology','Complex Variables','Abstract Integration','Non-Linear Optimization','Fluid Dynamics','Regression Modelling'];
    units.forEach((name, i) => {
        const uid = `U${i+1}`;
        const d = cats[uid] || {};
        const c1 = parseFloat(d.cat1) || 0;
        const c2 = parseFloat(d.cat2) || 0;
        const pct = ((c1+c2)/60*30).toFixed(1);
        rows.push(`"${name}",${c1},${c2},${pct}%,""`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'mathengine_grades.csv'; a.click();
}

function exportTasks() {
    const tasks = JSON.parse(localStorage.getItem('kanban_tasks') || '[]');
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'mathengine_tasks.json'; a.click();
}
