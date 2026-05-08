// ========================================
// MATHENGINE FEATURES — KANBAN, FLASHCARDS, STATS, NOTIFICATIONS
// ========================================

// Bootstrap: runs after app.js DOMContentLoaded has fired
window.addEventListener('load', () => {
    initKanban();
    initFlashcards();
    initStudyStats();
    initNotifications();
});

// ========================================
// 1. KANBAN TASK BOARD
// ========================================
function initKanban() {
    const sel = document.getElementById('task-unit-select');
    if (!sel) return;
    if (typeof state !== 'undefined' && state.units) {
        sel.innerHTML = '<option value="General">📌 General</option>' +
            state.units.map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    }
    renderKanban(loadTasks());

    document.getElementById('task-add-btn')?.addEventListener('click', () => {
        const title = document.getElementById('task-title-input')?.value.trim();
        if (!title) { showToast('Please enter a task title', '⚠'); return; }
        const task = {
            id: Date.now().toString(),
            title,
            unit: document.getElementById('task-unit-select')?.value || 'General',
            priority: document.getElementById('task-priority-select')?.value || 'medium',
            deadline: document.getElementById('task-date-input')?.value || '',
            col: 'todo',
        };
        const all = loadTasks();
        all.push(task);
        saveTasks(all);
        renderKanban(all);
        document.getElementById('task-title-input').value = '';
        showToast('Task added to board!', '✓');
    });

    ['todo','inprogress','done'].forEach(col => {
        const el = document.getElementById(`cards-${col}`);
        if (!el) return;
        el.addEventListener('dragover', e => {
            e.preventDefault();
            document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
            el.closest('.kanban-col').classList.add('drag-over');
        });
        el.addEventListener('dragleave', () => {
            document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
        });
        el.addEventListener('drop', e => {
            e.preventDefault();
            document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
            const taskId = e.dataTransfer.getData('taskId');
            const all = loadTasks();
            const task = all.find(t => t.id === taskId);
            if (task) { task.col = col; saveTasks(all); renderKanban(all); }
        });
    });
}

function renderKanban(tasks) {
    ['todo','inprogress','done'].forEach(col => {
        const container = document.getElementById(`cards-${col}`);
        const countEl = document.getElementById(`count-${col}`);
        if (!container) return;
        const colTasks = tasks.filter(t => t.col === col);
        if (countEl) countEl.textContent = colTasks.length;
        container.innerHTML = '';
        colTasks.forEach(task => {
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && col !== 'done';
            const card = document.createElement('div');
            card.className = `kanban-card priority-${task.priority}${isOverdue ? ' overdue' : ''}${col === 'done' ? ' col-done' : ''}`;
            card.draggable = true;
            card.innerHTML = `
                <button class="kc-delete" title="Delete">✕</button>
                <div class="kc-title">${task.title}</div>
                <div class="kc-meta">
                    <span class="kc-tag">${task.unit}</span>
                    <span class="kc-tag" style="background:rgba(251,191,36,0.08);color:var(--amber)">${task.priority}</span>
                    ${task.deadline ? `<span class="kc-date${isOverdue ? ' overdue' : ''}">${isOverdue ? '⚠ Overdue: ' : '📅 '}${task.deadline}</span>` : ''}
                </div>`;
            card.addEventListener('dragstart', e => {
                e.dataTransfer.setData('taskId', task.id);
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.querySelector('.kc-delete').addEventListener('click', e => {
                e.stopPropagation();
                saveTasks(loadTasks().filter(t => t.id !== task.id));
                renderKanban(loadTasks());
            });
            container.appendChild(card);
        });
    });
}

function loadTasks() { return JSON.parse(localStorage.getItem('kanban_tasks') || '[]'); }
function saveTasks(t) { localStorage.setItem('kanban_tasks', JSON.stringify(t)); }

// ========================================
// 2. FLASHCARD SYSTEM
// ========================================
let fcDeck = [];
let fcIndex = 0;

function buildDeck(unitFilter, ratingFilter) {
    if (typeof revisionData === 'undefined' || typeof state === 'undefined') return [];
    const ratings = JSON.parse(localStorage.getItem('fc_ratings') || '{}');
    const deck = [];
    state.units.forEach(unit => {
        if (unitFilter !== 'all' && unit.id !== unitFilter) return;
        const data = revisionData[unit.id];
        if (!data) return;
        const items = [
            ...data.formulas.map(f => ({ id: `${unit.id}_f_${f.title}`, type: 'Formula', unit: unit.name, color: unit.color, question: f.title, answer: f.expr })),
            ...data.theorems.map(t => ({ id: `${unit.id}_t_${t.name}`, type: 'Theorem', unit: unit.name, color: unit.color, question: t.name, answer: t.statement }))
        ];
        items.forEach(card => {
            const r = ratings[card.id] || 'new';
            if (ratingFilter === 'all' || ratingFilter === r) deck.push(card);
        });
    });
    return deck;
}

function initFlashcards() {
    const uf = document.getElementById('fc-unit-filter');
    if (!uf) return;
    if (typeof state !== 'undefined') {
        state.units.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id; opt.textContent = u.name;
            uf.appendChild(opt);
        });
    }

    const rebuild = () => {
        fcDeck = buildDeck(uf.value, document.getElementById('fc-filter')?.value || 'all');
        fcIndex = 0;
        unflipCard();
        showFlashcard();
        renderFcStats();
    };

    uf.addEventListener('change', rebuild);
    document.getElementById('fc-filter')?.addEventListener('change', rebuild);
    document.getElementById('fc-shuffle-btn')?.addEventListener('click', () => {
        fcDeck.sort(() => Math.random() - 0.5);
        fcIndex = 0; unflipCard(); showFlashcard();
        if (typeof showToast !== 'undefined') showToast('Deck shuffled!', '🔀');
    });
    document.getElementById('fc-prev-btn')?.addEventListener('click', () => {
        if (!fcDeck.length) return;
        fcIndex = (fcIndex - 1 + fcDeck.length) % fcDeck.length;
        unflipCard(); showFlashcard();
    });
    document.getElementById('fc-next-btn')?.addEventListener('click', () => {
        if (!fcDeck.length) return;
        fcIndex = (fcIndex + 1) % fcDeck.length;
        unflipCard(); showFlashcard();
    });
    document.getElementById('fc-card')?.addEventListener('click', () => {
        document.getElementById('fc-card-inner')?.classList.toggle('flipped');
    });
    document.querySelectorAll('.fc-rate-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (!fcDeck.length) return;
            const ratings = JSON.parse(localStorage.getItem('fc_ratings') || '{}');
            ratings[fcDeck[fcIndex].id] = btn.dataset.rating;
            localStorage.setItem('fc_ratings', JSON.stringify(ratings));
            setTimeout(() => {
                fcIndex = (fcIndex + 1) % fcDeck.length;
                unflipCard(); showFlashcard(); renderFcStats();
                updateStudyScore(2);
            }, 300);
        });
    });

    rebuild();
}

function unflipCard() {
    document.getElementById('fc-card-inner')?.classList.remove('flipped');
}

function showFlashcard() {
    const label = document.getElementById('fc-progress-label');
    if (!fcDeck.length) {
        if (label) label.textContent = 'No cards match filter';
        const q = document.getElementById('fc-question');
        if (q) q.textContent = 'No cards — change the filter above';
        const a = document.getElementById('fc-answer');
        if (a) a.textContent = '';
        const tag = document.getElementById('fc-unit-tag');
        if (tag) tag.textContent = '';
        return;
    }
    const c = fcDeck[fcIndex];
    if (label) label.textContent = `Card ${fcIndex + 1} of ${fcDeck.length}`;
    document.getElementById('fc-question').textContent = c.question;
    document.getElementById('fc-answer').textContent = c.answer;
    const tag = document.getElementById('fc-unit-tag');
    if (tag) {
        tag.textContent = `${c.unit} — ${c.type}`;
        tag.style.background = c.color + '22';
        tag.style.color = c.color;
    }
}

function renderFcStats() {
    const container = document.getElementById('fc-stats-row');
    if (!container) return;
    const ratings = JSON.parse(localStorage.getItem('fc_ratings') || '{}');
    const allCards = buildDeck('all', 'all');
    const counts = { new: 0, hard: 0, medium: 0, easy: 0 };
    allCards.forEach(c => { const r = ratings[c.id] || 'new'; counts[r] = (counts[r] || 0) + 1; });
    container.innerHTML = `
        <div class="fc-stat-pill"><div class="fc-stat-val" style="color:var(--text-secondary)">${counts.new}</div><div class="fc-stat-lbl">🆕 Unrated</div></div>
        <div class="fc-stat-pill"><div class="fc-stat-val" style="color:var(--rose)">${counts.hard}</div><div class="fc-stat-lbl">🔴 Hard</div></div>
        <div class="fc-stat-pill"><div class="fc-stat-val" style="color:var(--amber)">${counts.medium}</div><div class="fc-stat-lbl">🟡 Medium</div></div>
        <div class="fc-stat-pill"><div class="fc-stat-val" style="color:var(--green)">${counts.easy}</div><div class="fc-stat-lbl">🟢 Mastered</div></div>`;
}

// ========================================
// 3. STUDY STATS & STREAK
// ========================================
function initStudyStats() {
    const today = new Date().toDateString();
    const d = JSON.parse(localStorage.getItem('study_stats') || '{"streak":0,"lastVisit":"","sessions":[],"totalMinutes":0,"score":0}');
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d.lastVisit !== today) {
        d.streak = d.lastVisit === yesterday ? (d.streak || 0) + 1 : 1;
        d.lastVisit = today;
        localStorage.setItem('study_stats', JSON.stringify(d));
    }
    renderStatsPage();
}

function getStudyData() {
    return JSON.parse(localStorage.getItem('study_stats') || '{"streak":1,"lastVisit":"","sessions":[],"totalMinutes":0,"score":0}');
}

function updateStudyScore(pts) {
    const d = getStudyData();
    d.score = (d.score || 0) + pts;
    localStorage.setItem('study_stats', JSON.stringify(d));
    const el = document.getElementById('score-value');
    if (el) el.textContent = d.score;
}

function logStudySession(unitName, minutes) {
    const d = getStudyData();
    d.sessions = d.sessions || [];
    d.sessions.unshift({ unit: unitName, minutes, time: new Date().toISOString() });
    if (d.sessions.length > 20) d.sessions = d.sessions.slice(0, 20);
    d.totalMinutes = (d.totalMinutes || 0) + minutes;
    d.score = (d.score || 0) + Math.floor(minutes / 5);
    localStorage.setItem('study_stats', JSON.stringify(d));
    renderStatsPage();
}

function renderStatsPage() {
    const d = getStudyData();
    const sv = document.getElementById('streak-value'); if (sv) sv.textContent = d.streak || 1;
    const sb = document.getElementById('streak-sub');
    if (sb) {
        const s = d.streak || 1;
        sb.textContent = s >= 7 ? '🔥 Week+ streak! Incredible!' : s >= 3 ? "You're building momentum!" : "Keep it up — don't break the chain!";
    }
    const hv = document.getElementById('hours-value');
    if (hv) hv.textContent = ((d.totalMinutes || 0) / 60).toFixed(1) + 'h';
    const scv = document.getElementById('score-value'); if (scv) scv.textContent = d.score || 0;

    const ratings = JSON.parse(localStorage.getItem('fc_ratings') || '{}');
    const easyCt = Object.values(ratings).filter(r => r === 'easy').length;
    const cv = document.getElementById('cards-value'); if (cv) cv.textContent = easyCt;

    // Heatmap
    const hm = document.getElementById('week-heatmap');
    if (hm) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        hm.innerHTML = '';
        for (let i = 6; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            const ds = day.toDateString();
            const mins = (d.sessions || []).filter(s => new Date(s.time).toDateString() === ds)
                .reduce((acc, s) => acc + (s.minutes || 0), 0);
            const lv = mins === 0 ? 0 : mins < 30 ? 1 : mins < 90 ? 2 : 3;
            hm.innerHTML += `<div class="heatmap-day">
                <div class="heatmap-label">${days[day.getDay()]}</div>
                <div class="heatmap-cell level-${lv}${i === 0 ? ' today-cell' : ''}">${mins > 0 ? mins + 'm' : ''}</div>
            </div>`;
        }
    }

    // Session log
    const log = document.getElementById('session-log');
    if (log) {
        const sessions = d.sessions || [];
        if (!sessions.length) {
            log.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:8px 0">No sessions yet. Start the study timer to log sessions!</div>';
        } else {
            log.innerHTML = sessions.slice(0, 8).map(s => {
                const dt = new Date(s.time);
                return `<div class="session-item">
                    <span class="session-icon">📚</span>
                    <div class="session-info">
                        <div class="session-name">${s.unit || 'Study Session'}</div>
                        <div class="session-time">${dt.toLocaleDateString()} at ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <span class="session-duration">+${s.minutes}min</span>
                </div>`;
            }).join('');
        }
    }
}

// ========================================
// 4. BROWSER NOTIFICATIONS
// ========================================
function initNotifications() {
    const statusEl = document.getElementById('apc-status');
    const enableBtn = document.getElementById('notif-enable-btn');

    function refreshStatus() {
        if (!('Notification' in window)) {
            if (statusEl) statusEl.textContent = 'Notifications not supported in this browser';
            if (enableBtn) enableBtn.disabled = true;
            return;
        }
        const p = Notification.permission;
        if (statusEl) statusEl.textContent =
            p === 'granted' ? '✅ Notifications are ENABLED — you will receive reminders' :
            p === 'denied' ? '❌ Blocked — please allow notifications in browser settings' :
            'Click below to enable browser notifications';
        if (enableBtn) {
            enableBtn.textContent = p === 'granted' ? '✅ Already Enabled' : 'Enable Notifications';
            enableBtn.disabled = p === 'denied';
        }
    }

    refreshStatus();

    enableBtn?.addEventListener('click', async () => {
        if (!('Notification' in window)) return;
        await Notification.requestPermission();
        refreshStatus();
        if (typeof showToast !== 'undefined') showToast('Notification permission updated!', '🔔');
    });

    document.getElementById('set-reminder-btn')?.addEventListener('click', () => {
        const t = document.getElementById('reminder-time')?.value;
        if (!t) return;
        localStorage.setItem('daily_reminder_time', t);
        scheduleReminder(t);
        if (typeof showToast !== 'undefined') showToast(`Daily reminder set for ${t}!`, '⏰');
    });

    document.getElementById('test-alert-btn')?.addEventListener('click', () => {
        sendNotif('🔔 MathEngine Test Alert', 'Your exam reminders are working! Stay focused and keep studying.');
    });

    const saved = localStorage.getItem('daily_reminder_time');
    if (saved) {
        const el = document.getElementById('reminder-time');
        if (el) el.value = saved;
        scheduleReminder(saved);
    }

    renderAlertsList();
}

function scheduleReminder(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    setTimeout(() => {
        sendNotif('⏰ Daily Study Reminder', 'Time to open MathEngine and check your study plan!');
        scheduleReminder(timeStr); // re-schedule for next day
    }, target - now);
}

function sendNotif(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if (typeof showToast !== 'undefined') {
        showToast(body.slice(0, 70), '🔔');
    }
}

function renderAlertsList() {
    const container = document.getElementById('alerts-list');
    if (!container || typeof state === 'undefined') return;
    const now = new Date();
    const alerts = [];

    state.units.forEach(u => {
        const fields = [
            [u.cat1Date, 'CAT 1', '📝'],
            [u.cat2Date, 'CAT 2', '📝'],
            [u.examDate, 'Final Exam', '🎯']
        ];
        fields.forEach(([dateStr, label, icon]) => {
            if (!dateStr) return;
            const d = new Date(dateStr);
            const days = Math.ceil((d - now) / 86400000);
            if (days >= 0 && days <= 60) alerts.push({ title: `${u.name} — ${label}`, date: dateStr, days, icon });
        });
    });

    // Add group work deadline
    const gwDays = Math.ceil((new Date('2026-05-11') - now) / 86400000);
    if (gwDays >= 0) alerts.push({ title: 'Fluid Dynamics Group Work Submission', date: '2026-05-11 at 6PM', days: gwDays, icon: '👥' });

    const preDays = Math.ceil((new Date('2026-05-12') - now) / 86400000);
    if (preDays >= 0) alerts.push({ title: 'Fluid Dynamics Presentation', date: '2026-05-12 at 9AM', days: preDays, icon: '🎤' });

    alerts.sort((a, b) => a.days - b.days);

    if (!alerts.length) {
        container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem">No upcoming deadlines in the next 60 days.</div>';
        return;
    }

    container.innerHTML = alerts.map(a => {
        const col = a.days === 0 ? 'color:var(--rose);font-weight:700' :
                    a.days <= 3 ? 'color:var(--amber)' : 'color:var(--cyan)';
        const when = a.days === 0 ? '🔴 TODAY!' : a.days === 1 ? '⚡ Tomorrow!' : `in ${a.days} days`;
        return `<div class="alert-item">
            <span class="alert-icon">${a.icon}</span>
            <div class="alert-info">
                <div class="alert-title">${a.title}</div>
                <div class="alert-when">${a.date}</div>
            </div>
            <span class="alert-days" style="${col}">${when}</span>
        </div>`;
    }).join('');
}
