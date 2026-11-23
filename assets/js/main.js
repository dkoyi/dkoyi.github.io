// Small enhancements only. The page works fully without JavaScript.
(function () {
  var root = document.documentElement;

  // ----- Theme toggle (follows the system until the visitor picks one) -----
  var themeBtn = document.querySelector(".theme-toggle");
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.dataset.theme || (media.matches ? "dark" : "light");
  }
  function syncThemeButton() {
    var dark = currentTheme() === "dark";
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (themeBtn) {
    syncThemeButton();
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncThemeButton();
    });
    media.addEventListener("change", syncThemeButton);
  }

  // ----- Mobile menu -----
  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("nav-links");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("is-open", open);
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  // ----- Commit heatmap -----
  // Each event links a run of commit days to a project card on this page.
  var EVENTS = [
    { name: "Talk Kit", from: "2026-10-10", to: "2026-10-13", href: "#talk-kit" },
    { name: "Cramberry", from: "2026-10-24", to: "2026-10-26", href: "#cramberry" },
    { name: "Pit Pal", from: "2026-11-07", to: "2026-11-12", href: "#pit-pal" },
    { name: "CIC Launchpad", from: "2026-11-14", to: "2026-11-15", href: "#cic-launchpad" }
  ];
  var grid = document.getElementById("commits-grid");
  if (grid && window.fetch) {
    fetch("assets/data/contributions.json")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(drawHeatmap)
      .catch(function () {
        var fig = grid.closest(".commits");
        if (fig) fig.hidden = true;
      });
  }

  function fmt(iso) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function level(n, max) {
    if (!n) return 0;
    var r = n / max;
    return r > 0.6 ? 4 : r > 0.35 ? 3 : r > 0.15 ? 2 : 1;
  }

  function drawHeatmap(data) {
    var days = data.days || [];
    if (!days.length) return;
    var max = Math.max.apply(null, days.map(function (d) { return d[1]; })) || 1;
    var caption = document.getElementById("commits-caption");
    var defaultCaption = caption.textContent;
    var frag = document.createDocumentFragment();

    // Pad the first column so rows line up with weekdays (Sunday first)
    var firstDow = new Date(days[0][0] + "T12:00:00").getDay();
    for (var p = 0; p < firstDow; p++) {
      var pad = document.createElement("span");
      pad.className = "c c--pad";
      frag.appendChild(pad);
    }
    var cells = {};
    days.forEach(function (d) {
      var el = document.createElement("span");
      el.className = "c";
      el.dataset.l = level(d[1], max);
      el.dataset.date = d[0];
      el.title = d[1] + (d[1] === 1 ? " contribution on " : " contributions on ") + fmt(d[0]);
      cells[d[0]] = el;
      frag.appendChild(el);
    });
    grid.appendChild(frag);

    // Month labels sit above the first week that contains the 1st of a month
    var months = document.getElementById("commits-months");
    if (months) {
      var weeks = Math.ceil((firstDow + days.length) / 7);
      var lastLabelWeek = -4;
      days.forEach(function (d, i) {
        if (d[0].slice(8) !== "01") return;
        var week = Math.floor((firstDow + i) / 7);
        if (week - lastLabelWeek < 3 || week > weeks - 2) return;
        var s = document.createElement("span");
        s.style.gridColumn = String(week + 1);
        s.textContent = new Date(d[0] + "T12:00:00").toLocaleDateString("en-US", { month: "short" });
        months.appendChild(s);
        lastLabelWeek = week;
      });
    }

    var active = days.filter(function (d) { return d[1] > 0; }).length;
    grid.setAttribute("aria-label", data.total + " contributions on " + active + " days in the past year. The busiest stretches are the hackathons listed below.");
    document.getElementById("commits-total").textContent = data.total + " contributions in the last year";

    // Start scrolled to the most recent weeks on narrow screens
    var scroller = grid.closest(".commits__scroll");
    if (scroller) requestAnimationFrame(function () { scroller.scrollLeft = scroller.scrollWidth; });

    // Hovering a cell updates the caption
    grid.addEventListener("mouseover", function (e) {
      if (e.target.dataset && e.target.dataset.date) caption.textContent = e.target.title;
    });
    grid.addEventListener("mouseleave", function () { caption.textContent = defaultCaption; });

    // Event chips highlight their days and jump to the project card
    var list = document.getElementById("commits-events");
    EVENTS.forEach(function (ev) {
      var on = days.filter(function (d) { return d[0] >= ev.from && d[0] <= ev.to; });
      var n = on.reduce(function (s, d) { return s + d[1]; }, 0);
      if (!n) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "event-chip";
      a.href = ev.href;
      a.innerHTML = '<span class="event-chip__dot" aria-hidden="true"></span><span class="event-chip__name">' + ev.name + '</span>' +
        ' <span class="event-chip__n">' + fmt(ev.from) + " to " + fmt(ev.to) + " · " + n + " contributions</span>";
      function show() {
        grid.classList.add("is-focus");
        on.forEach(function (d) { cells[d[0]] && cells[d[0]].classList.add("is-on"); });
        caption.textContent = ev.name + ". " + n + " contributions from " + fmt(ev.from) + " to " + fmt(ev.to) + ".";
      }
      function hide() {
        grid.classList.remove("is-focus");
        on.forEach(function (d) { cells[d[0]] && cells[d[0]].classList.remove("is-on"); });
        caption.textContent = defaultCaption;
      }
      a.addEventListener("mouseenter", show);
      a.addEventListener("focus", show);
      a.addEventListener("mouseleave", hide);
      a.addEventListener("blur", hide);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  // ----- Footer year -----
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
