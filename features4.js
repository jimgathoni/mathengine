// features4.js — Smart Notes Optimizer

window.addEventListener('load', () => {
    initSmartNotes();
});

// ── Key term lists for the optimization engine ─────────────────────
const DEFINITION_TRIGGERS = [
    'is defined as','is called','are called','is known as','refers to','denotes',
    'is said to be','we define','we say that','is the','are the','means that',
    'definition','defined by','is given by'
];
const THEOREM_TRIGGERS = [
    'theorem','lemma','corollary','proposition','result','principle','law',
    'conjecture','proof','hence','therefore','it follows','we have','we get',
    'can be shown','it can be proven'
];
const FORMULA_PATTERNS = [
    /[a-zA-Z]\s*[=\+\-\*\/\^]\s*[a-zA-Z0-9\(\)]/,  // basic math expressions
    /\\frac|\\int|\\sum|\\prod|\\lim|\\infty/,         // LaTeX fragments
    /\d+\s*[=<>]\s*\d+/,                               // numeric equations
    /∫|∑|∏|∂|∇|Δ|λ|μ|σ|τ|ω|α|β|γ|θ|π|ε|δ/           // math symbols
];
const KEY_MATH_TERMS = [
    'eigenvalue','eigenvector','matrix','vector','scalar','integral','derivative',
    'differential','equation','theorem','function','continuous','convergent',
    'divergent','series','sequence','limit','boundary','condition','solution',
    'optimal','gradient','hessian','jacobian','determinant','trace','rank',
    'residue','contour','analytic','holomorphic','conformal','manifold',
    'measure','lebesgue','hilbert','banach','navier','stokes','reynolds',
    'regression','correlation','variance','distribution','probability'
];

// ── Init ─────────────────────────────────────────────────────────
function initSmartNotes() {
    // Populate unit selects
    const units = typeof state !== 'undefined' ? state.units : [];
    ['sn-unit', 'sn-filter-unit'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        units.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.name; opt.textContent = u.name;
            sel.appendChild(opt);
        });
    });

    // Tab switching
    document.querySelectorAll('.st-tab[data-sntab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.st-tab[data-sntab]').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sn-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById(`sn-panel-${tab.dataset.sntab}`);
            if (panel) panel.classList.add('active');
            if (tab.dataset.sntab === 'saved') renderSavedNotes();
        });
    });

    // File drop zone — input is OUTSIDE the zone to prevent click-bubble loop
    const dropZone = document.getElementById('sn-drop-zone');
    const fileInput = document.getElementById('sn-file-input');
    const pasteArea = document.getElementById('sn-paste');

    dropZone?.addEventListener('click', e => {
        e.stopPropagation();
        fileInput?.click();
    });
    fileInput?.addEventListener('click', e => e.stopPropagation()); // prevent bubbling back
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone?.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('dragover'); });
    dropZone?.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) readFile(file, 'sn-paste', 'sn-title');
    });
    fileInput?.addEventListener('change', function() {
        if (this.files[0]) readFile(this.files[0], 'sn-paste', 'sn-title');
        this.value = ''; // reset so same file can be re-selected
    });

    // Character counter
    pasteArea?.addEventListener('input', () => {
        const len = pasteArea.value.length;
        const el = document.getElementById('sn-char-count');
        if (el) el.textContent = `${len.toLocaleString()} characters · ~${Math.ceil(len / 1500)} min read`;
    });

    // Buttons
    document.getElementById('sn-clear-btn')?.addEventListener('click', () => {
        if (pasteArea) pasteArea.value = '';
        const countEl = document.getElementById('sn-char-count');
        if (countEl) countEl.textContent = '0 characters';
        document.getElementById('sn-result-card').style.display = 'none';
    });

    document.getElementById('sn-optimize-btn')?.addEventListener('click', () => {
        const text = pasteArea?.value.trim();
        if (!text || text.length < 30) {
            if (typeof showToast !== 'undefined') showToast('Please paste or import some notes first', '⚠');
            return;
        }
        runOptimizer(text);
    });

    document.getElementById('sn-copy-btn')?.addEventListener('click', () => {
        const body = document.getElementById('sn-result-body');
        if (!body) return;
        navigator.clipboard.writeText(body.innerText).then(() => {
            if (typeof showToast !== 'undefined') showToast('Copied to clipboard!', '📋');
        });
    });

    document.getElementById('sn-save-btn')?.addEventListener('click', saveCurrentNote);

    // Saved notes search/filter
    document.getElementById('sn-search')?.addEventListener('input', renderSavedNotes);
    document.getElementById('sn-filter-unit')?.addEventListener('change', renderSavedNotes);

    // Study mode controls
    document.getElementById('sn-font-size')?.addEventListener('input', function() {
        const content = document.getElementById('sn-study-content');
        if (content) content.style.fontSize = this.value + 'px';
    });
    document.getElementById('sn-print-btn')?.addEventListener('click', () => window.print());
    document.getElementById('sn-focus-study-btn')?.addEventListener('click', () => {
        document.getElementById('focus-overlay')?.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    renderSavedNotes();
}

// ── File reader (reusable) ───────────────────────────────────────
function readFile(file, targetTextareaId, targetTitleId) {
    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target.result;
        const ta = document.getElementById(targetTextareaId || 'sn-paste');
        if (ta) { ta.value = text; ta.dispatchEvent(new Event('input')); }
        const titleEl = document.getElementById(targetTitleId || 'sn-title');
        if (titleEl && !titleEl.value) {
            titleEl.value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        }
        if (typeof showToast !== 'undefined') showToast(`Loaded: ${file.name} (${Math.round(file.size/1024)}KB)`, '📂');
    };
    reader.onerror = () => { if (typeof showToast !== 'undefined') showToast('Could not read file', '❌'); };
    reader.readAsText(file);
}

// ── Core Optimization Engine ──────────────────────────────────────
let lastOptimizedHtml = '';
let lastOptimizedText = '';

function runOptimizer(rawText) {
    const mode = document.getElementById('sn-mode')?.value || 'full';
    const sentences = splitSentences(rawText);
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);

    let html = '';
    let stats = { defs: 0, theorems: 0, steps: 0, bullets: 0, formulas: 0 };

    if (mode === 'definitions') {
        html = extractDefinitionsMode(sentences, lines, stats);
    } else if (mode === 'steps') {
        html = extractStepsMode(lines, stats);
    } else if (mode === 'summary') {
        html = extractSummaryMode(sentences, lines, stats);
    } else {
        html = extractFullMode(sentences, lines, stats);
    }

    lastOptimizedHtml = html;
    lastOptimizedText = document.createElement('div').appendChild(document.createTextNode('')).textContent;

    // Show result
    const resultCard = document.getElementById('sn-result-card');
    const resultBody = document.getElementById('sn-result-body');
    const resultTitle = document.getElementById('sn-result-title');
    const resultMeta = document.getElementById('sn-result-meta');
    const statsBar = document.getElementById('sn-stats-bar');
    const titleInput = document.getElementById('sn-title');

    if (resultCard) resultCard.style.display = 'block';
    if (resultTitle) resultTitle.textContent = titleInput?.value || 'Optimized Notes';
    if (resultMeta) {
        const modeLabel = { definitions: 'Definitions & Theorems', steps: 'Step-by-Step', summary: 'Quick Summary', full: 'Full Structured' };
        resultMeta.textContent = `Mode: ${modeLabel[mode]} · ${rawText.length.toLocaleString()} chars processed · ${sentences.length} sentences`;
    }
    if (resultBody) resultBody.innerHTML = html;
    if (statsBar) {
        statsBar.innerHTML = [
            stats.defs > 0 ? `<span class="sn-stat-item">📖 Definitions: <strong>${stats.defs}</strong></span>` : '',
            stats.theorems > 0 ? `<span class="sn-stat-item">🔮 Theorems/Results: <strong>${stats.theorems}</strong></span>` : '',
            stats.formulas > 0 ? `<span class="sn-stat-item">🔣 Formulas: <strong>${stats.formulas}</strong></span>` : '',
            stats.steps > 0 ? `<span class="sn-stat-item">🔢 Steps: <strong>${stats.steps}</strong></span>` : '',
            stats.bullets > 0 ? `<span class="sn-stat-item">⚡ Key Points: <strong>${stats.bullets}</strong></span>` : '',
        ].filter(Boolean).join('');
    }

    resultCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof showToast !== 'undefined') showToast('Notes optimized!', '⚡');
}

// ── Extraction Modes ──────────────────────────────────────────────

function extractDefinitionsMode(sentences, lines, stats) {
    let defs = [], theorems = [], formulas = [];

    sentences.forEach(s => {
        const sl = s.toLowerCase();
        const isFormula = FORMULA_PATTERNS.some(p => p.test(s));
        const isDef = DEFINITION_TRIGGERS.some(t => sl.includes(t));
        const isThm = THEOREM_TRIGGERS.some(t => sl.includes(t));

        if (isFormula && s.length < 120) { formulas.push(s); stats.formulas++; }
        else if (isDef) { defs.push(s); stats.defs++; }
        else if (isThm) { theorems.push(s); stats.theorems++; }
    });

    let html = '';
    if (defs.length) {
        html += section('📖 Definitions', defs.map(s => `<div class="sn-def">${highlightTerms(s)}</div>`).join(''));
    }
    if (theorems.length) {
        html += section('🔮 Theorems & Results', theorems.map(s => `<div class="sn-theorem">${highlightTerms(s)}</div>`).join(''));
    }
    if (formulas.length) {
        html += section('🔣 Formulas & Expressions', formulas.map(s => `<div class="sn-formula">${s}</div>`).join(''));
    }
    if (!html) html = `<div style="color:var(--text-dim);font-size:0.85rem">No clear definitions or theorems detected. Try "Full Structured" mode instead.</div>`;
    return html;
}

function extractStepsMode(lines, stats) {
    const numbered = /^(\d+[\.\)]\s*|\*\s*|-\s*|•\s*)/;
    let stepCounter = 0;
    let stepsHtml = '';
    let otherHtml = '';

    lines.forEach(line => {
        if (numbered.test(line)) {
            const clean = line.replace(numbered, '').trim();
            stepCounter++;
            stepsHtml += `<div class="sn-step"><span class="sn-step-num">${stepCounter}</span><div>${highlightTerms(clean)}</div></div>`;
            stats.steps++;
        } else if (line.length > 20) {
            otherHtml += `<div class="sn-bullet"><span class="sn-bullet-dot"></span><div>${highlightTerms(line)}</div></div>`;
            stats.bullets++;
        }
    });

    let html = '';
    if (stepsHtml) html += section('🔢 Step-by-Step Procedure', stepsHtml);
    if (otherHtml) html += section('📌 Additional Notes', otherHtml);
    if (!html) {
        // Treat every sentence as a step
        const sents = splitSentences(lines.join(' '));
        sents.forEach((s, i) => {
            stepsHtml += `<div class="sn-step"><span class="sn-step-num">${i+1}</span><div>${highlightTerms(s)}</div></div>`;
            stats.steps++;
        });
        html = section('🔢 Extracted Steps', stepsHtml);
    }
    return html;
}

function extractSummaryMode(sentences, lines, stats) {
    // Score each sentence by keyword density
    const scored = sentences.map(s => {
        const sl = s.toLowerCase();
        let score = 0;
        KEY_MATH_TERMS.forEach(t => { if (sl.includes(t)) score += 3; });
        DEFINITION_TRIGGERS.forEach(t => { if (sl.includes(t)) score += 2; });
        THEOREM_TRIGGERS.forEach(t => { if (sl.includes(t)) score += 2; });
        FORMULA_PATTERNS.forEach(p => { if (p.test(s)) score += 4; });
        // Prefer shorter, information-dense sentences
        if (s.length < 80) score += 1;
        if (s.length > 300) score -= 2;
        return { s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.min(12, Math.ceil(sentences.length * 0.35)));
    // Re-sort back to original order by appearance
    top.sort((a, b) => sentences.indexOf(a.s) - sentences.indexOf(b.s));

    const bulletsHtml = top.map(({ s }) => {
        stats.bullets++;
        return `<div class="sn-bullet"><span class="sn-bullet-dot"></span><div>${highlightTerms(s)}</div></div>`;
    }).join('');

    const keyTermsFound = KEY_MATH_TERMS.filter(t => lines.join(' ').toLowerCase().includes(t));

    let html = section('⚡ Key Points (Auto-extracted)', bulletsHtml);
    if (keyTermsFound.length > 0) {
        html += section('🏷 Key Terms Detected', `<div style="display:flex;flex-wrap:wrap;gap:6px;">${
            keyTermsFound.slice(0, 20).map(t => `<span class="sn-highlight">${t}</span>`).join('')
        }</div>`);
    }
    return html;
}

function extractFullMode(sentences, lines, stats) {
    // Split into logical sections by headers (ALL CAPS lines, lines ending with :, numbered headings)
    const headerRx = /^(#+\s|[A-Z][A-Z\s]{4,}$|\d+\.\s+[A-Z]|.{3,60}:$)/;
    const groups = [];
    let current = { head: 'Introduction', items: [] };

    lines.forEach(line => {
        if (line.length < 5) return;
        if (headerRx.test(line) && line.length < 80) {
            if (current.items.length) groups.push(current);
            current = { head: line.replace(/^#+\s*/, '').replace(/:$/, ''), items: [] };
        } else {
            current.items.push(line);
        }
    });
    if (current.items.length) groups.push(current);

    let html = '';
    groups.forEach(group => {
        if (!group.items.length) return;
        const text = group.items.join(' ');
        const sents = splitSentences(text);

        let sectionHtml = '';
        sents.forEach(s => {
            const sl = s.toLowerCase();
            const isFormula = FORMULA_PATTERNS.some(p => p.test(s));
            const isDef = DEFINITION_TRIGGERS.some(t => sl.includes(t));
            const isThm = THEOREM_TRIGGERS.some(t => sl.includes(t));

            if (isFormula && s.length < 100) {
                sectionHtml += `<div class="sn-formula">${s}</div>`; stats.formulas++;
            } else if (isDef) {
                sectionHtml += `<div class="sn-def">${highlightTerms(s)}</div>`; stats.defs++;
            } else if (isThm) {
                sectionHtml += `<div class="sn-theorem">${highlightTerms(s)}</div>`; stats.theorems++;
            } else if (s.length > 10) {
                sectionHtml += `<div class="sn-bullet"><span class="sn-bullet-dot"></span><div>${highlightTerms(s)}</div></div>`;
                stats.bullets++;
            }
        });

        if (sectionHtml) html += section(group.head, sectionHtml);
    });

    if (!html) html = extractSummaryMode(sentences, lines, stats);
    return html;
}

// ── Helpers ───────────────────────────────────────────────────────
function splitSentences(text) {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 10) || [text];
}

function section(title, body) {
    return `<div class="sn-section"><div class="sn-section-head">${title}</div>${body}</div>`;
}

function highlightTerms(text) {
    let out = text;
    KEY_MATH_TERMS.forEach(term => {
        const rx = new RegExp(`\\b(${term})\\b`, 'gi');
        out = out.replace(rx, '<span class="sn-highlight">$1</span>');
    });
    return out;
}

// ── Save & Load Notes ─────────────────────────────────────────────
function loadNotes() { return JSON.parse(localStorage.getItem('smart_notes') || '[]'); }
function saveNotes(n) { localStorage.setItem('smart_notes', JSON.stringify(n)); }

function saveCurrentNote() {
    const title = document.getElementById('sn-title')?.value.trim() || 'Untitled Note';
    const unit = document.getElementById('sn-unit')?.value || 'General';
    const block = document.getElementById('sn-block')?.value.trim() || '';
    const mode = document.getElementById('sn-mode')?.value || 'full';
    const rawText = document.getElementById('sn-paste')?.value.trim() || '';
    const html = document.getElementById('sn-result-body')?.innerHTML || '';

    if (!html) { if (typeof showToast !== 'undefined') showToast('Optimize first before saving', '⚠'); return; }

    const notes = loadNotes();
    notes.unshift({
        id: Date.now().toString(),
        title, unit, block, mode, rawText, html,
        date: new Date().toISOString(),
        wordCount: rawText.split(/\s+/).length,
    });
    if (notes.length > 50) notes.splice(50);
    saveNotes(notes);
    renderSavedNotes();
    if (typeof showToast !== 'undefined') showToast('Note saved!', '💾');
    if (typeof updateStudyScore !== 'undefined') updateStudyScore(3);
}

function renderSavedNotes() {
    const container = document.getElementById('sn-saved-list');
    if (!container) return;

    const query = document.getElementById('sn-search')?.value.toLowerCase() || '';
    const unitFilter = document.getElementById('sn-filter-unit')?.value || 'all';
    let notes = loadNotes();

    if (unitFilter !== 'all') notes = notes.filter(n => n.unit === unitFilter);
    if (query) notes = notes.filter(n => n.title.toLowerCase().includes(query) || n.unit.toLowerCase().includes(query));

    if (!notes.length) {
        container.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:16px 0">No saved notes yet. Import and optimize some material to get started!</div>';
        return;
    }

    const modeIcons = { definitions: '📖', steps: '🔢', summary: '⚡', full: '🗂' };
    container.innerHTML = notes.map(note => {
        const d = new Date(note.date);
        return `<div class="sn-note-card">
            <div class="sn-note-icon">${modeIcons[note.mode] || '📝'}</div>
            <div class="sn-note-body">
                <div class="sn-note-title">${note.title}</div>
                <div class="sn-note-meta">
                    <span>${note.unit}</span>
                    ${note.block ? `<span>🕐 ${note.block}</span>` : ''}
                    <span>${note.wordCount || 0} words</span>
                    <span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                </div>
            </div>
            <div class="sn-note-actions">
                <button class="sn-note-btn primary" data-id="${note.id}" data-action="study">🎯 Study</button>
                <button class="sn-note-btn" data-id="${note.id}" data-action="reopt">♻ Re-optimize</button>
                <button class="sn-note-btn danger" data-id="${note.id}" data-action="del">✕</button>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('.sn-note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const { id, action } = btn.dataset;
            const note = loadNotes().find(n => n.id === id);
            if (!note) return;
            if (action === 'del') {
                saveNotes(loadNotes().filter(n => n.id !== id));
                renderSavedNotes();
            } else if (action === 'study') {
                openStudyMode(note);
            } else if (action === 'reopt') {
                // Switch to import tab and load the text
                document.querySelectorAll('.st-tab[data-sntab]').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.sn-panel').forEach(p => p.classList.remove('active'));
                document.querySelector('.st-tab[data-sntab="import"]')?.classList.add('active');
                document.getElementById('sn-panel-import')?.classList.add('active');
                const titleEl = document.getElementById('sn-title');
                const pasteEl = document.getElementById('sn-paste');
                if (titleEl) titleEl.value = note.title;
                if (pasteEl) { pasteEl.value = note.rawText; pasteEl.dispatchEvent(new Event('input')); }
            }
        });
    });
}

function openStudyMode(note) {
    // Switch to study tab
    document.querySelectorAll('.st-tab[data-sntab]').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sn-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('.st-tab[data-sntab="study"]')?.classList.add('active');
    document.getElementById('sn-panel-study')?.classList.add('active');

    document.getElementById('sn-study-empty').style.display = 'none';
    document.getElementById('sn-study-view').style.display = 'block';

    const titleEl = document.getElementById('sn-study-title');
    const unitEl = document.getElementById('sn-study-unit');
    const contentEl = document.getElementById('sn-study-content');

    if (titleEl) titleEl.textContent = note.title;
    if (unitEl) unitEl.textContent = `${note.unit}${note.block ? ' · ' + note.block : ''}`;
    if (contentEl) {
        contentEl.innerHTML = note.html;
        const fs = document.getElementById('sn-font-size');
        if (fs) contentEl.style.fontSize = fs.value + 'px';
    }

    // Log as a study session
    if (typeof logStudySession !== 'undefined') {
        logStudySession(note.unit + ' — ' + note.title, 10);
    }
}
