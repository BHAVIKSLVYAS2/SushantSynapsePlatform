import {mountPresentation} from '/shared/presentation.mjs?v=20261016-tools';

import {mountFocusTimer} from './focus-timer.mjs';
import {validatePlan,mergeBackup} from './backups.mjs?v=20261016-wins';
import {emptyPlan, orderedTasks, updatePlan} from './task-model.mjs';

mountFocusTimer();
const $ = id => document.getElementById(id);
const today = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata'}).format(new Date());
const PRIORITIES = ['High', 'Normal', 'Low'];
const STORAGE_KEY = 'synapse-focus-plan-v1';
let plan = emptyPlan(), storageReady = false, busy = false, selected = null;
let editing = null, drag = null, removedPlan = null;
$('plan-date').value = today();

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function readPlan() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return emptyPlan();
  const value = JSON.parse(raw);
  const invalid = () => { throw Error('Stored task data could not be read. Your saved data has been kept.'); };
  if (!value || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !Array.isArray(value.tasks) || value.tasks.length > 500) invalid();
  const ids = new Set();
  for (const task of value.tasks) {
    if (!task || typeof task.id !== 'string' || ids.has(task.id)
      || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 160
      || typeof task.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(task.date)
      || typeof task.createdAt !== 'string' || typeof task.done !== 'boolean'
      || !PRIORITIES.includes(task.priority) || !Number.isInteger(task.minutes)
      || task.minutes < 5 || task.minutes > 240
      || (task.order !== undefined && (!Number.isSafeInteger(task.order) || task.order < 0))) invalid();
    ids.add(task.id);
  }
  return value;
}

function addButton(parent, text, action, label) {
  const button = node('button', text);
  button.type = 'button';
  button.disabled = busy || !storageReady;
  if (label) {
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  button.addEventListener('click', action);
  parent.append(button);
  return button;
}

function focusCard(id, selector) {
  const card = document.querySelector('.task-row[data-task-id="' + CSS.escape(id) + '"]');
  const control = card?.querySelector(selector);
  control?.focus();
  return Boolean(control && document.activeElement === control);
}

function taskRow(task, carry = false) {
  const card = node('li', undefined, 'task-row' + (task.done ? ' done' : '') + (selected === task.id ? ' selected' : ''));
  card.dataset.taskId = task.id;
  card.dataset.priority = task.priority;
  const top = node('div', undefined, 'task-top');
  const checkbox = node('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.disabled = busy || !storageReady;
  checkbox.setAttribute('aria-label', 'Complete ' + task.title);
  checkbox.addEventListener('change', () => {
    command({type: 'toggle', id: task.id, done: checkbox.checked});
    focusCard(task.id, 'input[type=checkbox]');
  });
  const title = node('h4', task.title, 'task-title');
  const checkTarget = node('label', undefined, 'check-target');
  checkTarget.append(checkbox);
  top.append(checkTarget, title);
  if (!task.done && !carry) {
    const handle = node('button', undefined, 'drag-handle');
    handle.type = 'button';
    handle.disabled = busy || !storageReady;
    handle.setAttribute('aria-label', 'Drag ' + task.title);
    handle.title = 'Drag to a priority or a new position. You can also use the controls below.';
    const dots = node('span', '\u283f');
    dots.setAttribute('aria-hidden', 'true');
    handle.append(dots);
    handle.addEventListener('pointerdown', event => beginDrag(event, task, handle, card));
    handle.addEventListener('pointermove', moveDrag);
    handle.addEventListener('pointerup', dropDrag);
    handle.addEventListener('pointercancel', () => finishDrag());
    handle.addEventListener('lostpointercapture', () => finishDrag());
    handle.addEventListener('click', event => {
      if (event.detail === 0 && !drag) $('task-status').textContent = 'Drag to move a task, or use its priority and Up / Down controls.';
    });
    top.append(handle);
  }
  card.append(top);
  const badges = node('div', undefined, 'task-badges');
  badges.append(node('span', task.priority + ' priority', 'priority-badge'),
    node('span', task.minutes + ' min', 'estimate-badge'));
  if (carry) badges.append(node('span', task.date, 'date-badge'));
  if (selected === task.id && !task.done) badges.append(node('span', 'Current task', 'focus-badge'));
  card.append(badges);
  const actions = node('div', undefined, 'task-actions');
  if (carry) addButton(actions, 'Bring to this day', () => command({type: 'move', id: task.id, date: $('plan-date').value}));
  if (!task.done) addButton(actions, 'Focus on this', () => {
    selected = task.id;
    draw();
    $('startBtn').focus();
  });
  addButton(actions, 'Edit', () => openEditor(task)).dataset.taskAction = 'edit';
  addButton(actions, 'Remove', () => command({type: 'delete', id: task.id}));
  card.append(actions);

  if (!task.done && !carry) {
    const controls = node('div', undefined, 'task-reorder');
    const label = node('label', 'Priority');
    const choice = node('select');
    choice.dataset.reorder = 'priority';
    choice.setAttribute('aria-label', 'Priority for ' + task.title);
    choice.disabled = busy || !storageReady;
    for (const priority of PRIORITIES) {
      const option = node('option', priority);
      option.value = priority;
      choice.append(option);
    }
    choice.value = task.priority;
    choice.addEventListener('change', () => {
      command({type: 'reorder', id: task.id, priority: choice.value},
        'Moved ' + task.title + ' to ' + choice.value + ' priority.');
      focusCard(task.id, '[data-reorder=priority]');
    });
    label.append(choice);
    controls.append(label);
    const peers = orderedTasks(plan.tasks.filter(item => !item.done && item.date === task.date && item.priority === task.priority));
    const index = peers.findIndex(item => item.id === task.id);
    const moves = node('div', undefined, 'task-move-buttons');
    const up = addButton(moves, 'Up', () => {
      command({type: 'reorder', id: task.id, priority: task.priority, beforeId: peers[index - 1]?.id},
        'Moved ' + task.title + ' up.');
      focusCard(task.id, '.drag-handle');
    }, 'Move up ' + task.title);
    up.dataset.reorder = 'up';
    up.disabled ||= index === 0;
    const down = addButton(moves, 'Down', () => {
      command({type: 'reorder', id: task.id, priority: task.priority, beforeId: peers[index + 2]?.id ?? null},
        'Moved ' + task.title + ' down.');
      focusCard(task.id, '.drag-handle');
    }, 'Move down ' + task.title);
    down.dataset.reorder = 'down';
    down.disabled ||= index === peers.length - 1;
    controls.append(moves);
    card.append(controls);
  }
  return card;
}

function draw() {
  finishDrag();
  const day = $('plan-date').value;
  const tasks = plan.tasks.filter(task => task.date === day);
  const done = tasks.filter(task => task.done).length;
  const planned = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const remaining = tasks.filter(task => !task.done).reduce((sum, task) => sum + task.minutes, 0);
  const current = plan.tasks.find(task => task.id === selected && !task.done);
  if (!current) selected = null;
  $('current-task').textContent = current ? 'Focusing on: ' + current.title : 'Choose a task, or start an open focus session.';
  $('summary').textContent = storageReady
    ? done + ' of ' + tasks.length + ' complete - ' + planned + ' min planned - ' + remaining + ' min remaining'
    : 'Tasks save in this browser. No sign-in needed.';
  if ($('day-progress')) {
    $('day-progress').max = tasks.length || 1;
    $('day-progress').value = done;
    $('day-progress').setAttribute('aria-valuetext', done + ' of ' + tasks.length + ' tasks complete');
  }
  $('task-list').replaceChildren();
  for (const priority of PRIORITIES) {
    const rows = orderedTasks(tasks.filter(task => !task.done && task.priority === priority));
    const section = node('section', undefined, 'priority-lane');
    section.dataset.priority = priority;
    const heading = node('header', undefined, 'lane-heading');
    const title = node('h3', priority);
    title.id = 'priority-heading-' + priority.toLowerCase();
    section.setAttribute('aria-labelledby', title.id);
    heading.append(title, node('span', String(rows.length), 'lane-count'),
      node('span', rows.reduce((sum, task) => sum + task.minutes, 0) + ' min planned', 'lane-meta'));
    const list = node('ul', undefined, 'priority-list');
    list.setAttribute('aria-label', priority + ' priority tasks');
    for (const task of rows) list.append(taskRow(task));
    if (!rows.length) list.append(node('li', 'No tasks here. Drag a card here or choose this priority when adding a task.', 'lane-empty'));
    section.append(heading, list);
    $('task-list').append(section);
  }
  $('completed-list').replaceChildren();
  for (const task of orderedTasks(tasks.filter(task => task.done))) $('completed-list').append(taskRow(task));
  $('completed-section').hidden = done === 0;
  $('carry-list').replaceChildren();
  const carry = orderedTasks(plan.tasks.filter(task => !task.done && task.date < day));
  for (const task of carry) $('carry-list').append(taskRow(task, true));
  $('carry-section').hidden = !storageReady || carry.length === 0;
  $('empty-list').hidden = !storageReady || tasks.length > 0;
  $('task-form').querySelector('button[type=submit]').disabled = busy || !storageReady;
}

function command(input, successMessage = 'Saved in this browser.') {
  if (busy || !storageReady) return false;
  busy = true;
  let saved = false;
  try {
    const current = readPlan();
    const next = updatePlan(current, {...input, revision: plan.revision});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    removedPlan=input.type==='delete'?{before:current,revision:next.revision}:null;
    undoRemove.hidden=!removedPlan;
    plan = next;
    saved = true;
    $('task-status').textContent = successMessage;
    if (input.type === 'add') $('task-form').elements.title.value = '';
  } catch (error) {
    $('task-status').textContent = error.status ? error.message : 'Unable to save in browser storage. Your existing tasks have been kept.';
    if (error.status === 409) {
      try { plan = readPlan(); } catch {}
    }
  } finally {
    busy = false;
    draw();
  }
  return saved;
}

function openEditor(task) {
  editing = task.id;
  const form = $('edit-task-form');
  for (const name of ['title', 'priority', 'minutes', 'date']) form.elements[name].value = task[name];
  $('edit-error').textContent = '';
  $('task-dialog').showModal();
  form.elements.title.focus();
}

$('edit-task-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (command({type: 'edit', id: editing, title: form.elements.title.value,
    priority: form.elements.priority.value, minutes: Number(form.elements.minutes.value), date: form.elements.date.value})) {
    $('task-dialog').close();
  } else {
    $('edit-error').textContent = $('task-status').textContent;
  }
});
$('task-dialog').querySelector('[data-edit-cancel]').addEventListener('click', () => $('task-dialog').close());
$('task-dialog').addEventListener('close', () => {
  if (!focusCard(editing, '[data-task-action=edit]')) $('plan-date').focus();
  editing = null;
});

function clearDropMarks() {
  for (const element of $('task-list').querySelectorAll('.drop-target, .drop-before')) {
    element.classList.remove('drop-target', 'drop-before');
  }
}

function updateDropTarget() {
  if (!drag?.active) return;
  clearDropMarks();
  const section = document.elementFromPoint(drag.x, drag.y)?.closest('.priority-lane');
  if (!section || !$('task-list').contains(section)) {
    drag.target = null;
    return;
  }
  const candidates = [...section.querySelectorAll('.task-row')].filter(card => card.dataset.taskId !== drag.id);
  const before = candidates.find(card => {
    const box = card.getBoundingClientRect();
    return drag.y < box.top + box.height / 2;
  });
  section.classList.add('drop-target');
  before?.classList.add('drop-before');
  drag.target = {priority: section.dataset.priority, beforeId: before?.dataset.taskId ?? null};
}

function dragFrame() {
  if (!drag?.active) return;
  const margin = 72;
  let scroll = 0;
  if (drag.y > innerHeight - margin) scroll = Math.min(18, (drag.y - innerHeight + margin) / 3);
  else if (drag.y < margin + 72) scroll = -Math.min(18, (margin + 72 - drag.y) / 3);
  if (scroll) window.scrollBy(0, scroll);
  updateDropTarget();
  drag.frame = requestAnimationFrame(dragFrame);
}

function beginDrag(event, task, handle, card) {
  if (event.button !== 0 || busy || !storageReady) return;
  finishDrag();
  drag = {id: task.id, title: task.title, pointerId: event.pointerId, handle, card,
    startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false, target: null};
  handle.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= 6) {
    drag.active = true;
    drag.card.classList.add('dragging');
    drag.ghost = node('div', drag.title, 'drag-preview');
    drag.ghost.setAttribute('aria-hidden', 'true');
    document.body.append(drag.ghost);
    $('task-status').textContent = 'Moving ' + drag.title + '. Drop in a priority, or press Escape to cancel.';
    drag.frame = requestAnimationFrame(dragFrame);
  }
  if (drag.active) {
    event.preventDefault();
    drag.ghost.style.left = drag.x + 16 + 'px';
    drag.ghost.style.top = drag.y + 16 + 'px';
    updateDropTarget();
  }
}

function dropDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  if (!drag.active) {
    finishDrag();
    return;
  }
  event.preventDefault();
  drag.x = event.clientX;
  drag.y = event.clientY;
  updateDropTarget();
  const {id, title, target} = drag;
  finishDrag();
  if (target) command({type: 'reorder', id, ...target}, 'Moved ' + title + ' to ' + target.priority + ' priority.');
  else $('task-status').textContent = 'Move cancelled. Your task stayed in place.';
  focusCard(id, '.drag-handle');
}

function finishDrag() {
  if (!drag) return;
  const previous = drag;
  drag = null;
  cancelAnimationFrame(previous.frame);
  previous.ghost?.remove();
  previous.card.classList.remove('dragging');
  if (previous.handle.hasPointerCapture(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId);
  clearDropMarks();
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && drag) {
    const id = drag.id;
    finishDrag();
    $('task-status').textContent = 'Move cancelled. Your task stayed in place.';
    focusCard(id, '.drag-handle');
    event.preventDefault();
  }
});
window.addEventListener('blur', () => finishDrag());
document.addEventListener('visibilitychange', () => { if (document.hidden) finishDrag(); });

$('task-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  command({type: 'add', title: form.elements.title.value, date: $('plan-date').value,
    priority: form.elements.priority.value, minutes: Number(form.elements.minutes.value)});
});
$('plan-date').addEventListener('change', () => { if ($('plan-date').value) draw(); });
$('todayBtn').addEventListener('click', () => { $('plan-date').value = today(); draw(); });

function load() {
  try {
    plan = readPlan();
    storageReady = true;
  } catch {
    storageReady = false;
    $('task-status').textContent = 'Browser storage could not be read. Enable storage or check your saved data, then refresh. Your saved data has been kept.';
  }
  draw();
}
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) load();
});
load();

const backupTools=node('details');backupTools.className='backup-tools';
backupTools.append(node('summary','Keep a backup of your tasks'));
backupTools.append(node('p','Download all dates. Import merges new tasks without replacing existing tasks. Backups contain your task details; keep them somewhere private.'));
const exportPlan=node('button','Download task backup');exportPlan.type='button';
const importLabel=node('label','Import task backup (JSON)'),importPlan=document.createElement('input');importPlan.type='file';importPlan.accept='.json,application/json';importLabel.append(importPlan);backupTools.append(exportPlan,importLabel);$('tasks-heading').closest('section').append(backupTools);
const undoRemove=node('button','Undo task removal');undoRemove.type='button';undoRemove.id='undo-remove';undoRemove.hidden=true;$('task-status').after(undoRemove);
exportPlan.onclick=()=>{try{const saved=validatePlan(readPlan()),url=URL.createObjectURL(new Blob([JSON.stringify({format:'synapse-focus-v1',plan:saved},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='focus-tasks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('task-status').textContent='Task backup downloaded.';}catch(e){$('task-status').textContent=e.message;}};
importPlan.onchange=async()=>{try{const file=importPlan.files[0];if(!file)return;if(file.size>500000)throw Error('Use a backup under 500 KB.');const data=JSON.parse(await file.text()),current=readPlan(),next=mergeBackup(current,data),added=next.tasks.length-current.tasks.length;if(!added){$('task-status').textContent='These tasks are already in your plan.';return;}if(!confirm('Add '+added+' tasks from this backup? Existing tasks will be kept.'))return;if(readPlan().revision!==current.revision)throw Error('Your plan changed. Import again.');localStorage.setItem(STORAGE_KEY,JSON.stringify(next));plan=next;storageReady=true;removedPlan=null;undoRemove.hidden=true;draw();$('task-status').textContent=added+' tasks imported.';}catch(e){$('task-status').textContent=e.message;}finally{importPlan.value='';}};
undoRemove.onclick=()=>{try{if(!removedPlan)return;const current=readPlan();if(current.revision!==removedPlan.revision)throw Error('Your plan changed. Removal can no longer be undone.');const next=validatePlan({...removedPlan.before,revision:current.revision+1});localStorage.setItem(STORAGE_KEY,JSON.stringify(next));plan=next;draw();$('task-status').textContent='Task restored.';}catch(e){$('task-status').textContent=e.message;}finally{removedPlan=null;undoRemove.hidden=true;}};

mountPresentation(document.querySelector('.focus-timer'),{label:'Distraction-free focus'});
