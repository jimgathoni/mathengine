// features6.js — Focus Mode Timer + Settings Page

window.addEventListener('load', () => {
    initFocusMode();
    initSettings();
});

// ========================================
// FOCUS MODE
// ========================================
let fvInterval = null;
let fvSecondsLeft = 25 * 60;
let fvRunning = false;
let fvSessionsToday = 0;
let fvMinsToday = 0;

function initFocusMode() {
    // Populate unit selector
    const unitSel = document.getElementById('fv-unit-sel');
    if (unitSel && typeof state !== 'undefined') {
        state.units.forEach(u => {
            const o = document.createElement('option');
            o.value = u.name; o.textContent = u.name;
            unitSel.appendChild(o);
        });
    }

    // Load today's stats
    const today = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem('focus_stats') || '{}');
    if (stored.date === today) {
        fvSessionsToday = stored.sessions || 0;
        fvMinsToday = stored.mins || 0;
    }
    updateFvStats();

    // Mode selector changes timer
    document.getElementById('fv-mode-sel')?.addEventListener('change', function () {
        if (!fvRunning) {
            fvSecondsLeft = parseInt(this.value) * 60;
            updateFvDisplay();
        }
    });

    // Buttons
    document.getElementById('fv-start-btn')?.addEventListener('click', startFvTimer);
    document.getElementById('fv-pause-btn')?.addEventListener('click', pauseFvTimer);
    document.getElementById('fv-reset-btn')?.addEventListener('click', resetFvTimer);
    document.getElementById('fv-fullscreen-btn')?.addEventListener('click', () => {
        document.getElementById('focus-fab')?.click();
    });

    // Also wire the floating focus FAB
    document.getElementById('focus-fab')?.addEventListener('click', () => {
        const overlay = document.getElementById('focus-overlay');
        if (overlay) overlay.style.display = 'flex';
    });
    document.getElementById('focus-exit')?.addEventListener('click', () => {
        const overlay = document.getElementById('focus-overlay');
        if (overlay) overlay.style.display = 'none';
    });
    document.getElementById('focus-start-btn')?.addEventListener('click', startFvTimer);
    document.getElementById('focus-pause-btn')?.addEventListener('click', pauseFvTimer);
    document.getElementById('focus-reset-btn')?.addEventListener('click', resetFvTimer);

    updateFvDisplay();
}

function startFvTimer() {
    if (fvRunning) return;
    fvRunning = true;
    fvInterval = setInterval(() => {
        if (fvSecondsLeft <= 0) {
            clearInterval(fvInterval);
            fvRunning = false;
            onFvSessionComplete();
            return;
        }
        fvSecondsLeft--;
        updateFvDisplay();
    }, 1000);
}

function pauseFvTimer() {
    clearInterval(fvInterval);
    fvRunning = false;
}

function resetFvTimer() {
    clearInterval(fvInterval);
    fvRunning = false;
    const sel = document.getElementById('fv-mode-sel');
    fvSecondsLeft = parseInt(sel?.value || '25') * 60;
    updateFvDisplay();
}

function onFvSessionComplete() {
    fvSessionsToday++;
    const modeMins = parseInt(document.getElementById('fv-mode-sel')?.value || '25');
    fvMinsToday += modeMins;

    // Save stats
    const today = new Date().toDateString();
    localStorage.setItem('focus_stats', JSON.stringify({
        date: today,
        sessions: fvSessionsToday,
        mins: fvMinsToday
    }));

    // Also credit study stats
    const stats = JSON.parse(localStorage.getItem('study_stats') || '{}');
    stats.totalMins = (stats.totalMins || 0) + modeMins;
    stats.score = (stats.score || 0) + modeMins;
    const sessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');
    const unit = document.getElementById('fv-unit-sel')?.value || 'General';
    sessions.unshift({ date: new Date().toISOString(), unit, mins: modeMins });
    if (sessions.length > 50) sessions.splice(50);
    localStorage.setItem('study_stats', JSON.stringify(stats));
    localStorage.setItem('study_sessions', JSON.stringify(sessions));

    updateFvStats();
    updateFvDots();

    if (typeof showToast === 'function') showToast(`✅ Session complete! ${modeMins} mins logged.`, '🎯');

    // Browser notification
    if (Notification.permission === 'granted') {
        new Notification('MathEngine — Session Complete! 🎯', {
            body: `${modeMins}-min focus session done. Take a break!`,
            icon: ''
        });
    }

    // Auto-reset for next session
    resetFvTimer();
}

function updateFvDisplay() {
    const mins = Math.floor(fvSecondsLeft / 60).toString().padStart(2, '0');
    const secs = (fvSecondsLeft % 60).toString().padStart(2, '0');
    const display = `${mins}:${secs}`;

    // Update view timer
    const el = document.getElementById('fv-timer-display');
    if (el) {
        el.textContent = display;
        el.classList.toggle('urgent', fvSecondsLeft < 120 && fvRunning);
    }
    // Update overlay timer
    const ovEl = document.getElementById('focus-timer-display');
    if (ovEl) ovEl.textContent = display;
}

function updateFvStats() {
    const streak = JSON.parse(localStorage.getItem('study_stats') || '{}').streak || 0;
    const el = id => document.getElementById(id);
    if (el('fv-today-sessions')) el('fv-today-sessions').textContent = fvSessionsToday;
    if (el('fv-today-mins')) el('fv-today-mins').textContent = fvMinsToday;
    if (el('fv-today-streak')) el('fv-today-streak').textContent = streak;
    const countEl = el('fv-session-count');
    if (countEl) countEl.textContent = `${fvSessionsToday} session${fvSessionsToday !== 1 ? 's' : ''} completed today`;
}

function updateFvDots() {
    const dots = document.querySelectorAll('.fv-dot');
    dots.forEach((d, i) => {
        d.classList.toggle('done', i < (fvSessionsToday % 4));
    });
}

// ========================================
// SETTINGS PAGE
// ========================================
function initSettings() {
    loadProfileFromStorage();

    document.getElementById('set-save-profile')?.addEventListener('click', saveProfile);
    document.getElementById('set-save-prefs')?.addEventListener('click', savePrefs);
    document.getElementById('set-export-data')?.addEventListener('click', exportAllData);
    document.getElementById('set-print-plan')?.addEventListener('click', () => window.print());
    document.getElementById('set-clear-notes')?.addEventListener('click', () => {
        if (confirm('Clear all Smart Notes? This cannot be undone.')) {
            localStorage.removeItem('smart_notes');
            if (typeof showToast === 'function') showToast('Smart Notes cleared', '🗑');
        }
    });
    document.getElementById('set-clear-tasks')?.addEventListener('click', () => {
        if (confirm('Clear all Tasks? This cannot be undone.')) {
            localStorage.removeItem('kanban_tasks');
            if (typeof showToast === 'function') showToast('Task Board cleared', '🗑');
        }
    });
    document.getElementById('set-reset-all')?.addEventListener('click', () => {
        if (confirm('⚠ RESET ALL DATA? This will delete all notes, tasks, flashcard ratings, attendance records, and study stats. This cannot be undone!')) {
            const keysToKeep = [];
            localStorage.clear();
            if (typeof showToast === 'function') showToast('All data reset. Refreshing...', '⚠');
            setTimeout(() => location.reload(), 1500);
        }
    });
}

function loadProfileFromStorage() {
    const p = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const el = id => document.getElementById(id);
    if (p.name && el('set-name')) el('set-name').value = p.name;
    if (p.regno && el('set-regno')) el('set-regno').value = p.regno;
    if (p.school && el('set-school')) el('set-school').value = p.school;
    if (p.programme && el('set-programme')) el('set-programme').value = p.programme;

    const prefs = JSON.parse(localStorage.getItem('study_prefs') || '{}');
    if (prefs.hours && el('set-hours')) el('set-hours').value = prefs.hours;
    if (prefs.startTime && el('set-start-time')) el('set-start-time').value = prefs.startTime;
    if (prefs.endTime && el('set-end-time')) el('set-end-time').value = prefs.endTime;
    if (prefs.pomodoro && el('set-pomodoro')) el('set-pomodoro').value = prefs.pomodoro;

    // Apply name to topbar avatar if set
    if (p.name) {
        const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const avatar = document.querySelector('.topbar-avatar span');
        if (avatar) avatar.textContent = initials;
    }
}

function saveProfile() {
    const el = id => document.getElementById(id)?.value || '';
    const p = {
        name: el('set-name'),
        regno: el('set-regno'),
        school: el('set-school'),
        programme: el('set-programme')
    };
    localStorage.setItem('user_profile', JSON.stringify(p));
    loadProfileFromStorage();
    if (typeof showToast === 'function') showToast('Profile saved!', '💾');
}

function savePrefs() {
    const el = id => document.getElementById(id)?.value || '';
    const prefs = {
        hours: el('set-hours'),
        startTime: el('set-start-time'),
        endTime: el('set-end-time'),
        pomodoro: el('set-pomodoro')
    };
    localStorage.setItem('study_prefs', JSON.stringify(prefs));

    // Apply pomodoro to focus mode
    const fvSel = document.getElementById('fv-mode-sel');
    if (fvSel && prefs.pomodoro) fvSel.value = prefs.pomodoro;

    if (typeof showToast === 'function') showToast('Preferences saved!', '💾');
}

function exportAllData() {
    const allKeys = Object.keys(localStorage);
    const data = {};
    allKeys.forEach(k => {
        try { data[k] = JSON.parse(localStorage.getItem(k)); }
        catch { data[k] = localStorage.getItem(k); }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mathengine_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Data exported!', '📤');
}
