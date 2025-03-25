// State Management
const state = {
    fasting: false,
    paused: false,
    startTime: null,
    endTime: null,
    interval: null,
    streak: localStorage.getItem('fastingStreak') || 0,
    weightBefore: null,
    weightAfter: null,
    waterIntake: 0,
    energyLevel: null,
    journalEntries: [],
    history: JSON.parse(localStorage.getItem('fastingHistory')) || []
};

// DOM Elements
const elements = {
    protocolSelect: document.getElementById('protocol'),
    customHours: document.getElementById('custom-hours'),
    timerDisplay: document.getElementById('timer'),
    progressBar: document.getElementById('progress'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    endBtn: document.getElementById('end-btn'),
    weightBefore: document.getElementById('weight-before'),
    weightAfter: document.getElementById('weight-after'),
    waterCount: document.getElementById('water-count'),
    waterPlus: document.getElementById('water-plus'),
    waterMinus: document.getElementById('water-minus'),
    journalEntry: document.getElementById('journal-entry'),
    saveJournal: document.getElementById('save-journal'),
    historyTable: document.querySelector('#history-table tbody'),
    streakCount: document.getElementById('streak-count')
};

// Initialize App
function init() {
    setupEventListeners();
    updateStreak();
    loadHistory();
}

// Event Listeners
function setupEventListeners() {
    // Protocol Selection
    elements.protocolSelect.addEventListener('change', handleProtocolChange);
    
    // Timer Controls
    elements.startBtn.addEventListener('click', startFasting);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.endBtn.addEventListener('click', endFasting);
    
    // Water Tracker
    elements.waterPlus.addEventListener('click', () => updateWater(250));
    elements.waterMinus.addEventListener('click', () => updateWater(-250));
    
    // Energy Levels
    document.querySelectorAll('.energy-levels span').forEach(btn => {
        btn.addEventListener('click', () => setEnergyLevel(parseInt(btn.dataset.level)));
    });
    
    // Journal
    elements.saveJournal.addEventListener('click', saveJournalEntry);
}

function handleProtocolChange() {
    const showCustom = elements.protocolSelect.value === 'custom';
    elements.customHours.style.display = showCustom ? 'block' : 'none';
}

// Timer Functions
function startFasting() {
    const hours = elements.protocolSelect.value === 'custom' 
        ? parseInt(elements.customHours.value) 
        : parseInt(elements.protocolSelect.value);
    
    if (!hours || hours <= 0) {
        alert('Please enter a valid fasting duration');
        return;
    }
    
    state.startTime = new Date();
    state.endTime = new Date(state.startTime.getTime() + hours * 60 * 60 * 1000);
    state.fasting = true;
    state.paused = false;
    
    // Enable weight after input
    elements.weightAfter.disabled = false;
    
    startTimer();
    updateUI();
}

function togglePause() {
    state.paused = !state.paused;
    
    if (state.paused) {
        clearInterval(state.interval);
    } else {
        startTimer();
    }
    
    updateUI();
}

function startTimer() {
    clearInterval(state.interval); // Clear any existing timer
    
    state.interval = setInterval(() => {
        const now = new Date();
        const remaining = state.endTime - now;
        
        if (remaining <= 0) {
            endFasting();
            return;
        }
        
        updateTimerDisplay(remaining);
    }, 1000);
    
    // Initial update
    updateTimerDisplay(state.endTime - new Date());
}

function updateTimerDisplay(remainingMs) {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
    
    elements.timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    
    // Update progress bar
    const totalDuration = state.endTime - state.startTime;
    const progressPercent = ((totalDuration - remainingMs) / totalDuration) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;
}

function endFasting() {
    clearInterval(state.interval);
    state.fasting = false;
    state.paused = false;
    
    // Save session to history
    const session = {
        date: new Date().toLocaleString(),
        duration: Math.round((state.endTime - state.startTime) / (1000 * 60 * 60)),
        weightBefore: state.weightBefore,
        weightAfter: state.weightAfter,
        water: state.waterIntake,
        energy: state.energyLevel,
        notes: elements.journalEntry.value
    };
    
    state.history.push(session);
    saveHistory();
    updateHistoryTable();
    resetUI();
    updateStreak();
    
    alert('Fasting session completed!');
}

// Health Metrics
function updateWater(amount) {
    state.waterIntake = Math.max(0, state.waterIntake + amount);
    elements.waterCount.textContent = state.waterIntake;
}

function setEnergyLevel(level) {
    state.energyLevel = level;
    
    // Update UI
    document.querySelectorAll('.energy-levels span').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.level) === level);
    });
}

// Journal
function saveJournalEntry() {
    const entry = elements.journalEntry.value.trim();
    
    if (entry) {
        state.journalEntries.push({
            date: new Date().toLocaleString(),
            text: entry
        });
        
        elements.journalEntry.value = '';
        alert('Journal entry saved!');
    }
}

// History
function updateHistoryTable() {
    elements.historyTable.innerHTML = '';
    
    state.history.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.date}</td>
            <td>${session.duration} hrs</td>
            <td>${session.weightBefore ? (session.weightBefore - session.weightAfter).toFixed(1) : '-'} kg</td>
            <td>${session.water} ml</td>
            <td>${session.energy ? '⭐'.repeat(session.energy) : '-'}</td>
        `;
        elements.historyTable.appendChild(row);
    });
}

function loadHistory() {
    const savedHistory = localStorage.getItem('fastingHistory');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
        updateHistoryTable();
    }
}

function saveHistory() {
    localStorage.setItem('fastingHistory', JSON.stringify(state.history));
}

// Streak Counter
function updateStreak() {
    // Simple streak counter - you can enhance this with date checking
    if (state.history.length > 0) {
        state.streak = state.history.length;
        localStorage.setItem('fastingStreak', state.streak);
    }
    
    elements.streakCount.textContent = state.streak;
}

// UI Updates
function updateUI() {
    elements.startBtn.disabled = state.fasting && !state.paused;
    elements.pauseBtn.disabled = !state.fasting;
    elements.endBtn.disabled = !state.fasting;
    
    elements.pauseBtn.innerHTML = state.paused 
        ? '<i class="fas fa-play"></i> Resume' 
        : '<i class="fas fa-pause"></i> Pause';
}

function resetUI() {
    state.fasting = false;
    state.paused = false;
    state.startTime = null;
    state.endTime = null;
    state.waterIntake = 0;
    state.energyLevel = null;
    
    elements.timerDisplay.textContent = '00:00:00';
    elements.progressBar.style.width = '0%';
    elements.waterCount.textContent = '0';
    elements.weightBefore.value = '';
    elements.weightAfter.value = '';
    elements.weightAfter.disabled = true;
    
    document.querySelectorAll('.energy-levels span').forEach(el => {
        el.classList.remove('active');
    });
    
    updateUI();
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/IFCOUNTER/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker failed', err));
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', init);
