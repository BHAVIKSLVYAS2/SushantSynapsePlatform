const DEFAULT_MINUTES = 25;
const DURATION_KEY = 'synapse-focus-duration-v1';
const PRESET_MINUTES = [15, 25, 50];

function validMinutes(value) {
  return Number.isInteger(value) && value >= 5 && value <= 120;
}

export function mountFocusTimer(root = document) {
  const display = root.getElementById('timer');
  const start = root.getElementById('startBtn');
  const pause = root.getElementById('pauseBtn');
  const reset = root.getElementById('resetBtn');
  const status = root.getElementById('focus-status');
  if (!display || !start || !pause || !reset || !status) return;

  const heading = root.getElementById('focus-heading');
  const durationControls = root.getElementById('duration-controls');
  const durationButtons = [...root.querySelectorAll('[data-focus-minutes]')];
  const customPanel = root.getElementById('custom-duration');
  const customInput = root.getElementById('custom-minutes');
  const applyDuration = root.getElementById('apply-duration');
  const view = root.defaultView || display.ownerDocument?.defaultView;

  let selectedMinutes = DEFAULT_MINUTES;
  try {
    const saved = view?.localStorage.getItem(DURATION_KEY);
    if (saved && /^\d{1,3}$/.test(saved) && validMinutes(Number(saved))) selectedMinutes = Number(saved);
  } catch { /* The timer works when browser storage is unavailable. */ }

  let interval;
  let timeLeft = selectedMinutes * 60;
  let deadline = 0;
  let isRunning = false;
  let sessionActive = false;
  let customOpen = !PRESET_MINUTES.includes(selectedMinutes);

  function readyStatus() {
    return `Ready for ${selectedMinutes} minutes of focus, followed by a little break.`;
  }

  function updateDisplay() {
    const seconds = Math.ceil(timeLeft);
    display.textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    if (heading) heading.textContent = `${selectedMinutes}-minute focus timer`;
    start.disabled = isRunning;
    pause.disabled = !isRunning;
    if (durationControls) durationControls.disabled = sessionActive;
    for (const button of durationButtons) {
      const isCustom = button.dataset.focusMinutes === 'custom';
      button.disabled = sessionActive;
      button.setAttribute('aria-pressed', String(isCustom ? !PRESET_MINUTES.includes(selectedMinutes) : Number(button.dataset.focusMinutes) === selectedMinutes));
      if (isCustom) button.setAttribute('aria-expanded', String(customOpen));
    }
    if (customPanel) customPanel.hidden = !customOpen;
    if (customInput) customInput.disabled = sessionActive;
    if (applyDuration) applyDuration.disabled = sessionActive;
  }

  function chooseDuration(minutes) {
    if (sessionActive || !validMinutes(minutes)) return;
    selectedMinutes = minutes;
    timeLeft = minutes * 60;
    if (customInput) {
      customInput.value = String(minutes);
      customInput.removeAttribute('aria-invalid');
    }
    status.textContent = readyStatus();
    try {
      view.localStorage.setItem(DURATION_KEY, String(minutes));
    } catch {
      status.textContent += ' Your duration could not be saved; it works for this visit.';
    }
    updateDisplay();
  }

  function tick() {
    timeLeft = Math.max(0, (deadline - Date.now()) / 1000);
    if (timeLeft === 0) {
      clearInterval(interval);
      isRunning = false;
      sessionActive = false;
      status.textContent = 'Focus session complete! Time for a micro-rest. Choose a break below.';
    }
    updateDisplay();
  }

  start.addEventListener('click', () => {
    if (isRunning) return;
    if (timeLeft === 0) timeLeft = selectedMinutes * 60;
    deadline = Date.now() + timeLeft * 1000;
    isRunning = true;
    sessionActive = true;
    status.textContent = 'Focus session running. You can pause whenever you need.';
    interval = setInterval(tick, 250);
    updateDisplay();
  });
  pause.addEventListener('click', () => {
    if (!isRunning) return;
    tick();
    clearInterval(interval);
    if (timeLeft > 0) status.textContent = 'Paused. Start resumes your remaining time.';
    isRunning = false;
    updateDisplay();
  });
  reset.addEventListener('click', () => {
    clearInterval(interval);
    isRunning = false;
    sessionActive = false;
    timeLeft = selectedMinutes * 60;
    status.textContent = readyStatus();
    updateDisplay();
  });

  for (const button of durationButtons) {
    button.addEventListener('click', () => {
      if (sessionActive) return;
      if (button.dataset.focusMinutes === 'custom') {
        customOpen = !customOpen;
        updateDisplay();
        if (customOpen && customInput) customInput.focus();
        return;
      }
      customOpen = false;
      chooseDuration(Number(button.dataset.focusMinutes));
    });
  }

  function applyCustomDuration() {
    if (sessionActive || !customInput) return;
    const minutes = Number(customInput.value);
    if (!validMinutes(minutes)) {
      customInput.setAttribute('aria-invalid', 'true');
      status.textContent = 'Choose a whole number of minutes from 5 to 120.';
      customInput.focus();
      return;
    }
    chooseDuration(minutes);
  }
  applyDuration?.addEventListener('click', applyCustomDuration);
  customInput?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    applyCustomDuration();
  });
  if (customInput) customInput.value = String(selectedMinutes);
  status.textContent = readyStatus();
  root.addEventListener('visibilitychange', () => { if (isRunning) tick(); });
  updateDisplay();
}
