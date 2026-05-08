// ========================================
// PAST PAPERS VAULT — appended to features4.js
// ========================================

window.addEventListener('load', () => initPastPapers());

function initPastPapers() {
    const units = typeof state !== 'undefined' ? state.units : [];
    ['pp-unit','pp-filter-unit'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        units.forEach(u => {
            const o = document.createElement('option');
            o.value = u.name; o.textContent = u.name;
            sel.appendChild(o);
        });
    });

    // Drop zone for Past Papers
    const ppDrop = document.getElementById('pp-drop-zone');
    const ppInput = document.getElementById('pp-file-input');
    ppDrop?.addEventListener('click', e => { e.stopPropagation(); ppInput?.click(); });
    ppInput?.addEventListener('click', e => e.stopPropagation());
    ppDrop?.addEventListener('dragover', e => { e.preventDefault(); ppDrop.classList.add('dragover'); });
    ppDrop?.addEventListener('dragleave', e => { if (!ppDrop.contains(e.relatedTarget)) ppDrop.classList.remove('dragover'); });
    ppDrop?.addEventListener('drop', e => {
        e.preventDefault(); ppDrop.classList.remove('dragover');
        const f = e.dataTransfer.files[0];
        if (f) readFile(f, 'pp-paste', 'pp-title');
    });
    ppInput?.addEventListener('change', function() {
        if (this.files[0]) readFile(this.files[0], 'pp-paste', 'pp-title');
        this.value = '';
    });

    document.getElementById('pp-clear-btn')?.addEventListener('click', () => {
        ['pp-title','pp-paste'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
        document.getElementById('pp-result-card').style.display = 'none';
    });

    document.getElementById('pp-save-btn')?.addEventListener('click', () => savePaper(false));
    document.getElementById('pp-optimize-btn')?.addEventListener('click', () => savePaper(true));

    document.getElementById('pp-copy-btn')?.addEventListener('click', () => {
        const b = document.getElementById('pp-result-body');
        if (b) navigator.clipboard.writeText(b.innerText).then(() => {
            if (typeof showToast !== 'undefined') showToast('Copied!', '📋');
        });
    });

    document.getElementById('pp-save-note-btn')?.addEventListener('click', () => {
        const html = document.getElementById('pp-result-body')?.innerHTML || '';
        const title = document.getElementById('pp-result-title')?.textContent || 'Paper';
        const unit = document.getElementById('pp-unit')?.value || 'General';
        if (!html) return;
        const notes = JSON.parse(localStorage.getItem('smart_notes') || '[]');
        notes.unshift({ id: Date.now().toString(), title, unit, block: 'Past Paper', mode: 'full', rawText: '', html, date: new Date().toISOString(), wordCount: 0 });
        localStorage.setItem('smart_notes', JSON.stringify(notes));
        if (typeof showToast !== 'undefined') showToast('Saved to Smart Notes!', '💾');
    });

    document.getElementById('pp-to-selftest-btn')?.addEventListener('click', ppExtractToSelfTest);

    document.getElementById('pp-search')?.addEventListener('input', renderPapers);
    document.getElementById('pp-filter-unit')?.addEventListener('change', renderPapers);
    document.getElementById('pp-filter-type')?.addEventListener('change', renderPapers);

    renderPapers();
}

// ── Storage ───────────────────────────────────────────────────────
function loadPapers() { return JSON.parse(localStorage.getItem('past_papers') || '[]'); }
function savePaperStore(p) { localStorage.setItem('past_papers', JSON.stringify(p)); }

function savePaper(optimize) {
    const title = document.getElementById('pp-title')?.value.trim();
    const rawText = document.getElementById('pp-paste')?.value.trim();
    const unit = document.getElementById('pp-unit')?.value || 'General';
    const type = document.getElementById('pp-type')?.value || 'cat';
    if (!rawText) { if (typeof showToast !== 'undefined') showToast('Please paste or import paper content', '⚠'); return; }
    if (!title) { if (typeof showToast !== 'undefined') showToast('Please enter a paper title', '⚠'); return; }

    const papers = loadPapers();
    const paper = { id: Date.now().toString(), title, unit, type, rawText, date: new Date().toISOString(), wordCount: rawText.split(/\s+/).length };
    papers.unshift(paper);
    if (papers.length > 40) papers.splice(40);
    savePaperStore(papers);
    renderPapers();
    if (typeof showToast !== 'undefined') showToast('Paper saved!', '📄');

    if (optimize) runPaperOptimizer(paper);
}

// ── Renderer ──────────────────────────────────────────────────────
function renderPapers() {
    const container = document.getElementById('pp-list');
    if (!container) return;
    const query = (document.getElementById('pp-search')?.value || '').toLowerCase();
    const uFilter = document.getElementById('pp-filter-unit')?.value || 'all';
    const tFilter = document.getElementById('pp-filter-type')?.value || 'all';

    let papers = loadPapers();
    if (uFilter !== 'all') papers = papers.filter(p => p.unit === uFilter);
    if (tFilter !== 'all') papers = papers.filter(p => p.type === tFilter);
    if (query) papers = papers.filter(p => p.title.toLowerCase().includes(query) || p.unit.toLowerCase().includes(query));

    if (!papers.length) {
        container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:16px 0">No papers yet. Upload your first CAT or revision paper above!</div>';
        return;
    }

    const typeConf = {
        cat:      { icon: '📝', color: 'var(--cyan)',   label: 'CAT Paper' },
        revision: { icon: '📚', color: 'var(--violet)', label: 'Revision'  },
        exam:     { icon: '🎯', color: 'var(--rose)',   label: 'Past Exam' },
        notes:    { icon: '📃', color: 'var(--amber)',  label: 'Notes'     },
    };

    container.innerHTML = papers.map(p => {
        const tc = typeConf[p.type] || typeConf.notes;
        const d = new Date(p.date);
        return `<div class="sn-note-card" style="border-left:3px solid ${tc.color}">
            <div class="sn-note-icon">${tc.icon}</div>
            <div class="sn-note-body">
                <div class="sn-note-title">${p.title}</div>
                <div class="sn-note-meta">
                    <span style="color:${tc.color}">${tc.label}</span>
                    <span>${p.unit}</span>
                    <span>${p.wordCount || 0} words</span>
                    <span>${d.toLocaleDateString()}</span>
                </div>
            </div>
            <div class="sn-note-actions">
                <button class="sn-note-btn primary" data-ppid="${p.id}" data-ppaction="optimize">⚡ Optimize</button>
                <button class="sn-note-btn" data-ppid="${p.id}" data-ppaction="extract">🧪 Questions</button>
                <button class="sn-note-btn danger" data-ppid="${p.id}" data-ppaction="del">✕</button>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.sn-note-btn[data-ppid]').forEach(btn => {
        btn.addEventListener('click', () => {
            const { ppid, ppaction } = btn.dataset;
            const paper = loadPapers().find(p => p.id === ppid);
            if (!paper) return;
            if (ppaction === 'del') {
                savePaperStore(loadPapers().filter(p => p.id !== ppid));
                renderPapers();
            } else if (ppaction === 'optimize') {
                runPaperOptimizer(paper);
            } else if (ppaction === 'extract') {
                extractQuestionsFromPaper(paper);
            }
        });
    });
}

// ── Optimization ──────────────────────────────────────────────────
function runPaperOptimizer(paper) {
    const sentences = paper.rawText.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 10) || [paper.rawText];
    const lines = paper.rawText.split('\n').map(l => l.trim()).filter(l => l);
    const stats = { defs: 0, theorems: 0, steps: 0, bullets: 0, formulas: 0 };

    // Separate questions from explanatory text
    const qRx = /^(\d+[\.\)]\s*|Q[\.\d]+\s*|[a-z][\.\)]\s*)/i;
    const questions = lines.filter(l => qRx.test(l) || l.includes('?'));
    const content = lines.filter(l => !qRx.test(l) && !l.includes('?'));

    let html = '';

    // Questions section
    if (questions.length) {
        html += section('📝 Questions Identified', questions.map((q, i) => {
            const clean = q.replace(qRx, '').trim();
            return `<div class="sn-step"><span class="sn-step-num">${i+1}</span><div>${highlightTerms(clean || q)}</div></div>`;
        }).join(''));
        stats.steps = questions.length;
    }

    // Key content
    if (content.length) {
        const contentSents = content.join(' ').match(/[^.!?]+[.!?]+/g)?.map(s=>s.trim()).filter(s=>s.length>10) || content;
        let contentHtml = '';
        contentSents.forEach(s => {
            const sl = s.toLowerCase();
            const isDef = DEFINITION_TRIGGERS.some(t => sl.includes(t));
            const isThm = THEOREM_TRIGGERS.some(t => sl.includes(t));
            const isFormula = FORMULA_PATTERNS.some(p => p.test(s));
            if (isFormula && s.length < 100) { contentHtml += `<div class="sn-formula">${s}</div>`; stats.formulas++; }
            else if (isDef) { contentHtml += `<div class="sn-def">${highlightTerms(s)}</div>`; stats.defs++; }
            else if (isThm) { contentHtml += `<div class="sn-theorem">${highlightTerms(s)}</div>`; stats.theorems++; }
            else if (s.length > 20) { contentHtml += `<div class="sn-bullet"><span class="sn-bullet-dot"></span><div>${highlightTerms(s)}</div></div>`; stats.bullets++; }
        });
        if (contentHtml) html += section('📖 Key Content & Theory', contentHtml);
    }

    if (!html) html = `<div class="sn-bullet"><span class="sn-bullet-dot"></span><div>${highlightTerms(paper.rawText.slice(0,500))}</div></div>`;

    // Render result
    const card = document.getElementById('pp-result-card');
    if (card) card.style.display = 'block';
    const titleEl = document.getElementById('pp-result-title');
    if (titleEl) titleEl.textContent = paper.title + ' — Optimized';
    const metaEl = document.getElementById('pp-result-meta');
    if (metaEl) metaEl.textContent = `${paper.unit} · ${paper.wordCount} words · ${questions.length} questions detected`;
    const bodyEl = document.getElementById('pp-result-body');
    if (bodyEl) bodyEl.innerHTML = html;
    const statsEl = document.getElementById('pp-stats-bar');
    if (statsEl) statsEl.innerHTML = [
        stats.steps ? `<span class="sn-stat-item">❓ Questions: <strong>${stats.steps}</strong></span>` : '',
        stats.defs  ? `<span class="sn-stat-item">📖 Defs: <strong>${stats.defs}</strong></span>` : '',
        stats.formulas ? `<span class="sn-stat-item">🔣 Formulas: <strong>${stats.formulas}</strong></span>` : '',
    ].filter(Boolean).join('');

    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof showToast !== 'undefined') showToast('Paper optimized!', '⚡');
}

// ── Extract questions → Self-Test bank ───────────────────────────
function extractQuestionsFromPaper(paper) {
    const lines = paper.rawText.split('\n').map(l => l.trim()).filter(l => l);
    const qRx = /^(\d+[\.\)]\s*|Q[\.\d]+[\.\s]\s*|[a-z][\.\)]\s*)/i;
    const questions = lines.filter(l => qRx.test(l) || (l.includes('?') && l.length > 15));

    if (!questions.length) {
        if (typeof showToast !== 'undefined') showToast('No clear questions found in this paper', '⚠');
        return;
    }

    const bank = JSON.parse(localStorage.getItem('st_bank') || '[]');
    let added = 0;
    questions.forEach(q => {
        const clean = q.replace(qRx, '').trim();
        if (!clean || clean.length < 10) return;
        bank.push({
            id: Date.now().toString() + Math.random(),
            text: clean,
            unit: paper.unit,
            difficulty: 'medium',
            type: 'short',
            modelAnswer: '',
            source: paper.title,
        });
        added++;
    });
    localStorage.setItem('st_bank', JSON.stringify(bank));
    if (typeof showToast !== 'undefined') showToast(`${added} questions added to Self-Test bank!`, '🧪');

    // Refresh self-test bank if visible
    if (typeof renderQuestionBank === 'function') renderQuestionBank();
}

// ── pp helper: question extraction on current result ─────────────
function ppExtractToSelfTest() {
    const body = document.getElementById('pp-result-body');
    if (!body) return;
    const steps = body.querySelectorAll('.sn-step div');
    const unit = document.getElementById('pp-unit')?.value || 'General';
    const title = document.getElementById('pp-result-title')?.textContent || '';

    const bank = JSON.parse(localStorage.getItem('st_bank') || '[]');
    let added = 0;
    steps.forEach(el => {
        const text = el.innerText.trim();
        if (text.length < 10) return;
        bank.push({ id: Date.now().toString() + Math.random(), text, unit, difficulty: 'medium', type: 'short', modelAnswer: '', source: title });
        added++;
    });
    localStorage.setItem('st_bank', JSON.stringify(bank));
    if (typeof showToast !== 'undefined') showToast(`${added} questions pushed to Self-Test!`, '🧪');
    if (typeof renderQuestionBank === 'function') renderQuestionBank();
}
