// DOM Elements
const elements = {
    startBtn: document.getElementById('startFasting'),
    pauseBtn: document.getElementById('pauseResume'),
    endBtn: document.getElementById('endFasting'),
    protocolSelect: document.getElementById('fastingProtocol'),
    customHours: document.getElementById('customHours'),
    timeDisplay: document.getElementById('timeSpent'),
    progressCircle: document.querySelector('.progress-ring-circle'),
    waterAmount: document.getElementById('waterAmount'),
    addWater: document.getElementById('addWater'),
    subtractWater: document.getElementById('subtractWater'),
    energyBtns: document.querySelectorAll('.energy-btn'),
    notesInput: document.getElementById('fastingNotes'),
    saveNotes: document.getElementById('saveNotes'),
    historyTable: document.getElementById('historyTable').querySelector('tbody'),
    streakDisplay: document.getElementById('streak')
};

// State
let state = {
    fasting: false,
    paused: false,
    startTime: null,
    endTime: null,
    interval: null,
    waterIntake: 0,
    energyLevel: 0,
    currentNotes: '',
    history: JSON.parse(localStorage.getItem('fastingHistory')) || [],
    streak: parseInt(localStorage.getItem('fastingStreak')) || 0
};

// Initialize
function init() {
    updateStreakDisplay();
    loadHistory();
    setupEventListeners();
    setupProtocolSelector();
}

// Event Listeners
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startFasting);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.endBtn.addEventListener('click', endFasting);
    elements.addWater.addEventListener('click', () => updateWater(250));
    elements.subtractWater.addEventListener('click', () => updateWater(-250));
    elements.energyBtns.forEach(btn => {
        btn.addEventListener('click', () => setEnergyLevel(parseInt(btn.dataset.level)));
    });
    elements.saveNotes.addEventListener('click', saveNotes);
}

// Protocol Selector
function setupProtocolSelector() {
    elements.protocolSelect.addEventListener('change', function() {
        elements.customHours.style.display = this.value === 'custom' ? 'block' : 'none';
    });
}

// Fasting Functions
function startFasting() {
    const protocol = elements.protocolSelect.value;
    const hours = protocol === 'custom' ? 
        parseInt(elements.customHours.value) || 16 : 
        parseInt(protocol);

    state.startTime = new Date();
    state.endTime = new Date(state.startTime.getTime() + hours * 60 * 60 * 1000);
    state.fasting = true;
    
    updateUI();
    startTimer();
    animateProgressCircle();
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

function endFasting() {
    clearInterval(state.interval);
    saveFastingSession();
    resetState();
    updateUI();
    updateStreak();
}

// Timer Functions
function startTimer() {
    state.interval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const now = new Date();
    const remaining = state.endTime - now;
    
    if (remaining <= 0) {
        endFasting();
        return;
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000).toString().padStart(2, '0');

    elements.timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    updateProgressCircle(remaining);
}

// Progress Circle
function animateProgressCircle() {
    const totalDuration = state.endTime - state.startTime;
    const circumference = 2 * Math.PI * 52;
    elements.progressCircle.style.strokeDasharray = circumference;
    elements.progressCircle.style.strokeDashoffset = circumference;
}

function updateProgressCircle(remaining) {
    const totalDuration = state.endTime - state.startTime;
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (remaining / totalDuration) * circumference;
    elements.progressCircle.style.strokeDashoffset = offset;
}

// Water Tracker
function updateWater(amount) {
    state.waterIntake = Math.max(0, state.waterIntake + amount);
    elements.waterAmount.textContent = state.waterIntake;
}

// Energy Level
function setEnergyLevel(level) {
    state.energyLevel = level;
    elements.energyBtns.forEach(btn => {
        btn.style.transform = btn.dataset.level == level ? 'scale(1.2)' : 'scale(1)';
    });
}

// Notes
function saveNotes() {
    state.currentNotes = elements.notesInput.value;
    alert('Notes saved!');
}

// History
function saveFastingSession() {
    const session = {
        date: new Date().toLocaleDateString(),
        protocol: elements.protocolSelect.options[elements.protocolSelect.selectedIndex].text,
        weightBefore: document.getElementById('weightBefore').value,
        weightAfter: document.getElementById('weightAfter').value,
        water: state.waterIntake,
        energy: state.energyLevel,
        notes: state.currentNotes
    };
    
    state.history.push(session);
    localStorage.setItem('fastingHistory', JSON.stringify(state.history));
    loadHistory();
}

function loadHistory() {
    elements.historyTable.innerHTML = '';
    state.history.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.date}</td>
            <td>${session.protocol}</td>
            <td>${session.weightBefore} → ${session.weightAfter}</td>
            <td>${session.water}ml</td>
            <td>${'⭐'.repeat(session.energy)}</td>
        `;
        elements.historyTable.appendChild(row);
    });
}

// Streak Counter
function updateStreak() {
    const lastSession = state.history[state.history.length - 1];
    if (lastSession && isNewDay(lastSession.date)) {
        state.streak++;
    } else {
        state.streak = 1;
    }
    localStorage.setItem('fastingStreak', state.streak.toString());
    updateStreakDisplay();
}

function isNewDay(lastDate) {
    const last = new Date(lastDate);
    const today = new Date();
    return last.getDate() === today.getDate() - 1 && 
           last.getMonth() === today.getMonth() && 
           last.getFullYear() === today.getFullYear();
}

function updateStreakDisplay() {
    elements.streakDisplay.textContent = `🔥 ${state.streak}-day streak`;
}

// UI Updates
function updateUI() {
    elements.startBtn.disabled = state.fasting;
    elements.pauseBtn.disabled = !state.fasting;
    elements.endBtn.disabled = !state.fasting;
    elements.pauseBtn.innerHTML = state.paused ? 
        '<i class="fas fa-play"></i> Resume' : 
        '<i class="fas fa-pause"></i> Pause';
}

function resetState() {
    state.fasting = false;
    state.paused = false;
    state.startTime = null;
    state.endTime = null;
    state.waterIntake = 0;
    state.energyLevel = 0;
    state.currentNotes = '';
    clearInterval(state.interval);
}

// Initialize App
document.addEventListener('DOMContentLoaded', init);



// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/IF-Counter/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    });
  }

  // Fix for GitHub Pages paths
const repoName = 'IF-Counter'; // CHANGE THIS if your repo has a different name
const isGitHubPages = window.location.host.includes('github.io');

// Modified Service Worker registration
if ('serviceWorker' in navigator) {
  const swUrl = isGitHubPages ? `/${repoName}/sw.js` : '/sw.js';
  
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('SW registered for scope:', registration.scope);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// Request notification permission
function enableNotifications() {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification("Fasting Tracker", {
          body: "You'll now receive fasting reminders!",
          icon: "icons/icon-192.png"
        });
      }
    });
  }
  
  // Call this when user clicks a "Enable Notifications" button
  document.getElementById('notifyBtn')?.addEventListener('click', enableNotifications);


  