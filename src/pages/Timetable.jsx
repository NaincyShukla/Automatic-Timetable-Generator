import html2canvas from "html2canvas";
import React, { useEffect, useMemo, useState, useCallback } from "react";

/**
 * Timetable.jsx
 * ----------------------------------------------------------------------
 * Weekly timetable display for Monday-Friday.
 *
 * Features:
 * - Shows empty timetable slots as "-"
 * - Shows fixed lunch break from 10:30 AM to 11:00 AM
 * - Supports 60-minute theory sessions
 * - Supports 90-minute laboratory sessions
 * - Supports Lab / Laboratory roomType values
 * - PDF download
 * ----------------------------------------------------------------------
 */

const API_BASE = "http://localhost:5000/api/timetable";

const DIVISIONS = [
  "7EC1",
  "7EC2",
  "7EC3",
  "7EC4",
  "7EC5",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/*
 * Normal timetable boundaries.
 *
 * These are used for displaying empty slots.
 * Actual generated sessions are still displayed with their real
 * startTime and endTime, so a 90-minute lab is not artificially
 * changed into a 60-minute class.
 */
const STANDARD_SLOTS = [
  { start: "07:30", end: "08:30" },
  { start: "08:30", end: "09:30" },
  { start: "09:30", end: "10:30" },

  // Lunch is handled separately.

  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
];

const DAY_START = "07:30";
const DAY_END = "16:00";

const LUNCH_START = "10:30";
const LUNCH_END = "11:00";

const palette = {
  ink: "#1b2430",
  paper: "#f6f4ef",
  panel: "#ffffff",
  rule: "#d8d3c6",

  theory: "#2f5d62",
  theoryBg: "#e4efee",

  lab: "#9a4b32",
  labBg: "#f6e6de",

  accent: "#c98a1e",

  muted: "#6b7280",

  lunchBg: "#eeeae0",
  lunchText: "#6b6253",
};


/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeToMinutes(t) {
  if (!t) return 0;

  const [h, m] = t.split(":").map(Number);

  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTime(t) {
  if (!t) return "";

  const [h, m] = t.split(":").map(Number);

  const suffix = h >= 12 ? "PM" : "AM";

  const hour = h % 12 === 0 ? 12 : h % 12;

  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function isLabRow(row) {
  return (
    row?.roomType === "Lab" ||
    row?.roomType === "Laboratory"
  );
}

function overlapsLunch(start, end) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);

  const ls = timeToMinutes(LUNCH_START);
  const le = timeToMinutes(LUNCH_END);

  return s < le && e > ls;
}


/* ------------------------------------------------------------------ */
/* Build display blocks                                                */
/* ------------------------------------------------------------------ */

/*
 * Converts backend timetable sessions into display blocks.
 *
 * Important:
 * We do NOT modify the actual timetable sessions.
 *
 * Example:
 *
 * Backend:
 * 07:30 - 09:00 Lab
 *
 * Display:
 * 07:30 - 09:00 Lab
 *
 * instead of incorrectly displaying:
 * 07:30 - 08:30 Lab
 * 08:30 - 09:30 Lab
 *
 * Empty periods are split into normal timetable slots.
 */
function buildDayBlocks(day, rows) {

  const dayRows = rows
    .filter((r) => r.day === day)
    .map((r) => ({
      ...r,
      start: timeToMinutes(r.startTime),
      end: timeToMinutes(r.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  const blocks = [];

  let cursor = timeToMinutes(DAY_START);

  const lunchStart = timeToMinutes(LUNCH_START);
  const lunchEnd = timeToMinutes(LUNCH_END);
  const dayEnd = timeToMinutes(DAY_END);

  /*
   * Add empty time between cursor and target.
   * Empty time is split according to normal timetable boundaries.
   */
  const addEmptyBlocks = (from, to) => {

    let current = from;

    while (current < to) {

      /*
       * Find the next standard timetable boundary.
       */
      let nextBoundary = to;

      for (const slot of STANDARD_SLOTS) {

        const s = timeToMinutes(slot.start);
        const e = timeToMinutes(slot.end);

        if (s <= current && e > current) {
          nextBoundary = Math.min(e, to);
          break;
        }

        if (s > current) {
          nextBoundary = Math.min(s, to);
          break;
        }
      }

      /*
       * If nothing matched, move by one hour.
       */
      if (nextBoundary <= current) {
        nextBoundary = Math.min(current + 60, to);
      }

      /*
       * Never create a normal empty block across lunch.
       */
      if (current < lunchStart && nextBoundary > lunchStart) {
        nextBoundary = lunchStart;
      }

      if (current < lunchStart) {

        blocks.push({
          type: "empty",
          start: minutesToTime(current),
          end: minutesToTime(nextBoundary),
        });

      }

      current = nextBoundary;

      /*
       * Add lunch when we reach it.
       */
      if (current === lunchStart && lunchEnd <= to) {

        blocks.push({
          type: "lunch",
          start: LUNCH_START,
          end: LUNCH_END,
        });

        current = lunchEnd;
      }
    }
  };


  for (const row of dayRows) {

    /*
     * If a session overlaps lunch, do not place it across lunch.
     * This is only a display safeguard.
     */
    if (overlapsLunch(row.startTime, row.endTime)) {

      /*
       * Put the session before lunch if possible.
       */
      if (row.start < lunchStart && row.end <= lunchStart) {
        // normal handling below
      } else {
        continue;
      }
    }

    /*
     * If there is a gap before the session,
     * insert "-" slots.
     */
    if (cursor < row.start) {

      /*
       * If cursor is before lunch and row begins after lunch,
       * add the empty period before lunch.
       */
      if (cursor < lunchStart && row.start >= lunchEnd) {

        addEmptyBlocks(cursor, lunchStart);

        cursor = lunchStart;

        if (cursor === lunchStart) {

          blocks.push({
            type: "lunch",
            start: LUNCH_START,
            end: LUNCH_END,
          });

          cursor = lunchEnd;
        }

      } else {

        addEmptyBlocks(cursor, row.start);

        /*
         * addEmptyBlocks may already have inserted lunch.
         */
        if (cursor < lunchStart && row.start > lunchStart) {
          cursor = lunchEnd;
        }
      }
    }

    /*
     * If the session starts after lunch and lunch hasn't
     * already been inserted, add lunch.
     */
    if (
      cursor <= lunchStart &&
      row.start >= lunchEnd
    ) {

      if (
        !blocks.some(
          (b) =>
            b.type === "lunch" &&
            b.start === LUNCH_START
        )
      ) {

        if (cursor < lunchStart) {
          addEmptyBlocks(cursor, lunchStart);
        }

        blocks.push({
          type: "lunch",
          start: LUNCH_START,
          end: LUNCH_END,
        });
      }

      cursor = Math.max(cursor, lunchEnd);
    }

    /*
     * Add actual timetable session.
     */
    blocks.push({
      type: "session",
      row,
      start: row.startTime,
      end: row.endTime,
    });

    cursor = Math.max(cursor, row.end);

  }


  /*
   * Add remaining empty slots.
   */
  if (cursor < dayEnd) {

    if (cursor < lunchStart) {

      addEmptyBlocks(cursor, lunchStart);

      blocks.push({
        type: "lunch",
        start: LUNCH_START,
        end: LUNCH_END,
      });

      cursor = lunchEnd;

    } else if (
      cursor >= lunchStart &&
      cursor < lunchEnd
    ) {

      blocks.push({
        type: "lunch",
        start: LUNCH_START,
        end: LUNCH_END,
      });

      cursor = lunchEnd;
    }

    if (cursor < dayEnd) {
      addEmptyBlocks(cursor, dayEnd);
    }
  }


  /*
   * Remove accidental duplicate lunch entries.
   */
  const finalBlocks = [];

  for (const block of blocks) {

    if (
      block.type === "lunch" &&
      finalBlocks.some(
        (b) =>
          b.type === "lunch" &&
          b.start === LUNCH_START
      )
    ) {
      continue;
    }

    finalBlocks.push(block);
  }

  return finalBlocks;
}


/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function Timetable() {

  const [division, setDivision] =
    useState(DIVISIONS[0]);

  const [semester, setSemester] =
    useState(7);

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [notice, setNotice] =
    useState(null);


  /* -------------------------------------------------------------- */
  /* Fetch timetable                                                 */
  /* -------------------------------------------------------------- */

  const fetchTimetable = useCallback(
    async (div) => {

      setLoading(true);
      setError(null);

      try {

        const res =
          await fetch(`${API_BASE}/${div}`);

        const data =
          await res.json();

        if (!res.ok) {

          setRows([]);

          setError(
            data.message ||
            "No timetable found for this division yet."
          );

          return;
        }

        setRows(
          Array.isArray(data.timetable)
            ? data.timetable
            : []
        );

      } catch (err) {

        console.error(err);

        setRows([]);

        setError(
          "Could not reach the server. Is the backend running?"
        );

      } finally {

        setLoading(false);
      }
    },
    []
  );


  /* -------------------------------------------------------------- */
  /* Load timetable when division changes                            */
  /* -------------------------------------------------------------- */

  useEffect(() => {

    fetchTimetable(division);

  }, [division, fetchTimetable]);


  /* -------------------------------------------------------------- */
  /* Generate timetable                                              */
  /* -------------------------------------------------------------- */

  const handleGenerate = async () => {

    setGenerating(true);
    setError(null);
    setNotice(null);

    try {

      const res =
        await fetch(`${API_BASE}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            semester: Number(semester),
          }),
        });

      const data =
        await res.json();

      if (!res.ok) {

        setError(
          data.message ||
          "Generation failed."
        );

        return;
      }

      const unplacedNote =
        data.unplacedCount
          ? ` ${data.unplacedCount} session(s) could not be placed — check warnings.`
          : " All sessions placed successfully.";

      setNotice(
        `Timetable generated for semester ${semester}.${unplacedNote}`
      );

      if (
        data.warnings &&
        data.warnings.length
      ) {

        console.warn(
          "Timetable generation warnings:",
          data.warnings
        );
      }

      await fetchTimetable(division);

    } catch (err) {

      console.error(err);

      setError(
        "Could not reach the server. Is the backend running?"
      );

    } finally {

      setGenerating(false);
    }
  };


  /* -------------------------------------------------------------- */
  /* Day blocks                                                       */
  /* -------------------------------------------------------------- */

  const dayBlocks = useMemo(() => {

    const result = {};

    DAYS.forEach((day) => {

      result[day] =
        buildDayBlocks(day, rows);

    });

    return result;

  }, [rows]);


  /* -------------------------------------------------------------- */
  /* PDF download                                                     */
  /* -------------------------------------------------------------- */

  const downloadPDF = async () => {
    if (!rows.length) {
      setError("There is no timetable available to download.");
      return;
    }

    const element = document.getElementById("timetable-pdf");

    if (!element) {
      setError("Timetable display could not be found.");
      return;
    }

    try {
      setError(null);

      /*
       * IMPORTANT:
       * The website uses a minimum grid width for horizontal scrolling.
       * Capturing that scroll container directly can crop the Friday column.
       *
       * So for PDF export we create a temporary copy of the timetable,
       * give it a fixed wide canvas, remove horizontal clipping, and make
       * all five day columns fit inside that canvas.
       *
       * Nothing on the actual website is changed.
       */
      const exportWidth = 1250;

      const clone = element.cloneNode(true);

      clone.style.width = `${exportWidth}px`;
      clone.style.minWidth = `${exportWidth}px`;
      clone.style.maxWidth = `${exportWidth}px`;
      clone.style.overflow = "visible";
      clone.style.boxSizing = "border-box";
      clone.style.position = "absolute";
      clone.style.left = "-100000px";
      clone.style.top = "0";
      clone.style.background = palette.paper;

      const grid = clone.querySelector('[style*="grid"]');

      if (grid) {
        grid.style.width = "100%";
        grid.style.minWidth = "0";
        grid.style.maxWidth = "100%";
        grid.style.gridTemplateColumns =
          "repeat(5, minmax(0, 1fr))";
        grid.style.overflow = "visible";
      }

      /*
       * The day columns must also be allowed to shrink equally.
       */
      clone.querySelectorAll("div").forEach((node) => {
        const style = node.getAttribute("style") || "";

        if (
          style.includes("minWidth") &&
          style.includes("background")
        ) {
          node.style.minWidth = "0";
        }
      });

      document.body.appendChild(clone);

      /*
       * Wait one frame so the browser calculates the cloned grid before
       * html2canvas measures it.
       */
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve())
      );

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: palette.paper,
        logging: false,
        width: exportWidth,
        windowWidth: exportWidth,
        scrollX: 0,
        scrollY: 0,
      });

      document.body.removeChild(clone);

      const imageData = canvas.toDataURL("image/png");

      const { default: JsPDF } = await import("jspdf");

      const doc = new JsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 5;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imageRatio = canvas.width / canvas.height;

      /*
       * First fit by width, then by height.
       * This guarantees that Monday, Tuesday, Wednesday, Thursday AND
       * Friday are completely visible on the PDF page.
       */
      let imageWidth = availableWidth;
      let imageHeight = imageWidth / imageRatio;

      if (imageHeight > availableHeight) {
        imageHeight = availableHeight;
        imageWidth = imageHeight * imageRatio;
      }

      const x = (pageWidth - imageWidth) / 2;
      const y = (pageHeight - imageHeight) / 2;

      doc.addImage(
        imageData,
        "PNG",
        x,
        y,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
      );

      doc.save(
        `${division}_Semester_${semester}_Timetable.pdf`
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Unable to generate the PDF. Please try again.");
    }
  };


  /* -------------------------------------------------------------- */
  /* Render                                                           */
  /* -------------------------------------------------------------- */

  return (

    <div style={styles.page}>

      {/* -------------------------------------------------------- */}
      {/* Header                                                     */}
      {/* -------------------------------------------------------- */}

      <header style={styles.header}>

        <div>

          <p style={styles.eyebrow}>
            EduScheduler
          </p>

          <h1 style={styles.title}>
            Weekly Timetable
          </h1>

        </div>


        <div style={styles.controls}>

          {/* Division */}

          <label style={styles.controlGroup}>

            <span style={styles.controlLabel}>
              Division
            </span>

            <select
              value={division}
              onChange={(e) =>
                setDivision(e.target.value)
              }
              style={styles.select}
            >

              {DIVISIONS.map((d) => (

                <option
                  key={d}
                  value={d}
                >
                  {d}
                </option>

              ))}

            </select>

          </label>


          {/* Semester */}

          <label style={styles.controlGroup}>

            <span style={styles.controlLabel}>
              Semester
            </span>

            <input
              type="number"
              value={semester}
              onChange={(e) =>
                setSemester(e.target.value)
              }
              style={styles.input}
              min={1}
              max={8}
            />

          </label>


          {/* Generate */}

          <button
            style={styles.generateBtn}
            onClick={handleGenerate}
            disabled={generating}
          >

            {generating
              ? "Generating..."
              : "Generate Timetable"}

          </button>


          {/* PDF */}

          <button
            style={styles.pdfBtn}
            onClick={downloadPDF}
            disabled={!rows.length}
          >

            Download PDF

          </button>

        </div>

      </header>


      {/* -------------------------------------------------------- */}
      {/* Messages                                                   */}
      {/* -------------------------------------------------------- */}

      {notice && (

        <div
          style={{
            ...styles.banner,
            ...styles.bannerOk,
          }}
        >
          {notice}
        </div>

      )}


      {error && (

        <div
          style={{
            ...styles.banner,
            ...styles.bannerErr,
          }}
        >
          {error}
        </div>

      )}


      {/* -------------------------------------------------------- */}
      {/* Legend                                                     */}
      {/* -------------------------------------------------------- */}

      <div style={styles.legend}>

        <span style={styles.legendItem}>

          <span
            style={{
              ...styles.swatch,
              background:
                palette.theoryBg,
              borderColor:
                palette.theory,
            }}
          />

          Theory

        </span>


        <span style={styles.legendItem}>

          <span
            style={{
              ...styles.swatch,
              background:
                palette.labBg,
              borderColor:
                palette.lab,
            }}
          />

          Laboratory

        </span>


        <span style={styles.legendItem}>

          <span
            style={{
              ...styles.lunchSwatch,
            }}
          />

          Lunch

        </span>

      </div>


      {/* -------------------------------------------------------- */}
      {/* Loading                                                    */}
      {/* -------------------------------------------------------- */}

      {loading ? (

        <p style={styles.status}>
          Loading timetable...
        </p>

      ) : rows.length === 0 ? (

        <p style={styles.status}>
          No timetable saved yet for{" "}
          {division}. Click "Generate
          Timetable" to build one.
        </p>

      ) : (

        <div id="timetable-pdf" style={styles.timetableWrapper}>

          <div style={styles.grid}>

            {DAYS.map((day) => (

              <div
                key={day}
                style={styles.dayColumn}
              >

                {/* Day header */}

                <div style={styles.dayHeader}>
                  {day.toUpperCase()}
                </div>


                {/* Day body */}

                <div style={styles.dayBody}>

                  {dayBlocks[day].map(
                    (block, index) => {

                      /* ------------------------------------ */
                      /* Lunch                                   */
                      /* ------------------------------------ */

                      if (
                        block.type ===
                        "lunch"
                      ) {

                        return (

                          <div
                            key={`${day}-lunch-${index}`}
                            style={styles.lunchBlock}
                          >

                            <div
                              style={
                                styles.lunchTime
                              }
                            >
                              {formatTime(
                                block.start
                              )}{" "}
                              –{" "}
                              {formatTime(
                                block.end
                              )}
                            </div>

                            <div
                              style={
                                styles.lunchText
                              }
                            >
                              LUNCH BREAK
                            </div>

                          </div>

                        );
                      }


                      /* ------------------------------------ */
                      /* Empty                                   */
                      /* ------------------------------------ */

                      if (
                        block.type ===
                        "empty"
                      ) {

                        return (

                          <div
                            key={`${day}-empty-${index}`}
                            style={
                              styles.emptySlot
                            }
                          >

                            <div
                              style={
                                styles.cardTime
                              }
                            >
                              {formatTime(
                                block.start
                              )}{" "}
                              –{" "}
                              {formatTime(
                                block.end
                              )}
                            </div>

                            <div
                              style={
                                styles.emptyDash
                              }
                            >
                              -
                            </div>

                          </div>

                        );
                      }


                      /* ------------------------------------ */
                      /* Actual session                          */
                      /* ------------------------------------ */

                      const row =
                        block.row;

                      const isLab =
                        isLabRow(row);


                      return (

                        <div
                          key={`${day}-session-${index}`}
                          style={{
                            ...styles.card,

                            background:
                              isLab
                                ? palette.labBg
                                : palette.theoryBg,

                            borderLeftColor:
                              isLab
                                ? palette.lab
                                : palette.theory,
                          }}
                        >

                          <div
                            style={
                              styles.cardTime
                            }
                          >

                            {formatTime(
                              row.startTime
                            )}{" "}
                            –{" "}
                            {formatTime(
                              row.endTime
                            )}

                          </div>


                          <div
                            style={
                              styles.cardSubject
                            }
                          >
                            {row.subject}
                          </div>


                          <div
                            style={
                              styles.cardMeta
                            }
                          >
                            {row.teacher}
                          </div>


                          <div
                            style={
                              styles.cardMeta
                            }
                          >
                            {row.room} ·{" "}
                            {isLab
                              ? "Lab"
                              : "Classroom"}
                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}


/* ================================================================== */
/* Styles                                                             */
/* ================================================================== */

const styles = {

  page: {

    fontFamily:
      "'Georgia', 'Iowan Old Style', serif",

    background:
      palette.paper,

    color:
      palette.ink,

    minHeight:
      "100vh",

    padding:
      "32px 40px 64px",
  },


  /* -------------------------------------------------------------- */
  /* Header                                                         */
  /* -------------------------------------------------------------- */

  header: {

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-end",

    flexWrap:
      "wrap",

    gap:
      "20px",

    borderBottom:
      `2px solid ${palette.ink}`,

    paddingBottom:
      "18px",

    marginBottom:
      "20px",
  },


  eyebrow: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "12px",

    letterSpacing:
      "0.14em",

    textTransform:
      "uppercase",

    color:
      palette.accent,

    margin:
      0,
  },


  title: {

    fontSize:
      "34px",

    margin:
      "4px 0 0",

    fontWeight:
      700,
  },


  /* -------------------------------------------------------------- */
  /* Controls                                                       */
  /* -------------------------------------------------------------- */

  controls: {

    display:
      "flex",

    alignItems:
      "flex-end",

    gap:
      "12px",

    flexWrap:
      "wrap",
  },


  controlGroup: {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "4px",

    fontFamily:
      "'Courier New', monospace",
  },


  controlLabel: {

    fontSize:
      "11px",

    letterSpacing:
      "0.08em",

    textTransform:
      "uppercase",

    color:
      palette.muted,
  },


  select: {

    fontFamily:
      "inherit",

    fontSize:
      "14px",

    padding:
      "8px 10px",

    border:
      `1px solid ${palette.ink}`,

    background:
      palette.panel,

    color:
      palette.ink,

    minWidth:
      "76px",
  },


  input: {

    fontFamily:
      "inherit",

    fontSize:
      "14px",

    padding:
      "8px 10px",

    border:
      `1px solid ${palette.ink}`,

    background:
      palette.panel,

    color:
      palette.ink,

    width:
      "70px",
  },


  generateBtn: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "13px",

    letterSpacing:
      "0.04em",

    textTransform:
      "uppercase",

    padding:
      "10px 18px",

    background:
      palette.ink,

    color:
      palette.paper,

    border:
      "none",

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",
  },


  pdfBtn: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "13px",

    letterSpacing:
      "0.04em",

    textTransform:
      "uppercase",

    padding:
      "10px 18px",

    background:
      palette.accent,

    color:
      "#ffffff",

    border:
      "none",

    cursor:
      "pointer",

    whiteSpace:
      "nowrap",
  },


  /* -------------------------------------------------------------- */
  /* Messages                                                       */
  /* -------------------------------------------------------------- */

  banner: {

    padding:
      "10px 14px",

    marginBottom:
      "16px",

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "13px",

    borderLeft:
      "4px solid",
  },


  bannerOk: {

    background:
      "#eaf3ea",

    borderColor:
      "#3f7d4f",

    color:
      "#234a2c",
  },


  bannerErr: {

    background:
      "#f7e6e2",

    borderColor:
      palette.lab,

    color:
      "#5c2a19",
  },


  /* -------------------------------------------------------------- */
  /* Legend                                                         */
  /* -------------------------------------------------------------- */

  legend: {

    display:
      "flex",

    gap:
      "18px",

    marginBottom:
      "18px",

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "12px",

    color:
      palette.muted,

    flexWrap:
      "wrap",
  },


  legendItem: {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "6px",
  },


  swatch: {

    display:
      "inline-block",

    width:
      "12px",

    height:
      "12px",

    border:
      "1px solid",
  },


  lunchSwatch: {

    display:
      "inline-block",

    width:
      "12px",

    height:
      "12px",

    background:
      palette.lunchBg,

    border:
      `1px solid ${palette.lunchText}`,
  },


  /* -------------------------------------------------------------- */
  /* Status                                                         */
  /* -------------------------------------------------------------- */

  status: {

    fontFamily:
      "'Courier New', monospace",

    color:
      palette.muted,

    fontSize:
      "14px",
  },


  /* -------------------------------------------------------------- */
  /* Timetable                                                      */
  /* -------------------------------------------------------------- */

  timetableWrapper: {

    width:
      "100%",

    overflowX:
      "auto",

    background:
      palette.paper,

    boxSizing:
      "border-box",
  },


  grid: {

    display:
      "grid",

    gridTemplateColumns:
      "repeat(5, minmax(200px, 1fr))",

    gap:
      "14px",

    alignItems:
      "start",

    minWidth:
      "1050px",
  },


  dayColumn: {

    background:
      palette.panel,

    border:
      `1px solid ${palette.rule}`,

    minWidth:
      0,
  },


  dayHeader: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "12px",

    letterSpacing:
      "0.08em",

    textTransform:
      "uppercase",

    padding:
      "11px 12px",

    borderBottom:
      `2px solid ${palette.ink}`,

    background:
      palette.ink,

    color:
      palette.paper,

    fontWeight:
      700,
  },


  dayBody: {

    padding:
      "10px",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "8px",

    minHeight:
      "120px",
  },


  /* -------------------------------------------------------------- */
  /* Actual session card                                            */
  /* -------------------------------------------------------------- */

  card: {

    borderLeft:
      "4px solid",

    padding:
      "9px 10px",

    minHeight:
      "74px",

    boxSizing:
      "border-box",
  },


  cardTime: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "10px",

    color:
      palette.muted,

    marginBottom:
      "5px",
  },


  cardSubject: {

    fontSize:
      "14px",

    fontWeight:
      700,

    lineHeight:
      1.25,

    marginBottom:
      "3px",
  },


  cardMeta: {

    fontSize:
      "11px",

    color:
      palette.muted,

    lineHeight:
      1.3,
  },


  /* -------------------------------------------------------------- */
  /* Empty slot                                                     */
  /* -------------------------------------------------------------- */

  emptySlot: {

    background:
      "#faf9f6",

    border:
      `1px dashed ${palette.rule}`,

    padding:
      "9px 10px",

    minHeight:
      "58px",

    boxSizing:
      "border-box",
  },


  emptyDash: {

    textAlign:
      "center",

    color:
      "#a4a09a",

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "18px",

    fontWeight:
      700,

    padding:
      "3px 0 2px",
  },


  /* -------------------------------------------------------------- */
  /* Lunch                                                         */
  /* -------------------------------------------------------------- */

  lunchBlock: {

    background:
      palette.lunchBg,

    border:
      `1px solid ${palette.rule}`,

    padding:
      "7px 10px",

    textAlign:
      "center",

    margin:
      "2px 0",

    boxSizing:
      "border-box",
  },


  lunchTime: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "9px",

    color:
      palette.lunchText,

    marginBottom:
      "2px",
  },


  lunchText: {

    fontFamily:
      "'Courier New', monospace",

    fontSize:
      "10px",

    fontWeight:
      700,

    letterSpacing:
      "0.08em",

    color:
      palette.lunchText,
  },

};