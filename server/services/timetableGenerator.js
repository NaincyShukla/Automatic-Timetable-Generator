/**
 * timetableGenerator.js
 *
 * Deterministic timetable generator with elective-block (parallel elective subgroup) support.
 *
 * Phases:
 * 1. loadSchedulingData
 * 2. buildSessionPool (theory + lab, elective blocks)
 * 3. compute targets (implicit in placement heuristics)
 * 4. assign sessions to days and slots (theory first, then labs)
 * 5. compact scheduling (earliest frontier: morning -> afternoon)
 * 6. resolve teacher conflicts
 * 7. resolve room conflicts
 * 8. repair evict/reseat
 *
 * Returns { timetable, unplaced, warnings }.
 *
 * Uses models: Settings, Division, Subject, Teacher, Location
 */

const Settings = require("../models/Settings");
const Division = require("../models/Division");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");
const Location = require("../models/Location");

// -----------------------------
// Business mapping (fixed)
const ELECTIVE_MAPPING = {
  // DevOps is one elective; ST and BT are the two alternatives in the
  // same parallel block.
  "7EC1": ["DevOps Essentials", "Software Testing", "Blockchain Technology"],

  // Two independent elective choices.
  "7EC2": ["DevOps Essentials", "UI and UX Design"],
  "7EC3": ["DevOps Essentials", "UI and UX Design"],

  // IMPORTANT: NLP and UI/UX are NOT parallel in EC4.
  "7EC4": ["Natural Language Processing", "UI and UX Design"],

  // NLP is common. UI/UX, ST and BT are the divided/parallel alternatives.
  "7EC5": [
    "Natural Language Processing",
    "UI and UX Design",
    "Software Testing",
    "Blockchain Technology",
  ],
};
// -----------------------------

// Scheduling constants
const BASE_UNIT_MINUTES = 30;
const THEORY_MINUTES = 60;
const THEORY_UNIT_SLOTS = THEORY_MINUTES / BASE_UNIT_MINUTES; // 2
const LAB_BLOCK_MINUTES = 90;
const LAB_UNIT_SLOTS = LAB_BLOCK_MINUTES / BASE_UNIT_MINUTES; // 3

const LUNCH_START = "10:30";
const LUNCH_END = "11:00";

const DEFAULT_START = "07:30";
const DEFAULT_END = "13:30";

const MAX_SESSIONS_PER_DAY = 6;
const TARGET_APPROX_PER_DAY = 4;

// Preferred visible lecture starts (for compactness)
const PREFERRED_STARTS = ["07:30", "08:30", "09:30", "11:00", "12:00"];

// -----------------------------
// small helpers
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
function stableHash(s) {
  // FNV-1a 32-bit-ish quick deterministic hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function rotateArray(arr, offset) {
  if (!arr || !arr.length) return arr || [];
  const n = arr.length;
  const o = ((offset % n) + n) % n;
  return arr.slice(o).concat(arr.slice(0, o));
}
function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// -----------------------------
// Build time slots (30-minute base units), excluding lunch
async function loadSchedulingData(semester) {
  const [settings, divisions, subjects, teachers, locations] = await Promise.all([
    Settings.findOne({}),
    Division.find({ semester }),
    Subject.find({ semester }),
    Teacher.find({}),
    Location.find({}),
  ]);

  if (!settings) throw new Error("Settings not found.");
  if (!divisions || !divisions.length) throw new Error(`No divisions for semester ${semester}`);
  if (!subjects || !subjects.length) throw new Error(`No subjects for semester ${semester}`);

  // map subject name -> first teacher that lists it
  const teacherMap = {};
  teachers.forEach((t) => {
    if (!Array.isArray(t.subjects)) return;
    t.subjects.forEach((sname) => {
      if (!teacherMap[sname]) teacherMap[sname] = t;
    });
  });

  const classrooms = locations.filter((l) => l.type === "Classroom").map((l) => l.roomNo);
  const labs = locations.filter((l) => l.type === "Laboratory").map((l) => l.roomNo);

  if (!classrooms.length) throw new Error("No Classroom locations configured.");
  if (!labs.length) throw new Error("No Laboratory locations configured.");

  return {
    settings,
    divisions,
    subjects,
    teacherMap,
    rooms: { classrooms, labs },
  };
}

function buildTimeSlots(settings) {
  const workingDays = settings.workingDays && settings.workingDays.length ? settings.workingDays :
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const start = toMinutes(settings.collegeStartTime || DEFAULT_START);
  const end = toMinutes(settings.collegeEndTime || DEFAULT_END);
  const lunchStart = toMinutes(LUNCH_START);
  const lunchEnd = toMinutes(LUNCH_END);

  const slots = [];
  for (const day of workingDays) {
    for (let t = start; t + BASE_UNIT_MINUTES <= end; t += BASE_UNIT_MINUTES) {
      const slotEnd = t + BASE_UNIT_MINUTES;
      if (t < lunchEnd && slotEnd > lunchStart) continue; // overlap lunch
      slots.push({
        day,
        start: t,
        end: slotEnd,
        startTime: minutesToTime(t),
        endTime: minutesToTime(slotEnd),
      });
    }
  }
  return slots;
}
const units = [];
// -----------------------------
// Build session pool with elective blocks
function buildSessionPool(divisions, subjects, teacherMap, warnings = []) {
  // subject name -> subject doc
  const subjByName = {};
  subjects.forEach((s) => (subjByName[s.name] = s));

  const ELECTIVE_NAMES = new Set([
    "DEVOPS ESSENTIALS",
    "SOFTWARE TESTING",
    "BLOCKCHAIN TECHNOLOGY",
    "UI AND UX DESIGN",
    "NATURAL LANGUAGE PROCESSING"
]);

const mandatorySubjects = subjects.filter((s) => {
    const name = String(s.name || "")
        .trim()
        .toUpperCase();

    return (
        s.type === "Mandatory" &&
        !ELECTIVE_NAMES.has(name)
    );
});

const electiveSubjects = subjects.filter((s) => {
    const name = String(s.name || "")
        .trim()
        .toUpperCase();

    return (
        s.type === "Elective" ||
        ELECTIVE_NAMES.has(name)
    );
});

  const theorySessions = []; // 1-hour lecture entries
  const labSessions = []; // 1.5-hour lab block entries

  // For each division: include all mandatory + allowed electives (from ELECTIVE_MAPPING).
  // For electives: create blocks (parallel subgroups). We'll chunk electives into blocks of size 2 deterministically.
  divisions.forEach((div) => {
    const divName = div.divisionName;
    const electiveNames = ELECTIVE_MAPPING[divName] || [];
    const allowedElectives = electiveSubjects.filter((s) => electiveNames.includes(s.name));

    // Elective blocks are explicitly defined by the business rules.
    // Subjects inside the same block are scheduled at the SAME time.
    // Subjects in different blocks must NOT overlap.
    let electiveBlocks = [];

    if (divName === "7EC1") {
      electiveBlocks = [
        ["DevOps Essentials"],
        ["Software Testing", "Blockchain Technology"],
      ];
    } else if (divName === "7EC2" || divName === "7EC3") {
      electiveBlocks = [
        ["DevOps Essentials"],
        ["UI and UX Design"],
      ];
    } else if (divName === "7EC4") {
      // They are alternatives but are NOT a parallel block.
      electiveBlocks = [
        ["Natural Language Processing"],
        ["UI and UX Design"],
      ];
    } else if (divName === "7EC5") {
      // NLP is common. The remaining three alternatives run in parallel.
      electiveBlocks = [
        ["Natural Language Processing"],
        [
          "UI and UX Design",
          "Software Testing",
          "Blockchain Technology",
        ],
      ];
    }

    // All mandatory + all electives (we'll attach block meta to electives)
    const combined = [...mandatorySubjects.map((s) => ({ subj: s, isElective: false }))]
      .concat(
        electiveBlocks.flatMap((block, bIdx) =>
          block.map((ename) => {
            const s = subjects.find(sub =>
    sub.name.trim().toLowerCase() ===
    ename.trim().toLowerCase()
);
            if (!s) {
    console.log("DATABASE SUBJECT NOT FOUND:", ename);
}

return {
    subj: s,
    isElective: true,
    blockId: `${divName}|electiveBlock|${bIdx}`
};
          })
        )
      );
console.log("Division:", divName);
console.log("Combined subjects:");
combined.forEach(x => console.log(x.subj?.name));
    combined.forEach((entry) => {
      const s = entry.subj;
      if (!s) {
        warnings.push(`Subject definition missing for an elective/mandatory listed for division ${divName}`);
        return;
      }
      const teacher = teacherMap[s.name];
     const assignedTeacher = teacher || {
    _id: "TBD",
    name: "TBD"
};

      const displayName =
    entry.isElective && entry.blockId
        ? electiveBlocks[
            Number(entry.blockId.split("|").pop())
          ].join(" / ")
        : s.name;

const base = {

    division: divName,

    // IMPORTANT:
    // subjectId must remain the REAL subject id/code.
    // blockId is only used to decide whether different subjects may run
    // in parallel. Using blockId as subjectId incorrectly made ST and BT
    // look like the same subject and prevented proper parallel scheduling.
    subjectId: s.code || s._id.toString(),

    subjectName: displayName,

    teacherId: assignedTeacher._id.toString(),
teacherName: assignedTeacher.name,

    blockId: entry.blockId || null,

    isElective: entry.isElective || false,

};

      // theory sessions: one per theory hour
      const th = Number(s.theoryHours || 0);
      for (let i = 0; i < th; i++) {
        theorySessions.push({
          ...base,
          roomType: "Classroom",
          durationSlots: THEORY_UNIT_SLOTS,
          kind: "theory",
        });
      }

      // LAB RULE:
      // Exactly ONE lab per subject per week (except Major Project).
      // The lab is either 1 hour or 1.5 hours.
      // We deliberately do NOT create multiple blocks when labHours = 3,
      // because the requirement is one lab session per subject per week.
      const isMajorProject =
        String(s.name || "").trim().toUpperCase() === "MAJOR PROJECT - 1";

      const lh = Number(s.labHours || 0);

      if (lh > 0 && !isMajorProject) {
        const labMinutes = lh >= 1.5 ? 90 : 60;

        labSessions.push({
          ...base,
          roomType: "Lab",
          durationSlots: labMinutes / BASE_UNIT_MINUTES,
          kind: "lab",

          // Hard identity used to prevent the same lab being placed twice.
          sessionKey: `${divName}|${s.code || s._id.toString()}|LAB`,
        });
      }
    });
  });
console.log("Theory:", theorySessions.length);
console.log("Labs:", labSessions.length);
  return { theorySessions, labSessions };
}

// -----------------------------
// Scheduler
class Scheduler {
  constructor(slots, workingDays, rooms) {
    this.slots = slots;
    this.workingDays = workingDays;
    this.rooms = rooms; // { Classrooms: [], Labs: [] } - but we'll accept { Classroom:[], Lab:[] } too
    this.reset();
  }

  reset() {
    this.timetable = []; // placed rows
    // placedMeta map: row -> { idxs, room, day, session }
    this.placedMeta = new Map();
    // busy maps:
    this.teacherBusy = {}; // teacherId -> Set(slotIdx)
    this.roomBusy = {}; // roomNo -> Set(slotIdx)
    // For division conflicts we do not use a global divisionBusy set; instead check actual placed rows to allow elective-block overlaps.
    this.subjectDayUsed = {}; // "division|subjectId|day" -> true
    this.divisionDayCount = {}; // "division|day" -> occupied teaching blocks
    this.placedLabKeys = new Set(); // one lab per subject/division/week
  }

  // get consecutive windows of length durationSlots
  getConsecutiveWindows(durationSlots) {
    const res = [];
    for (let i = 0; i <= this.slots.length - durationSlots; i++) {
      const group = this.slots.slice(i, i + durationSlots);
      const sameDay = group.every((s) => s.day === group[0].day);
      const contiguous = group.every((s, k) => k === 0 || s.start === group[k - 1].end);
      if (sameDay && contiguous) {
        res.push({
          day: group[0].day,
          start: group[0].start,
          end: group[group.length - 1].end,
          startTime: group[0].startTime,
          endTime: group[group.length - 1].endTime,
          idxs: Array.from({ length: durationSlots }, (_, k) => i + k),
        });
      }
    }
    return res;
  }

  // utility: check if a set is free for these indices
  isFree(map, key, idxs) {
    const s = map[key];
    if (!s) return true;
    return idxs.every((i) => !s.has(i));
  }
  markBusy(map, key, idxs) {
    if (!map[key]) map[key] = new Set();
    idxs.forEach((i) => map[key].add(i));
  }
  unmarkBusy(map, key, idxs) {
    const s = map[key];
    if (!s) return;
    idxs.forEach((i) => s.delete(i));
  }

  // division-slot overlap check:
  // allow overlap if the only overlapping placed sessions for same division
  // are session(s) that belong to the same blockId as `session.blockId`.
  divisionAllows(session, idxs) {
    // scan placedMeta for any placed row that overlaps idxs and same division
    for (const [row, meta] of this.placedMeta.entries()) {
      if (meta.session.division !== session.division) continue;
      // overlap?
      if (meta.idxs.some((i) => idxs.includes(i))) {
        // if both have blockId and they match -> allowed (parallel elective subgroup)
        if (meta.session.blockId && session.blockId && meta.session.blockId === session.blockId) {
          // allowed overlap
          continue;
        }
        // else conflict
        return false;
      }
    }
    return true;
  }

  // A real subject may have only ONE lecture/lab on a day.
  // Parallel electives are different subjects, so they are allowed to
  // occupy the same day/time when their blockId is equal.
  subjectUsedSameDay(session, day) {
    return !!this.subjectDayUsed[
      `${session.division}|${session.subjectId}|${day}`
    ];
  }

  // Count occupied teaching periods, not rows.
  // If UI/UX + ST + BT are parallel, three rows at the same time count
  // as ONE occupied period for the division.
  divisionDayCountFor(session, day) {
    const groups = new Set();

    for (const meta of this.placedMeta.values()) {
      if (
        meta.session.division !== session.division ||
        meta.day !== day
      ) {
        continue;
      }

      const idxKey = meta.idxs.join(",");
      const blockKey = meta.session.blockId
        ? meta.session.blockId
        : `single:${meta.session.subjectId}`;

      groups.add(`${blockKey}|${idxKey}`);
    }

    return groups.size;
  }

  // Place all members of one elective block in the SAME time window.
  // If one member cannot be placed, everything placed by this call is
  // rolled back.
  tryPlaceParallelBlock(sessions, idxs) {
    if (!sessions || !sessions.length) return [];

    const placedRows = [];

    for (const session of sessions) {
      const row = this.tryPlace(session, idxs);

      if (!row) {
        placedRows.forEach((r) => this.removeRow(r));
        return null;
      }

      placedRows.push(row);
    }

    return placedRows;
  }

  // pick a room from pool deterministically
  pickRoom(pool, session, idxs, preferRoom = null) {
    if (!pool || !pool.length) return null;
    // prefer preferRoom if free
    if (preferRoom && pool.includes(preferRoom) && this.isFree(this.roomBusy, preferRoom, idxs)) return preferRoom;

    const h = stableHash(`${session.subjectId}|${session.division}|${idxs[0]}`);
    for (let k = 0; k < pool.length; k++) {
      const candidate = pool[(h + k) % pool.length];
      if (this.isFree(this.roomBusy, candidate, idxs)) return candidate;
    }
    return null;
  }

  tryPlace(session, idxs) {
    if (!idxs || !idxs.length) return null;

    const day = this.slots[idxs[0]].day;

    // Same subject cannot occur twice on the same day.
    if (this.subjectUsedSameDay(session, day)) return null;

    // Daily cap counts parallel electives as ONE occupied period.
    if (this.divisionDayCountFor(session, day) >= MAX_SESSIONS_PER_DAY) {
      return null;
    }

    // Hard protection against accidentally placing the same lab twice.
    if (
      session.kind === "lab" &&
      session.sessionKey &&
      this.placedLabKeys.has(session.sessionKey)
    ) {
      return null;
    }

    // Teacher must be free.
    if (!this.isFree(this.teacherBusy, session.teacherId, idxs)) {
      return null;
    }

    // Same division may overlap ONLY inside the same elective block.
    if (!this.divisionAllows(session, idxs)) return null;

    const pool =
      session.roomType === "Classroom"
        ? this.rooms.Classroom || this.rooms.classrooms || []
        : this.rooms.Lab || this.rooms.labs || [];

    if (!pool.length) return null;

    const room = this.pickRoom(pool, session, idxs);
    if (!room) return null;

    // Commit.
    this.markBusy(this.teacherBusy, session.teacherId, idxs);
    this.markBusy(this.roomBusy, room, idxs);

    this.subjectDayUsed[
      `${session.division}|${session.subjectId}|${day}`
    ] = true;

    const divDayKey = `${session.division}|${day}`;

    // Only increment day load when this is NOT another row of the
    // exact same parallel block at the exact same time.
    const parallelAlreadyCounted = [...this.placedMeta.values()].some(
      (meta) =>
        meta.session.division === session.division &&
        meta.day === day &&
        meta.session.blockId &&
        session.blockId &&
        meta.session.blockId === session.blockId &&
        meta.idxs.length === idxs.length &&
        meta.idxs.every((v, i) => v === idxs[i])
    );

    if (!parallelAlreadyCounted) {
      this.divisionDayCount[divDayKey] =
        (this.divisionDayCount[divDayKey] || 0) + 1;
    }

    const row = {
      division: session.division,
      day,
      startTime: minutesToTime(this.slots[idxs[0]].start),
      endTime: minutesToTime(
        this.slots[idxs[idxs.length - 1]].end
      ),
      subject: session.subjectName,
      teacher: session.teacherName,
      room,
      roomType: session.roomType,
      kind: session.kind,
      blockId: session.blockId || null,
    };

    this.timetable.push(row);

    this.placedMeta.set(row, {
      idxs: idxs.slice(),
      room,
      day,
      session,
    });

    if (session.kind === "lab" && session.sessionKey) {
      this.placedLabKeys.add(session.sessionKey);
    }

    return row;
  }

  removeRow(row) {
    const meta = this.placedMeta.get(row);
    if (!meta) return;

    this.unmarkBusy(
      this.teacherBusy,
      meta.session.teacherId,
      meta.idxs
    );

    this.unmarkBusy(
      this.roomBusy,
      meta.room,
      meta.idxs
    );

    if (
      meta.session.kind === "lab" &&
      meta.session.sessionKey
    ) {
      this.placedLabKeys.delete(meta.session.sessionKey);
    }

    this.timetable = this.timetable.filter(
      (r) => r !== row
    );

    this.placedMeta.delete(row);

    // Rebuild both day maps from the actual placed rows.
    // This is safer than decrementing/deleting blindly during repair.
    this.subjectDayUsed = {};
    this.divisionDayCount = {};

    for (const other of this.placedMeta.values()) {
      const subjectKey =
        `${other.session.division}|${other.session.subjectId}|${other.day}`;

      this.subjectDayUsed[subjectKey] = true;
    }

    const countedGroups = new Set();

    for (const other of this.placedMeta.values()) {
      const divDayKey =
        `${other.session.division}|${other.day}`;

      const groupKey = other.session.blockId
        ? `${divDayKey}|${other.session.blockId}|${other.idxs.join(",")}`
        : `${divDayKey}|single|${other.session.subjectId}|${other.idxs.join(",")}`;

      if (!countedGroups.has(groupKey)) {
        countedGroups.add(groupKey);

        this.divisionDayCount[divDayKey] =
          (this.divisionDayCount[divDayKey] || 0) + 1;
      }
    }
  }

  // -----------------------------
  // Place theory sessions first: try to spread across distinct days
  // -----------------------------
  placeTheorySessions(theorySessions) {
    const unplaced = [];

    // First schedule parallel elective blocks as groups.
    const parallelGroups = new Map();
    const normalSessions = [];

    for (const s of theorySessions) {
      if (s.blockId) {
        const key = s.blockId;
        if (!parallelGroups.has(key)) {
          parallelGroups.set(key, []);
        }
        parallelGroups.get(key).push(s);
      } else {
        normalSessions.push(s);
      }
    }

    const groupKeys = [...parallelGroups.keys()].sort(
      (a, b) => stableHash(a) - stableHash(b)
    );

    for (const key of groupKeys) {
      const group = parallelGroups.get(key);

      // All members of the block normally have the same lecture duration.
      // Use the longest duration so the whole block occupies one exact window.
      const durationSlots = Math.max(
        ...group.map((s) => s.durationSlots)
      );

      const windows =
        this.getConsecutiveWindows(durationSlots);

      const rot =
        stableHash(key) % this.workingDays.length;

      const dayRank = new Map(
        rotateArray(this.workingDays, rot).map((d, i) => [d, i])
      );

      windows.sort((a, b) => {
        const da = dayRank.get(a.day) - dayRank.get(b.day);
        if (da !== 0) return da;
        return a.start - b.start;
      });

      let placed = false;

      for (const w of windows) {
        // If one member has a different duration, still require the
        // group's actual sessions to fit in the same block.
        const rows = this.tryPlaceParallelBlock(group, w.idxs);

        if (rows) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        group.forEach((s) => {
          s._unplaced = true;
          unplaced.push(s);
        });
      }
    }

    // Now schedule mandatory subjects and any non-parallel subjects.
    // Multiple theory hours of the same subject are deliberately spread
    // over different days.
    const subjectGroups = new Map();

    for (const s of normalSessions) {
      const key = `${s.division}|${s.subjectId}`;

      if (!subjectGroups.has(key)) {
        subjectGroups.set(key, []);
      }

      subjectGroups.get(key).push(s);
    }

    const subjectKeys = [...subjectGroups.keys()].sort(
      (a, b) => stableHash(a) - stableHash(b)
    );

    for (const key of subjectKeys) {
      const group = subjectGroups.get(key);
      const sample = group[0];

      const rot =
        stableHash(sample.division + sample.subjectId) %
        this.workingDays.length;

      const dayOrder = rotateArray(
        this.workingDays,
        rot
      );

      for (const session of group) {
        let placed = false;

        const orderedDays = [...dayOrder].sort(
          (a, b) =>
            this.divisionDayCountFor(session, a) -
              this.divisionDayCountFor(session, b) ||
            a.localeCompare(b)
        );

        for (const day of orderedDays) {
          // Hard rule: same subject cannot be placed twice on this day.
          if (this.subjectUsedSameDay(session, day)) {
            continue;
          }

          const windows =
            this.getConsecutiveWindows(
              session.durationSlots
            ).filter((w) => w.day === day);

          // Prefer the earliest available point after the current
          // occupied frontier, but never violate the constraints.
          const placedToday =
            this.timetable
              .filter(
                (r) =>
                  r.division === session.division &&
                  r.day === day
              )
              .sort(
                (a, b) =>
                  toMinutes(a.startTime) -
                  toMinutes(b.startTime)
              );

          let frontier = toMinutes(DEFAULT_START);

          if (placedToday.length) {
            frontier = Math.max(
              ...placedToday.map((r) =>
                toMinutes(r.endTime)
              )
            );

            if (
              frontier >= toMinutes(LUNCH_START) &&
              frontier < toMinutes(LUNCH_END)
            ) {
              frontier = toMinutes(LUNCH_END);
            }
          }

          windows.sort((a, b) => {
            const da = Math.abs(a.start - frontier);
            const db = Math.abs(b.start - frontier);

            if (da !== db) return da - db;
            return a.start - b.start;
          });

          for (const w of windows) {
            if (this.tryPlace(session, w.idxs)) {
              placed = true;
              break;
            }
          }

          if (placed) break;
        }

        if (!placed) {
          session._unplaced = true;
          unplaced.push(session);
        }
      }
    }

    return unplaced;
  }

  // -----------------------------
  // Place labs (continuous 1.5h blocks), prefer morning
  // -----------------------------
  placeLabSessions(labSessions) {
    const unplaced = [];

    // Group parallel elective labs by blockId.
    const parallelGroups = new Map();
    const normalLabs = [];

    for (const lab of labSessions) {
      if (lab.blockId) {
        if (!parallelGroups.has(lab.blockId)) {
          parallelGroups.set(lab.blockId, []);
        }
        parallelGroups.get(lab.blockId).push(lab);
      } else {
        normalLabs.push(lab);
      }
    }

    const groupKeys = [...parallelGroups.keys()].sort(
      (a, b) => stableHash(a) - stableHash(b)
    );

    for (const key of groupKeys) {
      const group = parallelGroups.get(key);

      // Parallel labs must use the same duration. If their DB values
      // differ, use the longest duration for the common block.
      const durationSlots = Math.max(
        ...group.map((s) => s.durationSlots)
      );

      const windows =
        this.getConsecutiveWindows(durationSlots);

      const rot =
        stableHash(key) % this.workingDays.length;

      const dayRank = new Map(
        rotateArray(this.workingDays, rot).map((d, i) => [d, i])
      );

      windows.sort((a, b) => {
        const da = dayRank.get(a.day) - dayRank.get(b.day);
        if (da !== 0) return da;
        return a.start - b.start;
      });

      let placed = false;

      for (const w of windows) {
        const rows = this.tryPlaceParallelBlock(
          group,
          w.idxs
        );

        if (rows) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        group.forEach((lab) => {
          lab._unplaced = true;
          unplaced.push(lab);
        });
      }
    }

    // Non-parallel labs: exactly one per subject/week.
    for (const lab of normalLabs) {
      let placed = false;

      const rot =
        stableHash(
          `${lab.division}|${lab.subjectId}|LAB`
        ) % this.workingDays.length;

      const dayRank = new Map(
        rotateArray(this.workingDays, rot).map((d, i) => [d, i])
      );

      const windows =
        this.getConsecutiveWindows(
          lab.durationSlots
        );

      windows.sort((a, b) => {
        const da = dayRank.get(a.day) - dayRank.get(b.day);

        if (da !== 0) return da;

        return a.start - b.start;
      });

      for (const w of windows) {
        if (this.tryPlace(lab, w.idxs)) {
          placed = true;
          break;
        }
      }

      if (!placed) {
        lab._unplaced = true;
        unplaced.push(lab);
      }
    }

    return unplaced;
  }

  // -----------------------------
  // Teacher conflicts resolution (simple heuristic)
  // Iterate and try to move more-flexible session to another window
  // -----------------------------
  resolveTeacherConflicts() {
    let changed = false;
    // build per-slot teacher occupancy map
    const slotMap = new Map();
    for (const [row, meta] of this.placedMeta.entries()) {
      meta.idxs.forEach((idx) => {
        if (!slotMap.has(idx)) slotMap.set(idx, []);
        slotMap.get(idx).push({ row, meta });
      });
    }

    for (const [idx, occ] of slotMap.entries()) {
      // group by teacher
      const byTeacher = {};
      for (const o of occ) {
        const t = o.meta.session.teacherId;
        if (!byTeacher[t]) byTeacher[t] = [];
        byTeacher[t].push(o);
      }
      for (const t of Object.keys(byTeacher)) {
        if (byTeacher[t].length <= 1) continue;
        // conflict found: teacher t teaching multiple rows at slot idx
        // choose one to move: pick the one with more alternative windows
        const candidates = byTeacher[t].map((x) => x.row);
        const scored = candidates.map((row) => {
          const meta = this.placedMeta.get(row);
          // temporarily remove
          this.removeRow(row);
          const options = this.getConsecutiveWindows(meta.session.durationSlots).filter((w) => {
            // do not violate subject same-day rule
            if (this.subjectUsedSameDay(meta.session, w.day)) return false;
            return true;
          });
          // restore
          this.tryPlace(meta.session, meta.idxs, meta.room);
          return { row, optionsCount: options.length, meta };
        });
        // pick candidate with largest optionsCount to move
        scored.sort((a, b) => b.optionsCount - a.optionsCount);
        const toMove = scored[0];
        if (!toMove) continue;
        // try to find a new window for toMove.row
        const row = toMove.row;
        const meta = this.placedMeta.get(row);
        if (!meta) continue;
        // remove
        this.removeRow(row);
        const windows = this.getConsecutiveWindows(meta.session.durationSlots).filter((w) => {
          // allow same day first but subject day rule enforced by tryPlace
          return true;
        });
        windows.sort((a, b) => {
          const sameDayA = a.day === meta.day ? 0 : 1;
          const sameDayB = b.day === meta.day ? 0 : 1;
          if (sameDayA !== sameDayB) return sameDayA - sameDayB;
          const morningBoundary = toMinutes("10:00");
          const aMorning = a.start < morningBoundary ? 0 : 1;
          const bMorning = b.start < morningBoundary ? 0 : 1;
          if (aMorning !== bMorning) return aMorning - bMorning;
          return a.start - b.start;
        });

        let moved = false;
        for (const w of windows) {
          if (this.tryPlace(meta.session, w.idxs)) {
            moved = true;
            changed = true;
            break;
          }
        }
        if (!moved) {
          // put back
          this.tryPlace(meta.session, meta.idxs, meta.room);
        }
      }
    }
    return changed;
  }

  // -----------------------------
  // Room conflict resolution (rare, but attempt swaps)
  // -----------------------------
  resolveRoomConflicts() {
    let changed = false;
    // build room occupancy map
    const roomMap = {};
    for (const [row, meta] of this.placedMeta.entries()) {
      if (!roomMap[meta.room]) roomMap[meta.room] = new Set();
      meta.idxs.forEach((i) => {
        if (roomMap[meta.room].has(i)) {
          // conflict: same room used twice for same slot -> attempt to find alt room
          const pool = meta.session.roomType === "Classroom" ? (this.rooms.Classroom || this.rooms.classrooms) :
            (this.rooms.Lab || this.rooms.labs);
          const alt = pool.find((r) => r !== meta.room && this.isFree(this.roomBusy, r, meta.idxs));
          if (alt) {
            this.unmarkBusy(this.roomBusy, meta.room, meta.idxs);
            this.markBusy(this.roomBusy, alt, meta.idxs);
            meta.room = alt;
            row.room = alt;
            changed = true;
          } else {
            // try swap with another row occupying same idxs and same type
            const other = [...this.placedMeta.entries()].find(([r2, m2]) =>
              r2 !== row && m2.session.roomType === meta.session.roomType &&
              m2.idxs.length === meta.idxs.length && m2.idxs.every((x, i) => meta.idxs[i] === x)
            );
            if (other) {
              const [oRow, oMeta] = other;
              const tmp = meta.room;
              meta.room = oMeta.room;
              oMeta.room = tmp;
              row.room = meta.room;
              oRow.room = oMeta.room;
              changed = true;
            }
          }
        }
        roomMap[meta.room].add(i);
      });
    }
    return changed;
  }

  // -----------------------------
  // Repair unplaced sessions by limited eviction
  // -----------------------------
  repair(unplacedSessions) {
    let still = unplacedSessions.slice();
    let progress = true;
    let rounds = 0;
    while (progress && still.length && rounds < 6) {
      rounds++;
      progress = false;
      for (let i = still.length - 1; i >= 0; i--) {
        const s = still[i];
        const windows = this.getConsecutiveWindows(s.durationSlots);
        // deterministic order
        windows.sort((a, b) => a.start - b.start || a.day.localeCompare(b.day));
        let placed = false;
        for (const w of windows) {
          // find blockers occupying any idx in w that conflict (division other than allowed parallel or teacher conflict)
          const blockers = new Set();
          for (const idx of w.idxs) {
            for (const [row, meta] of this.placedMeta.entries()) {
              if (meta.idxs.includes(idx)) {
                // blocker if same division but not same block OR same teacher
                const sameDivision = meta.session.division === s.division;
                const sameBlock = meta.session.blockId && s.blockId && meta.session.blockId === s.blockId;
                if ((sameDivision && !sameBlock) || meta.session.teacherId === s.teacherId) {
                  blockers.add(row);
                }
              }
            }
          }
          if (blockers.size === 0) {
            if (this.tryPlace(s, w.idxs)) {
              placed = true;
              break;
            }
            continue;
          }
          if (blockers.size > 2) continue; // limit
          const saved = Array.from(blockers).map((r) => ({ row: r, meta: this.placedMeta.get(r) }));
          // remove blockers
          saved.forEach((x) => this.removeRow(x.row));
          const placedRow = this.tryPlace(s, w.idxs);
          if (!placedRow) {
            // rollback
            saved.forEach((x) => this.tryPlace(x.meta.session, x.meta.idxs, x.meta.room));
            continue;
          }
          // try reseat saved
          let allReseated = true;
          for (const x of saved) {
            const options = this.getConsecutiveWindows(x.meta.session.durationSlots);
            let reseated = false;
            for (const opt of options) {
              if (this.tryPlace(x.meta.session, opt.idxs)) {
                reseated = true;
                break;
              }
            }
            if (!reseated) {
              allReseated = false;
              break;
            }
          }
          if (!allReseated) {
            // full rollback
            this.removeRow(placedRow);
            saved.forEach((x) => this.tryPlace(x.meta.session, x.meta.idxs, x.meta.room));
            continue;
          }
          // success
          placed = true;
          break;
        }
        if (placed) {
          still.splice(i, 1);
          progress = true;
        }
      }
    }
    return still;
  }

  validateFinalSchedule() {
    const subjectDay = new Set();
    const labKeys = new Set();

    for (const meta of this.placedMeta.values()) {
      const s = meta.session;

      const subjectDayKey =
        `${s.division}|${s.subjectId}|${meta.day}`;

      if (subjectDay.has(subjectDayKey)) {
        // Parallel electives have different real subjectId values, so
        // reaching this point means a real duplicate subject/day exists.
        throw new Error(
          `Invalid timetable: ${s.division} has ${s.subjectName} more than once on ${meta.day}.`
        );
      }

      subjectDay.add(subjectDayKey);

      if (s.kind === "lab" && s.sessionKey) {
        if (labKeys.has(s.sessionKey)) {
          throw new Error(
            `Invalid timetable: duplicate lab ${s.sessionKey}.`
          );
        }

        labKeys.add(s.sessionKey);
      }
    }
  }

  // -----------------------------
  // Top-level generate: theory first, then labs, teacher/room resolves, repair
  // -----------------------------
  generate(theorySessions, labSessions) {
    this.reset();
    const warnings = [];

    // 1. Theory: place
    const unplacedTheory = this.placeTheorySessions(theorySessions);

    // 2. Labs: place
    const unplacedLabs = this.placeLabSessions(labSessions);

    let unplaced = [...unplacedTheory, ...unplacedLabs];

    // 3. Resolve teacher conflicts iteratively
    let tRounds = 0;
    while (this.resolveTeacherConflicts() && tRounds < 6) tRounds++;

    // 4. Resolve room conflicts
    let rRounds = 0;
    while (this.resolveRoomConflicts() && rRounds < 6) rRounds++;

    // 5. Repair
    if (unplaced.length) {
      unplaced = this.repair(unplaced);
    }

    // Final safety validation. These are hard business rules; do not silently
    // return a timetable containing duplicate subject/day or duplicate labs.
    this.validateFinalSchedule();

    // sort timetable: division, day order, start time
    const dayRank = new Map(this.workingDays.map((d, i) => [d, i]));
    this.timetable.sort((a, b) => {
      if (a.division !== b.division) return a.division.localeCompare(b.division);
      if (a.day !== b.day) return dayRank.get(a.day) - dayRank.get(b.day);
      return toMinutes(a.startTime) - toMinutes(b.startTime);
    });

    return { timetable: this.timetable.slice(), unplaced: unplaced.slice(), warnings };
  }
}

// -----------------------------
// Public entry
async function generateTimetable(semester) {
  const warnings = [];
  const data = await loadSchedulingData(semester);
  const { settings, divisions, subjects, teacherMap, rooms } = data;

  const workingDays = settings.workingDays && settings.workingDays.length ? settings.workingDays :
    ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const slots = buildTimeSlots({
    workingDays,
    collegeStartTime: settings.collegeStartTime || DEFAULT_START,
    collegeEndTime: settings.collegeEndTime || DEFAULT_END,
  });

  const { theorySessions, labSessions } = buildSessionPool(divisions, subjects, teacherMap, warnings);

  // normalize room shape expected by Scheduler (legacy code sometimes used { Classroom, Lab })
  const roomShape = {
    Classroom: (rooms && rooms.classrooms) ? rooms.classrooms : (rooms.Classroom || []),
    Lab: (rooms && rooms.labs) ? rooms.labs : (rooms.Lab || []),
  };

  const scheduler = new Scheduler(slots, workingDays, roomShape);
  const { timetable, unplaced, warnings: schedWarnings } = (() => {
    const res = scheduler.generate(theorySessions, labSessions);
    return res;
  })();

  // Append warnings
  schedWarnings && schedWarnings.forEach((w) => warnings.push(w));

  // Unplaced explanation warnings
  unplaced.forEach((s) => {
    warnings.push(
      `Could not schedule "${s.subjectName}" (${s.kind}, ${s.roomType}) for division ${s.division}. Possible causes: grid too small, teacher/room overbooked, or daily cap hit.`
    );
  });

  return { timetable, unplaced, warnings };
}

module.exports = {
  generateTimetable,
  buildTimeSlots,
  buildSessionPool,
  loadSchedulingData,
  ELECTIVE_MAPPING,
};