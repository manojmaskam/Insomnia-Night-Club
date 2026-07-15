/* ============================================================
   INSOMNIA — dynamic events renderer
   Reads events from data/events.csv (Excel → Save As CSV).
   Falls back to data/events.json if no CSV is present.
   Fills any [data-events-grid] on the page.
   ------------------------------------------------------------
   CSV columns (header row required, any order):
       name, date, time, image        (optional: id)
   date: YYYY-MM-DD  (also accepts DD/MM/YYYY or "15 Jul 2026")
   ------------------------------------------------------------
   Grid attributes:
     data-events-upcoming="1"  -> show upcoming; if none, show the
                                  most recent past event
     data-events-limit="N"     -> show at most N
   ============================================================ */
(function () {
  "use strict";

  var grids = document.querySelectorAll("[data-events-grid]");
  if (!grids.length) return;

  var MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var bust = "?v=" + Date.now();

  loadEvents().then(function (events) {
    if (!Array.isArray(events)) events = [];
    events.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

    grids.forEach(function (grid) {
      var list = events.slice();

      if (grid.getAttribute("data-events-upcoming") === "1") {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var upcoming = list.filter(function (e) { var d = parseDate(e.date); return d && d >= today; });
        if (upcoming.length) {
          list = upcoming;
        } else {
          var past = list.filter(function (e) { var d = parseDate(e.date); return d && d < today; });
          list = past.length ? [past[past.length - 1]] : [];
        }
      }
      var limit = parseInt(grid.getAttribute("data-events-limit") || "0", 10);
      if (limit > 0) list = list.slice(0, limit);

      grid.innerHTML = list.map(cardHTML).join("");
    });
  });

  /* ---------- data loading: CSV first, JSON fallback ---------- */
  function loadEvents() {
    return fetch("data/events.csv" + bust, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) return loadJSON();
        return r.text().then(function (txt) {
          var rows = parseCSV(txt);
          return rows.length ? rows : loadJSON();
        });
      })
      .catch(loadJSON);
  }
  function loadJSON() {
    return fetch("data/events.json" + bust, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .catch(function () { return []; });
  }

  /* ---------- CSV → event objects ---------- */
  function parseCSV(text) {
    var rows = tokenizeCSV(text);
    if (rows.length < 2) return [];
    var header = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var ci = {
      name:  header.indexOf("name"),
      date:  header.indexOf("date"),
      time:  header.indexOf("time"),
      image: header.indexOf("image"),
      id:    header.indexOf("id")
    };
    if (ci.name < 0 || ci.date < 0) return []; // not a valid events sheet
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      var c = rows[i];
      if (!c.length || (c.length === 1 && String(c[0]).trim() === "")) continue;
      var name = cell(c, ci.name);
      if (!name) continue;
      out.push({
        id:    cell(c, ci.id) || ("csv_" + i),
        name:  name,
        date:  normalizeDate(cell(c, ci.date)),
        time:  cell(c, ci.time),
        image: cell(c, ci.image) || "assets/images/dj_card.jpg"
      });
    }
    return out;
  }
  function cell(row, idx) { return idx >= 0 && idx < row.length ? String(row[idx]).trim() : ""; }

  // RFC-4180-ish tokenizer: handles quotes, escaped quotes, commas & newlines in quotes
  function tokenizeCSV(text) {
    text = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var rows = [], row = [], field = "", inQ = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ",") { row.push(field); field = ""; }
        else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
        else field += ch;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  /* ---------- date helpers ---------- */
  function pad(n) { n = String(n); return n.length < 2 ? "0" + n : n; }
  function normalizeDate(s) {
    s = String(s || "").trim();
    if (!s) return "";
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);           // ISO
    if (m) return m[1] + "-" + pad(m[2]) + "-" + pad(m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);  // DD/MM/YYYY (day-first)
    if (m) { var y = +m[3]; if (y < 100) y += 2000; return y + "-" + pad(m[2]) + "-" + pad(m[1]); }
    var d = new Date(s);                                          // "15 Jul 2026" etc.
    if (!isNaN(d.getTime())) return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    return s;
  }
  function parseDate(s) {
    if (!s) return null;
    var p = String(s).split("-");
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  /* ---------- card markup ---------- */
  function cardHTML(ev) {
    var d = parseDate(ev.date);
    var weekday = d ? DAYS[d.getDay()] : "";
    var dateLabel = d ? (d.getDate() + " " + MONTHS[d.getMonth()]) : esc(ev.date || "");
    var img = esc(ev.image || "assets/images/dj_card.jpg");
    var name = esc(ev.name || "");
    var time = esc(ev.time || "");
    return (
      '<article class="pcard" data-card>' +
        '<div class="pcard__img"><img src="' + img + '" alt="' + name +
          ' performing live at Insomnia Night Club, Hyderabad" loading="lazy" decoding="async" /></div>' +
        '<div class="pcard__bar">' +
          '<div class="pcard__info"><h3>' + name + "</h3>" +
            "<p>" + time + "&nbsp; | &nbsp;" + weekday + "</p></div>" +
          '<p class="pcard__date">' + dateLabel + "</p>" +
        "</div>" +
      "</article>"
    );
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
})();
