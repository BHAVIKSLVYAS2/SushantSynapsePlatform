var TournamentEngine = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // apps/tournament-lite/backend/sports.js
  var require_sports = __commonJS({
    "apps/tournament-lite/backend/sports.js"(exports, module) {
      var sports = ["Cricket", "Badminton", "Table Tennis", "Pickleball", "Chess", "Carrom"];
      function check(ok, message) {
        if (!ok) {
          const error = Error(message);
          error.status = 400;
          throw error;
        }
      }
      function number(v, min, max) {
        const n = Number(v);
        check(v !== "" && v !== null && v !== void 0 && Number.isFinite(n) && n >= min && n <= max, "Invalid number");
        return n;
      }
      function integer(v, min, max) {
        const n = number(v, min, max);
        check(Number.isInteger(n), "Whole number required");
        return n;
      }
      function balls(v) {
        check(/^\d{1,3}(\.[0-5])?$/.test(String(v)), "Use cricket overs notation, e.g. 4.3");
        const [o, b = 0] = String(v).split(".").map(Number);
        return o * 6 + b;
      }
      function rules(sport, i = {}) {
        const defaults = { bestOf: 3, points: ["Table Tennis", "Pickleball"].includes(sport) ? 11 : 21, winBy: 2, cap: 0, overs: 10, wickets: 10, win: sport === "Chess" ? 1 : 2, draw: sport === "Chess" ? 0.5 : 1, loss: 0 };
        const relevant = ["win", "draw", "loss", ...sport === "Cricket" ? ["overs", "wickets"] : sport === "Chess" ? [] : sport === "Carrom" ? ["bestOf"] : ["bestOf", "points", "winBy", "cap"]];
        const limits = { bestOf: [1, 7], points: [1, 100], winBy: [1, 2], cap: [0, 200], overs: [1, 100], wickets: [1, 10], win: [0, 10], draw: [0, 10], loss: [0, 10] };
        const labels = { bestOf: "Best of games / boards", points: "Points per game", winBy: "Win by", cap: "Score cap", overs: "Cricket overs", wickets: "Cricket wickets", win: "League win points", draw: "Draw points", loss: "Loss points" };
        const r = { ...defaults };
        for (const key of relevant) {
          try {
            r[key] = (["win", "draw", "loss"].includes(key) ? number : integer)(i[key] ?? defaults[key], ...limits[key]);
          } catch (error) {
            error.message = labels[key] + ": " + error.message;
            throw error;
          }
        }
        check(r.bestOf % 2 === 1, "Best of must be odd");
        check(!r.cap || r.cap >= r.points, "Cap must be at least the points target");
        return r;
      }
      function score(t, m, i, allowIncomplete = false) {
        const r = t.rules;
        check(m.a && m.b, "Both participants must be known");
        if (t.sport === "Chess") {
          check(["white", "black", "draw"].includes(i.outcome), "Choose a chess outcome");
          check(i.outcome !== "draw" || m.stage !== "knockout", "Knockout draws require a decisive replay");
          return { outcome: i.outcome, winner: i.outcome === "draw" ? null : i.outcome === "white" ? m.a : m.b, sa: i.outcome === "white" ? 1 : i.outcome === "draw" ? 0.5 : 0, sb: i.outcome === "black" ? 1 : i.outcome === "draw" ? 0.5 : 0 };
        }
        if (t.sport === "Cricket") {
          const innings = ["a", "b"].map((side) => {
            const x = i[side] || {}, runs = integer(x.runs, 0, 2e3), wickets = integer(x.wickets, 0, r.wickets), bowled = balls(x.overs);
            check(bowled > 0 && bowled <= r.overs * 6, "Overs must be positive and within the match limit");
            return { runs, wickets, overs: String(x.overs), balls: wickets === r.wickets ? r.overs * 6 : bowled };
          });
          const [a, b] = innings;
          check(["a", "b"].includes(i.battingFirst), "Select batting first");
          const tied = a.runs === b.runs;
          check(!tied || m.stage !== "knockout" || ["a", "b"].includes(i.tieWinner), "Choose a knockout tiebreak winner");
          return { a, b, battingFirst: i.battingFirst, target: innings[i.battingFirst === "a" ? 0 : 1].runs + 1, tieWinner: tied && m.stage === "knockout" ? i.tieWinner : "", winner: tied ? m.stage === "knockout" ? m[i.tieWinner] : null : a.runs > b.runs ? m.a : m.b, sa: a.runs, sb: b.runs };
        }
        check(Array.isArray(i.games) && i.games.length > 0 && i.games.length <= r.bestOf, "Enter game scores");
        let aw = 0, bw = 0, sa = 0, sb = 0;
        const needed = Math.floor(r.bestOf / 2) + 1;
        const games = i.games.map((g, index) => {
          check(aw < needed && bw < needed, "Remove games after the match was decided");
          check(Array.isArray(g) && g.length === 2, "Enter both scores for game " + (index + 1));
          const a = integer(g[0], 0, 999), b = integer(g[1], 0, 999), hi = Math.max(a, b), lo = Math.min(a, b);
          const decided = t.sport === "Carrom" ? a !== b : hi >= r.points && (hi - lo >= r.winBy || !!r.cap && hi === r.cap);
          if (t.sport !== "Carrom") check((!r.cap || hi <= r.cap) && (!r.cap || hi < r.cap || a !== b) && (!decided || hi === r.points && hi - lo >= r.winBy || hi - lo === r.winBy || hi === r.cap && hi - lo < r.winBy), "Game " + (index + 1) + " score does not meet rules: " + r.points + " points, win by " + r.winBy + (r.cap ? ", cap " + r.cap : ""));
          if (!decided) check(allowIncomplete && index === i.games.length - 1, a === b ? "Games cannot be tied unless saving the current game in progress" : "Finish this game before entering the next game; check points and win-by rules");
          else {
            a > b ? aw++ : bw++;
          }
          sa += a;
          sb += b;
          return [a, b];
        });
        const complete = aw === needed || bw === needed;
        check(allowIncomplete || complete, "Enter enough games to decide the match");
        return { games, winner: complete ? aw > bw ? m.a : m.b : null, sa, sb };
      }
      module.exports = { sports, check, number, integer, rules, score, balls };
    }
  });

  // apps/tournament-lite/frontend/scheduling.js
  var require_scheduling = __commonJS({
    "apps/tournament-lite/frontend/scheduling.js"(exports, module) {
      (function(root) {
        "use strict";
        const time = (value) => Date.parse(value + "+05:30");
        function conflicts(matches, match, when, location, duration = 60, participants = []) {
          if (!Number.isInteger(Number(duration)) || Number(duration) < 5 || Number(duration) > 480) throw Error("Choose a duration from 5 to 480 minutes.");
          const people = (m) => new Set([m.a, m.b].filter(Boolean).flatMap((id) => {
            const participant = participants.find((p) => p.id === id);
            return ["entry:" + id, ...(participant?.members || "").split(",").map((n) => n.trim().normalize("NFKC").toLowerCase()).filter(Boolean).map((n) => "player:" + n)];
          })), players = people(match);
          const start = time(when), end = start + Number(duration) * 6e4, court = String(location).trim().normalize("NFKC").toLowerCase();
          return matches.filter((other) => other.id !== match.id && other.when && !other.result?.bye && start < time(other.when) + Number(other.duration || 60) * 6e4 && time(other.when) < end && (court && court === String(other.location || "").trim().normalize("NFKC").toLowerCase() || [...people(other)].some((id) => players.has(id))));
        }
        function suggest(matches, match, when, location, duration = 60, participants = []) {
          let start = time(when);
          if (!Number.isFinite(start)) throw Error("Choose a starting date and time.");
          for (let i = 0; i < 2016; i++, start += 5 * 6e4) {
            const slot = new Date(start + 330 * 6e4).toISOString().slice(0, 16);
            if (!conflicts(matches, match, slot, location, duration, participants).length) return slot;
          }
          throw Error("No free slot found in the next seven days.");
        }
        const api = { conflicts, suggest };
        if (typeof module === "object") module.exports = api;
        else root.TournamentSchedule = api;
      })(typeof globalThis === "object" ? globalThis : exports);
    }
  });

  // apps/tournament-lite/backend/tournament-engine.js
  var require_tournament_engine = __commonJS({
    "apps/tournament-lite/backend/tournament-engine.js"(exports, module) {
      var randomUUID = () => crypto.randomUUID();
      function randomInt(max) {
        const bound = Math.floor(4294967296 / max) * max;
        let n;
        do {
          n = crypto.getRandomValues(new Uint32Array(1))[0];
        } while (n >= bound);
        return n % max;
      }
      var { sports, check, integer, rules, score } = require_sports();
      var scheduler = require_scheduling();
      var formats = ["Knockout", "League / Round Robin", "League + Knockout", "Group Stage + Knockout"];
      function text(v, max = 120) {
        check(typeof v === "string" && v.trim().length <= max, "Invalid text");
        return v.trim();
      }
      function date(v) {
        if (!v) return "";
        check(/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Invalid date");
        return v;
      }
      function create(b) {
        check(sports.includes(b.sport) && formats.includes(b.format), "Select sport and format");
        check((b.sport === "Cricket" ? ["Teams"] : b.sport === "Chess" ? ["Singles"] : ["Singles", "Doubles"]).includes(b.mode), "Invalid participant mode");
        const name = text(b.name);
        check(name, "Tournament name required");
        const start = date(b.start), end = date(b.end);
        check(!start || !end || end >= start, "End date must follow start");
        const logo = b.logo || "";
        check(typeof logo === "string" && logo.length < 35e4 && (!logo || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo)), "Use a small PNG, JPEG or WebP logo");
        return { name, sport: b.sport, format: b.format, mode: b.mode, venue: text(b.venue || ""), start, end, organizer: text(b.organizer || ""), contact: text(b.contact || "", 80), logo, rules: rules(b.sport, b.rules), expected: integer(b.expected || 8, 2, 64), qualifiers: integer(b.qualifiers || 2, 2, 16), groupCount: integer(b.groupCount || 2, 2, 8), participants: [], matches: [], published: false };
      }
      function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
          const j = randomInt(i + 1);
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }
      function fixture(t, stage, round, a, b, group = "", sources = null) {
        return { id: randomUUID(), stage, round, a, b, group, sources, result: null, status: "upcoming", when: "", location: t.venue };
      }
      function knockout(t, ids) {
        let size = 2;
        while (size < ids.length) size *= 2;
        let order = [1, 2];
        while (order.length < size) {
          const n = order.length * 2 + 1;
          order = order.flatMap((x) => [x, n - x]);
        }
        let prev = [];
        for (let i = 0; i < size; i += 2) {
          const m = fixture(t, "knockout", 1, ids[order[i] - 1] || null, ids[order[i + 1] - 1] || null);
          t.matches.push(m);
          prev.push(m);
        }
        let round = 2;
        while (prev.length > 1) {
          const next = [];
          for (let i = 0; i < prev.length; i += 2) {
            const m = fixture(t, "knockout", round, null, null, "", [prev[i].id, prev[i + 1].id]);
            t.matches.push(m);
            next.push(m);
          }
          prev = next;
          round++;
        }
      }
      function league(t, ids, group) {
        const list = [...ids];
        if (list.length % 2) list.push(null);
        for (let round = 1; round < list.length; round++) {
          for (let i = 0; i < list.length / 2; i++) {
            const a = list[i], b = list[list.length - 1 - i];
            if (a && b) t.matches.push(fixture(t, "league", round, round % 2 ? a : b, round % 2 ? b : a, group));
          }
          list.splice(1, 0, list.pop());
        }
      }
      function standings(t, group) {
        const ids = group ? t.groups[group] : t.participants.map((p) => p.id);
        const rows = ids.map((id) => ({ id, played: 0, won: 0, lost: 0, draw: 0, points: 0, difference: 0, runs: 0, balls: 0, against: 0, againstBalls: 0 })), map = new Map(rows.map((x) => [x.id, x]));
        for (const m of t.matches.filter((x) => x.stage === "league" && x.result && (!group || x.group === group))) {
          const a = map.get(m.a), b = map.get(m.b), r = m.result;
          for (const [x, side, other] of [[a, "a", "b"], [b, "b", "a"]]) {
            x.played++;
            const win = r.winner === x.id, draw = !r.winner;
            x.won += +win;
            x.draw += +draw;
            x.lost += +(!win && !draw);
            x.points += win ? t.rules.win : draw ? t.rules.draw : t.rules.loss;
            x.difference += side === "a" ? r.sa - r.sb : r.sb - r.sa;
            if (t.sport === "Cricket") {
              x.runs += r[side].runs;
              x.balls += r[side].balls;
              x.against += r[other].runs;
              x.againstBalls += r[other].balls;
            }
          }
        }
        for (const x of rows) x.nrr = x.balls ? 6 * x.runs / x.balls - 6 * x.against / x.againstBalls : 0;
        return rows.sort((a, b) => b.points - a.points || (t.sport === "Cricket" ? b.nrr - a.nrr : b.difference - a.difference) || t.participants.findIndex((p) => p.id === a.id) - t.participants.findIndex((p) => p.id === b.id));
      }
      function progress(t) {
        for (const m of t.matches.filter((x) => x.stage === "knockout")) {
          if (m.sources) {
            const src = m.sources.map((id) => t.matches.find((x) => x.id === id)), ids = src.map((x) => x.result?.winner || null);
            if (m.a !== ids[0] || m.b !== ids[1]) {
              m.result = null;
              delete m.score;
              m.status = "upcoming";
            }
            [m.a, m.b] = ids;
          } else if (!m.a || !m.b) {
            m.result = { winner: m.a || m.b, bye: true };
            m.status = "completed";
          }
        }
        const matches = t.matches.filter((x) => x.stage === "league");
        if (t.format.includes("+") && matches.length && matches.every((x) => x.result) && !t.matches.some((x) => x.stage === "knockout")) {
          let ids;
          if (t.groups) {
            const groups = Object.keys(t.groups), ranked = groups.map((g) => standings(t, g));
            ids = [];
            for (let rank = 0; rank < t.qualifiers / groups.length; rank++) for (const rows of ranked) ids.push(rows[rank].id);
          } else ids = standings(t).slice(0, t.qualifiers).map((x) => x.id);
          t.qualified = ids;
          knockout(t, ids);
          progress(t);
        }
      }
      function apply(t, type, b) {
        if (type === "participants") {
          check(!t.matches.length, "Participants are locked after fixture generation");
          check(Array.isArray(b.participants) && b.participants.length <= 64, "Maximum 64 participants");
          const used = /* @__PURE__ */ new Set(), seeds = /* @__PURE__ */ new Set();
          t.participants = b.participants.map((p) => {
            const name = text(p.name);
            check(name && !used.has(name.toLowerCase()), "Participant names must be unique");
            used.add(name.toLowerCase());
            const members = text(p.members || "", 500);
            if (t.mode === "Doubles") check(members.split(",").map((x) => x.trim()).filter(Boolean).length === 2, "Doubles pairs require two comma-separated players");
            const seed = p.seed ? integer(p.seed, 1, 64) : 0;
            check(!seed || !seeds.has(seed), "Seeds must be unique");
            if (seed) seeds.add(seed);
            return { id: randomUUID(), name, members, seed };
          });
        } else if (type === "generate") {
          check(!t.matches.length, "Fixtures already generated");
          check(t.participants.length >= 2, "Add at least two participants");
          const entries = shuffle([...t.participants]).sort((a, b2) => (a.seed || 999) - (b2.seed || 999)), ids = entries.map((x) => x.id);
          if (t.format === "Knockout") knockout(t, ids);
          else if (t.format === "Group Stage + Knockout") {
            check(t.groupCount * 2 <= ids.length && t.qualifiers % t.groupCount === 0 && t.qualifiers <= ids.length && t.qualifiers / t.groupCount <= Math.floor(ids.length / t.groupCount), "Use two or more players per group and equal qualifiers per group");
            t.groups = {};
            ids.forEach((id, i) => {
              const g = String.fromCharCode(65 + i % t.groupCount);
              (t.groups[g] ??= []).push(id);
            });
            for (const [g, list] of Object.entries(t.groups)) league(t, list, g);
          } else {
            check(t.format === "League / Round Robin" || t.qualifiers <= ids.length, "Too many qualifiers");
            league(t, ids, "");
          }
          progress(t);
        } else if (type === "result" || type === "score") {
          const m = t.matches.find((x) => x.id === b.id);
          check(m && !m.result?.bye, "Match not found or automatic bye");
          const result = score(t, m, b, type === "score");
          if (m.stage === "league" && t.matches.some((x) => x.stage === "knockout")) {
            check(b.confirmReset === true, "Confirm clearing the knockout stage before correcting a league result");
            t.matches = t.matches.filter((x) => x.stage === "league");
            delete t.qualified;
          }
          if (result.games && !result.winner) {
            m.score = result;
            m.result = null;
            m.status = "live";
          } else {
            m.result = result;
            delete m.score;
            m.status = "completed";
          }
          progress(t);
        } else if (type === "schedule") {
          const m = t.matches.find((x) => x.id === b.id);
          check(m, "Match not found");
          const when = b.when || "";
          check(!when || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(when) && Number.isFinite(Date.parse(when + "+05:30")), "Invalid match time");
          if (when) {
            date(when.slice(0, 10));
            check(Number(when.slice(11, 13)) < 24 && Number(when.slice(14)) < 60, "Invalid match time");
          }
          const location = text(b.location || ""), duration = integer(b.duration === void 0 ? 60 : b.duration, 5, 480);
          check(["upcoming", "live"].includes(b.status), "Invalid status");
          check(!when || !scheduler.conflicts(t.matches, m, when, location, duration, t.participants).length, "Court or participant already has an overlapping match");
          m.when = when;
          m.location = location;
          m.duration = duration;
          if (!m.result) m.status = b.status;
        } else if (type === "qualification") {
          check(!t.matches.length, "Qualification is locked after fixture generation");
          check(t.format.includes("+"), "This format has no qualification stage");
          const qualifiers = integer(b.qualifiers, 2, 16), groupCount = t.format === "Group Stage + Knockout" ? integer(b.groupCount, 2, 8) : t.groupCount;
          check(t.format !== "Group Stage + Knockout" || qualifiers % groupCount === 0, "Qualifiers must divide equally between groups");
          t.qualifiers = qualifiers;
          t.groupCount = groupCount;
        } else if (type === "details") {
          const details = create({ ...t, ...Object.fromEntries(["name", "venue", "start", "end", "organizer", "contact"].map((key) => [key, b[key]])) });
          for (const key of ["name", "venue", "start", "end", "organizer", "contact"]) t[key] = details[key];
        } else if (type === "publish") {
          check(typeof b.published === "boolean", "Invalid publication state");
          t.published = b.published;
        } else throw Error("Unknown command");
        return t;
      }
      function view(t) {
        const v = structuredClone(t);
        v.tables = t.groups ? Object.fromEntries(Object.keys(t.groups).map((g) => [g, standings(t, g)])) : { All: standings(t) };
        const final = t.matches.filter((x) => x.stage === "knockout").at(-1), complete = t.matches.length && t.matches.every((x) => x.result);
        v.champion = complete ? final?.result.winner || standings(t)[0]?.id : null;
        v.runnerUp = complete ? final ? final.a === v.champion ? final.b : final.a : standings(t)[1]?.id : null;
        v.status = complete ? "Completed" : t.matches.some((x) => x.result && !x.result.bye || x.status === "live") ? "Active" : "Upcoming";
        return v;
      }
      module.exports = { create, apply, view, standings, formats };
    }
  });
  return require_tournament_engine();
})();
