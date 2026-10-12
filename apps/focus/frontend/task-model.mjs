
const PRIORITIES = ['High', 'Normal', 'Low'];
const fail = (status, message) => { throw Object.assign(Error(message), {status}); };

export const emptyPlan = () => ({revision: 0, tasks: []});

// Older saved tasks have no order field. Preserve their creation order until
// their lane changes, without migrating or replacing their stored plan.
export function orderedTasks(rows) {
  return [...rows].sort((a, b) => Number(a.done) - Number(b.done)
    || PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
    || (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
    || a.createdAt.localeCompare(b.createdAt));
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || !Number.isFinite(Date.parse(value + 'T00:00:00Z'))
    || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) {
    fail(400, 'Choose a valid date');
  }
  return value;
}

function validTitle(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 160) {
    fail(400, 'Enter a task of up to 160 characters');
  }
  return value.trim();
}

function validPriority(value) {
  if (!PRIORITIES.includes(value)) fail(400, 'Choose a valid priority');
  return value;
}

function validMinutes(value) {
  if (!Number.isInteger(value) || value < 5 || value > 240) fail(400, 'Estimate between 5 and 240 minutes');
  return value;
}

function lane(tasks, date, priority, excludeId) {
  return orderedTasks(tasks.filter(task => !task.done && task.date === date
    && task.priority === priority && task.id !== excludeId));
}

function setOrder(tasks) {
  tasks.forEach((task, index) => { task.order = index; });
}

function checkDayCapacity(plan, task, date) {
  if (date !== task.date && plan.tasks.filter(item => item.date === date).length >= 100) {
    fail(409, 'Plan up to 100 tasks per day.');
  }
}

function moveToLane(plan, task, date, priority) {
  if (task.date === date && task.priority === priority) return;
  const previousDate = task.date, previousPriority = task.priority;
  const destination = lane(plan.tasks, date, priority, task.id);
  task.date = date;
  task.priority = priority;
  if (!task.done) {
    setOrder(lane(plan.tasks, previousDate, previousPriority));
    setOrder([...destination, task]);
  }
}

export function updatePlan(current, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Invalid task command');
  if (!Number.isSafeInteger(input.revision) || input.revision !== current.revision) {
    fail(409, 'Your task list changed. Reload and try again.');
  }
  const plan = structuredClone(current);

  if (input.type === 'add') {
    if (plan.tasks.length >= 500) fail(409, 'Your list holds up to 500 tasks. Remove older completed tasks first.');
    const day = validDate(input.date);
    if (plan.tasks.filter(task => task.date === day).length >= 100) fail(409, 'Plan up to 100 tasks per day.');
    const task = {
      id: crypto.randomUUID(), title: validTitle(input.title), date: day,
      priority: validPriority(input.priority), minutes: validMinutes(input.minutes),
      done: false, createdAt: new Date().toISOString(),
    };
    const destination = lane(plan.tasks, day, task.priority);
    setOrder([...destination, task]);
    plan.tasks.push(task);
  } else {
    const task = plan.tasks.find(item => item.id === input.id);
    if (!task) fail(404, 'Task not found');

    if (input.type === 'toggle') {
      if (typeof input.done !== 'boolean') fail(400, 'Choose a completion state');
      if (task.done !== input.done) {
        const remaining = lane(plan.tasks, task.date, task.priority, task.id);
        task.done = input.done;
        setOrder(input.done ? remaining : [...remaining, task]);
      }
    } else if (input.type === 'rename') {
      // Retained for existing authenticated plans and older browser clients.
      task.title = validTitle(input.title);
    } else if (input.type === 'edit') {
      const title = validTitle(input.title), priority = validPriority(input.priority);
      const minutes = validMinutes(input.minutes), date = validDate(input.date);
      checkDayCapacity(plan, task, date);
      moveToLane(plan, task, date, priority);
      task.title = title;
      task.minutes = minutes;
    } else if (input.type === 'move') {
      const date = validDate(input.date);
      checkDayCapacity(plan, task, date);
      moveToLane(plan, task, date, task.priority);
    } else if (input.type === 'reorder') {
      if (task.done) fail(400, 'Move an unfinished task. Reopen completed tasks first.');
      const priority = validPriority(input.priority);
      if (input.beforeId !== undefined && input.beforeId !== null && typeof input.beforeId !== 'string') {
        fail(400, 'Choose a valid task position');
      }
      const destination = lane(plan.tasks, task.date, priority, task.id);
      let index = destination.length;
      if (input.beforeId !== undefined && input.beforeId !== null) {
        index = destination.findIndex(item => item.id === input.beforeId);
        if (index < 0) fail(400, 'Choose an unfinished task in the same day and priority');
      }
      const previousPriority = task.priority;
      task.priority = priority;
      if (priority !== previousPriority) setOrder(lane(plan.tasks, task.date, previousPriority));
      destination.splice(index, 0, task);
      setOrder(destination);
    } else if (input.type === 'delete') {
      plan.tasks = plan.tasks.filter(item => item.id !== task.id);
      if (!task.done) setOrder(lane(plan.tasks, task.date, task.priority));
    } else {
      fail(400, 'Unknown task command');
    }
  }
  plan.revision++;
  return plan;
}
