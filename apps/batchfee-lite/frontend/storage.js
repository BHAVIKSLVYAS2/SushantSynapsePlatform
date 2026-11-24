'use strict';

const BatchFeeStorage = (() => {
  const { empty, apply, view, today, date } = BatchFeeEngine;
  let opening;
  function database() {
    return opening ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('synapse-batchfee-lite', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('academy');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Browser storage is unavailable.'));
    }).catch(error => { opening = null; throw error; });
  }

  async function transact(write, operate) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('academy', write ? 'readwrite' : 'readonly');
      const store = tx.objectStore('academy');
      const request = store.get('current');
      let result;
      let failure;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure || new Error('Browser storage could not save this change.'));
      request.onsuccess = () => {
        try {
          const current = request.result ?? { revision: 0, state: empty(), events: [] };
          result = operate(current);
          if (write) store.put(current, 'current');
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
    });
  }

  const snapshot = current => ({ revision: current.revision, ...view(current.state) });
  function restore(current, backup) {
    const events = backup?.events;
    if (!['batchfee-lite-1', 'batchfee-lite-organisation-1'].includes(backup?.format) || !Array.isArray(events) || events.length > 50000) throw new Error('Invalid BatchFee backup.');
    if (current.events.length > events.length || current.events.some((event, index) => JSON.stringify(event) !== JSON.stringify(events[index]))) throw new Error('Backup conflicts with existing history.');
    const state = empty();
    const ids = new Set();
    let previousDay = '';
    for (const event of events) {
      const command = event?.data;
      if (!command || typeof event.at !== 'string' || !/^20\d\d-\d\d-\d\dT/.test(event.at) || Number.isNaN(Date.parse(event.at)) || typeof event.actor !== 'string' || event.actor.length > 200 || event.action !== command.type || ids.has(command.id)) throw new Error('Invalid backup event.');
      const day = date(command.day);
      if (day < previousDay || day > today()) throw new Error('Invalid backup chronology.');
      previousDay = day;
      ids.add(command.id);
      apply(state, command, day);
    }
    current.state = state;
    current.events = events;
    current.revision++;
  }

  function command(current, { revision, type, input, requestId }) {
    const prior = current.events.find(event => event.data.id === requestId);
    if (prior) {
      if (prior.action !== type || JSON.stringify(prior.data.input) !== JSON.stringify(input)) throw new Error('Request key reused with different data.');
      return snapshot(current);
    }
    if (revision !== current.revision) throw new Error('Data changed in another tab. Refresh before saving again.');
    if (!current.state.profile && !['profile', 'sync'].includes(type)) throw new Error('Set up your academy first.');
    const data = { id: requestId, type, input, day: today() };
    const before = type === 'sync' ? JSON.stringify(current.state) : null;
    apply(current.state, data, data.day);
    if (before !== JSON.stringify(current.state)) {
      current.events.push({ at: new Date().toISOString(), actor: 'browser', action: type, data });
      current.revision++;
    }
    return snapshot(current);
  }

  return {
    read: () => transact(false, snapshot),
    command: input => transact(true, current => command(current, input)),
    backup: () => transact(false, current => ({ format: 'batchfee-lite-1', events: current.events, exportedAt: new Date().toISOString() })),
    restore: ({ revision, backup }) => transact(true, current => {
      if (revision !== current.revision) throw new Error('Data changed in another tab. Refresh before restoring.');
      restore(current, backup);
      return snapshot(current);
    }),
  };
})();
