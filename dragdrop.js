// Drag and Drop Mode for Periodic Table Quiz

class DragDropQuiz {
  constructor() {
    this.selectedElements = [];
    this.placedElements = new Map(); // { position: elementData }
    this.startTime = null;
    this.timerInterval = null;
    this.correctCount = 0;
    this.totalToPlace = 0;
    this.selectedGroup = 'all';
  }

  // Initialize drag-drop mode
  init(groupFilter = 'all') {
    this.selectedGroup = groupFilter;
    this.selectedElements = this.getElementsForGroup(groupFilter);
    this.placedElements.clear();
    this.correctCount = 0;
    this.totalToPlace = this.selectedElements.length;
    this.startTime = Date.now();
    this.startTimer();
  }

  // Get elements based on group filter
  getElementsForGroup(group) {
    if (group === 'all') {
      return [...elementsData]; // assume elementsData exists globally
    }
    return elementsData.filter(el => el.group === group);
  }

  // Start the timer
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.updateTimerDisplay();
    }, 100);
  }

  // Get elapsed time in seconds
  getElapsedSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // Format time display (MM:SS)
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Update timer display
  updateTimerDisplay() {
    const timerEl = document.getElementById('dragdrop-timer');
    if (timerEl) {
      timerEl.textContent = this.formatTime(this.getElapsedSeconds());
    }
  }

  // Check if element placement is correct
  isCorrectPlacement(element, targetGroup, targetPeriod) {
    return element.group === targetGroup && element.period === targetPeriod;
  }

  // Place element in the table
  placeElement(element, groupNumber, periodNumber) {
    const position = `${groupNumber}-${periodNumber}`;
    
    if (this.isCorrectPlacement(element, groupNumber, periodNumber)) {
      this.placedElements.set(position, element);
      this.correctCount++;
      return { success: true, message: 'ถูกต้อง! 🎉' };
    } else {
      return { success: false, message: 'ตำแหน่งผิด ลองใหม่' };
    }
  }

  // Remove placed element
  removeElement(position) {
    if (this.placedElements.has(position)) {
      this.placedElements.delete(position);
      this.correctCount--;
    }
  }

  // Get quiz results
  getResults() {
    const elapsedSeconds = this.getElapsedSeconds();
    const percentage = Math.round((this.correctCount / this.totalToPlace) * 100);
    
    return {
      correct: this.correctCount,
      total: this.totalToPlace,
      percentage: percentage,
      timeSeconds: elapsedSeconds,
      timeFormatted: this.formatTime(elapsedSeconds)
    };
  }

  // Get rating based on percentage and time
  getRating(percentage, timeSeconds) {
    if (percentage === 100) {
      if (timeSeconds < 60) return { rating: 'perfect', emoji: '⭐', text: 'สมบูรณ์แบบ!' };
      if (timeSeconds < 120) return { rating: 'great', emoji: '🌟', text: 'ยอดเยี่ยม!' };
      return { rating: 'good', emoji: '👍', text: 'ดีมาก!' };
    }
    if (percentage >= 80) return { rating: 'good', emoji: '👍', text: 'ดี' };
    if (percentage >= 60) return { rating: 'fair', emoji: '😊', text: 'พอใจ' };
    return { rating: 'poor', emoji: '💪', text: 'พยายามอีกครั้ง' };
  }

  // Stop timer
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

// Global instance
let dragDropQuiz = new DragDropQuiz();

// Open drag-drop quiz mode
function openDragDropMode(group = 'all') {
  document.getElementById('quiz-screen').classList.remove('active');
  document.getElementById('dragdrop-screen').classList.add('active');
  
  dragDropQuiz = new DragDropQuiz();
  dragDropQuiz.init(group);
  renderDragDropQuiz();
}

// Drag and Drop Event Handlers
function setupDragDrop() {
  // Make all draggable cards draggable
  setupCardDragging();
  // Setup drop zones
  setupDropZones();
}

function setupCardDragging() {
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.dragdrop-card')) {
      const card = e.target.closest('.dragdrop-card');
      const elementData = JSON.parse(card.dataset.element);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(elementData));
      card.classList.add('dragging');
    }
  });

  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.dragdrop-card');
    if (card) {
      card.classList.remove('dragging');
    }
  });
}

function setupDropZones() {
  document.addEventListener('dragover', (e) => {
    if (e.target.closest('.drop-slot')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.target.closest('.drop-slot').classList.add('drag-over');
    }
  });

  document.addEventListener('dragleave', (e) => {
    const slot = e.target.closest('.drop-slot');
    if (slot && e.target === slot) {
      slot.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    const slot = e.target.closest('.drop-slot');
    if (slot) {
      e.preventDefault();
      e.stopPropagation();
      slot.classList.remove('drag-over');
      
      try {
        const elementData = JSON.parse(e.dataTransfer.getData('application/json'));
        const groupNum = parseInt(slot.dataset.group);
        const periodNum = parseInt(slot.dataset.period);
        
        handleElementDrop(elementData, groupNum, periodNum, slot);
      } catch (error) {
        console.error('Drop error:', error);
      }
    }
  });
}

function handleElementDrop(element, groupNum, periodNum, dropElement) {
  const result = dragDropQuiz.placeElement(element, groupNum, periodNum);
  
  if (result.success) {
    // Show success animation
    dropElement.classList.add('success');
    dropElement.innerHTML = `
      <div class="drop-slot-content">
        <div class="slot-sym">${element.symbol}</div>
        <div class="slot-name">${element.name_th}</div>
      </div>
    `;
    dropElement.style.pointerEvents = 'none';
    
    // Remove the card from the deck
    const cards = document.querySelectorAll('.dragdrop-card');
    cards.forEach(card => {
      if (card.dataset.element === JSON.stringify(element)) {
        card.style.opacity = '0.3';
        card.draggable = false;
      }
    });
    
    // Update progress
    updateDragDropProgress();
    
    // Check if all placed
    if (dragDropQuiz.correctCount === dragDropQuiz.totalToPlace) {
      setTimeout(endDragDropQuiz, 500);
    }
  } else {
    // Show error animation
    dropElement.classList.add('error');
    setTimeout(() => dropElement.classList.remove('error'), 500);
  }
}

function updateDragDropProgress() {
  const percentage = Math.round((dragDropQuiz.correctCount / dragDropQuiz.totalToPlace) * 100);
  const progressFill = document.querySelector('.dragdrop-progress-fill');
  const progressLabel = document.querySelector('.dragdrop-progress-label');
  
  if (progressFill) {
    progressFill.style.width = percentage + '%';
  }
  if (progressLabel) {
    progressLabel.textContent = `${dragDropQuiz.correctCount}/${dragDropQuiz.totalToPlace}`;
  }
}

function endDragDropQuiz() {
  dragDropQuiz.stopTimer();
  const results = dragDropQuiz.getResults();
  const rating = dragDropQuiz.getRating(results.percentage, results.timeSeconds);
  
  showDragDropResults(results, rating);
}

function showDragDropResults(results, rating) {
  const modal = document.getElementById('dragdrop-result');
  if (!modal) return;
  
  const content = `
    <div class="dragdrop-result-card">
      <div class="dragdrop-result-header">
        <div class="result-emoji">${rating.emoji}</div>
        <h2>${rating.text}</h2>
      </div>
      <div class="dragdrop-result-stats">
        <div class="stat">
          <div class="stat-number">${results.correct}/${results.total}</div>
          <div class="stat-label">ถูกต้อง</div>
        </div>
        <div class="stat">
          <div class="stat-number">${results.percentage}%</div>
          <div class="stat-label">เปอร์เซ็นต์</div>
        </div>
        <div class="stat">
          <div class="stat-number">${results.timeFormatted}</div>
          <div class="stat-label">เวลา</div>
        </div>
      </div>
      <div class="dragdrop-result-actions">
        <button class="dragdrop-btn-primary" onclick="retryDragDrop()">ลองใหม่</button>
        <button class="dragdrop-btn-secondary" onclick="exitDragDrop()">กลับหน้าหลัก</button>
      </div>
    </div>
  `;
  
  modal.innerHTML = content;
  modal.classList.add('open');
}

function retryDragDrop() {
  const modal = document.getElementById('dragdrop-result');
  if (modal) modal.classList.remove('open');
  
  // Reset and start new quiz
  const group = dragDropQuiz.selectedGroup;
  dragDropQuiz = new DragDropQuiz();
  dragDropQuiz.init(group);
  renderDragDropQuiz();
}

function exitDragDrop() {
  dragDropQuiz.stopTimer();
  document.getElementById('dragdrop-screen').classList.remove('active');
  document.getElementById('dragdrop-result').classList.remove('open');
  // Show table view
  document.querySelector('header').style.display = 'flex';
  document.querySelector('.legend').style.display = 'flex';
  document.querySelector('.main').style.display = 'block';
}

function renderDragDropQuiz() {
  const screen = document.getElementById('dragdrop-screen');
  if (!screen) return;
  
  // Render card deck
  const deckHTML = dragDropQuiz.selectedElements
    .map(el => `
      <div class="dragdrop-card" data-element='${JSON.stringify(el)}' draggable="true">
        <div class="dragdrop-card-sym">${el.symbol}</div>
        <div class="dragdrop-card-name">${el.name_th}</div>
      </div>
    `)
    .join('');
  
  const deckContainer = document.getElementById('dragdrop-deck');
  if (deckContainer) {
    deckContainer.innerHTML = deckHTML;
  }
  
  // Render periodic table grid
  const gridHTML = generatePeriodicTableSlots();
  const tableContainer = document.getElementById('dragdrop-table');
  if (tableContainer) {
    tableContainer.innerHTML = gridHTML;
  }
  
  // Update progress
  updateDragDropProgress();
  
  setupDragDrop();
}

function generatePeriodicTableSlots() {
  let html = '';
  
  // Generate 18 groups x 7 periods
  for (let period = 1; period <= 7; period++) {
    for (let group = 1; group <= 18; group++) {
      html += `
        <div class="drop-slot" data-group="${group}" data-period="${period}">
          <div class="slot-label">G${group}</div>
        </div>
      `;
    }
  }
  
  return html;
}
