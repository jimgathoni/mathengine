// features3.js — Self-Test / Exam Simulation Engine

window.addEventListener('load', () => {
    // Add nav title for selftest
    document.querySelectorAll('.nav-item[data-view="selftest"]').forEach(item => {
        item.addEventListener('click', () => {
            const t = document.getElementById('page-title');
            const s = document.getElementById('page-subtitle');
            if (t) t.textContent = '🧪 Self-Test & Exam Simulation';
            if (s) s.textContent = 'Question bank · Timed sessions · Score history';
        });
    });

    initSelfTest();
});

// ── STATE ─────────────────────────────────────────────────────────
let examDeck = [];
let examIndex = 0;
let examAnswers = {};
let examTimerSecs = 0;
let examTimerInterval = null;
let examTimeLimitSecs = 0;

// ── INIT ──────────────────────────────────────────────────────────
function initSelfTest() {
    // Tab switching
    document.querySelectorAll('.st-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.st-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.st-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById(`st-panel-${tab.dataset.stab}`);
            if (panel) panel.classList.add('active');
            if (tab.dataset.stab === 'history') renderHistory();
        });
    });

    // Populate unit selects
    const units = typeof state !== 'undefined' ? state.units : [];
    ['st-unit-sel', 'st-exam-unit'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        units.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.name; opt.textContent = u.name;
            sel.appendChild(opt);
        });
    });

    // Question type toggle
    document.getElementById('st-type-sel')?.addEventListener('change', function() {
        document.getElementById('st-mcq-options').style.display = this.value === 'mcq' ? 'flex' : 'none';
        document.getElementById('st-short-answer').style.display = this.value === 'short' ? 'flex' : 'none';
        document.getElementById('st-tf-answer').style.display = this.value === 'truefalse' ? 'flex' : 'none';
    });

    // Add question
    document.getElementById('st-add-q-btn')?.addEventListener('click', addQuestion);

    // Exam controls
    document.getElementById('st-start-exam-btn')?.addEventListener('click', startExam);
    document.getElementById('st-submit-exam-btn')?.addEventListener('click', submitExam);
    document.getElementById('st-retry-btn')?.addEventListener('click', resetToSetup);
    document.getElementById('st-prev-q')?.addEventListener('click', () => { examIndex = Math.max(0, examIndex - 1); renderExamQuestion(); });
    document.getElementById('st-next-q')?.addEventListener('click', () => { examIndex = Math.min(examDeck.length - 1, examIndex + 1); renderExamQuestion(); });

    renderQuestionBank();
}

// ── QUESTION BANK ─────────────────────────────────────────────────
function loadBank() { return JSON.parse(localStorage.getItem('st_bank') || '[]'); }
function saveBank(b) { localStorage.setItem('st_bank', JSON.stringify(b)); }

function addQuestion() {
    const q = document.getElementById('st-q-input')?.value.trim();
    if (!q) { if (typeof showToast !== 'undefined') showToast('Please enter a question', '⚠'); return; }
    const type = document.getElementById('st-type-sel')?.value || 'mcq';

    const question = {
        id: Date.now().toString(),
        text: q,
        unit: document.getElementById('st-unit-sel')?.value || 'General',
        difficulty: document.getElementById('st-diff-sel')?.value || 'medium',
        type,
    };

    if (type === 'mcq') {
        question.options = {
            A: document.getElementById('st-opt-a')?.value.trim(),
            B: document.getElementById('st-opt-b')?.value.trim(),
            C: document.getElementById('st-opt-c')?.value.trim(),
            D: document.getElementById('st-opt-d')?.value.trim(),
        };
        question.correct = document.getElementById('st-correct-sel')?.value || 'A';
        if (!question.options.A || !question.options.B) {
            if (typeof showToast !== 'undefined') showToast('Please fill at least options A and B', '⚠');
            return;
        }
    } else if (type === 'short') {
        question.modelAnswer = document.getElementById('st-model-ans')?.value.trim();
    } else if (type === 'truefalse') {
        question.correct = document.getElementById('st-tf-sel')?.value || 'True';
    }

    const bank = loadBank();
    bank.push(question);
    saveBank(bank);
    renderQuestionBank();

    // Clear form
    document.getElementById('st-q-input').value = '';
    ['st-opt-a','st-opt-b','st-opt-c','st-opt-d','st-model-ans'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    if (typeof showToast !== 'undefined') showToast('Question added to bank!', '✓');
}

function renderQuestionBank() {
    const container = document.getElementById('st-question-list');
    const countEl = document.getElementById('st-bank-count');
    const bank = loadBank();

    if (countEl) countEl.textContent = `${bank.length} question${bank.length !== 1 ? 's' : ''} in bank`;

    if (!container) return;
    if (!bank.length) {
        container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:12px 0">No questions yet. Add your first question above!</div>';
        return;
    }

    const diffColors = { easy: '#34d399', medium: '#fbbf24', hard: '#fb7185' };
    const typeIcons = { mcq: '⊙', short: '✍', truefalse: 'T/F' };

    container.innerHTML = bank.map((q, i) => `
        <div class="st-q-item">
            <div class="st-q-num">${i + 1}.</div>
            <div class="st-q-body">
                <div class="st-q-text">${q.text}</div>
                <div class="st-q-tags">
                    <span class="st-q-tag" style="color:${diffColors[q.difficulty]}">${q.difficulty}</span>
                    <span class="st-q-tag">${q.unit}</span>
                    <span class="st-q-tag">${typeIcons[q.type] || q.type}</span>
                    ${q.type === 'mcq' ? `<span class="st-q-tag" style="color:var(--green)">Answer: ${q.correct}</span>` : ''}
                    ${q.type === 'truefalse' ? `<span class="st-q-tag" style="color:var(--green)">Answer: ${q.correct}</span>` : ''}
                </div>
            </div>
            <button class="st-q-del" data-id="${q.id}">✕</button>
        </div>`).join('');

    container.querySelectorAll('.st-q-del').forEach(btn => {
        btn.addEventListener('click', () => {
            saveBank(loadBank().filter(q => q.id !== btn.dataset.id));
            renderQuestionBank();
        });
    });
}

// ── EXAM ENGINE ───────────────────────────────────────────────────
function startExam() {
    let bank = loadBank();
    const unitFilter = document.getElementById('st-exam-unit')?.value || 'all';
    const diffFilter = document.getElementById('st-exam-diff')?.value || 'all';
    const countSel = document.getElementById('st-exam-count')?.value || '10';
    const timeSel = parseInt(document.getElementById('st-exam-time')?.value || '30');

    if (unitFilter !== 'all') bank = bank.filter(q => q.unit === unitFilter);
    if (diffFilter !== 'all') bank = bank.filter(q => q.difficulty === diffFilter);

    if (!bank.length) {
        if (typeof showToast !== 'undefined') showToast('No questions match your filters!', '⚠');
        return;
    }

    // Shuffle
    bank.sort(() => Math.random() - 0.5);

    // Slice count
    const count = countSel === 'all' ? bank.length : Math.min(parseInt(countSel), bank.length);
    examDeck = bank.slice(0, count);
    examIndex = 0;
    examAnswers = {};
    examTimeLimitSecs = timeSel * 60;
    examTimerSecs = examTimeLimitSecs;

    document.getElementById('st-setup-form').style.display = 'none';
    document.getElementById('st-results-panel').style.display = 'none';
    document.getElementById('st-exam-arena').style.display = 'block';

    renderExamQuestion();
    if (examTimeLimitSecs > 0) startExamTimer();
}

function renderExamQuestion() {
    if (!examDeck.length) return;
    const q = examDeck[examIndex];

    const progress = document.getElementById('st-exam-progress');
    if (progress) progress.textContent = `Question ${examIndex + 1} of ${examDeck.length}`;

    const meta = document.getElementById('st-exam-meta');
    if (meta) {
        const diffColors = { easy: '#34d399', medium: '#fbbf24', hard: '#fb7185' };
        meta.innerHTML = `
            <span class="st-q-tag" style="color:${diffColors[q.difficulty]}">${q.difficulty}</span>
            <span class="st-q-tag">${q.unit}</span>
            <span class="st-q-tag">${q.type}</span>`;
    }

    const qEl = document.getElementById('st-exam-question');
    if (qEl) qEl.textContent = q.text;

    const choicesEl = document.getElementById('st-exam-choices');
    const shortEl = document.getElementById('st-exam-short-input');
    const shortTA = document.getElementById('st-user-short-ans');

    if (q.type === 'mcq') {
        shortEl.style.display = 'none';
        choicesEl.innerHTML = Object.entries(q.options).filter(([, v]) => v).map(([letter, text]) => `
            <div class="st-choice${examAnswers[q.id] === letter ? ' selected' : ''}" data-letter="${letter}">
                <span class="st-choice-letter">${letter}</span>
                <span>${text}</span>
            </div>`).join('');
        choicesEl.querySelectorAll('.st-choice').forEach(c => {
            c.addEventListener('click', () => {
                examAnswers[q.id] = c.dataset.letter;
                renderExamQuestion();
                renderDots();
            });
        });
    } else if (q.type === 'truefalse') {
        shortEl.style.display = 'none';
        choicesEl.innerHTML = ['True', 'False'].map(opt => `
            <div class="st-choice${examAnswers[q.id] === opt ? ' selected' : ''}" data-letter="${opt}">
                <span class="st-choice-letter">${opt[0]}</span>
                <span>${opt}</span>
            </div>`).join('');
        choicesEl.querySelectorAll('.st-choice').forEach(c => {
            c.addEventListener('click', () => {
                examAnswers[q.id] = c.dataset.letter;
                renderExamQuestion();
                renderDots();
            });
        });
    } else {
        choicesEl.innerHTML = '';
        shortEl.style.display = 'block';
        if (shortTA) {
            shortTA.value = examAnswers[q.id] || '';
            shortTA.oninput = () => { examAnswers[q.id] = shortTA.value; renderDots(); };
        }
    }

    renderDots();
}

function renderDots() {
    const container = document.getElementById('st-q-dots');
    if (!container) return;
    container.innerHTML = examDeck.map((q, i) => {
        const answered = examAnswers[q.id] !== undefined && examAnswers[q.id] !== '';
        return `<div class="st-dot${answered ? ' answered' : ''}${i === examIndex ? ' current' : ''}" data-i="${i}" title="Q${i+1}"></div>`;
    }).join('');
    container.querySelectorAll('.st-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            examIndex = parseInt(dot.dataset.i);
            renderExamQuestion();
        });
    });
}

function startExamTimer() {
    clearInterval(examTimerInterval);
    updateTimerDisplay();
    examTimerInterval = setInterval(() => {
        examTimerSecs--;
        updateTimerDisplay();
        if (examTimerSecs <= 0) { clearInterval(examTimerInterval); submitExam(); }
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('st-exam-timer');
    if (!el) return;
    if (examTimeLimitSecs === 0) { el.textContent = '--:--'; return; }
    const m = Math.floor(examTimerSecs / 60).toString().padStart(2, '0');
    const s = (examTimerSecs % 60).toString().padStart(2, '0');
    el.textContent = `${m}:${s}`;
    el.classList.toggle('urgent', examTimerSecs <= 120);
}

function submitExam() {
    clearInterval(examTimerInterval);
    document.getElementById('st-exam-arena').style.display = 'none';
    document.getElementById('st-results-panel').style.display = 'block';
    renderResults();
}

function renderResults() {
    let correct = 0, wrong = 0, manual = 0;
    const timeTaken = examTimeLimitSecs > 0 ? examTimeLimitSecs - examTimerSecs : 0;

    examDeck.forEach(q => {
        const ans = examAnswers[q.id] || '';
        if (q.type === 'short') { manual++; }
        else if (ans === q.correct) { correct++; }
        else { wrong++; }
    });

    const autoGraded = examDeck.length - manual;
    const pct = autoGraded > 0 ? Math.round((correct / autoGraded) * 100) : 0;
    const grade = pct >= 70 ? { label: 'A', color: '#34d399' } :
                  pct >= 60 ? { label: 'B', color: '#38bdf8' } :
                  pct >= 50 ? { label: 'C', color: '#fbbf24' } :
                  pct >= 40 ? { label: 'D', color: '#a78bfa' } :
                               { label: 'E', color: '#fb7185' };

    // Score circle
    const circle = document.getElementById('st-score-circle');
    const scoreVal = document.getElementById('st-score-val');
    if (circle) circle.style.borderColor = grade.color;
    if (scoreVal) { scoreVal.textContent = `${pct}%`; scoreVal.style.color = grade.color; }

    // Stats
    const statsEl = document.getElementById('st-results-stats');
    if (statsEl) {
        const mins = Math.floor(timeTaken / 60);
        const secs = timeTaken % 60;
        statsEl.innerHTML = `
            <div class="st-rs-item"><span class="st-rs-val" style="color:${grade.color}">${grade.label}</span><span>Grade</span></div>
            <div class="st-rs-item"><span class="st-rs-val" style="color:var(--green)">${correct}</span><span>Correct (auto-graded)</span></div>
            <div class="st-rs-item"><span class="st-rs-val" style="color:var(--rose)">${wrong}</span><span>Wrong</span></div>
            <div class="st-rs-item"><span class="st-rs-val" style="color:var(--amber)">${manual}</span><span>Manual review needed</span></div>
            ${timeTaken > 0 ? `<div class="st-rs-item"><span class="st-rs-val">${mins}m ${secs}s</span><span>Time taken</span></div>` : ''}`;
    }

    // Review list
    const reviewEl = document.getElementById('st-review-list');
    if (reviewEl) {
        reviewEl.innerHTML = '<div style="font-size:0.8rem;color:var(--text-dim);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:12px">Review Answers</div>' +
            examDeck.map((q, i) => {
                const ans = examAnswers[q.id] || '(no answer)';
                let cls = 'ri-manual', icon = '🟡', ansHtml = '';
                if (q.type === 'short') {
                    ansHtml = `<div class="st-ri-ans" style="color:var(--amber)">Your answer: ${ans}</div>
                               <div class="st-ri-ans" style="color:var(--cyan)">Model: ${q.modelAnswer || 'N/A'}</div>`;
                } else if (ans === q.correct) {
                    cls = 'ri-correct'; icon = '✅';
                    ansHtml = `<div class="st-ri-ans st-ri-correct">✓ ${ans}${q.options ? ' — ' + q.options[ans] : ''}</div>`;
                } else {
                    cls = 'ri-wrong'; icon = '❌';
                    ansHtml = `<div class="st-ri-ans st-ri-wrong">✗ You: ${ans}</div>
                               <div class="st-ri-ans st-ri-correct">✓ Correct: ${q.correct}${q.options ? ' — ' + q.options[q.correct] : ''}</div>`;
                }
                return `<div class="st-review-item ${cls}">
                    <div class="st-ri-q">${icon} Q${i+1}: ${q.text}</div>
                    ${ansHtml}
                </div>`;
            }).join('');
    }

    // Save to history
    const history = JSON.parse(localStorage.getItem('st_history') || '[]');
    history.unshift({
        date: new Date().toISOString(),
        score: pct,
        grade: grade.label,
        gradeColor: grade.color,
        correct, wrong, manual,
        total: examDeck.length,
        timeSecs: timeTaken,
    });
    if (history.length > 50) history.splice(50);
    localStorage.setItem('st_history', JSON.stringify(history));

    // Award study score
    if (typeof updateStudyScore !== 'undefined') updateStudyScore(Math.floor(pct / 10));
}

function resetToSetup() {
    clearInterval(examTimerInterval);
    document.getElementById('st-setup-form').style.display = 'block';
    document.getElementById('st-exam-arena').style.display = 'none';
    document.getElementById('st-results-panel').style.display = 'none';
    examDeck = []; examIndex = 0; examAnswers = {};
}

function renderHistory() {
    const container = document.getElementById('st-history-list');
    if (!container) return;
    const history = JSON.parse(localStorage.getItem('st_history') || '[]');

    if (!history.length) {
        container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:12px 0">No exam sessions yet. Complete an exam to see your history here!</div>';
        return;
    }

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <span style="font-size:0.8rem;color:var(--text-dim);font-family:var(--font-mono)">${history.length} session(s) recorded</span>
            <button class="btn btn-secondary" onclick="clearHistory()" style="font-size:0.75rem;padding:6px 14px">Clear History</button>
        </div>` +
        history.map(h => {
            const d = new Date(h.date);
            const mins = Math.floor((h.timeSecs || 0) / 60);
            const secs = (h.timeSecs || 0) % 60;
            return `<div class="st-history-item">
                <span class="st-hi-score" style="color:${h.gradeColor}">${h.score}%</span>
                <div class="st-hi-info">
                    <div class="st-hi-meta">${h.correct || 0} correct / ${h.wrong || 0} wrong / ${h.manual || 0} manual — ${h.total} questions</div>
                    <div class="st-hi-date">${d.toLocaleDateString()} at ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}${h.timeSecs ? ` · ${mins}m ${secs}s` : ''}</div>
                </div>
                <span class="st-hi-grade" style="background:${h.gradeColor}22;color:${h.gradeColor};border:1px solid ${h.gradeColor}44">Grade ${h.grade}</span>
            </div>`;
        }).join('');
}

function clearHistory() {
    if (confirm('Clear all exam history?')) {
        localStorage.removeItem('st_history');
        renderHistory();
    }
}
