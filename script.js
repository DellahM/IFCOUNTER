// ===== STATE MANAGEMENT =====
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
  
  // ===== DOM ELEMENTS =====
  const elements = {
    // Timer Elements
    protocolSelect: document.getElementById('protocol'),
    customHours: document.getElementById('custom-hours'),
    timerDisplay: document.getElementById('timer'),
    progressBar: document.getElementById('progress'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    endBtn: document.getElementById('end-btn'),
    
    // Metrics Elements
    weightBefore: document.getElementById('weight-before'),
    weightAfter: document.getElementById('weight-after'),
    waterCount: document.getElementById('water-count'),
    waterPlus: document.getElementById('water-plus'),
    waterMinus: document.getElementById('water-minus'),
    
    // History Elements
    historyTable: document.querySelector('#history-table tbody'),
    streakCount: document.getElementById('streak-count'),
    
    // Tab Elements
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Collapsibles
    collapsibles: document.querySelectorAll('.collapsible'),
    
    // Compact Toggle
    compactToggle: document.getElementById('toggle-compact')
  };
  
  // ===== CORE FUNCTIONS =====
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
    clearInterval(state.interval);
    
    state.interval = setInterval(() => {
      const now = new Date();
      const remaining = state.endTime - now;
      
      if (remaining <= 0) {
        endFasting();
        return;
      }
      
      updateTimerDisplay(remaining);
    }, 1000);
    
    updateTimerDisplay(state.endTime - new Date());
  }
  
  function updateTimerDisplay(remainingMs) {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
    
    elements.timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    
    const totalDuration = state.endTime - state.startTime;
    const progressPercent = ((totalDuration - remainingMs) / totalDuration) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;
  }
  
  function endFasting() {
    clearInterval(state.interval);
    
    const session = {
      date: new Date().toLocaleString(),
      duration: Math.round((state.endTime - state.startTime) / (1000 * 60 * 60)),
      weightBefore: state.weightBefore,
      weightAfter: state.weightAfter,
      water: state.waterIntake,
      energy: state.energyLevel,
      notes: elements.journalEntry?.value
    };
    
    state.history.push(session);
    saveHistory();
    updateHistoryTable();
    resetUI();
    updateStreak();
  }
  
  // ===== TAB SYSTEM =====
  function setupTabs() {
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        
        // Activate clicked tab
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });
  }
  
  // ===== COLLAPSIBLE SECTIONS =====
  function setupCollapsibles() {
    elements.collapsibles.forEach(item => {
      const header = item.querySelector('.collapsible-header');
      const icon = header.querySelector('i');
      
      header.addEventListener('click', () => {
        item.classList.toggle('active');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      });
    });
  }
  
  // ===== COMPACT MODE =====
  function setupCompactMode() {
    elements.compactToggle.addEventListener('click', () => {
      document.querySelector('.app-container').classList.toggle('ultra-compact');
      const icon = elements.compactToggle.querySelector('i');
      icon.classList.toggle('fa-compress-alt');
      icon.classList.toggle('fa-expand-alt');
      
      // Update button text
      const isCompact = document.querySelector('.app-container').classList.contains('ultra-compact');
      elements.compactToggle.innerHTML = isCompact 
        ? '<i class="fas fa-expand-alt"></i> Normal Mode' 
        : '<i class="fas fa-compress-alt"></i> Compact Mode';
    });
  }
  
  // ===== HEALTH METRICS =====
  function updateWater(amount) {
    state.waterIntake = Math.max(0, state.waterIntake + amount);
    elements.waterCount.textContent = state.waterIntake;
  }
  
  function setEnergyLevel(level) {
    state.energyLevel = level;
    document.querySelectorAll('.energy-levels span').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.level) === level);
    });
  }
  
  // ===== HISTORY SYSTEM =====
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
  
  function saveHistory() {
    localStorage.setItem('fastingHistory', JSON.stringify(state.history));
  }
  
  function updateStreak() {
    state.streak = state.history.length;
    localStorage.setItem('fastingStreak', state.streak);
    elements.streakCount.textContent = state.streak;
  }
  
  // ===== UI UPDATES =====
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
  
  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Timer Controls
    elements.startBtn.addEventListener('click', startFasting);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.endBtn.addEventListener('click', endFasting);
    
    // Protocol Selector
    elements.protocolSelect.addEventListener('change', function() {
      elements.customHours.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // Water Tracker
    elements.waterPlus.addEventListener('click', () => updateWater(250));
    elements.waterMinus.addEventListener('click', () => updateWater(-250));
    
    // Energy Levels
    document.querySelectorAll('.energy-levels span').forEach(btn => {
      btn.addEventListener('click', () => setEnergyLevel(parseInt(btn.dataset.level)));
    });
  }
  
  // ===== INITIALIZATION =====
  function init() {
    setupEventListeners();
    setupTabs();
    setupCollapsibles();
    setupCompactMode();
    updateStreak();
    updateHistoryTable();
    
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/IFCOUNTER/sw.js')
          .then(reg => console.log('SW registered:', reg))
          .catch(err => console.log('SW failed:', err));
      });
    }
  }
  
  // Start the app
  document.addEventListener('DOMContentLoaded', init);



  function setupTabs() {
    elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 1. Deactivate all tabs
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        
        // 2. Activate clicked tab
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
      });
    });
  }