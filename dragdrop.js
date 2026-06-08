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

// Drag and Drop Event Handlers
function setupDragDrop() {
  // Make all draggable cards draggable
  setupCardDragging();
  // Setup drop zones
  setupDropZones();
}

function setupCardDragging() {
  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('dragdrop-card')) {
      const elementData = JSON.parse(e.target.dataset.element);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(elementData));
      e.target.classList.add('dragging');
    }
  });

  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('dragdrop-card')) {
      e.target.classList.remove('dragging');
    }
  });
}

function setupDropZones() {
  document.addEventListener('dragover', (e) => {
    if (e.target.classList.contains('drop-slot')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.target.classList.add('drag-over');
    }
  });

  document.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('drop-slot')) {
      e.target.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    if (e.target.classList.contains('drop-slot')) {
      e.preventDefault();
      e.target.classList.remove('drag-over');
      
      try {
        const elementData = JSON.parse(e.dataTransfer.getData('application/json'));
        const groupNum = parseInt(e.target.dataset.group);
        const periodNum = parseInt(e.target.dataset.period);
        
        handleElementDrop(elementData, groupNum, periodNum, e.target);
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
    dropElement.draggable = false;
    
    // Remove the card from the deck
    const card = document.querySelector(`.dragdrop-card[data-element='${JSON.stringify(element)}']`);
    if (card) card.style.opacity = '0.3';
    
    // Check if all placed
    if (dragDropQuiz.correctCount === dragDropQuiz.totalToPlace) {
      endDragDropQuiz();
    }
  } else {
    // Show error animation
    dropElement.classList.add('error');
    setTimeout(() => dropElement.classList.remove('error'), 500);
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
  `;
  
  modal.innerHTML = content;
  modal.classList.add('open');
}

function retryDragDrop() {
  const modal = document.getElementById('dragdrop-result');
  if (modal) modal.classList.remove('open');
  
  // Reset and start new quiz
  dragDropQuiz = new DragDropQuiz();
  dragDropQuiz.init(dragDropQuiz.selectedGroup);
  renderDragDropQuiz();
}

function exitDragDrop() {
  dragDropQuiz.stopTimer();
  document.getElementById('dragdrop-screen').classList.remove('active');
  document.getElementById('quiz-screen').classList.add('active');
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
  
  document.getElementById('dragdrop-deck').innerHTML = deckHTML;
  
  // Render periodic table grid
  const gridHTML = generatePeriodicTableSlots();
  document.getElementById('dragdrop-table').innerHTML = gridHTML;
  
  setupDragDrop();
}

function generatePeriodicTableSlots() {
  let html = '';
  
  // Generate 18 groups x 7 periods
  for (let period = 1; period <= 7; period++) {
    for (let group = 1; group <= 18; group++) {
      html += `
        <div class="drop-slot" data-group="${group}" data-period="${period}">
          <div class="slot-label">族 ${group}<br/>周期 ${period}</div>
        </div>
      `;
    }
  }
  
  return html;
}
