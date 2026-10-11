const SESSION_SECONDS = 25 * 60;

export function mountFocusTimer(root = document) {
  const display = root.getElementById('timer');
  const start = root.getElementById('startBtn');
  const pause = root.getElementById('pauseBtn');
  const reset = root.getElementById('resetBtn');
  const status = root.getElementById('focus-status');
  if (!display || !start || !pause || !reset || !status) return;

  let interval;
  let timeLeft = SESSION_SECONDS;
  let deadline = 0;
  let isRunning = false;

  function updateDisplay() {
    const seconds = Math.ceil(timeLeft);
    display.textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    start.disabled = isRunning;
    pause.disabled = !isRunning;
  }

  function tick() {
    timeLeft = Math.max(0, (deadline - Date.now()) / 1000);
    if (timeLeft === 0) {
      clearInterval(interval);
      isRunning = false;
      status.textContent = 'Focus session complete! Time for a micro-rest. Choose a break below.';
    }
    updateDisplay();
  }

  start.addEventListener('click', () => {
    if (isRunning) return;
    if (timeLeft === 0) timeLeft = SESSION_SECONDS;
    deadline = Date.now() + timeLeft * 1000;
    isRunning = true;
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
    timeLeft = SESSION_SECONDS;
    status.textContent = 'Ready for 25 minutes of focus, followed by a little break.';
    updateDisplay();
  });
  root.addEventListener('visibilitychange', () => { if (isRunning) tick(); });
  updateDisplay();
}
