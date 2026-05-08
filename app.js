// ========================================
// MathEngine — Industrial Mathematics
// BIM 3.2 · JKUAT · Study Ecosystem
// ========================================

// ----------------------------------------
// DATA MODEL
// ----------------------------------------
const state = {
    units: [
        { id: 'U1', name: 'Linear Algebra with Applications', code: 'SMA 2324', weight: 1.0, color: '#38bdf8' },
        { id: 'U2', name: 'Research Methodology', code: 'HRD 2114', weight: 1.0, color: '#a78bfa' },
        { id: 'U3', name: 'Complex Variables', code: 'SMA 2314', weight: 1.2, color: '#34d399' },
        { id: 'U4', name: 'Abstract Integration', code: 'SMA 2302', weight: 1.2, color: '#fbbf24' },
        { id: 'U5', name: 'Non-Linear Math Optimization', code: 'SMA 2318', weight: 1.5, color: '#fb7185' },
        { id: 'U6', name: 'Fluid Dynamics', code: 'SMA 2424', weight: 1.0, color: '#f97316' },
        { id: 'U7', name: 'Regression Modelling', code: 'STA 2413', weight: 1.0, color: '#22d3ee' }
    ],
    deadlines: [
        // ── NEXT WEEK: CATs & Assignments ──
        { id: 'GW1', unitId: 'U6', title: '📄 Group Work Submission', date: new Date('2026-05-11T09:00:00'), weightFactor: 0.1, type: 'assignment' },
        { id: 'GW2', unitId: 'U6', title: '🎤 Group Presentation', date: new Date('2026-05-11T08:00:00'), weightFactor: 0.1, type: 'assignment' },
        { id: 'C1',  unitId: 'U6', title: 'CAT 2', date: new Date('2026-05-15T08:00:00'), weightFactor: 0.2, type: 'cat' },
        { id: 'C2',  unitId: 'U7', title: 'CAT 2 (TBC: Thu/Fri)', date: new Date('2026-05-14T14:00:00'), weightFactor: 0.2, type: 'cat' },
        // ── FINAL EXAMS ──
        { id: 'D1', unitId: 'U1', title: 'Final Exam', date: new Date('2026-05-25T16:00:00'), weightFactor: 0.7, type: 'exam' },
        { id: 'D2', unitId: 'U2', title: 'Final Exam', date: new Date('2026-05-26T08:00:00'), weightFactor: 0.7, type: 'exam' },
        { id: 'D3', unitId: 'U3', title: 'Final Exam', date: new Date('2026-05-27T13:30:00'), weightFactor: 0.7, type: 'exam' },
        { id: 'D4', unitId: 'U4', title: 'Final Exam', date: new Date('2026-05-28T08:00:00'), weightFactor: 0.7, type: 'exam' },
        { id: 'D5', unitId: 'U5', title: 'Final Exam', date: new Date('2026-06-02T13:30:00'), weightFactor: 0.7, type: 'exam' },
        { id: 'D6', unitId: 'U6', title: 'Final Exam', date: new Date('2026-06-03T08:00:00'), weightFactor: 0.7, type: 'exam' },
        { id: 'D7', unitId: 'U7', title: 'Final Exam', date: new Date('2026-06-04T10:45:00'), weightFactor: 0.7, type: 'exam' }
    ],
    weeklySchedule: {
        1: [ // Monday
            { title: 'Fluid Dynamics', unitId: 'U6', start: '08:00', end: '10:00', venue: 'NSC 403' },
            { title: 'Linear Algebra', unitId: 'U1', start: '11:00', end: '13:00', venue: 'PAM LAB A' }
        ],
        2: [ // Tuesday
            { title: 'Abstract Integration', unitId: 'U4', start: '10:40', end: '13:00', venue: 'HRD 205' },
            { title: 'Research Methodology', unitId: 'U2', start: '14:00', end: '16:00', venue: 'PAM LAB B' }
        ],
        3: [ // Wednesday
            { title: 'Complex Variables', unitId: 'U3', start: '11:00', end: '13:00', venue: 'CLB 002' },
            { title: 'Regression Modelling', unitId: 'U7', start: '14:00', end: '16:00', venue: 'NSC' }
        ],
        4: [ // Thursday
            { title: 'Non-Linear Optimization', unitId: 'U5', start: '10:00', end: '13:00', venue: 'NSC' }
        ],
        5: [], // Friday
        6: [], // Saturday
        0: []  // Sunday
    },
    settings: {
        maxStudyHoursPerDay: 4,
        blockDurationMins: 60,
        studyStartHour: 18 // 6 PM
    }
};

// ----------------------------------------
// UTILITIES
// ----------------------------------------
function getToday() {
    return new Date();
}

function getDaysUntil(date) {
    const now = getToday();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getHoursUntil(date) {
    const now = getToday();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}

function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function getUnit(unitId) {
    return state.units.find(u => u.id === unitId);
}

// ----------------------------------------
// STUDY ALLOCATION ENGINE
// ----------------------------------------
function calculateStudyAllocation() {
    const riskScores = {};
    state.units.forEach(u => { riskScores[u.id] = 0; });

    state.deadlines.forEach(d => {
        const daysLeft = Math.max(1, getDaysUntil(d.date));
        const unit = getUnit(d.unitId);
        // Risk = (Weight * Course Difficulty * 100) / Days Remaining
        const score = (d.weightFactor * unit.weight * 100) / daysLeft;
        riskScores[d.unitId] += score;
    });

    const unitsByRisk = Object.entries(riskScores)
        .map(([id, score]) => ({ id, score, unit: getUnit(id) }))
        .sort((a, b) => b.score - a.score);

    const blocks = [];
    let remainingHours = state.settings.maxStudyHoursPerDay;
    let hour = state.settings.studyStartHour;

    for (const u of unitsByRisk) {
        if (remainingHours <= 0) break;
        if (u.score < 3) continue;

        let hoursToAssign = u.score > 15 ? 2 : 1;
        if (hoursToAssign > remainingHours) hoursToAssign = remainingHours;

        const deadline = state.deadlines.find(d => d.unitId === u.id);
        const daysLeft = getDaysUntil(deadline.date);

        let priority = 'low';
        let reason = 'Routine review for syllabus coverage.';
        if (daysLeft <= 3) {
            priority = 'high';
            reason = `CRITICAL: ${deadline.title} in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}! Intensive revision required.`;
        } else if (daysLeft <= 7) {
            priority = 'medium';
            reason = `${deadline.title} approaching in ${daysLeft} days. Begin focused preparation.`;
        }

        for (let i = 0; i < hoursToAssign; i++) {
            const startH = hour.toString().padStart(2, '0');
            const endH = (hour + 1).toString().padStart(2, '0');
            blocks.push({
                unitId: u.id,
                unitName: u.unit.name,
                unitCode: u.unit.code,
                color: u.unit.color,
                time: `${startH}:00 – ${endH}:00`,
                priority,
                reason,
                score: u.score
            });
            hour++;
            remainingHours--;
        }
    }

    return blocks;
}

// ----------------------------------------
// RENDERERS
// ----------------------------------------
function renderClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    el.textContent = `${h}:${m}:${s}`;
}

function renderMetrics() {
    const sorted = [...state.deadlines].sort((a, b) => a.date - b.date);
    const nextExam = sorted.find(d => d.date > new Date());

    document.getElementById('next-exam-days').textContent = nextExam ? getDaysUntil(nextExam.date) : '—';

    const blocks = calculateStudyAllocation();
    document.getElementById('blocks-tonight').textContent = blocks.length;

    // Exam window: days from first to last exam
    const first = sorted[0].date;
    const last = sorted[sorted.length - 1].date;
    const windowDays = Math.ceil((last - first) / (1000 * 60 * 60 * 24));
    document.getElementById('exam-window').textContent = windowDays;
}

function renderExams() {
    const container = document.getElementById('exams-list');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...state.deadlines].sort((a, b) => a.date - b.date);

    sorted.forEach(d => {
        const unit = getUnit(d.unitId);
        const days = getDaysUntil(d.date);
        const hours = getHoursUntil(d.date);

        let urgencyClass = 'safe';
        if (days <= 3) urgencyClass = 'critical';
        else if (days <= 10) urgencyClass = 'warning';

        // Type badge styling
        const typeColors = { exam: '#fb7185', cat: '#fbbf24', assignment: '#a78bfa' };
        const typeLabels = { exam: 'EXAM', cat: 'CAT', assignment: 'TASK' };
        const typeColor = typeColors[d.type] || '#38bdf8';
        const typeLabel = typeLabels[d.type] || 'EVENT';

        const item = document.createElement('div');
        item.className = 'exam-item';
        item.innerHTML = `
            <div class="exam-urgency ${urgencyClass}"></div>
            <div class="exam-info">
                <div class="exam-name">${unit.name}: ${d.title}</div>
                <div class="exam-date">${unit.code} · ${formatDate(d.date)}</div>
            </div>
            <span style="font-size: 0.6rem; font-family: var(--font-mono); padding: 3px 8px; border-radius: 12px; background: ${typeColor}20; color: ${typeColor}; border: 1px solid ${typeColor}30; letter-spacing: 0.5px; align-self: center;">${typeLabel}</span>
            <div class="exam-countdown">
                <span class="countdown-value" style="color: ${unit.color}">${days}</span>
                <span class="countdown-label">days (${hours}h)</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderSchedule() {
    const container = document.getElementById('schedule-list');
    const label = document.getElementById('today-label');
    if (!container) return;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    if (label) label.textContent = dayNames[today];

    const classes = state.weeklySchedule[today] || [];
    container.innerHTML = '';

    if (classes.length === 0) {
        container.innerHTML = `
            <div class="no-classes">
                <span class="no-classes-icon">📐</span>
                <p>No classes today — free day for revision!</p>
            </div>
        `;
        return;
    }

    classes.forEach(c => {
        const unit = getUnit(c.unitId);
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-dot" style="background: ${unit ? unit.color : '#38bdf8'}; box-shadow: 0 0 12px ${unit ? unit.color + '40' : 'rgba(56,189,248,0.25)'}"></div>
            <span class="timeline-time">${formatTime(c.start)} – ${formatTime(c.end)}</span>
            <div>
                <div class="timeline-label">${c.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; font-family: var(--font-mono);">${c.venue}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderAllocation() {
    const container = document.getElementById('allocation-list');
    if (!container) return;
    container.innerHTML = '';

    const blocks = calculateStudyAllocation();

    if (blocks.length === 0) {
        container.innerHTML = `
            <div class="alloc-empty">
                <span style="font-size: 2rem; display: block; margin-bottom: 12px;">✓</span>
                <p>All exams are far enough away. Enjoy a lighter evening!</p>
            </div>
        `;
        return;
    }

    blocks.forEach(b => {
        const card = document.createElement('div');
        card.className = `alloc-card priority-${b.priority}`;
        card.innerHTML = `
            <div class="alloc-header">
                <span class="alloc-tag ${b.priority}">${b.priority} priority</span>
                <span class="alloc-time">${b.time}</span>
            </div>
            <div class="alloc-unit" style="color: ${b.color}">${b.unitName}</div>
            <div class="alloc-reason">${b.reason}</div>
        `;
        container.appendChild(card);
    });
}

// ----------------------------------------
// WEEK MATRIX (Calendar View)
// ----------------------------------------
function renderWeekMatrix() {
    const container = document.getElementById('week-matrix');
    if (!container) return;
    container.innerHTML = '';

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayKeys = [1, 2, 3, 4, 5];
    const timeSlots = ['08:00–10:00', '10:00–11:00', '11:00–13:00', '13:00–14:00', '14:00–16:00'];

    // Header row
    const cornerCell = document.createElement('div');
    cornerCell.className = 'matrix-header';
    cornerCell.textContent = 'TIME';
    container.appendChild(cornerCell);

    dayLabels.forEach(d => {
        const header = document.createElement('div');
        header.className = 'matrix-header';
        header.textContent = d;
        container.appendChild(header);
    });

    // Data rows
    timeSlots.forEach(slot => {
        const timeCell = document.createElement('div');
        timeCell.className = 'matrix-time';
        timeCell.textContent = slot;
        container.appendChild(timeCell);

        const [slotStart] = slot.split('–');

        dayKeys.forEach(dayKey => {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';

            const classes = state.weeklySchedule[dayKey] || [];
            const match = classes.find(c => {
                const cStartH = parseInt(c.start.split(':')[0]);
                const slotStartH = parseInt(slotStart.split(':')[0]);
                const cEndH = parseInt(c.end.split(':')[0]);
                return slotStartH >= cStartH && slotStartH < cEndH;
            });

            if (match) {
                const unit = getUnit(match.unitId);
                cell.innerHTML = `<div class="matrix-class" style="background: ${unit.color}15; border-color: ${unit.color}30; color: ${unit.color}">${match.title}<br><span style="font-size: 0.65rem; opacity: 0.7;">${match.venue}</span></div>`;
            }

            container.appendChild(cell);
        });
    });
}

// ----------------------------------------
// UNIT CARDS (Units View)
// ----------------------------------------
function renderUnitCards() {
    const container = document.getElementById('units-grid');
    if (!container) return;
    container.innerHTML = '';

    const unitColors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#22d3ee'];

    state.units.forEach((u, i) => {
        const deadline = state.deadlines.find(d => d.unitId === u.id);
        const daysLeft = deadline ? getDaysUntil(deadline.date) : '—';
        const hoursLeft = deadline ? getHoursUntil(deadline.date) : 0;
        const color = u.color || unitColors[i % unitColors.length];

        // Calculate "study urgency" as a % bar
        const maxDays = 30;
        const urgencyPct = Math.min(100, Math.max(5, ((maxDays - daysLeft) / maxDays) * 100));

        const weekClasses = Object.values(state.weeklySchedule).flat().filter(c => c.unitId === u.id);
        const weeklyHours = weekClasses.reduce((sum, c) => {
            const sh = parseInt(c.start.split(':')[0]);
            const eh = parseInt(c.end.split(':')[0]);
            return sum + (eh - sh);
        }, 0);

        const card = document.createElement('div');
        card.className = 'unit-card';
        card.innerHTML = `
            <div class="unit-card-accent" style="background: linear-gradient(90deg, ${color}, transparent)"></div>
            <div class="unit-card-header">
                <div class="unit-card-name" style="color: ${color}">${u.name}</div>
                <span class="unit-card-weight">w = ${u.weight.toFixed(1)}</span>
            </div>
            <div class="unit-card-stats">
                <div class="unit-stat">
                    <span class="unit-stat-label">Code</span>
                    <span class="unit-stat-value">${u.code}</span>
                </div>
                <div class="unit-stat">
                    <span class="unit-stat-label">Exam In</span>
                    <span class="unit-stat-value" style="color: ${daysLeft <= 5 ? '#fb7185' : daysLeft <= 14 ? '#fbbf24' : '#34d399'}">${daysLeft} days (${hoursLeft}h)</span>
                </div>
                <div class="unit-stat">
                    <span class="unit-stat-label">Weekly Contact</span>
                    <span class="unit-stat-value">${weeklyHours}h / week</span>
                </div>
            </div>
            <div class="unit-progress-bar">
                <div class="unit-progress-fill" style="width: ${urgencyPct}%; background: linear-gradient(90deg, ${color}, ${color}80);"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ----------------------------------------
// NAVIGATION
// ----------------------------------------
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;

            // Update active nav
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show view
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            const target = document.getElementById(`view-${view}`);
            if (target) target.classList.add('active');

            // Update title
            const titles = {
                dashboard: ['The Control Room', 'Real-time exam countdown & study allocation'],
                calendar: ['Week Matrix', 'Your weekly class schedule in matrix form'],
                studyplan: ['Study Planner', 'AI-generated study timetable with CAT & exam prep'],
                units: ['Unit Vectors', 'All 7 units — weights, deadlines, and contact hours'],
                progress: ['Progress Tracker', 'Track syllabus coverage subtopic by subtopic'],
                grades: ['Grade Calculator', 'Input CAT scores & see what you need in the Final Exam'],
                revision: ['📚 Revision Hub', 'Key formulas, theorems & exam tips for all 7 units'],
                tasks: ['📋 Task Board', 'Kanban board — drag tasks across To Do · In Progress · Done'],
                flashcards: ['🃏 Flashcards', 'Active recall with spaced repetition ratings'],
                stats: ['📊 Study Stats', 'Streak · Hours studied · Study score & weekly activity'],
                alerts: ['🔔 Notifications', 'Browser alerts for exams, CATs & daily study reminders'],
                groupwork: ['👥 Group Work Tracker', 'Document stages · Slide checklist · Member tasks · Deadlines'],
                resources: ['📖 Resources & Formula Search', 'Textbooks · Video lectures · MIT OCW · Formula finder'],
                attendance: ['📅 Attendance Tracker', 'Mark classes · Stay above 75% for JKUAT CAT eligibility'],
                selftest: ['🧪 Self-Test & Exam Simulation', 'Question bank · Timed exam sessions · Score history'],
                smartnotes: ['📝 Smart Notes Optimizer', 'Import material · Auto-extract key points · Study-ready in seconds'],
                pastpapers: ['📄 Past Papers Vault', 'CAT papers · Revision papers · Optimize & extract questions'],
                focus: ['🎯 Focus Mode', 'Pomodoro timer · Study music · Track your sessions'],
                settings: ['⚙ Settings & Parameters', 'Profile · Study preferences · Data management']
            };
            document.getElementById('page-title').textContent = titles[view]?.[0] || 'Dashboard';
            document.getElementById('page-subtitle').textContent = titles[view]?.[1] || '';
        });
    });
}

// ----------------------------------------
// STUDY PLANNER — TIMETABLE GENERATION
// ----------------------------------------
let studyWeekOffset = 0; // 0 = this week, 1 = next week, etc.

function getWeekDates(offset) {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + (offset * 7));
    monday.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function generateStudyTimetable(weekDates) {
    // Time slots: 7 AM to 10 PM (15 hours)
    const START_HOUR = 7;
    const END_HOUR = 22;
    const LUNCH_HOUR = 13; // 1 PM lunch break
    const DINNER_HOUR = 18; // 6 PM short break

    // Build a 2D grid: grid[dayIndex][hourIndex] = block or null
    const grid = [];
    for (let day = 0; day < 7; day++) {
        const daySlots = [];
        for (let h = START_HOUR; h < END_HOUR; h++) {
            daySlots.push(null); // empty slot
        }
        grid.push(daySlots);
    }

    // Step 1: Place fixed classes
    for (let day = 0; day < 7; day++) {
        const date = weekDates[day];
        const jsDay = date.getDay(); // 0=Sun, 1=Mon, ...
        const classes = state.weeklySchedule[jsDay] || [];

        classes.forEach(c => {
            const startH = parseInt(c.start.split(':')[0]);
            const endH = parseInt(c.end.split(':')[0]);
            for (let h = startH; h < endH; h++) {
                const slotIdx = h - START_HOUR;
                if (slotIdx >= 0 && slotIdx < grid[day].length) {
                    const unit = getUnit(c.unitId);
                    grid[day][slotIdx] = {
                        type: 'class',
                        label: c.title,
                        sub: c.venue,
                        color: unit ? unit.color : '#38bdf8'
                    };
                }
            }
        });
    }

    // Step 2: Place breaks (lunch & dinner)
    for (let day = 0; day < 7; day++) {
        const lunchIdx = LUNCH_HOUR - START_HOUR;
        const dinnerIdx = DINNER_HOUR - START_HOUR;
        if (lunchIdx >= 0 && lunchIdx < grid[day].length && !grid[day][lunchIdx]) {
            grid[day][lunchIdx] = { type: 'break', label: 'Lunch Break', sub: '1:00 PM' };
        }
        if (dinnerIdx >= 0 && dinnerIdx < grid[day].length && !grid[day][dinnerIdx]) {
            grid[day][dinnerIdx] = { type: 'break', label: 'Dinner Break', sub: '6:00 PM' };
        }
    }

    // Step 3: Calculate study priorities for this week
    // Find all deadlines that are upcoming and relevant
    const weekStart = weekDates[0];
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59);

    // Build risk scores — deadlines within 21 days of this week get study time
    const studyTargets = [];
    state.deadlines.forEach(d => {
        const daysFromWeekStart = Math.ceil((d.date - weekStart) / (1000 * 60 * 60 * 24));
        if (daysFromWeekStart < 0) return; // already passed
        if (daysFromWeekStart > 28) return; // too far

        const unit = getUnit(d.unitId);
        const urgency = Math.max(1, daysFromWeekStart);

        // Priority score: higher = more urgent
        let score = (d.weightFactor * unit.weight * 100) / urgency;

        // Boost items happening THIS week
        if (daysFromWeekStart <= 7) score *= 2.5;

        let studyType = 'exam';
        let studyLabel = `📖 ${unit.name}`;
        let studySub = 'Exam Revision';
        if (d.type === 'cat') {
            studyType = 'cat';
            studySub = `CAT Prep — ${d.title}`;
            studyLabel = `📝 ${unit.name}`;
        } else if (d.type === 'assignment') {
            studyType = 'assignment';
            studySub = d.title;
            studyLabel = `📄 ${unit.name}`;
        }

        studyTargets.push({
            unitId: d.unitId,
            unit,
            score,
            type: studyType,
            label: studyLabel,
            sub: studySub,
            daysFromWeekStart,
            deadline: d.date
        });
    });

    // Sort by priority (highest first)
    studyTargets.sort((a, b) => b.score - a.score);

    // Step 4: Fill free slots with study blocks
    // Distribute across the week — each target gets blocks proportional to its score
    const totalScore = studyTargets.reduce((s, t) => s + t.score, 0) || 1;

    // Count free slots
    let totalFree = 0;
    for (let day = 0; day < 7; day++) {
        for (let h = 0; h < grid[day].length; h++) {
            if (!grid[day][h]) totalFree++;
        }
    }

    // Assign blocks to each target
    const assignments = studyTargets.map(t => {
        const ratio = t.score / totalScore;
        let blocks = Math.round(ratio * totalFree);
        blocks = Math.max(1, Math.min(blocks, Math.floor(totalFree * 0.4)));
        return { ...t, blocksNeeded: blocks, blocksPlaced: 0 };
    });

    // PASS 1: Fill priority study blocks
    for (const target of assignments) {
        if (target.blocksPlaced >= target.blocksNeeded) continue;

        const deadlineDayIdx = Math.min(6, Math.max(0, Math.floor((target.deadline - weekStart) / (1000 * 60 * 60 * 24))));

        for (let day = 0; day < 7 && target.blocksPlaced < target.blocksNeeded; day++) {
            if ((target.type === 'cat' || target.type === 'assignment') && day > deadlineDayIdx) continue;

            for (let h = 0; h < grid[day].length && target.blocksPlaced < target.blocksNeeded; h++) {
                if (!grid[day][h]) {
                    grid[day][h] = {
                        type: target.type,
                        label: target.label,
                        sub: target.sub,
                        color: target.unit.color
                    };
                    target.blocksPlaced++;
                }
            }
        }
    }

    // PASS 2: Fill ALL remaining empty slots with round-robin study blocks
    // This ensures no free time is wasted — every slot gets a unit to study
    if (studyTargets.length > 0) {
        let roundIdx = 0;
        for (let day = 0; day < 7; day++) {
            for (let h = 0; h < grid[day].length; h++) {
                if (!grid[day][h]) {
                    const target = studyTargets[roundIdx % studyTargets.length];
                    grid[day][h] = {
                        type: target.type,
                        label: target.label,
                        sub: target.sub,
                        color: target.unit.color
                    };
                    roundIdx++;
                }
            }
        }
    }

    return grid;
}

function renderStudyTimetable() {
    const container = document.getElementById('study-timetable');
    const weekLabel = document.getElementById('sp-week-label');
    if (!container) return;
    container.innerHTML = '';

    // Find the last exam date
    const lastExam = state.deadlines
        .filter(d => d.type === 'exam')
        .sort((a, b) => b.date - a.date)[0];
    const lastExamDate = lastExam ? lastExam.date : new Date();

    // Calculate how many weeks from now to last exam
    const now = new Date();
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - now.getDay() + 1);
    thisMonday.setHours(0, 0, 0, 0);

    const weeksNeeded = Math.ceil((lastExamDate - thisMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;

    if (weekLabel) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        weekLabel.textContent = `Full Plan: ${weeksNeeded} Weeks (Today → ${lastExamDate.getDate()} ${months[lastExamDate.getMonth()]})`;
    }

    const START_HOUR = 7;
    const END_HOUR = 22;
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Build a set of exam dates for highlighting
    const examDateSet = new Set();
    state.deadlines.forEach(d => {
        const ds = new Date(d.date);
        ds.setHours(0, 0, 0, 0);
        examDateSet.add(ds.getTime());
    });

    // Render each week
    for (let w = 0; w < weeksNeeded; w++) {
        const weekDates = getWeekDates(w);
        const grid = generateStudyTimetable(weekDates);

        const ws = weekDates[0];
        const we = weekDates[6];
        const weekTitle = `Week ${w + 1}: ${ws.getDate()} ${months[ws.getMonth()]} – ${we.getDate()} ${months[we.getMonth()]}`;
        const label = w === 0 ? '(This Week)' : w === 1 ? '(Next Week)' : '';

        // Week separator / title
        const separator = document.createElement('div');
        separator.className = 'sp-week-separator';
        separator.innerHTML = `<span class="sp-week-title">${weekTitle}</span><span class="sp-week-tag">${label}</span>`;
        container.appendChild(separator);

        // Create grid for this week
        const weekGrid = document.createElement('div');
        weekGrid.className = 'study-timetable-grid';

        // Header row
        const corner = document.createElement('div');
        corner.className = 'st-header';
        corner.textContent = 'TIME';
        weekGrid.appendChild(corner);

        for (let d = 0; d < 7; d++) {
            const header = document.createElement('div');
            const dateStr = `${weekDates[d].getDate()}/${weekDates[d].getMonth() + 1}`;
            header.className = 'st-header';

            // Highlight today
            if (weekDates[d].getTime() === todayDate.getTime()) {
                header.classList.add('today');
            }

            // Highlight exam days
            const hasExam = examDateSet.has(weekDates[d].getTime());
            if (hasExam) {
                header.classList.add('exam-day');
            }

            header.innerHTML = `${dayLabels[d]}<br><span style="font-size:0.6rem;opacity:0.6">${dateStr}</span>${hasExam ? '<br><span style="font-size:0.55rem;color:#fb7185">📋 EXAM</span>' : ''}`;
            weekGrid.appendChild(header);
        }

        // Data rows
        for (let h = START_HOUR; h < END_HOUR; h++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'st-time';
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            timeCell.textContent = `${h12}:00 ${ampm}`;
            weekGrid.appendChild(timeCell);

            for (let d = 0; d < 7; d++) {
                const cell = document.createElement('div');
                cell.className = 'st-cell';

                const slotIdx = h - START_HOUR;
                const block = grid[d][slotIdx];

                if (block) {
                    const blockEl = document.createElement('div');
                    const typeClass = block.type === 'class' ? 'class-block' :
                                      block.type === 'cat' ? 'cat-block' :
                                      block.type === 'exam' ? 'exam-block' :
                                      block.type === 'assignment' ? 'assignment-block' :
                                      'break-block';
                    blockEl.className = `st-block ${typeClass}`;
                    blockEl.innerHTML = `${block.label}<span class="st-block-sub">${block.sub}</span>`;
                    cell.appendChild(blockEl);
                }

                weekGrid.appendChild(cell);
            }
        }

        container.appendChild(weekGrid);
    }
}

function setupStudyPlannerNav() {
    // Prev/Next now scroll to sections instead
    const prevBtn = document.getElementById('sp-prev');
    const nextBtn = document.getElementById('sp-next');
    if (prevBtn) {
        prevBtn.textContent = '↑ Scroll to Top';
        prevBtn.addEventListener('click', () => {
            document.getElementById('study-timetable')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (nextBtn) {
        nextBtn.textContent = 'Jump to Exam Week ↓';
        nextBtn.addEventListener('click', () => {
            const separators = document.querySelectorAll('.sp-week-separator');
            if (separators.length > 0) {
                separators[separators.length - 1].scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// ----------------------------------------
// ANIMATED MATH BACKGROUND
// ----------------------------------------
function initMathCanvas() {
    const canvas = document.getElementById('mathCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const symbols = ['∑', '∫', '∂', '∇', 'π', '∞', 'Δ', 'λ', 'θ', 'φ', '≈', '√', '∏', 'ε', 'μ', 'σ', '∈', '⊂', '⊗', '⊕'];
    const particles = [];

    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            size: 12 + Math.random() * 20,
            speed: 0.15 + Math.random() * 0.35,
            opacity: 0.03 + Math.random() * 0.08,
            drift: (Math.random() - 0.5) * 0.3
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.02)';
        ctx.lineWidth = 1;
        const gridSize = 80;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw floating symbols
        particles.forEach(p => {
            ctx.font = `${p.size}px 'Space Grotesk', sans-serif`;
            ctx.fillStyle = `rgba(56, 189, 248, ${p.opacity})`;
            ctx.fillText(p.symbol, p.x, p.y);

            p.y -= p.speed;
            p.x += p.drift;

            if (p.y < -30) {
                p.y = canvas.height + 30;
                p.x = Math.random() * canvas.width;
            }
            if (p.x < -30) p.x = canvas.width + 30;
            if (p.x > canvas.width + 30) p.x = -30;
        });

        requestAnimationFrame(draw);
    }

    draw();
}

// ----------------------------------------
// INTERACTIVE SYSTEM
// ----------------------------------------

// Notes storage (persisted in localStorage)
function getNotes() {
    try { return JSON.parse(localStorage.getItem('mathengine_notes') || '{}'); } catch { return {}; }
}
function saveNote(key, text) {
    const notes = getNotes();
    notes[key] = text;
    localStorage.setItem('mathengine_notes', JSON.stringify(notes));
}
function getNote(key) {
    return getNotes()[key] || '';
}

// Toast
function showToast(msg, icon = '✓') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    const iconEl = document.getElementById('toast-icon');
    if (!toast) return;
    msgEl.textContent = msg;
    iconEl.textContent = icon;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Context Menu
function showCtxMenu(e, headerText, items) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('ctx-menu');
    const header = document.getElementById('ctx-menu-header');
    const body = document.getElementById('ctx-menu-body');
    
    header.textContent = headerText;
    body.innerHTML = '';

    items.forEach(item => {
        if (item === 'divider') {
            const div = document.createElement('div');
            div.className = 'ctx-divider';
            body.appendChild(div);
            return;
        }
        const btn = document.createElement('button');
        btn.className = `ctx-item ${item.danger ? 'danger' : ''}`;
        btn.innerHTML = `<span class="ctx-item-icon">${item.icon}</span> ${item.label}`;
        btn.addEventListener('click', () => {
            hideCtxMenu();
            item.action();
        });
        body.appendChild(btn);
    });

    // Position
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - (items.length * 44 + 50));
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('show');
}

function hideCtxMenu() {
    document.getElementById('ctx-menu')?.classList.remove('show');
}

// Modal
function showModal(title, bodyHTML, footerButtons = []) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    footerEl.innerHTML = '';

    footerButtons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = `btn ${b.class || 'btn-secondary'}`;
        btn.textContent = b.label;
        btn.addEventListener('click', () => {
            b.action();
        });
        footerEl.appendChild(btn);
    });

    overlay.classList.add('show');
}

function hideModal() {
    document.getElementById('modal-overlay')?.classList.remove('show');
}

// Study timer
let timerInterval = null;
function startStudyTimer(unitName, minutes = 60) {
    let remaining = minutes * 60;
    
    function updateTimer() {
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').textContent = `${m}:${s}`;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            showToast(`⏰ Time's up! ${unitName} session complete.`, '🎉');
            hideModal();
            return;
        }
        remaining--;
    }

    const bodyHTML = `
        <div style="text-align:center">
            <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.85rem">Focused study session for:</p>
            <h3 style="color:var(--cyan);margin-bottom:24px">${unitName}</h3>
            <div id="timer-display" style="font-family:var(--font-mono);font-size:3.5rem;font-weight:700;color:var(--text-primary);margin-bottom:24px">${minutes}:00</div>
            <p style="color:var(--text-dim);font-size:0.78rem">Stay focused! Close distractions.</p>
        </div>
    `;

    showModal('⏱ Study Timer', bodyHTML, [
        { label: 'Stop & Close', class: 'btn-danger', action: () => { clearInterval(timerInterval); timerInterval = null; hideModal(); } }
    ]);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

// ── Exam item click handler ──
function attachExamInteractions() {
    document.querySelectorAll('.exam-item').forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            const deadline = [...state.deadlines].sort((a, b) => a.date - b.date)[idx];
            if (!deadline) return;
            const unit = getUnit(deadline.unitId);

            showCtxMenu(e, `${unit.name}`, [
                { icon: '📝', label: 'Add / Edit Notes', action: () => openNotesModal(deadline.id, `${unit.name} — ${deadline.title}`) },
                { icon: '✅', label: 'Mark as Studied', action: () => showToast(`Marked "${unit.name}: ${deadline.title}" as studied`, '✅') },
                { icon: '⏱', label: 'Start 60-min Timer', action: () => startStudyTimer(unit.name, 60) },
                { icon: '⏱', label: 'Start 30-min Timer', action: () => startStudyTimer(unit.name, 30) },
                'divider',
                { icon: '📅', label: 'Change Date', action: () => openChangeDateModal(deadline) },
                { icon: '🗑', label: 'Remove Deadline', danger: true, action: () => {
                    state.deadlines = state.deadlines.filter(d => d.id !== deadline.id);
                    refreshAll();
                    showToast(`Removed "${unit.name}: ${deadline.title}"`, '🗑');
                }}
            ]);
        });
    });
}

// ── Allocation card click handler ──
function attachAllocationInteractions() {
    document.querySelectorAll('.alloc-card').forEach((card, idx) => {
        card.addEventListener('click', (e) => {
            const blocks = calculateStudyAllocation();
            const block = blocks[idx];
            if (!block) return;

            showCtxMenu(e, block.unitName, [
                { icon: '▶', label: 'Start Study Timer (1h)', action: () => startStudyTimer(block.unitName, 60) },
                { icon: '⏱', label: 'Start 25-min Pomodoro', action: () => startStudyTimer(block.unitName, 25) },
                { icon: '📝', label: 'Add Notes', action: () => openNotesModal(`alloc_${block.unitId}`, block.unitName) },
                'divider',
                { icon: '✅', label: 'Mark as Done', action: () => { showToast(`"${block.unitName}" session marked complete!`, '✅'); } },
                { icon: '⏭', label: 'Skip This Block', action: () => { showToast(`Skipped "${block.unitName}" block`, '⏭'); } }
            ]);
        });
    });
}

// ── Unit card click handler ──
function attachUnitInteractions() {
    document.querySelectorAll('.unit-card').forEach((card, idx) => {
        card.addEventListener('click', (e) => {
            const unit = state.units[idx];
            if (!unit) return;

            showCtxMenu(e, unit.name, [
                { icon: '📝', label: 'View / Add Notes', action: () => openNotesModal(`unit_${unit.id}`, unit.name) },
                { icon: '⚖', label: 'Change Difficulty Weight', action: () => openWeightModal(unit) },
                { icon: '📅', label: 'Add New Deadline', action: () => openAddDeadlineModal(unit) },
                { icon: '▶', label: 'Start Study Timer', action: () => startStudyTimer(unit.name, 60) },
                'divider',
                { icon: '📊', label: 'View All Deadlines', action: () => openUnitDeadlinesModal(unit) }
            ]);
        });
    });
}

// ── Study timetable block click handler ──
function attachStudyTimetableInteractions() {
    document.querySelectorAll('.st-block').forEach(block => {
        block.addEventListener('click', (e) => {
            const label = block.childNodes[0]?.textContent || 'Block';
            const sub = block.querySelector('.st-block-sub')?.textContent || '';
            
            showCtxMenu(e, label.trim(), [
                { icon: '▶', label: 'Start Study Timer', action: () => startStudyTimer(label.trim(), 60) },
                { icon: '⏱', label: 'Quick 25-min Session', action: () => startStudyTimer(label.trim(), 25) },
                { icon: '📝', label: 'Add Notes', action: () => openNotesModal(`study_${label.trim()}`, label.trim()) },
                { icon: '✅', label: 'Mark Complete', action: () => {
                    block.style.opacity = '0.4';
                    block.style.textDecoration = 'line-through';
                    showToast(`Completed: ${label.trim()}`, '✅');
                }}
            ]);
        });
    });
}

// ── Modal: Notes ──
function openNotesModal(key, title) {
    const existing = getNote(key);
    showModal(`📝 Notes: ${title}`, `
        <div class="form-group">
            <label class="form-label">Your notes</label>
            <textarea class="form-textarea" id="note-input" rows="5" placeholder="Type your notes here...">${existing}</textarea>
        </div>
    `, [
        { label: 'Cancel', class: 'btn-secondary', action: hideModal },
        { label: 'Save Notes', class: 'btn-primary', action: () => {
            const text = document.getElementById('note-input').value;
            saveNote(key, text);
            hideModal();
            showToast('Notes saved!', '📝');
        }}
    ]);
}

// ── Modal: Change Date ──
function openChangeDateModal(deadline) {
    const unit = getUnit(deadline.unitId);
    const isoDate = deadline.date.toISOString().slice(0, 16);
    showModal(`📅 Reschedule: ${unit.name}`, `
        <div class="form-group">
            <label class="form-label">Event: ${deadline.title}</label>
        </div>
        <div class="form-group">
            <label class="form-label">New Date & Time</label>
            <input type="datetime-local" class="form-input" id="new-date-input" value="${isoDate}">
        </div>
    `, [
        { label: 'Cancel', class: 'btn-secondary', action: hideModal },
        { label: 'Update Date', class: 'btn-primary', action: () => {
            const newDate = document.getElementById('new-date-input').value;
            if (newDate) {
                deadline.date = new Date(newDate);
                hideModal();
                refreshAll();
                showToast(`Date updated for ${unit.name}!`, '📅');
            }
        }}
    ]);
}

// ── Modal: Change Weight ──
function openWeightModal(unit) {
    showModal(`⚖ Difficulty: ${unit.name}`, `
        <div class="form-group">
            <label class="form-label">Current weight: ${unit.weight.toFixed(1)}</label>
        </div>
        <div class="form-group">
            <label class="form-label">New difficulty weight (0.5 = Easy, 1.0 = Normal, 1.5 = Hard, 2.0 = Very Hard)</label>
            <select class="form-select" id="weight-input">
                <option value="0.5" ${unit.weight === 0.5 ? 'selected' : ''}>0.5 — Easy</option>
                <option value="0.8" ${unit.weight === 0.8 ? 'selected' : ''}>0.8 — Below Average</option>
                <option value="1.0" ${unit.weight === 1.0 ? 'selected' : ''}>1.0 — Normal</option>
                <option value="1.2" ${unit.weight === 1.2 ? 'selected' : ''}>1.2 — Above Average</option>
                <option value="1.5" ${unit.weight === 1.5 ? 'selected' : ''}>1.5 — Hard</option>
                <option value="2.0" ${unit.weight === 2.0 ? 'selected' : ''}>2.0 — Very Hard</option>
            </select>
        </div>
    `, [
        { label: 'Cancel', class: 'btn-secondary', action: hideModal },
        { label: 'Save', class: 'btn-primary', action: () => {
            unit.weight = parseFloat(document.getElementById('weight-input').value);
            hideModal();
            refreshAll();
            showToast(`Weight updated for ${unit.name}!`, '⚖');
        }}
    ]);
}

// ── Modal: Add Deadline ──
function openAddDeadlineModal(unit) {
    showModal(`📅 Add Deadline: ${unit.name}`, `
        <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="dl-type">
                <option value="cat">CAT</option>
                <option value="exam">Final Exam</option>
                <option value="assignment">Assignment</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" id="dl-title" placeholder="e.g. CAT 3, Assignment 1...">
        </div>
        <div class="form-group">
            <label class="form-label">Date & Time</label>
            <input type="datetime-local" class="form-input" id="dl-date">
        </div>
    `, [
        { label: 'Cancel', class: 'btn-secondary', action: hideModal },
        { label: 'Add Deadline', class: 'btn-primary', action: () => {
            const type = document.getElementById('dl-type').value;
            const title = document.getElementById('dl-title').value || 'New Deadline';
            const date = document.getElementById('dl-date').value;
            if (!date) { showToast('Please select a date!', '⚠'); return; }
            
            const weightFactors = { cat: 0.2, exam: 0.7, assignment: 0.1 };
            state.deadlines.push({
                id: 'NEW_' + Date.now(),
                unitId: unit.id,
                title,
                date: new Date(date),
                weightFactor: weightFactors[type] || 0.2,
                type
            });
            hideModal();
            refreshAll();
            showToast(`Added "${title}" for ${unit.name}!`, '📅');
        }}
    ]);
}

// ── Modal: View All Deadlines for a Unit ──
function openUnitDeadlinesModal(unit) {
    const unitDeadlines = state.deadlines.filter(d => d.unitId === unit.id).sort((a, b) => a.date - b.date);
    let html = '';
    if (unitDeadlines.length === 0) {
        html = '<p style="color:var(--text-dim)">No deadlines set for this unit.</p>';
    } else {
        html = '<div style="display:flex;flex-direction:column;gap:10px">';
        unitDeadlines.forEach(d => {
            const days = getDaysUntil(d.date);
            const typeColors = { exam: '#fb7185', cat: '#fbbf24', assignment: '#a78bfa' };
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-deep);border-radius:8px;border:1px solid var(--glass-border)">
                <div>
                    <div style="font-weight:600;font-size:0.9rem">${d.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);font-family:var(--font-mono)">${formatDate(d.date)}</div>
                </div>
                <div style="text-align:right">
                    <span style="font-family:var(--font-mono);font-weight:700;color:${typeColors[d.type] || '#38bdf8'}">${days}d</span>
                    <span style="font-size:0.6rem;display:block;color:var(--text-dim);text-transform:uppercase">${d.type}</span>
                </div>
            </div>`;
        });
        html += '</div>';
    }
    showModal(`📊 ${unit.name} — Deadlines`, html, [
        { label: 'Close', class: 'btn-secondary', action: hideModal }
    ]);
}

// ── Refresh all rendered components ──
function refreshAll() {
    renderMetrics();
    renderExams();
    renderSchedule();
    renderAllocation();
    renderWeekMatrix();
    renderUnitCards();
    renderStudyTimetable();
    // Re-attach interactions after re-render
    setTimeout(attachAllInteractions, 50);
}

function attachAllInteractions() {
    attachExamInteractions();
    attachAllocationInteractions();
    attachUnitInteractions();
    attachStudyTimetableInteractions();
}

// Global: close context menu on outside click
document.addEventListener('click', (e) => {
    const menu = document.getElementById('ctx-menu');
    if (menu && !menu.contains(e.target)) hideCtxMenu();
});

// Global: close modal on overlay click or close button
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') hideModal();
});

// Close button
document.getElementById('modal-close')?.addEventListener('click', hideModal);

// ----------------------------------------
// SUBTOPIC DATA (per unit)
// ----------------------------------------
const unitSubtopics = {
    U1: [ // Linear Algebra
        'Vector Spaces & Subspaces', 'Linear Independence & Basis', 'Linear Transformations',
        'Matrix Representation of Linear Maps', 'Eigenvalues & Eigenvectors',
        'Diagonalisation', 'Inner Product Spaces', 'Gram-Schmidt Orthogonalisation',
        'Spectral Theorem', 'Jordan Normal Form', 'Singular Value Decomposition'
    ],
    U2: [ // Research Methodology
        'Research Design & Types', 'Literature Review Techniques', 'Quantitative Methods',
        'Qualitative Methods', 'Sampling Techniques', 'Data Collection Methods',
        'Validity & Reliability', 'Hypothesis Testing in Research', 'Research Ethics',
        'Scientific Report Writing', 'Citation & Referencing (APA/IEEE)'
    ],
    U3: [ // Complex Variables
        'Complex Numbers & Geometry', 'Analytic Functions (Cauchy-Riemann)', 'Elementary Functions',
        'Complex Integration', 'Cauchy\'s Theorem & Integral Formula', 'Taylor & Laurent Series',
        'Isolated Singularities', 'Residue Theorem', 'Contour Integration Applications',
        'Conformal Mappings', 'Mobius Transformations'
    ],
    U4: [ // Abstract Integration
        'σ-Algebras & Measurable Spaces', 'Measures & Measure Spaces', 'Lebesgue Measure',
        'Measurable Functions', 'Lebesgue Integral', 'Convergence Theorems (MCT, DCT)',
        'Lp Spaces', 'Radon-Nikodym Theorem', 'Product Measures & Fubini\'s Theorem',
        'Modes of Convergence', 'Fourier Transform in L² Context'
    ],
    U5: [ // Non-Linear Optimization
        'Unconstrained Optimization (1D)', 'Multivariable Unconstrained Optimization',
        'Gradient Descent & Variants', 'Newton & Quasi-Newton Methods',
        'Constrained Optimization — Equality Constraints', 'KKT Conditions',
        'Lagrangian Methods', 'Convex Sets & Functions', 'Convex Optimization Problems',
        'Interior Point Methods', 'Global vs Local Optima'
    ],
    U6: [ // Fluid Dynamics
        'Fluid Properties & Kinematics', 'Continuity Equation', 'Euler Equations',
        'Navier-Stokes Equations', 'Bernoulli\'s Equation & Applications',
        'Potential Flow Theory', 'Vorticity & Circulation', 'Boundary Layer Theory',
        'Dimensional Analysis & Similarity', 'Turbulence Introduction', 'Wave Equations in Fluids'
    ],
    U7: [ // Regression Modelling
        'Simple Linear Regression', 'Multiple Linear Regression', 'OLS Estimation & Properties',
        'Model Diagnostics & Residuals', 'Hypothesis Tests in Regression',
        'Multicollinearity & VIF', 'Polynomial & Interaction Terms',
        'Logistic Regression', 'Poisson & Count Data Regression',
        'Model Selection (AIC, BIC, R²)', 'Cross-Validation & Overfitting'
    ]
};

// ----------------------------------------
// PROGRESS TRACKER
// ----------------------------------------
function getProgressData() {
    try { return JSON.parse(localStorage.getItem('mathengine_progress') || '{}'); }
    catch { return {}; }
}

function saveProgressData(data) {
    localStorage.setItem('mathengine_progress', JSON.stringify(data));
}

function renderProgressTracker() {
    const container = document.getElementById('progress-units');
    const overallBar = document.getElementById('overall-bar');
    const overallPct = document.getElementById('overall-pct');
    if (!container) return;

    const progressData = getProgressData();
    container.innerHTML = '';

    let totalTopics = 0, totalDone = 0;

    state.units.forEach(unit => {
        const topics = unitSubtopics[unit.id] || [];
        const doneTopic = topics.filter(t => progressData[`${unit.id}_${t}`]);
        totalTopics += topics.length;
        totalDone += doneTopic.length;
        const pct = topics.length ? Math.round((doneTopic.length / topics.length) * 100) : 0;

        const card = document.createElement('div');
        card.className = 'pu-card';

        card.innerHTML = `
            <div class="pu-header">
                <div class="pu-header-left">
                    <span class="pu-color-dot" style="background:${unit.color}"></span>
                    <div>
                        <div class="pu-name">${unit.name}</div>
                        <div class="pu-code">${doneTopic.length}/${topics.length} topics done</div>
                    </div>
                </div>
                <div class="pu-bar-wrap">
                    <div class="pu-bar" style="background:${unit.color};width:${pct}%"></div>
                </div>
                <div class="pu-pct" style="color:${unit.color}">${pct}%</div>
                <span class="pu-chevron">▶</span>
            </div>
            <div class="pu-subtopics">
                <div class="subtopic-list" id="subtopics-${unit.id}"></div>
            </div>
        `;

        // Toggle open/close
        card.querySelector('.pu-header').addEventListener('click', () => {
            card.classList.toggle('open');
        });

        container.appendChild(card);

        // Render subtopics
        const subList = card.querySelector(`#subtopics-${unit.id}`);
        topics.forEach(topic => {
            const key = `${unit.id}_${topic}`;
            const isDone = !!progressData[key];
            const item = document.createElement('div');
            item.className = `subtopic-item ${isDone ? 'done' : ''}`;
            item.innerHTML = `
                <div class="subtopic-checkbox">${isDone ? '✓' : ''}</div>
                <span class="subtopic-label">${topic}</span>
            `;
            item.addEventListener('click', () => {
                const current = getProgressData();
                current[key] = !current[key];
                saveProgressData(current);
                renderProgressTracker(); // re-render
            });
            subList.appendChild(item);
        });
    });

    // Overall bar
    const overallPctVal = totalTopics ? Math.round((totalDone / totalTopics) * 100) : 0;
    if (overallBar) overallBar.style.width = overallPctVal + '%';
    if (overallPct) overallPct.textContent = overallPctVal + '%';
}

// ----------------------------------------
// GRADE CALCULATOR
// ----------------------------------------
// Grading scheme: CATs 2×30 = 60 marks → contribute 30% of total
//                 Final exam out of 70 marks → contributes 70% of total
// Total = (cat_total/60)*30 + (final/70)*70
const GRADE_BANDS = [
    { label: 'A (Distinction)', min: 70, max: 100, bandClass: 'band-a', color: '#34d399' },
    { label: 'B (Credit)',      min: 60, max: 69,  bandClass: 'band-b', color: '#38bdf8' },
    { label: 'C (Pass)',        min: 50, max: 59,  bandClass: 'band-c', color: '#fbbf24' },
    { label: 'D (Borderline)', min: 40, max: 49,  bandClass: 'band-d', color: '#a78bfa' },
    { label: 'E (Fail)',       min: 0,  max: 39,  bandClass: 'band-e', color: '#fb7185' },
];

function getCATData() {
    try { return JSON.parse(localStorage.getItem('mathengine_cats') || '{}'); }
    catch { return {}; }
}

function saveCATData(data) {
    localStorage.setItem('mathengine_cats', JSON.stringify(data));
}

function calcNeededInFinal(catTotal, targetTotal) {
    // catTotal: marks out of 60
    // CATs contribute 30%: catContrib = (catTotal/60)*30
    // Final contributes 70%: finalContrib = (finalScore/70)*70 = finalScore
    // Target = catContrib + finalContrib
    // finalScore = targetTotal - catContrib
    const catContrib = (catTotal / 60) * 30;
    const finalNeeded = targetTotal - catContrib;
    return Math.ceil(finalNeeded);
}

function renderGradeCalculator() {
    const container = document.getElementById('grade-grid');
    if (!container) return;
    container.innerHTML = '';
    const catData = getCATData();

    state.units.forEach(unit => {
        const cat1Key = `${unit.id}_cat1`;
        const cat2Key = `${unit.id}_cat2`;
        const cat1 = catData[cat1Key] ?? '';
        const cat2 = catData[cat2Key] ?? '';

        const card = document.createElement('div');
        card.className = 'grade-card';

        card.innerHTML = `
            <div class="grade-card-header">
                <span class="grade-card-color" style="background:${unit.color}"></span>
                <span class="grade-card-name">${unit.name}</span>
                <span class="grade-card-code">${unit.code || ''}</span>
            </div>
            <div class="grade-card-body">
                <div class="grade-inputs">
                    <div class="gi-row">
                        <span class="gi-label">CAT 1 Score</span>
                        <input type="number" class="gi-input" id="cat1-${unit.id}" min="0" max="30" value="${cat1}" placeholder="—">
                        <span class="gi-max">/ 30</span>
                    </div>
                    <div class="gi-row">
                        <span class="gi-label">CAT 2 Score</span>
                        <input type="number" class="gi-input" id="cat2-${unit.id}" min="0" max="30" value="${cat2}" placeholder="—">
                        <span class="gi-max">/ 30</span>
                    </div>
                    <div class="cat-summary" id="cat-summary-${unit.id}">
                        <span class="cat-summary-label">Total CAT Score:</span>
                        <span class="cat-summary-value" id="cat-total-${unit.id}">—</span>
                        <span class="cat-summary-contrib" id="cat-contrib-${unit.id}"></span>
                    </div>
                </div>
                <div class="grade-results" id="grade-results-${unit.id}">
                    <div style="color:var(--text-dim);font-size:0.82rem;font-style:italic">Enter your CAT scores to see required final marks →</div>
                </div>
            </div>
        `;

        container.appendChild(card);

        // Wire up live calculation
        const inp1 = card.querySelector(`#cat1-${unit.id}`);
        const inp2 = card.querySelector(`#cat2-${unit.id}`);

        function recalculate() {
            const v1 = parseFloat(inp1.value);
            const v2 = parseFloat(inp2.value);

            // Save to localStorage
            const data = getCATData();
            if (!isNaN(v1)) data[cat1Key] = v1;
            if (!isNaN(v2)) data[cat2Key] = v2;
            saveCATData(data);

            const catTotal = (isNaN(v1) ? 0 : v1) + (isNaN(v2) ? 0 : v2);
            const hasData = !isNaN(v1) || !isNaN(v2);

            // Update summary
            const totalEl = card.querySelector(`#cat-total-${unit.id}`);
            const contribEl = card.querySelector(`#cat-contrib-${unit.id}`);
            const catContrib = (catTotal / 60) * 30;
            totalEl.textContent = `${catTotal}/60`;
            contribEl.textContent = `→ ${catContrib.toFixed(1)}% of final grade`;

            // Render grade rows
            const resultsEl = card.querySelector(`#grade-results-${unit.id}`);
            if (!hasData) {
                resultsEl.innerHTML = '<div style="color:var(--text-dim);font-size:0.82rem;font-style:italic">Enter your CAT scores to see required final marks →</div>';
                return;
            }

            resultsEl.innerHTML = '';

            GRADE_BANDS.forEach(band => {
                const neededForMax = calcNeededInFinal(catTotal, band.max);
                const neededForMin = calcNeededInFinal(catTotal, band.min);
                // Show what you need to REACH this grade band (the minimum)
                const needed = Math.max(0, neededForMin);
                const impossible = needed > 70;
                const alreadyAchieved = calcNeededInFinal(catTotal, band.max) <= 0;

                const barPct = impossible ? 100 : Math.min(100, Math.round((needed / 70) * 100));
                let statusText = `${needed}/70`;
                let statusColor = band.color;
                let statusLabel = '';

                if (alreadyAchieved) {
                    statusText = '✓ Secured';
                    statusColor = '#34d399';
                    statusLabel = 'Achieved!';
                } else if (impossible) {
                    statusLabel = 'Not Possible';
                    statusColor = '#475569';
                } else {
                    statusLabel = needed <= 35 ? '✓ Feasible' : needed <= 55 ? '⚡ Challenging' : '🔥 Very Hard';
                }

                const row = document.createElement('div');
                row.className = 'grade-result-row';
                row.innerHTML = `
                    <span class="gr-grade-label">${band.label}</span>
                    <div class="gr-bar-wrap"><div class="gr-bar" style="width:${barPct}%;background:${impossible ? '#334155' : band.color}"></div></div>
                    <span class="gr-needed" style="color:${statusColor}">${impossible ? 'Impossible' : alreadyAchieved ? '✓ Done' : needed + '/70'}</span>
                    <span class="gr-status" style="color:${statusColor}">${statusLabel}</span>
                `;
                resultsEl.appendChild(row);
            });
        }

        inp1.addEventListener('input', recalculate);
        inp2.addEventListener('input', recalculate);

        // Trigger if values already exist
        if (cat1 !== '' || cat2 !== '') recalculate();
    });
}

// ----------------------------------------
// INITIALIZATION
// ----------------------------------------
function init() {
    initMathCanvas();
    setupNavigation();
    setupStudyPlannerNav();
    renderClock();
    setInterval(renderClock, 1000);
    renderMetrics();
    renderExams();
    renderSchedule();
    renderAllocation();
    renderWeekMatrix();
    renderUnitCards();
    renderStudyTimetable();
    renderProgressTracker();
    renderGradeCalculator();
    renderRevisionHub();
    setTimeout(attachAllInteractions, 100);
}

document.addEventListener('DOMContentLoaded', init);

// ----------------------------------------
// REVISION HUB DATA & RENDERER
// ----------------------------------------
const revisionData = {
    U1: {
        formulas: [
            { title: 'Characteristic Equation', expr: 'det(A − λI) = 0' },
            { title: 'Eigenvalue Equation', expr: 'Av = λv' },
            { title: 'Gram-Schmidt (Step k)', expr: 'uₖ = vₖ − Σᵢ₌₁ᵏ⁻¹ (⟨vₖ,uᵢ⟩/⟨uᵢ,uᵢ⟩)uᵢ' },
            { title: 'Rank-Nullity Theorem', expr: 'rank(T) + nullity(T) = dim(V)' },
            { title: 'SVD Decomposition', expr: 'A = UΣVᵀ' },
            { title: 'Diagonalisation', expr: 'A = PDP⁻¹,  D = diag(λ₁,...,λₙ)' },
        ],
        theorems: [
            { name: 'Spectral Theorem', statement: 'Every real symmetric matrix A is orthogonally diagonalisable: A = QDQᵀ where Q is orthogonal and D is diagonal with real eigenvalues.' },
            { name: 'Cayley-Hamilton', statement: 'Every square matrix A satisfies its own characteristic polynomial: p(A) = 0, where p(λ) = det(A − λI).' },
            { name: 'Dimension Theorem', statement: 'For a linear map T: V → W, dim(ker T) + dim(Im T) = dim(V).' },
        ],
        tips: [
            '⚡ To diagonalise A: find eigenvalues from det(A−λI)=0, then find eigenvectors for each λ, then form P from eigenvectors.',
            '⚡ If A is symmetric, eigenvectors for distinct eigenvalues are always orthogonal — use this shortcut!',
            '⚡ For the exam: know how to apply Gram-Schmidt to 2–3 vectors step by step.',
        ]
    },
    U2: {
        formulas: [
            { title: 'Sample Mean', expr: 'x̄ = (1/n) Σxᵢ' },
            { title: 'Standard Deviation', expr: 's = √[(1/(n-1)) Σ(xᵢ - x̄)²]' },
            { title: 'Confidence Interval (known σ)', expr: 'x̄ ± z_(α/2) · σ/√n' },
            { title: 'Chi-Square Test Statistic', expr: 'χ² = Σ (O - E)²/E' },
            { title: 'p-value Decision Rule', expr: 'Reject H₀ if p-value < α (usually 0.05)' },
        ],
        theorems: [
            { name: 'Central Limit Theorem', statement: 'For large n, the sample mean x̄ is approximately normally distributed: x̄ ~ N(μ, σ²/n), regardless of the population distribution.' },
            { name: 'Law of Large Numbers', statement: 'As n → ∞, the sample mean x̄ converges in probability to the true population mean μ.' },
        ],
        tips: [
            '⚡ Know the difference between Type I error (false positive, α) and Type II error (false negative, β).',
            '⚡ In report writing: IMRAD structure (Introduction, Methods, Results, Discussion).',
            '⚡ APA citation: Author (Year). Title. Journal, Volume(Issue), Pages. DOI.',
        ]
    },
    U3: {
        formulas: [
            { title: 'Cauchy-Riemann Equations', expr: '∂u/∂x = ∂v/∂y,  ∂u/∂y = −∂v/∂x' },
            { title: 'Cauchy Integral Formula', expr: 'f(z₀) = (1/2πi) ∮_γ f(z)/(z−z₀) dz' },
            { title: 'Residue Theorem', expr: '∮_γ f(z) dz = 2πi Σ Res(f, zₖ)' },
            { title: 'Residue at Simple Pole', expr: 'Res(f, z₀) = lim_{z→z₀} (z−z₀)f(z)' },
            { title: 'Laurent Series', expr: 'f(z) = Σ_{n=-∞}^{∞} aₙ(z−z₀)ⁿ' },
            { title: "Taylor Series of e^z", expr: 'eᶻ = Σ_{n=0}^{∞} zⁿ/n!' },
        ],
        theorems: [
            { name: "Cauchy's Theorem", statement: 'If f is analytic on and inside a simple closed contour γ, then ∮_γ f(z) dz = 0.' },
            { name: 'Liouville\'s Theorem', statement: 'Every bounded entire function is constant.' },
            { name: 'Fundamental Theorem of Algebra', statement: 'Every non-constant polynomial with complex coefficients has at least one complex root.' },
        ],
        tips: [
            '⚡ To evaluate real integrals using residues: close the contour in the upper half-plane, include only poles with Im(z) > 0.',
            '⚡ A function is analytic at z₀ iff it is differentiable in a neighbourhood of z₀ (not just at z₀).',
            '⚡ Essential singularity: Laurent series has infinitely many negative powers. Pole of order m: finite number. Removable: no negative powers.',
        ]
    },
    U4: {
        formulas: [
            { title: 'Lebesgue Integral', expr: '∫f dμ = sup{∫s dμ : 0 ≤ s ≤ f, s simple}' },
            { title: 'Markov\'s Inequality', expr: 'μ({x : f(x) ≥ λ}) ≤ (1/λ) ∫f dμ' },
            { title: 'Lp Norm', expr: '‖f‖_p = (∫|f|^p dμ)^(1/p)' },
            { title: 'Hölder\'s Inequality', expr: '∫|fg| dμ ≤ ‖f‖_p · ‖g‖_q,  1/p + 1/q = 1' },
            { title: "Radon-Nikodym", expr: 'dν/dμ = h,  i.e. ν(E) = ∫_E h dμ' },
        ],
        theorems: [
            { name: 'Monotone Convergence Theorem', statement: 'If 0 ≤ f₁ ≤ f₂ ≤ ... and fₙ → f pointwise a.e., then ∫fₙ dμ → ∫f dμ.' },
            { name: 'Dominated Convergence Theorem', statement: 'If |fₙ| ≤ g with g integrable, and fₙ → f a.e., then ∫fₙ dμ → ∫f dμ.' },
            { name: "Fubini's Theorem", statement: 'For non-negative measurable f on X×Y: ∫_{X×Y} f d(μ×ν) = ∫_X (∫_Y f dν) dμ = ∫_Y (∫_X f dμ) dν.' },
        ],
        tips: [
            '⚡ Every Riemann integrable function on [a,b] is Lebesgue integrable and the values agree.',
            '⚡ To prove a function is measurable: show pre-images of open sets are measurable.',
            '⚡ A.e. (almost everywhere) = except on a set of measure zero. Key concept for all convergence theorems!',
        ]
    },
    U5: {
        formulas: [
            { title: 'Gradient (Necessary Condition)', expr: '∇f(x*) = 0' },
            { title: 'Hessian (2nd Order Check)', expr: 'H = [∂²f/∂xᵢ∂xⱼ],  H ≻ 0 ⟹ local min' },
            { title: 'Gradient Descent Update', expr: 'xₖ₊₁ = xₖ − αₖ ∇f(xₖ)' },
            { title: 'Lagrangian', expr: 'L(x,λ) = f(x) + Σ λᵢgᵢ(x)' },
            { title: 'KKT Conditions', expr: '∇f + Σλᵢ∇gᵢ = 0,  λᵢgᵢ = 0,  λᵢ ≥ 0,  gᵢ ≤ 0' },
            { title: 'Newton\'s Method', expr: 'xₖ₊₁ = xₖ − [H(xₖ)]⁻¹ ∇f(xₖ)' },
        ],
        theorems: [
            { name: 'Weierstrass Existence Theorem', statement: 'A continuous function on a compact set attains its minimum and maximum.' },
            { name: 'Convex Optimality', statement: 'For a convex function f on a convex set, every local minimum is a global minimum.' },
            { name: 'KKT Necessary Conditions', statement: 'At a local minimum x* of f subject to gᵢ(x) ≤ 0, under constraint qualification, ∃ λ ≥ 0 satisfying KKT.' },
        ],
        tips: [
            '⚡ If H(x*) is positive definite → local minimum. Negative definite → local maximum. Indefinite → saddle point.',
            '⚡ For constrained problems: always check constraint qualification (LICQ or MFCQ) before applying KKT.',
            '⚡ Complementary slackness: λᵢgᵢ(x*) = 0 — either the constraint is active (gᵢ = 0) or the multiplier is zero (λᵢ = 0).',
        ]
    },
    U6: {
        formulas: [
            { title: 'Continuity Equation', expr: '∂ρ/∂t + ∇·(ρu) = 0' },
            { title: 'Euler Equations', expr: 'ρ(Du/Dt) = −∇p + ρf' },
            { title: 'Navier-Stokes (incompressible)', expr: 'ρ(∂u/∂t + u·∇u) = −∇p + μ∇²u' },
            { title: 'Bernoulli\'s Equation', expr: 'p + ½ρv² + ρgz = constant' },
            { title: 'Vorticity', expr: 'ω = ∇ × u' },
            { title: 'Reynolds Number', expr: 'Re = ρvL/μ = vL/ν' },
        ],
        theorems: [
            { name: 'Kelvin Circulation Theorem', statement: 'For an ideal barotropic fluid with conservative body forces, the circulation around a closed material loop is constant in time: DΓ/Dt = 0.' },
            { name: 'Helmholtz Vortex Theorems', statement: '(1) Fluid particles on a vortex line remain on it. (2) Strength of a vortex tube is constant along its length. (3) A vortex tube cannot end within a fluid.' },
        ],
        tips: [
            '⚡ Group Work key topics: write clearly, state assumptions, cite Navier-Stokes derivation steps.',
            '⚡ Bernoulli applies only along a streamline for steady, inviscid, incompressible flow.',
            '⚡ Re < 2300: laminar flow. Re > 4000: turbulent flow. 2300–4000: transitional.',
        ]
    },
    U7: {
        formulas: [
            { title: 'OLS Estimator', expr: 'β̂ = (XᵀX)⁻¹Xᵀy' },
            { title: 'R-squared', expr: 'R² = 1 − SSres/SStot = 1 − Σ(yᵢ−ŷᵢ)²/Σ(yᵢ−ȳ)²' },
            { title: 'F-statistic', expr: 'F = (R²/k) / [(1−R²)/(n−k−1)]' },
            { title: 'Logistic Regression', expr: 'log[p/(1−p)] = β₀ + β₁x₁ + ... + βₖxₖ' },
            { title: 'AIC', expr: 'AIC = 2k − 2ln(L̂)' },
            { title: 'VIF (Multicollinearity)', expr: 'VIF_j = 1/(1 − R²_j)' },
        ],
        theorems: [
            { name: 'Gauss-Markov Theorem', statement: 'Under the classical linear regression assumptions, OLS estimator β̂ is the Best Linear Unbiased Estimator (BLUE) — minimum variance among all linear unbiased estimators.' },
            { name: 'Frisch-Waugh-Lovell', statement: 'The OLS estimator of a subset of coefficients in a multiple regression equals the OLS estimator in a regression of the residuals of y on the residuals of X, after partialling out the other regressors.' },
        ],
        tips: [
            '⚡ Always check regression assumptions: linearity, homoscedasticity, independence, normality of errors (LINE).',
            '⚡ VIF > 10 indicates serious multicollinearity. VIF > 5 is worth investigating.',
            '⚡ For model selection: lower AIC/BIC = better. Adjusted R² penalises extra variables unlike plain R².',
        ]
    }
};

// Update nav titles to include revision
(function patchNavTitles() {
    const origSetupNav = setupNavigation;
})();

function renderRevisionHub() {
    const container = document.getElementById('rev-units');
    if (!container) return;
    container.innerHTML = '';

    state.units.forEach(unit => {
        const data = revisionData[unit.id];
        if (!data) return;

        const card = document.createElement('div');
        card.className = 'rev-card';

        card.innerHTML = `
            <div class="rev-card-header">
                <div class="rev-card-color" style="background:${unit.color}"></div>
                <div class="rev-card-title">
                    <div class="rev-card-name">${unit.name}</div>
                    <div class="rev-card-meta">${data.formulas.length} formulas · ${data.theorems.length} theorems · ${data.tips.length} exam tips</div>
                </div>
                <div class="rev-card-tags">
                    <span class="rev-tag formulas">Formulas</span>
                    <span class="rev-tag theorems">Theorems</span>
                    <span class="rev-tag tips">Tips</span>
                </div>
                <span class="rev-chevron">▶</span>
            </div>
            <div class="rev-card-body">
                <div class="rev-tabs">
                    <button class="rev-tab active" data-panel="formulas-${unit.id}">📐 Key Formulas</button>
                    <button class="rev-tab" data-panel="theorems-${unit.id}">📖 Theorems</button>
                    <button class="rev-tab" data-panel="tips-${unit.id}">💡 Exam Tips</button>
                </div>

                <div class="rev-panel active" id="formulas-${unit.id}">
                    ${data.formulas.map(f => `
                        <div class="formula-block">
                            <div class="formula-title">${f.title}</div>
                            <div class="formula-expr">${f.expr}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="rev-panel" id="theorems-${unit.id}">
                    ${data.theorems.map(t => `
                        <div class="theorem-block">
                            <div class="theorem-name">${t.name}</div>
                            <div class="theorem-statement">${t.statement}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="rev-panel" id="tips-${unit.id}">
                    ${data.tips.map(tip => `
                        <div class="tip-block">
                            <span class="tip-icon">💡</span>
                            <span class="tip-text">${tip}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Toggle card
        card.querySelector('.rev-card-header').addEventListener('click', () => {
            card.classList.toggle('open');
        });

        // Tab switching
        card.querySelectorAll('.rev-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const panelId = tab.dataset.panel;
                card.querySelectorAll('.rev-tab').forEach(t => t.classList.remove('active'));
                card.querySelectorAll('.rev-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                card.querySelector(`#${panelId}`)?.classList.add('active');
            });
        });

        container.appendChild(card);
    });
}
