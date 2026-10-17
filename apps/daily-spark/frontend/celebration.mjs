// A short, local celebration shared by Make 24 and the Break game results.
// It never creates a score or sends a request.
export function createSparkCelebration(root, {resultSelector = '#result', titleSelector = '#result-title'} = {}) {
  const document = root.ownerDocument, view = document.defaultView;
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['mint', 'gold', 'coral', 'sky', 'lilac'];
  let overlay = null, timer = null;
  const animations = new Set();

  function clear() {
    view.clearTimeout(timer);
    timer = null;
    for (const animation of animations) animation.cancel();
    animations.clear();
    overlay?.remove();
    overlay = null;
  }

  function visible() {
    return root.isConnected && !document.hidden && !root.closest('[hidden]');
  }

  function piece(className, x, y, color) {
    const element = document.createElement('span');
    element.className = className;
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    if (color) element.style.setProperty('--spark-piece-color', 'var(--spark-pop-' + color + ')');
    overlay.append(element);
    return element;
  }

  function animate(element, frames, options) {
    animations.add(element.animate(frames, {...options, fill: 'both'}));
  }

  function celebrate() {
    clear();
    if (!visible()) return;
    const result = root.querySelector(resultSelector);
    const title = root.querySelector(titleSelector);
    // Bring the achievement into view on small phones without opening a modal.
    title?.focus({preventScroll: true});
    result?.scrollIntoView({block: 'center', behavior: motion.matches ? 'instant' : 'smooth'});
    if (motion.matches || typeof view.Element.prototype.animate !== 'function') return;

    overlay = document.createElement('div');
    overlay.className = 'spark-party-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.append(overlay);
    const width = view.innerWidth, height = view.innerHeight;
    const count = width < 600 ? 24 : 34;
    const range = Math.min(width * .65, 680);

    for (const side of [-1, 1]) {
      const originX = side < 0 ? width * .08 : width * .92;
      const originY = height * .8;
      const popper = piece('spark-popper', originX, originY);
      popper.textContent = '\u{1f389}';
      const mirror = side < 0 ? 1 : -1;
      animate(popper, [
        {transform: 'translate(-50%, -50%) scaleX(' + mirror + ') scale(.6)', opacity: 0},
        {offset: .2, transform: 'translate(-50%, -50%) scaleX(' + mirror + ') scale(1.18)', opacity: 1},
        {offset: .65, transform: 'translate(-50%, -50%) scaleX(' + mirror + ') scale(1)', opacity: 1},
        {transform: 'translate(-50%, -50%) scaleX(' + mirror + ') scale(.9)', opacity: 0},
      ], {duration: 1100, easing: 'ease-out'});

      for (let index = 0; index < count; index++) {
        const confetti = piece('spark-confetti' + (index % 3 === 0 ? ' spark-confetti-round' : ''),
          originX, originY, colors[index % colors.length]);
        const dx = -side * (40 + Math.random() * range);
        const rise = 140 + Math.random() * Math.min(height * .58, 440);
        const turn = (index % 2 ? -1 : 1) * (160 + Math.random() * 500);
        animate(confetti, [
          {transform: 'translate(-50%, -50%) scale(.4)', opacity: 0},
          {offset: .08, opacity: 1},
          {offset: .55, transform: 'translate(' + dx * .65 + 'px, ' + -rise + 'px) rotate(' + turn * .55 + 'deg)', opacity: 1},
          {transform: 'translate(' + dx + 'px, ' + (height * .25 + 80) + 'px) rotate(' + turn + 'deg)', opacity: 0},
        ], {duration: 1900 + Math.random() * 500, delay: Math.random() * 160, easing: 'cubic-bezier(.12,.6,.35,1)'});
      }
    }

    for (const [x, y, delay] of [[.26, .28, 100], [.74, .2, 400], [.52, .43, 700]]) {
      const radius = Math.min(width * .19, 130);
      const ring = piece('spark-firework-ring', width * x, height * y, colors[Math.round(x * 10) % colors.length]);
      animate(ring, [
        {transform: 'translate(-50%, -50%) scale(.1)', opacity: .7},
        {transform: 'translate(-50%, -50%) scale(1)', opacity: 0},
      ], {duration: 950, delay, easing: 'ease-out'});
      for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 6;
        const spark = piece('spark-firework-spark', width * x, height * y, colors[index % colors.length]);
        const dx = Math.cos(angle) * radius, dy = Math.sin(angle) * radius;
        animate(spark, [
          {transform: 'translate(-50%, -50%) rotate(' + (index * 30 + 90) + 'deg) scale(.2)', opacity: 0},
          {offset: .15, opacity: 1},
          {transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + (index * 30 + 90) + 'deg) scale(.65)', opacity: 0},
        ], {duration: 1050, delay, easing: 'ease-out'});
      }
    }
    timer = view.setTimeout(clear, 2850);
  }

  // Preserve in-tab game progress while immediately stopping effects when the
  // hub hides this game, the user changes tabs, or motion preferences change.
  const observer = new view.MutationObserver(() => { if (!visible()) clear(); });
  for (let ancestor = root; ancestor; ancestor = ancestor.parentElement) {
    observer.observe(ancestor, {attributes: true, attributeFilter: ['hidden']});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  motion.addEventListener('change', () => { if (motion.matches) clear(); });
  view.addEventListener('pagehide', clear);
  return {celebrate, clear};
}
