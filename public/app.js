// State Management for Tech Games Fest 2026
const state = {
  events: [],
  selectedCompetitions: new Set(),
  activeTab: 'home',
  activeRulesDay: 1,
  snackPricing: { pack1: 135, pack2: 240 },
  activeOrder: null,
  orderPollInterval: null,
  currentRegData: null
};

// Event Theme Matrix: 7 Unique Vibrant CS Colors
const EVENT_THEMES = {
  'mentimeter-quiz': {
    themeClass: 'theme-emerald',
    gradient: 'linear-gradient(90deg, #00FF9D, #059669)',
    accent: '#00FF9D',
    file: 'arena_01_quiz.py',
    lang: 'Python 3.12'
  },
  'collage-making': {
    themeClass: 'theme-amber',
    gradient: 'linear-gradient(90deg, #F59E0B, #D97706)',
    accent: '#F59E0B',
    file: 'arena_02_collage.c',
    lang: 'ANSI C'
  },
  'pitch-perfect': {
    themeClass: 'theme-cyan',
    gradient: 'linear-gradient(90deg, #00E5FF, #0284C7)',
    accent: '#00E5FF',
    file: 'arena_03_pitch_no_ai.rs',
    lang: 'Rust Engine'
  },
  'dumb-charades': {
    themeClass: 'theme-purple',
    gradient: 'linear-gradient(90deg, #A855F7, #7C3AED)',
    accent: '#A855F7',
    file: 'arena_04_charades.js',
    lang: 'Node.js'
  },
  'debate': {
    themeClass: 'theme-rose',
    gradient: 'linear-gradient(90deg, #FF3366, #E11D48)',
    accent: '#FF3366',
    file: 'arena_05_vox_debate.cpp',
    lang: 'C++20'
  },
  'artistry': {
    themeClass: 'theme-yellow',
    gradient: 'linear-gradient(90deg, #14B8A6, #0D9488)',
    accent: '#14B8A6',
    file: 'arena_06_artistry.dart',
    lang: 'Dart / Flutter'
  },
  'tech-pictionary': {
    themeClass: 'theme-indigo',
    gradient: 'linear-gradient(90deg, #6366F1, #4F46E5)',
    accent: '#818CF8',
    file: 'arena_07_pictionary.ts',
    lang: 'TypeScript'
  }
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSSE();
  fetchEvents();
  setupRegistrationForm();
  setupDayTabs();
  setupCashfreeModalListeners();
});

// ==================== NAVIGATION HANDLING ====================
function initNavigation() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target]');
    if (btn) {
      const target = btn.getAttribute('data-target');
      if (target) {
        e.preventDefault();
        navigateTo(target);
      }
    }
  });

  // Handle URL hash on load
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash, false);

  window.addEventListener('popstate', () => {
    const currentHash = window.location.hash.replace('#', '') || 'home';
    navigateTo(currentHash, false);
  });
}

function navigateTo(tabId, updateHistory = true) {
  const validTabs = ['home', 'rules', 'register'];
  if (!validTabs.includes(tabId)) tabId = 'home';

  state.activeTab = tabId;

  // Toggle active views
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });
  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) activeView.classList.add('active');

  // Toggle active nav links in header
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-target') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  if (updateHistory) {
    window.history.pushState(null, '', `#${tabId}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Day Tab Switching on Rules Page
function setupDayTabs() {
  const dayTabBtns = document.querySelectorAll('.day-tab-btn');
  dayTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dayTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeRulesDay = parseInt(btn.getAttribute('data-day'), 10);
      renderRulesSection();
    });
  });
}

// ==================== REAL-TIME SERVER-SENT EVENTS (SSE) ====================
function initSSE() {
  if (!window.EventSource) {
    console.warn('SSE not supported; falling back to periodic polling.');
    setInterval(fetchEvents, 8000);
    return;
  }

  const evtSource = new EventSource('/api/events/stream');

  evtSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.events) {
        state.events = data.events;
        updateLiveSlotDisplays();
        renderRulesSection();
      }
      if (data.type === 'PAYMENT_CONFIRMED' && state.activeOrder && data.orderId === state.activeOrder.order_id) {
        // If live SSE confirms payment for our active order, automatically unlock pass!
        checkOrderStatusOnce(data.orderId);
      }
    } catch (err) {
      console.error('SSE parsing error:', err);
    }
  };

  evtSource.onerror = () => {
    // Browser automatically handles SSE reconnection
  };
}

// Fetch Initial Events Data
async function fetchEvents() {
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.success && data.events) {
      state.events = data.events;
      updateLiveSlotDisplays();
      renderRulesSection();
      renderCompSelector();
    }
  } catch (err) {
    console.error('Failed to fetch events:', err);
  }
}

function updateLiveSlotDisplays() {
  renderHomeSlotsGrid();
  renderCompSelector();
}

// ==================== RENDER HOME SLOTS GRID (7 VIBRANT CS THEMES) ====================
function renderHomeSlotsGrid() {
  const container = document.getElementById('home-slots-grid');
  if (!container) return;

  container.innerHTML = state.events.map(evt => {
    const isSoldOut = evt.remainingSlots <= 0;
    const isLow = evt.remainingSlots <= 5 && !isSoldOut;
    
    const statusClass = isSoldOut 
      ? 'status-full' 
      : (isLow ? 'status-warning' : 'status-available');
    
    const statusLabel = isSoldOut
      ? '🔴 Sold Out'
      : (isLow ? `⚠️ ${evt.remainingSlots} Left` : `🟢 ${evt.remainingSlots} Slots Open`);

    const fillPercent = evt.fillPercentage || 0;
    const classifiedDate = evt.dayNumber === 1 ? 'Day 1 • 16th Nov' : 'Day 2 • 17th Nov';
    const conf = EVENT_THEMES[evt.id] || {
      themeClass: 'theme-cyan',
      gradient: 'linear-gradient(90deg, #00E5FF, #0284C7)',
      accent: '#00E5FF',
      file: `track_0${evt.order}.py`
    };

    return `
      <div class="slot-card-dark ${conf.themeClass}">
        <!-- Mini Terminal Top Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.45rem; margin-bottom: 0.65rem; border-bottom: 1px solid rgba(255,255,255,0.06); font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;">
          <span style="display: flex; gap: 4px;">
            <span class="dot-red" style="width:7px; height:7px;"></span>
            <span class="dot-yellow" style="width:7px; height:7px;"></span>
            <span class="dot-green" style="width:7px; height:7px;"></span>
          </span>
          <span style="color: ${conf.accent}; font-weight: 700;">${conf.file}</span>
        </div>

        <div class="slot-card-header">
          <span class="slot-day-pill" style="border-color: ${conf.accent}44; color: ${conf.accent};">${classifiedDate}</span>
          <span class="slot-status-pill ${statusClass}">${statusLabel}</span>
        </div>

        <h4 class="slot-title">${evt.name}</h4>
        <div class="slot-time-text">
          <span>⏰</span> <span>${evt.time}</span>
        </div>

        <div class="slot-bar-track">
          <div class="slot-bar-fill" style="width: ${fillPercent}%; background: ${isSoldOut ? '#EF4444' : conf.gradient};"></div>
        </div>

        <div class="slot-count-text">
          <span>${evt.registeredCount} / ${evt.totalSlots} Teams</span>
          <span class="slot-intake-badge" style="color: ${conf.accent}; background: ${conf.accent}15;">Max: ${evt.totalSlots}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== RENDER RULES SECTION (STACKED ONE BELOW THE OTHER) ====================
function renderRulesSection() {
  const container = document.getElementById('rules-cards-container');
  if (!container) return;

  const currentDayEvents = state.events.filter(e => e.dayNumber === state.activeRulesDay);

  const themeConfig = {
    'mentimeter-quiz': { theme: 'theme-emerald', file: 'track_01_techgyaan_quiz.py', lang: 'Python 3.12' },
    'collage-making': { theme: 'theme-amber', file: 'track_02_collage_chronicles.c', lang: 'ANSI C' },
    'pitch-perfect': { theme: 'theme-cyan', file: 'track_03_pitch_perfect_no_ai.rs', lang: 'Rust Engine' },
    'dumb-charades': { theme: 'theme-purple', file: 'track_04_mudra_mime_charades.js', lang: 'Node.js' },
    'debate': { theme: 'theme-rose', file: 'track_05_vox_debate.cpp', lang: 'C++20' }
  };

  const defaultThemes = ['theme-emerald', 'theme-amber', 'theme-cyan', 'theme-purple', 'theme-rose', 'theme-yellow', 'theme-indigo'];

  container.innerHTML = `
    <div class="games-rules-stacked">
      ${currentDayEvents.map(evt => {
        const conf = themeConfig[evt.id] || {
          theme: defaultThemes[((evt.order || 1) - 1) % defaultThemes.length],
          file: `track_0${evt.order || 1}_${evt.id.replace(/-/g, '_')}.sh`,
          lang: 'Bash / Linux'
        };

        let topicCalloutHtml = '';
        if (evt.topicReleaseNotice) {
          topicCalloutHtml = `
            <div class="stacked-box-code" style="border-left-color: #F59E0B;">
              <div class="stacked-box-title" style="color: #F59E0B;">📢 Topic Announcement Schedule</div>
              <div style="color: #FDE68A; line-height: 1.55;">${evt.topicReleaseNotice}</div>
            </div>
          `;
        }

        let themeBoxHtml = '';
        if (evt.theme) {
          themeBoxHtml = `
            <div class="stacked-box-code">
              <div class="stacked-box-title">⚡ Quiz Scope &amp; Syllabus</div>
              <div style="color: #E2E8F0; line-height: 1.55;">${evt.theme}</div>
            </div>
          `;
        }

        const roundBadgeText = evt.hasSecondRound ? '⭐ 2 Rounds' : '1 Round Only';
        const dateFormatted = evt.dayNumber === 1 ? 'Day 1 &bull; 16th Nov 2026' : 'Day 2 &bull; 17th Nov 2026';

        return `
          <div class="game-rule-card-stacked ${conf.theme}" id="rule-${evt.id}">
            
            <!-- Terminal Chrome Bar -->
            <div class="terminal-bar">
              <div class="terminal-dots">
                <span class="dot-red"></span>
                <span class="dot-yellow"></span>
                <span class="dot-green"></span>
              </div>
              <div class="terminal-filename">
                <span class="cs-code-prompt">&gt;_</span> ${conf.file} &bull; [${conf.lang}]
              </div>
              <div class="terminal-env-tag">
                ${dateFormatted}
              </div>
            </div>

            <!-- Card Content Body -->
            <div class="stacked-card-body">
              <div class="stacked-header-row">
                <div class="stacked-title-group">
                  <h3>
                    <span class="stacked-order-chip">ARENA #${evt.order}</span>
                    <span>${evt.name}</span>
                  </h3>
                  <div class="stacked-tagline-quote">
                    // "${evt.tagline}"
                  </div>
                </div>

                <div class="stacked-meta-pills">
                  <span class="stacked-pill">⏰ ${evt.time}</span>
                  <span class="stacked-pill">📍 ${evt.location}</span>
                  <span class="stacked-pill">${roundBadgeText}</span>
                  <span class="stacked-pill" style="color: var(--accent-color, #00FF9D); border-color: var(--accent-border, rgba(0,255,157,0.3)); font-weight: 800;">
                    🎟️ ${evt.remainingSlots} / ${evt.totalSlots} Slots Free
                  </span>
                </div>
              </div>

              <p class="stacked-desc-text">${evt.shortDesc}</p>

              ${themeBoxHtml}
              ${topicCalloutHtml}

              <div class="stacked-rules-section">
                <div class="stacked-rules-heading">
                  <span>📋</span>
                  <span>Participant Rules &amp; Tournament Guidelines:</span>
                </div>
                <ul class="stacked-rules-ul">
                  ${evt.rules.map(rule => `
                    <li>
                      <span class="stacked-rule-icon">✓</span>
                      <span>${rule}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <div class="stacked-card-footer">
                <div style="font-size: 0.82rem; color: #64748B; font-family: 'JetBrains Mono', monospace;">
                  <code>status: open</code> &bull; <code>max_intake: ${evt.totalSlots} trios</code>
                </div>
                <button class="btn-enroll-track" onclick="selectAndGoToRegister('${evt.id}')">
                  <span>Enroll Trio in Arena #${evt.order}</span>
                  <span>→</span>
                </button>
              </div>
            </div>

          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 1-Click Track Enrollment Helper
window.selectAndGoToRegister = function(eventId) {
  if (state.selectedCompetitions.size < 3) {
    state.selectedCompetitions.add(eventId);
    renderCompSelector();
    updateSelectedCompsSummary();
  }
  navigateTo('register');
};

// ==================== RENDER COMPETITION SELECTOR (STEP 1) ====================
function renderCompSelector() {
  const container = document.getElementById('comp-selection-grid');
  if (!container) return;

  const countBadge = document.getElementById('selected-comp-counter');
  const count = state.selectedCompetitions.size;
  if (countBadge) {
    countBadge.innerText = `${count} / 3 Selected (Min 2 required)`;
    if (count >= 2 && count <= 3) {
      countBadge.style.color = '#34D399';
      countBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      countBadge.style.background = 'rgba(16, 185, 129, 0.15)';
    } else {
      countBadge.style.color = '#F59E0B';
      countBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      countBadge.style.background = 'rgba(245, 158, 11, 0.15)';
    }
  }

  container.innerHTML = state.events.map(evt => {
    const isSelected = state.selectedCompetitions.has(evt.id);
    const isSoldOut = evt.remainingSlots <= 0;
    const disabledClass = isSoldOut ? 'disabled' : '';
    const selectedClass = isSelected ? 'selected' : '';
    const classifiedDate = evt.dayNumber === 1 ? 'Day 1 (16 Nov)' : 'Day 2 (17 Nov)';
    const conf = EVENT_THEMES[evt.id] || {
      themeClass: 'theme-cyan',
      accent: '#00E5FF',
      file: `track_0${evt.order || 1}.py`
    };

    return `
      <div class="comp-select-card ${conf.themeClass} ${selectedClass} ${disabledClass}" data-event-id="${evt.id}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <span class="slot-day-pill" style="border-color: ${conf.accent}44; color: ${conf.accent}; font-size: 0.68rem; padding: 2px 8px;">ARENA #${evt.order}</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: ${conf.accent}; opacity: 0.85;">${conf.file}</span>
          </div>
          <div class="comp-card-top-row">
            <h4 style="font-size: 1rem; font-weight: 800; color: #FFFFFF; line-height: 1.3;">${evt.name}</h4>
            <div class="comp-checkbox-circle">
              ${isSelected ? '✓' : ''}
            </div>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">${evt.shortDesc}</p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 0.65rem;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #94A3B8;">${classifiedDate} • ${evt.time.split('–')[0].trim()}</span>
          <span class="slot-status-pill ${isSoldOut ? 'status-full' : (evt.remainingSlots <= 5 ? 'status-warning' : 'status-available')}">
            ${isSoldOut ? 'Full' : `${evt.remainingSlots}/${evt.totalSlots} free`}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Attach click events
  container.querySelectorAll('.comp-select-card:not(.disabled)').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-event-id');
      if (state.selectedCompetitions.has(id)) {
        state.selectedCompetitions.delete(id);
      } else {
        if (state.selectedCompetitions.size >= 3) {
          alert('You can select a maximum of 3 competitions per team.');
          return;
        }
        state.selectedCompetitions.add(id);
      }
      renderCompSelector();
      updateSelectedCompsSummary();
    });
  });

  // Enable/disable proceed button
  const nextBtn = document.getElementById('btn-step1-next');
  if (nextBtn) {
    const isValid = (count >= 2 && count <= 3);
    nextBtn.disabled = !isValid;
    nextBtn.style.opacity = isValid ? '1' : '0.4';
    nextBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }
}

function updateSelectedCompsSummary() {
  const summaryList = document.getElementById('summary-selected-events');
  if (!summaryList) return;

  const selectedArray = Array.from(state.selectedCompetitions).map(id => {
    const evt = state.events.find(e => e.id === id);
    return evt ? evt.name : id;
  });

  if (selectedArray.length === 0) {
    summaryList.innerHTML = '<span style="color:#64748B; font-style:italic;">No events selected yet.</span>';
  } else {
    summaryList.innerHTML = selectedArray.map(name => `
      <span style="display:inline-block; background: rgba(56, 189, 248, 0.15); color: #38BDF8; font-size: 0.78rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.35); margin: 0.2rem;">${name}</span>
    `).join(' ');
  }
}

// ==================== REGISTRATION STEPPER & PRICING ====================
function setupRegistrationForm() {
  const btnStep1Next = document.getElementById('btn-step1-next');
  const btnStep2Back = document.getElementById('btn-step2-back');
  const btnStep2Next = document.getElementById('btn-step2-next');
  const btnStep3Back = document.getElementById('btn-step3-back');
  const btnProceedPayment = document.getElementById('btn-proceed-payment');

  if (btnStep1Next) {
    btnStep1Next.addEventListener('click', () => {
      if (state.selectedCompetitions.size < 2 || state.selectedCompetitions.size > 3) {
        alert('Please select at least 2 and at most 3 competitions.');
        return;
      }
      setRegStep(2);
    });
  }

  if (btnStep2Back) {
    btnStep2Back.addEventListener('click', () => setRegStep(1));
  }

  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', () => {
      if (!validateStep2()) return;
      populateReviewStep();
      setRegStep(3);
    });
  }

  if (btnStep3Back) {
    btnStep3Back.addEventListener('click', () => setRegStep(2));
  }

  if (btnProceedPayment) {
    btnProceedPayment.addEventListener('click', initiateCashfreeCheckout);
  }

  // Setup phone numbers (digits only, max 10) & USN (alphanumeric uppercase, max 11) live sanitizers
  for (let i = 1; i <= 3; i++) {
    const phoneInput = document.getElementById(`m${i}-phone`);
    if (phoneInput) {
      phoneInput.setAttribute('maxlength', '10');
      phoneInput.setAttribute('inputmode', 'numeric');
      phoneInput.setAttribute('pattern', '[0-9]{10}');
      phoneInput.addEventListener('input', (e) => {
        // Enforce digits only
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    const usnInput = document.getElementById(`m${i}-usn`);
    if (usnInput) {
      usnInput.setAttribute('maxlength', '11');
      usnInput.classList.add('form-input-usn');
      usnInput.addEventListener('input', (e) => {
        // Enforce alphanumeric uppercase only, max 11 characters (e.g. ENG24DS0018 or 1DS23AI001)
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
      });
    }
  }

  // Setup snack pack radios listener
  document.querySelectorAll('input[type="radio"][name^="member-"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const groupName = e.target.name;
      document.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
        r.closest('.snack-radio-label').classList.remove('selected');
      });
      e.target.closest('.snack-radio-label').classList.add('selected');
      calculateRegistrationPricing();
    });
  });
}

function setRegStep(step) {
  document.querySelectorAll('.reg-step-card').forEach(c => c.style.display = 'none');
  const targetStep = document.getElementById(`reg-step-${step}`);
  if (targetStep) targetStep.style.display = 'block';

  // Update stepper indicators
  for (let i = 1; i <= 3; i++) {
    const item = document.getElementById(`step-indicator-${i}`);
    if (!item) continue;
    item.classList.remove('active', 'completed');
    if (i === step) {
      item.classList.add('active');
    } else if (i < step) {
      item.classList.add('completed');
    }
  }

  const stepper = document.querySelector('.reg-stepper-bar');
  if (stepper) {
    window.scrollTo({ top: stepper.offsetTop - 90, behavior: 'smooth' });
  }
}

function validateStep2() {
  const teamName = document.getElementById('input-team-name').value.trim();
  if (!teamName) {
    alert('Please enter a Team Name.');
    document.getElementById('input-team-name').focus();
    return false;
  }

  for (let i = 1; i <= 3; i++) {
    const name = document.getElementById(`m${i}-name`).value.trim();
    const usn = document.getElementById(`m${i}-usn`).value.trim().toUpperCase();
    const sem = document.getElementById(`m${i}-sem`).value.trim();
    const phone = document.getElementById(`m${i}-phone`).value.trim();
    const email = document.getElementById(`m${i}-email`).value.trim();
    const snack = document.querySelector(`input[name="member-${i}-snack"]:checked`);

    if (!name || !usn || !sem || !phone || !email) {
      alert(`Please fill in all mandatory details for Team Member ${i}.`);
      return false;
    }

    // Strict USN Validation: 10 to 11 alphanumeric characters (e.g. ENG24DS0018 or 1DS23AI001)
    const cleanUsn = usn.replace(/[^A-Z0-9]/g, '');
    if (cleanUsn.length < 10 || cleanUsn.length > 11 || !/^[A-Z0-9]{10,11}$/.test(cleanUsn)) {
      alert(`Team Member ${i}: Please enter a valid University USN format (e.g. ENG24DS0018 or 1DS23AI001). It must contain exactly 10 to 11 alphanumeric characters.`);
      document.getElementById(`m${i}-usn`).focus();
      return false;
    }

    // Strict WhatsApp Phone Validation: exactly 10 numeric digits
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^\d{10}$/.test(cleanPhone)) {
      alert(`Team Member ${i}: Please enter a valid 10-digit WhatsApp contact number (numbers only, e.g. 9876543210).`);
      document.getElementById(`m${i}-phone`).focus();
      return false;
    }

    if (!snack) {
      alert(`Please select a Snack Pack for Team Member ${i}.`);
      return false;
    }
  }

  return true;
}

function calculateRegistrationPricing() {
  const pack1Price = state.snackPricing.pack1; // ₹135
  const pack2Price = state.snackPricing.pack2; // ₹240
  let total = 0;

  for (let i = 1; i <= 3; i++) {
    const checked = document.querySelector(`input[name="member-${i}-snack"]:checked`);
    if (checked) {
      const priceTag = document.getElementById(`m${i}-price-display`);
      const isPack2 = checked.value === 'pack2';
      const cost = isPack2 ? pack2Price : pack1Price;
      total += cost;
      if (priceTag) priceTag.innerText = `₹${cost}`;
    }
  }

  const summaryTotal = document.getElementById('summary-total-price');
  if (summaryTotal) summaryTotal.innerText = `₹${total}`;
  return total;
}

function populateReviewStep() {
  const teamName = document.getElementById('input-team-name').value.trim();
  document.getElementById('review-team-name').innerText = teamName;

  // Selected events
  const selectedEventNames = Array.from(state.selectedCompetitions).map(id => {
    const e = state.events.find(ev => ev.id === id);
    return e ? `${e.name} (${e.dayNumber === 1 ? '16 Nov' : '17 Nov'})` : id;
  });
  document.getElementById('review-events-list').innerHTML = selectedEventNames.map(n => `<li>${n}</li>`).join('');

  // Members breakdown
  const membersListEl = document.getElementById('review-members-breakdown');
  let membersHtml = '';
  let calculatedTotal = 0;

  for (let i = 1; i <= 3; i++) {
    const name = document.getElementById(`m${i}-name`).value.trim();
    const usn = document.getElementById(`m${i}-usn`).value.trim().toUpperCase();
    const sem = document.getElementById(`m${i}-sem`).value.trim();
    const phone = document.getElementById(`m${i}-phone`).value.trim();
    const snackVal = document.querySelector(`input[name="member-${i}-snack"]:checked`).value;
    const isPack2 = snackVal === 'pack2';
    const snackCost = isPack2 ? state.snackPricing.pack2 : state.snackPricing.pack1;
    const snackName = isPack2 ? 'Snack Pack 2 (Diet Coke Combo)' : 'Snack Pack 1 (Juice & Ice-Cream Combo)';
    calculatedTotal += snackCost;

    membersHtml += `
      <div style="background: rgba(14, 18, 28, 0.7); border: 1px solid var(--border-light); border-radius: 14px; padding: 0.95rem 1.15rem; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <strong style="font-size: 0.95rem; color: #FFFFFF;">Member ${i}: ${name}</strong>
          <span style="font-size: 0.82rem; font-weight: 800; color: #34D399;">${snackName} (₹${snackCost})</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted);">USN: ${usn} | Sem: ${sem} | Ph: ${phone}</p>
      </div>
    `;
  }

  membersListEl.innerHTML = membersHtml;
  document.getElementById('review-final-amount').innerText = `₹${calculatedTotal}`;
}

// ==================== CASHFREE PAYMENTS GATEWAY CHECKOUT ====================
async function initiateCashfreeCheckout() {
  const btn = document.getElementById('btn-proceed-payment');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Creating Cashfree Session... ⏳';
  }

  const teamName = document.getElementById('input-team-name').value.trim();
  const selectedCompetitions = Array.from(state.selectedCompetitions);
  const members = [];

  for (let i = 1; i <= 3; i++) {
    members.push({
      name: document.getElementById(`m${i}-name`).value.trim(),
      usn: document.getElementById(`m${i}-usn`).value.trim().toUpperCase(),
      semester: document.getElementById(`m${i}-sem`).value.trim(),
      phone: document.getElementById(`m${i}-phone`).value.trim(),
      email: document.getElementById(`m${i}-email`).value.trim(),
      snackPack: document.querySelector(`input[name="member-${i}-snack"]:checked`).value
    });
  }

  try {
    const res = await fetch('/api/register-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, selectedCompetitions, members })
    });

    const data = await res.json();

    if (!data.success) {
      alert(`Registration Initiation Error: ${data.message || 'Please try again.'}`);
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Proceed to Cashfree Checkout 💳';
      }
      return;
    }

    state.activeOrder = data;

    // Open Modal
    const modal = document.getElementById('cashfree-payment-modal');
    modal.classList.add('active');

    // Update modal details
    document.getElementById('cf-modal-amount').innerText = `₹${data.order_amount}`;
    document.getElementById('cf-order-id-label').innerText = `Session ID: ${data.order_id}`;
    document.getElementById('cf-modal-heading').innerText = 'Cashfree Checkout Active';
    document.getElementById('cf-modal-sub').innerText = 'Please complete your transaction via UPI, Cards, or Netbanking in the modal.';

    // Clear fallback UTR field & feedback
    const utrInput = document.getElementById('input-fallback-utr');
    if (utrInput) utrInput.value = '';
    const utrFeedback = document.getElementById('utr-feedback-msg');
    if (utrFeedback) utrFeedback.innerHTML = '';

    // Invoke Official Cashfree SDK
    try {
      if (window.Cashfree) {
        const cfMode = data.cashfreeEnvironment === 'PRODUCTION' ? 'production' : 'sandbox';
        const cashfree = window.Cashfree({ mode: cfMode });
        
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_modal"
        }).then(result => {
          console.log('[Cashfree Modal Action]:', result);
          checkOrderStatusOnce(data.order_id);
        });
      } else {
        console.warn('Cashfree SDK not loaded in browser; auto-polling observer enabled.');
      }
    } catch (cfErr) {
      console.warn('Cashfree modal launch notice:', cfErr);
    }

    // Start Real-Time Order Status Polling (checks every 2 seconds for Webhook / UTR confirmation)
    startOrderStatusPolling(data.order_id);

  } catch (err) {
    console.error('Error initiating checkout:', err);
    alert('Failed to connect to Cashfree payment engine. Please check your network.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Proceed to Cashfree Checkout 💳';
    }
  }
}

// ==================== AUTO-STATUS POLLING ENGINE ====================
function startOrderStatusPolling(orderId) {
  if (state.orderPollInterval) clearInterval(state.orderPollInterval);

  state.orderPollInterval = setInterval(() => {
    checkOrderStatusOnce(orderId);
  }, 2000);
}

async function checkOrderStatusOnce(orderId) {
  if (!orderId) return;

  try {
    const res = await fetch(`/api/order-status/${orderId}`);
    const data = await res.json();

    if (data.success && data.isPaid) {
      if (state.orderPollInterval) clearInterval(state.orderPollInterval);
      
      const modal = document.getElementById('cashfree-payment-modal');
      if (modal) modal.classList.remove('active');

      if (data.status === 'OVER_CAPACITY' || data.overCapacity) {
        showOverCapacityAlert(data.registration);
      } else {
        showRegistrationSuccess(data.registration);
      }
    }
  } catch (e) {
    // transient network retry
  }
}

// ==================== CASHFREE MODAL & FALLBACK UTR LISTENERS ====================
function setupCashfreeModalListeners() {
  const modal = document.getElementById('cashfree-payment-modal');
  const closeBtn = document.getElementById('close-cashfree-modal');
  const btnVerifyUtr = document.getElementById('btn-self-verify-utr');
  const utrInput = document.getElementById('input-fallback-utr');
  const utrFeedback = document.getElementById('utr-feedback-msg');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (btnVerifyUtr) {
    btnVerifyUtr.addEventListener('click', async () => {
      const utrVal = utrInput.value.trim();

      if (!/^\d{12}$/.test(utrVal)) {
        utrFeedback.innerHTML = '<span style="color: #F87171; font-weight: 700;">⚠️ Please enter a valid 12-digit numeric UPI UTR/Ref Number.</span>';
        utrInput.focus();
        return;
      }

      if (!state.activeOrder || !state.activeOrder.order_id) {
        utrFeedback.innerHTML = '<span style="color: #F87171; font-weight: 700;">⚠️ Order session not active. Please re-initiate checkout.</span>';
        return;
      }

      btnVerifyUtr.disabled = true;
      btnVerifyUtr.innerText = 'Verifying...';
      utrFeedback.innerHTML = '<span style="color: #38BDF8; font-weight: 700;">⏳ Verifying UTR with database &amp; observers...</span>';

      try {
        const res = await fetch('/api/verify-utr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: state.activeOrder.order_id,
            utrNumber: utrVal
          })
        });

        const data = await res.json();

        if (data.success) {
          if (data.overCapacity) {
            utrFeedback.innerHTML = '<span style="color: #F59E0B; font-weight: 800;">⚠️ Payment logged! Arena slot filled moments earlier &bull; Priority review...</span>';
            if (state.orderPollInterval) clearInterval(state.orderPollInterval);

            setTimeout(() => {
              modal.classList.remove('active');
              showOverCapacityAlert(data.registration);
            }, 1200);
          } else {
            utrFeedback.innerHTML = '<span style="color: #34D399; font-weight: 800;">✓ UTR Verified! Unlocking official pass...</span>';
            if (state.orderPollInterval) clearInterval(state.orderPollInterval);

            setTimeout(() => {
              modal.classList.remove('active');
              showRegistrationSuccess(data.registration);
            }, 1200);
          }
        } else {
          utrFeedback.innerHTML = `<span style="color: #F87171; font-weight: 700;">❌ ${data.message || 'UTR verification failed.'}</span>`;
        }
      } catch (err) {
        utrFeedback.innerHTML = '<span style="color: #F87171; font-weight: 700;">❌ Server error verifying UTR. Please retry.</span>';
      } finally {
        btnVerifyUtr.disabled = false;
        btnVerifyUtr.innerText = 'Verify UTR →';
      }
    });
  }
}

// ==================== DIGITAL CONFIRMATION PASS ====================
function showRegistrationSuccess(reg) {
  state.currentRegData = reg;
  document.querySelectorAll('.reg-step-card').forEach(c => c.style.display = 'none');
  const successCard = document.getElementById('reg-success-card');
  if (!successCard) return;

  successCard.style.display = 'block';

  document.getElementById('success-reg-id').innerText = reg.id || 'TGF-2026-CONFIRMED';
  document.getElementById('success-team-name').innerText = reg.teamName || document.getElementById('input-team-name').value;
  document.getElementById('success-total-paid').innerText = `₹${reg.totalAmount}`;
  document.getElementById('success-pay-id').innerText = reg.utrNumber || reg.paymentId || 'CF_VERIFIED_PAID';

  const compNames = (reg.selectedCompetitions || Array.from(state.selectedCompetitions)).map(cid => {
    const e = state.events.find(ev => ev.id === cid);
    return e ? e.name : cid;
  }).join(', ');
  document.getElementById('success-events-list').innerText = compNames;

  // Render members list
  const members = reg.members || [];
  document.getElementById('success-members-list').innerHTML = members.map((m, idx) => `
    <li><strong>Member ${idx + 1}:</strong> ${m.name} (${m.usn}, ${m.semester}) &bull; Refreshment: ${m.snackPack === 'pack1' ? 'Pack 1 (Juice Combo)' : 'Pack 2 (Diet Coke Combo)'} (₹${m.snackPrice})</li>
  `).join('');

  // Print button
  document.getElementById('btn-print-pass').onclick = () => {
    window.print();
  };

  // Reset / Register another
  document.getElementById('btn-register-another').onclick = () => {
    resetRegistrationForm();
  };

  window.scrollTo({ top: successCard.offsetTop - 80, behavior: 'smooth' });
}

// ==================== OVERCAPACITY PRIORITY RESOLUTION CARD ====================
function showOverCapacityAlert(reg) {
  state.currentRegData = reg;
  document.querySelectorAll('.reg-step-card').forEach(c => c.style.display = 'none');
  const alertCard = document.getElementById('reg-overcapacity-card');
  if (!alertCard) return;

  alertCard.style.display = 'block';

  document.getElementById('overcapacity-reg-id').innerText = reg.id || 'TGF-2026-PRIORITY';
  document.getElementById('overcapacity-team-name').innerText = reg.teamName || document.getElementById('input-team-name').value;
  document.getElementById('overcapacity-total-paid').innerText = `₹${reg.totalAmount}`;
  document.getElementById('overcapacity-pay-id').innerText = reg.utrNumber || reg.paymentId || 'CF_UTR_LOGGED';

  const fullComps = reg.overCapacityEvents || [];
  const compNames = fullComps.length > 0 
    ? fullComps.join(', ')
    : (reg.selectedCompetitions || Array.from(state.selectedCompetitions)).map(cid => {
        const e = state.events.find(ev => ev.id === cid);
        return e ? e.name : cid;
      }).join(', ');

  document.getElementById('overcapacity-events-list').innerText = compNames;

  const btnBack = document.getElementById('btn-overcapacity-back');
  if (btnBack) {
    btnBack.onclick = () => {
      resetRegistrationForm();
      navigateTo('home');
    };
  }

  window.scrollTo({ top: alertCard.offsetTop - 80, behavior: 'smooth' });
}

function resetRegistrationForm() {
  state.selectedCompetitions.clear();
  state.activeOrder = null;
  if (state.orderPollInterval) clearInterval(state.orderPollInterval);

  document.getElementById('input-team-name').value = '';
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`m${i}-name`).value = '';
    document.getElementById(`m${i}-usn`).value = '';
    document.getElementById(`m${i}-sem`).value = '3rd Sem';
    document.getElementById(`m${i}-phone`).value = '';
    document.getElementById(`m${i}-email`).value = '';
    const defPack = document.querySelector(`input[name="member-${i}-snack"][value="pack1"]`);
    if (defPack) defPack.checked = true;
    document.querySelectorAll(`input[name="member-${i}-snack"]`).forEach(r => {
      r.closest('.snack-radio-label').classList.remove('selected');
    });
    if (defPack) defPack.closest('.snack-radio-label').classList.add('selected');
  }

  document.getElementById('reg-success-card').style.display = 'none';
  const overCard = document.getElementById('reg-overcapacity-card');
  if (overCard) overCard.style.display = 'none';

  setRegStep(1);
  renderCompSelector();
  calculateRegistrationPricing();
}
