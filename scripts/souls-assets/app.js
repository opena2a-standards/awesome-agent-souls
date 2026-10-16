/* SOUL Library — standalone app (inlined at build time). No network, no deps. */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("souls-data").textContent);
  var SOULS = DATA.souls || [];
  var META = DATA.meta || {};
  var BY_ID = {};
  SOULS.forEach(function (s) { BY_ID[s.id] = s; });

  var AXIS_ORDER = ["role", "industry", "org", "usecase", "fleet", "examples", "templates"];
  var AXIS_LABEL = {
    role: "By Role", industry: "By Industry", org: "By Organization Type",
    usecase: "By Use Case", fleet: "By Fleet", examples: "Examples", templates: "Templates"
  };
  var AXIS_NOTE = {
    role: "What the agent does day to day",
    industry: "Tuned to a sector's rules and risks",
    org: "Shaped by the organisation it serves",
    usecase: "Built around a single job to be done",
    fleet: "Multi-agent teams that work together",
    examples: "End-to-end worked examples",
    templates: "Starting points to copy and adapt"
  };
  var AXIS_LETTER = { role: "R", industry: "I", org: "O", usecase: "U", fleet: "F", examples: "E", templates: "T" };
  var KIND_LABEL = { fleet: "Fleet", template: "Template", example: "Example", soul: "Soul" };

  /* ------------------------------------------------------------------ *
   * Colour system: every axis owns a hue; groups spread within it.      *
   * ------------------------------------------------------------------ */
  var AXIS_HUE = { role: 222, industry: 186, org: 336, usecase: 28, fleet: 152, examples: 272, templates: 305 };
  function axisHue(axis) { return AXIS_HUE[axis] != null ? AXIS_HUE[axis] : 222; }
  function groupHueOf(g) {
    if (!g) return 222;
    var gs = GROUPS_BY_AXIS[g.axis] || [];
    var i = gs.indexOf(g), n = gs.length, base = axisHue(g.axis);
    var off = n > 1 ? ((i / (n - 1)) - 0.5) * 84 : 0;
    return Math.round((base + off + 360) % 360);
  }
  /* ------------------------------------------------------------------ *
   * Per-hue lightness.                                                  *
   * A single --tc-l for every hue is not a single contrast: at HSL 38%  *
   * the greens and teals land near 3.6:1 while the blues clear 7:1, so  *
   * 21 of the 41 group colours missed the 4.5:1 floor in light theme.   *
   * Each hue therefore gets its own lightness, solved against the       *
   * lowest-contrast surface it can appear on and against the strongest  *
   * tint it can sit in. These constants mirror app.css; change both.    *
   * ------------------------------------------------------------------ */
  var TC_S = { light: 50, dark: 58 };
  var TC_BASE = { light: [244, 240, 234], dark: [36, 40, 50] };  // --surface-2
  var TC_TINT = 0.14;    // .badge lays the hue over the surface at this alpha
  var TC_TARGET = 4.6;   // a hair above the 4.5:1 floor, for rounding

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    function f(n) {
      var k = (n + h / 30) % 12;
      return (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))) * 255;
    }
    return [f(0), f(8), f(4)];
  }
  function relLum(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]);
  }
  function contrast(a, b) {
    var x = relLum(a), y = relLum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  // Light theme wants the lightest value that still passes, dark the darkest,
  // so the hues stay as distinguishable as the floor allows.
  function solveL(hue, theme) {
    var sat = TC_S[theme], base = TC_BASE[theme], dark = theme === "dark";
    var lo = dark ? 40 : 10, hi = dark ? 95 : 60, best = dark ? 95 : 10;
    for (var i = 0; i < 24; i++) {
      var mid = (lo + hi) / 2, c = hslToRgb(hue, sat, mid);
      var tinted = [0, 1, 2].map(function (k) { return c[k] * TC_TINT + base[k] * (1 - TC_TINT); });
      if (contrast(c, tinted) >= TC_TARGET) { best = mid; if (dark) hi = mid; else lo = mid; }
      else if (dark) lo = mid; else hi = mid;
    }
    return Math.round(best * 10) / 10;
  }
  var TC_CACHE = {};
  function hueVars(h) {
    if (!TC_CACHE[h]) {
      TC_CACHE[h] = "--h:" + h + ";--tl:" + solveL(h, "light") + "%;--tld:" + solveL(h, "dark") + "%";
    }
    return TC_CACHE[h];
  }
  function hueAttr(h) { return ' style="' + hueVars(h) + '"'; }
  function axisLetter(axis) { return AXIS_LETTER[axis] || "?"; }
  function amark(axis) {
    return '<span class="amark hue" style="' + hueVars(axisHue(axis)) + '" aria-hidden="true">' + axisLetter(axis) + "</span>";
  }

  /* ------------------------------------------------------------------ *
   * Group index                                                         *
   * ------------------------------------------------------------------ */
  var GROUPS = {};      // key "axis/slug" -> {axis, slug, label, count, souls:[]}
  var GROUPS_BY_AXIS = {};
  AXIS_ORDER.forEach(function (a) { GROUPS_BY_AXIS[a] = []; });

  SOULS.forEach(function (s) {
    var key = s.axis + "/" + s.group;
    var g = GROUPS[key];
    if (!g) {
      g = { key: key, axis: s.axis, slug: s.group, label: s.groupLabel, count: 0, souls: [] };
      GROUPS[key] = g;
      if (GROUPS_BY_AXIS[s.axis]) GROUPS_BY_AXIS[s.axis].push(g);
    }
    g.souls.push(s);
    g.count++;
  });
  AXIS_ORDER.forEach(function (a) {
    GROUPS_BY_AXIS[a].sort(function (x, y) { return x.label.localeCompare(y.label); });
    GROUPS_BY_AXIS[a].forEach(function (g) {
      g.souls.sort(function (x, y) { return (x.heading || x.name).localeCompare(y.heading || y.name); });
    });
  });

  /* ------------------------------------------------------------------ *
   * Markdown (small, dependency-free)                                   *
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // esc() leaves the quote characters alone, because the link regex below still
  // has to see a literal " to find a title. Anything going into an attribute is
  // escaped here instead, at the point of interpolation.
  function escAttr(s) {
    return String(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // Only these schemes become real links. javascript:, data: and the rest fall
  // through to plain text rather than being rendered as something clickable.
  function safeHref(url) {
    return /^(?:https?:|mailto:)/i.test(url) ? url : null;
  }
  var CODE_MARK = "\u0000";
  var LINK_MARK = "\u0001";
  var CODE_RE = new RegExp(CODE_MARK + "(\\d+)" + CODE_MARK, "g");
  var LINK_RE = new RegExp(LINK_MARK + "(\\d+)" + LINK_MARK, "g");

  function em(s) {
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  }

  // Code spans and link targets are both lifted out before emphasis runs and
  // put back afterwards. Without that, `**literal**` loses its asterisks and a
  // URL containing one grows an <em> in the middle of its href. Labels keep
  // their emphasis because em() is applied to them on the way back in.
  function inline(t) {
    var s = esc(t);
    var code = [];
    s = s.replace(/`([^`]+)`/g, function (m, c) {
      return CODE_MARK + (code.push(c) - 1) + CODE_MARK;
    });
    var links = [];
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (m, label, href) {
      return LINK_MARK + (links.push({ label: label, href: href }) - 1) + LINK_MARK;
    });
    s = em(s);
    s = s.replace(LINK_RE, function (m, i) {
      var l = links[Number(i)], safe = safeHref(l.href);
      if (safe) {
        return '<a href="' + escAttr(safe) + '" target="_blank" rel="noreferrer noopener">' + em(l.label) + "</a>";
      }
      return '<span class="reflink" title="' + escAttr(l.href) + '">' + em(l.label) + "</span>";
    });
    return s.replace(CODE_RE, function (m, i) {
      return "<code>" + code[Number(i)] + "</code>";
    });
  }

  // Collects one list block. An item indented past the first item's indent is
  // attached to the item above it, so a nested run no longer ends the list and
  // restarts the numbering. Levels below the second are folded into the second.
  function renderList(lines, start, ordered) {
    var FIRST = ordered ? /^(\s*)\d+[.)]\s+(.*)$/ : /^(\s*)[-*+]\s+(.*)$/;
    var ANY = /^(\s*)(?:\d+[.)]|[-*+])\s+(.*)$/;
    var items = [], i = start, m;
    while (i < lines.length) {
      m = (items.length ? ANY : FIRST).exec(lines[i]);
      if (!m) break;
      items.push({ indent: m[1].length, text: m[2], ord: /^\s*\d/.test(lines[i]) });
      i++;
    }
    if (!items.length) return null;
    var base = items[0].indent;
    var out = ordered ? "<ol>" : "<ul>";
    var k = 0, openItem = false;
    while (k < items.length) {
      if (items[k].indent > base) {
        var nested = [], nord = items[k].ord;
        while (k < items.length && items[k].indent > base) { nested.push(items[k].text); k++; }
        out += (nord ? "<ol>" : "<ul>") +
          nested.map(function (x) { return "<li>" + inline(x) + "</li>"; }).join("") +
          (nord ? "</ol>" : "</ul>");
        continue;
      }
      if (openItem) out += "</li>";
      out += "<li>" + inline(items[k].text);
      openItem = true;
      k++;
    }
    if (openItem) out += "</li>";
    out += ordered ? "</ol>" : "</ul>";
    return { html: out, next: i };
  }
  function splitRow(l) {
    return l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(function (c) { return c.trim(); });
  }
  function mdToHtml(md) {
    var lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    var html = "", i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        var buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        html += '<pre class="code"><code>' + esc(buf.join("\n")) + "</code></pre>";
        continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|/.test(lines[i + 1])) {
        var head = splitRow(line); i += 2; var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        html += "<table><thead><tr>" + head.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") +
          "</tr></thead><tbody>" + rows.map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>";
          }).join("") + "</tbody></table>";
        continue;
      }
      var hm = /^(#{1,6})\s+(.*)$/.exec(line);
      if (hm) { var lvl = hm[1].length; html += "<h" + lvl + ">" + inline(hm[2]) + "</h" + lvl + ">"; i++; continue; }
      if (/^\s*>\s?/.test(line)) {
        var qb = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { qb.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
        html += "<blockquote>" + mdToHtml(qb.join("\n")) + "</blockquote>";
        continue;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        var ul = renderList(lines, i, false);
        html += ul.html; i = ul.next;
        continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        var ol = renderList(lines, i, true);
        html += ol.html; i = ol.next;
        continue;
      }
      if (/^\s*$/.test(line)) { i++; continue; }
      var pb = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) &&
             !/^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|\s*>)/.test(lines[i]) && !/^\s*\|/.test(lines[i])) {
        pb.push(lines[i]); i++;
      }
      html += "<p>" + inline(pb.join(" ")) + "</p>";
    }
    return html;
  }

  /* ------------------------------------------------------------------ *
   * Theme                                                               *
   * ------------------------------------------------------------------ */
  var THEME_KEY = "souls-theme";
  var media = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")) ||
    { matches: false, addEventListener: function () {} };
  function resolved(mode) { return mode === "dark" || (mode === "auto" && media.matches) ? "dark" : "light"; }
  function getMode() {
    try { var m = localStorage.getItem(THEME_KEY); if (m === "light" || m === "dark" || m === "auto") return m; } catch (e) {}
    return "auto";
  }
  function applyTheme(mode) {
    document.documentElement.setAttribute("data-theme", resolved(mode));
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-btn]"), function (b) {
      var on = b.getAttribute("data-theme-btn") === mode;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  media.addEventListener("change", function () { if (getMode() === "auto") applyTheme("auto"); });

  /* ------------------------------------------------------------------ *
   * Helpers                                                             *
   * ------------------------------------------------------------------ */
  function hash() { return location.hash.replace(/^#/, "") || "/"; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  var ARTICLE_CACHE = {};
  function secId(slug) { return "sec-" + slug; }
  function soulHref(s, slug) {
    return "#/s/" + encodeURIComponent(s.id) + (slug ? "/sec/" + encodeURIComponent(slug) : "");
  }
  function chip(text, accent) { return '<span class="chip' + (accent ? " accent" : "") + '">' + esc(text) + "</span>"; }
  function kindBadge(kind) {
    if (!kind || kind === "soul") return "";
    return '<span class="badge ' + kind + '">' + (KIND_LABEL[kind] || kind) + "</span>";
  }
  function clip(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
  }
  function countAxis(axis) {
    var n = 0; (GROUPS_BY_AXIS[axis] || []).forEach(function (g) { n += g.count; }); return n;
  }
  function highlight(text, q) {
    var t = String(text == null ? "" : text);
    if (!q) return esc(t);
    var i = t.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(t);
    return esc(t.slice(0, i)) + "<mark>" + esc(t.slice(i, i + q.length)) + "</mark>" + esc(t.slice(i + q.length));
  }

  /* ------------------------------------------------------------------ *
   * Row builders                                                        *
   * ------------------------------------------------------------------ */
  function groupRow(g) {
    return '<a class="row hue"' + hueAttr(groupHueOf(g)) + ' href="#/g/' + g.key + '">' + amark(g.axis) +
      '<span class="body"><span class="t">' + esc(g.label) + '</span>' +
      '<span class="sub">' + plural(g.count, "document", "documents") + "</span></span>" +
      '<span class="go" aria-hidden="true">→</span></a>';
  }
  function soulRow(s) {
    var g = GROUPS[s.axis + "/" + s.group];
    return '<a class="row hue"' + hueAttr(groupHueOf(g)) + ' href="#/s/' + encodeURIComponent(s.id) + '">' + amark(s.axis) +
      '<span class="body"><span class="t">' + esc(s.heading || s.name) + " " + kindBadge(s.kind) + "</span>" +
      '<span class="sub">' + esc(s.role || s.groupLabel) +
      (s.description ? " · " + esc(clip(s.description, 96)) : "") + "</span></span>" +
      '<span class="go" aria-hidden="true">→</span></a>';
  }
  function tile(hue, dataJump, href, titleHtml, sub) {
    var jump = dataJump ? ' data-jump="' + dataJump + '"' : "";
    return '<a class="tile hue" style="' + hueVars(hue) + '"' + jump + ' href="' + href + '">' +
      '<span class="tname">' + titleHtml + "</span><span class=\"tn\">" + esc(sub) + "</span></a>";
  }

  /* ------------------------------------------------------------------ *
   * Views                                                               *
   * ------------------------------------------------------------------ */
  // Built once at boot; setActiveNav moves the highlight afterwards.
  function sidebarHtml() {
    var h = "";
    AXIS_ORDER.forEach(function (axis) {
      var gs = GROUPS_BY_AXIS[axis];
      if (!gs || !gs.length) return;
      h += '<h3 class="hue"' + hueAttr(axisHue(axis)) + ">" + esc(AXIS_LABEL[axis]) + "</h3>";
      gs.forEach(function (g) {
        h += '<a class="navlink hue"' + hueAttr(groupHueOf(g)) + ' href="#/g/' + g.key + '" data-key="' + g.key + '">' +
          '<span class="dot" aria-hidden="true"></span>' +
          '<span class="lbl">' + esc(g.label) + "</span>" +
          '<span class="count">' + g.count + "</span></a>";
      });
    });
    return h;
  }

  function homeHtml() {
    var h = '<div class="hero">' +
      '<p class="eyebrow">Standalone · offline · ' + SOULS.length + ' documents</p>' +
      "<h1>SOUL Library</h1>" +
      '<p class="lede">Every agent identity in <strong>' + esc(META.repo || "the repository") +
      "</strong>, organised seven ways. Find the right one, then read it in full — without opening a single file.</p>" +
      '<div class="stats">' +
      '<div class="stat"><b>' + SOULS.length + "</b><span>souls &amp; templates</span></div>" +
      '<div class="stat"><b>' + Object.keys(GROUPS).length + "</b><span>groups</span></div>" +
      // countAxis("fleet") is the number of agents across the fleets, not the
      // number of fleets, which is what the label says.
      '<div class="stat"><b>' + (GROUPS_BY_AXIS.fleet || []).length + "</b><span>fleets</span></div>" +
      "</div></div>";

    // Start here
    var starts = [];
    function firstWhere(fn) { for (var i = 0; i < SOULS.length; i++) { if (fn(SOULS[i])) return SOULS[i]; } return null; }
    [firstWhere(function (s) { return s.axis === "templates"; }),
     firstWhere(function (s) { return s.kind === "fleet"; }),
     firstWhere(function (s) { return s.axis === "role" && s.group === "development"; }),
     firstWhere(function (s) { return s.axis === "examples"; })].forEach(function (s) {
      if (s) starts.push(s);
    });
    if (starts.length) {
      h += '<h2 class="slabel">Start here</h2><div class="tiles">' +
        starts.map(function (s) {
          var g = GROUPS[s.axis + "/" + s.group];
          return tile(groupHueOf(g), null, "#/s/" + encodeURIComponent(s.id),
            amark(s.axis) + esc(s.heading || s.name), (s.axisLabel || "") + " · " + (s.groupLabel || ""));
        }).join("") + "</div>";
    }

    // Browse by
    h += '<h2 class="slabel">Browse by</h2><div class="tiles">' +
      AXIS_ORDER.map(function (axis) {
        if (!(GROUPS_BY_AXIS[axis] || []).length) return "";
        return tile(axisHue(axis), "home-" + axis, "#home-" + axis,
          amark(axis) + esc(AXIS_LABEL[axis]),
          plural(countAxis(axis), "document", "documents") + " · " +
          plural(GROUPS_BY_AXIS[axis].length, "group", "groups"));
      }).join("") + "</div>";

    // Full catalogue as lists
    AXIS_ORDER.forEach(function (axis) {
      var gs = GROUPS_BY_AXIS[axis];
      if (!gs || !gs.length) return;
      h += '<section class="axis-sec" id="home-' + axis + '">' +
        '<div class="ah"><h2>' + esc(AXIS_LABEL[axis]) + '</h2><span class="c">' +
        plural(countAxis(axis), "document", "documents") + "</span></div>" +
        '<div class="rows">' + gs.map(groupRow).join("") + "</div></section>";
    });
    return h;
  }

  function groupHtml(g) {
    return '<div class="sect-head hue"' + hueAttr(groupHueOf(g)) + ">" +
      '<nav class="crumbs"><a href="#/">Home</a><span>/</span>' + esc(AXIS_LABEL[g.axis]) + "<span>/</span>" + esc(g.label) + "</nav>" +
      "<h1>" + esc(g.label) + "</h1>" +
      '<p class="sub">' + plural(g.count, "document", "documents") + " in " +
      esc(AXIS_LABEL[g.axis]) + " · " + esc(AXIS_NOTE[g.axis] || "") + "</p></div>" +
      '<div class="rows">' + g.souls.map(soulRow).join("") + "</div>";
  }

  function soulHtml(s) {
    var g = GROUPS[s.axis + "/" + s.group];
    var hue = groupHueOf(g);
    var withHead = (s.sections || []).filter(function (x) { return x.heading; });

    var metas = [];
    if (s.role) metas.push(chip(s.role, true));
    if (s.author) metas.push(chip("author: " + s.author));
    if (s.fleet) metas.push(chip("fleet: " + s.fleet));
    if (s.category) metas.push(chip("category: " + s.category));
    if (s.team_size) metas.push(chip("team size: " + s.team_size));
    if (s.coordination) metas.push(chip("coordination: " + s.coordination));
    metas.push(chip(s.axisLabel + " · " + s.groupLabel));

    var tools = (s.tools && s.tools.length)
      ? '<div class="toolsrow"><span class="lbl">Tools</span>' + s.tools.map(function (t) { return chip(t); }).join("") + "</div>"
      : "";

    // Rendering a soul walks every section through mdToHtml, so the result is
    // kept: revisiting a soul, or returning to it from search, is then free.
    var body = ARTICLE_CACHE[s.id];
    if (body == null) {
      body = "";
      (s.sections || []).forEach(function (sec) {
        body += '<section class="section" id="' + secId(sec.slug) + '">' +
          (sec.heading ? '<h2 tabindex="-1">' + esc(sec.heading) + "</h2>" : "") +
          '<div class="md">' + mdToHtml(sec.body) + "</div></section>";
      });
      if (!s.sections || !s.sections.length) {
        body = '<section class="section"><div class="md"><p>No sections found.</p></div></section>';
      }
      ARTICLE_CACHE[s.id] = body;
    }

    var idx = g ? g.souls.indexOf(s) : -1;
    var prev = idx > 0 ? g.souls[idx - 1] : null;
    var next = idx >= 0 && idx < g.souls.length - 1 ? g.souls[idx + 1] : null;
    var pn = (prev || next)
      ? '<div class="pn">' +
        (prev ? '<a href="#/s/' + encodeURIComponent(prev.id) + '"><div class="k">← Previous</div><div class="pt">' + esc(prev.heading || prev.name) + "</div></a>" : "<span></span>") +
        (next ? '<a class="next" href="#/s/' + encodeURIComponent(next.id) + '"><div class="k">Next →</div><div class="pt">' + esc(next.heading || next.name) + "</div></a>" : "<span></span>") +
        "</div>"
      : "";

    var toc = withHead.length
      ? '<aside class="toc" aria-label="On this page"><div class="h">On this page</div><ol>' +
        withHead.map(function (x) {
          // A real route, so a section is linkable and the back button works.
          return '<li><a href="' + soulHref(s, x.slug) + '" data-sec="' + secId(x.slug) + '">' +
            esc(x.heading) + "</a></li>";
        }).join("") + "</ol></aside>"
      : "";

    var article = '<article class="article">' + body + pn + "</article>";

    return '<div class="detail hue"' + hueAttr(hue) + ">" +
      '<div class="detail-head">' +
      '<nav class="crumbs"><a href="#/">Home</a><span>/</span>' +
      '<a href="#/g/' + s.axis + "/" + s.group + '">' + esc(AXIS_LABEL[s.axis]) + "</a><span>/</span>" +
      '<a href="#/g/' + s.axis + "/" + s.group + '">' + esc(s.groupLabel) + "</a></nav>" +
      "<h1>" + esc(s.heading || s.name) + " " + kindBadge(s.kind) + "</h1>" +
      (s.description ? '<p class="lead">' + esc(s.description) + "</p>" : "") +
      '<div class="metarow">' + metas.join("") + "</div>" + tools + "</div>" +
      (toc ? '<div class="detail-grid">' + toc + article + "</div>" : article) +
      "</div>";
  }

  /* ------------------------------------------------------------------ *
   * Search (fuzzy + highlighted + real zero-state)                      *
   * ------------------------------------------------------------------ */
  function fuzzySub(hay, q) {
    // Substring first, then an order-preserving subsequence match.
    var idx = hay.indexOf(q);
    if (idx >= 0) return { score: 0, idx: idx };
    var i = 0, j = 0, first = -1, last = -1, gaps = 0;
    while (i < hay.length && j < q.length) {
      if (hay[i] === q[j]) { if (first < 0) first = i; if (last >= 0) gaps += i - last - 1; last = i; j++; }
      i++;
    }
    if (j !== q.length) return null;
    // The subsequence has to be compact to count. Left unbounded it matches
    // almost anything: the letters of "hipaa" can be picked out of "Technical
    // Support Specialist", which then outranks the souls that discuss HIPAA.
    if (last - first + 1 > q.length * 3 + 4) return null;
    return { score: 3 + gaps / 10, idx: first < 0 ? 999 : first };
  }

  /* ------------------------------------------------------------------ *
   * Body index.                                                         *
   * This file carries roughly 600 KB of section prose. Search used to   *
   * look only at names, roles, tools, descriptions and headings, which  *
   * is about 4% of it, so searching for a term that appears in the text *
   * of a soul found nothing. The index below is built once, on the      *
   * first keystroke, and matched with plain indexOf: subsequence        *
   * matching over this much text matches nearly everything.             *
   * ------------------------------------------------------------------ */
  function cleanProse(t) {
    return String(t || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\|/g, " · ")
      .replace(/^[\s·-]*[-:·\s]{6,}$/gm, " ")
      .replace(/[*`_#>]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  var BODY_INDEX = null;
  function bodyIndex() {
    if (!BODY_INDEX) {
      BODY_INDEX = SOULS.map(function (s) {
        return (s.sections || []).map(function (sec) {
          var text = cleanProse(sec.body);
          return { text: text, low: text.toLowerCase(), heading: sec.heading, slug: sec.slug };
        });
      });
    }
    return BODY_INDEX;
  }

  function snippetHtml(entry, ql, q) {
    var at = entry.low.indexOf(ql);
    var from = Math.max(0, at - 22);
    var to = Math.min(entry.text.length, at + ql.length + 130);
    var piece = (from > 0 ? "… " : "") + entry.text.slice(from, to) + (to < entry.text.length ? " …" : "");
    return (entry.heading ? '<span class="where">' + esc(entry.heading) + "</span> — " : "") + highlight(piece, q);
  }

  function searchHtml(q) {
    var ql = q.toLowerCase();
    var index = bodyIndex();
    var hits = SOULS.map(function (s, si) {
      var name = (s.heading || s.name || "").toLowerCase();
      var meta = ((s.role || "") + " " + (s.groupLabel || "") + " " + (s.axisLabel || "") + " " + (s.tools || []).join(" ")).toLowerCase();
      var head = ((s.description || "") + " " + (s.sectionHeadings || []).join(" ")).toLowerCase();
      var a = fuzzySub(name, ql); if (a) return { s: s, score: a.score, idx: a.idx, field: "name" };
      var b = fuzzySub(meta, ql); if (b) return { s: s, score: 10 + b.score, idx: b.idx, field: "meta" };
      var ci = head.indexOf(ql); if (ci >= 0) return { s: s, score: 20, idx: ci, field: "head" };
      var secs = index[si];
      for (var k = 0; k < secs.length; k++) {
        var at = secs[k].low.indexOf(ql);
        if (at >= 0) return { s: s, score: 30 + k * 0.01, idx: at, field: "body", sec: secs[k] };
      }
      return null;
    }).filter(Boolean).sort(function (x, y) { return x.score - y.score || x.idx - y.idx; }).slice(0, 60);

    var head = '<div class="sect-head"><nav class="crumbs"><a href="#/">Home</a><span>/</span>Search</nav>' +
      "<h1 tabindex=\"-1\">Search</h1><p class=\"sub\">" + plural(hits.length, "result", "results") +
      " for \u201c" + esc(q) + "\u201d</p></div>";

    if (!hits.length) {
      return head + '<div class="empty"><p>Nothing matches \u201c' + esc(q) + '\u201d.</p>' +
        "<p>Try a role like \u201creviewer\u201d, a tool like \u201cClaude Code\u201d, a standard like \u201cHIPAA\u201d, " +
        "or a phrase from inside a soul.</p></div>";
    }
    return head + '<div class="results" id="results" role="listbox" aria-label="Search results">' +
      hits.map(function (x, i) {
        var s = x.s, g = GROUPS[s.axis + "/" + s.group];
        var title = x.field === "name" ? highlight(s.heading || s.name, q) : esc(s.heading || s.name);
        var sub = esc(s.axisLabel) + " · " + esc(s.groupLabel) + (s.role ? " · " + esc(s.role) : "");
        // A body hit links straight to the section it was found in.
        return '<a class="row hue" id="res-' + i + '" role="option" aria-selected="false"' +
          hueAttr(groupHueOf(g)) + ' href="' + soulHref(s, x.sec ? x.sec.slug : "") + '">' +
          '<span class="body"><span class="nm">' + title + "</span>" +
          '<span class="sub">' + sub + "</span>" +
          (x.sec ? '<span class="snip">' + snippetHtml(x.sec, ql, q) + "</span>" : "") +
          "</span>" +
          '<span class="go" aria-hidden="true">\u2192</span></a>';
      }).join("") + "</div>";
  }

  /* ------------------------------------------------------------------ *
   * Render                                                              *
   * ------------------------------------------------------------------ */
  var sideEl = document.getElementById("side");
  var mainEl = document.getElementById("main");
  var searchInput = document.getElementById("search");
  var scrimEl = document.getElementById("scrim");
  var menuBtn = document.getElementById("menubtn");
  var liveEl = document.getElementById("live");
  var footEl = document.querySelector(".foot");
  var spy = null;

  var REPO = META.repo || "souls";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  function teardownSpy() { if (spy) { spy.disconnect(); spy = null; } }

  function setupSpy() {
    teardownSpy();
    if (!("IntersectionObserver" in window)) return;
    var secs = [].slice.call(mainEl.querySelectorAll(".section[id]"));
    var links = [].slice.call(mainEl.querySelectorAll(".toc a[data-sec]"));
    if (!secs.length || !links.length) return;
    var visible = {};
    function refresh() {
      var chosen = null;
      for (var i = 0; i < secs.length; i++) { if (visible[secs[i].id]) { chosen = secs[i].id; break; } }
      if (!chosen) {
        for (var k = 0; k < secs.length; k++) { if (secs[k].getBoundingClientRect().top < 140) chosen = secs[k].id; }
      }
      links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-sec") === chosen); });
    }
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      refresh();
    }, { rootMargin: "-70px 0px -62% 0px", threshold: 0 });
    secs.forEach(function (sec) { spy.observe(sec); });
    refresh();
  }

  /* ------------------------------------------------------------------ *
   * Routes                                                              *
   *   /                      home                                       *
   *   /g/<axis>/<group>      one group                                  *
   *   /s/<id>[/sec/<slug>]   one soul, optionally at a section          *
   *   /q/<query>             search results                             *
   * ------------------------------------------------------------------ */
  function parseRoute(h) {
    if (h.indexOf("/g/") === 0) {
      var p = h.slice(3).split("/");
      return { kind: "g", key: p[0] + "/" + p[1] };
    }
    if (h.indexOf("/s/") === 0) {
      var rest = h.slice(3), slug = "", at = rest.indexOf("/sec/");
      if (at >= 0) { slug = decodeURIComponent(rest.slice(at + 5)); rest = rest.slice(0, at); }
      return { kind: "s", id: decodeURIComponent(rest), slug: slug };
    }
    if (h.indexOf("/q/") === 0) return { kind: "q", q: decodeURIComponent(h.slice(3)) };
    return { kind: "home" };
  }
  function routeKey(r) {
    if (r.kind === "s") return "s:" + r.id;
    if (r.kind === "g") return "g:" + r.key;
    if (r.kind === "q") return "q:" + r.q;
    return "home";
  }

  /* ---------- Sidebar: built once, then only the active link moves ---------- */
  sideEl.innerHTML = sidebarHtml(null);
  var navLinks = [].slice.call(sideEl.querySelectorAll(".navlink"));
  function setActiveNav(key) {
    var active = null;
    navLinks.forEach(function (a) {
      var on = key != null && a.getAttribute("data-key") === key;
      a.classList.toggle("on", on);
      if (on) { a.setAttribute("aria-current", "true"); active = a; }
      else a.removeAttribute("aria-current");
    });
    // With 41 groups the active one is usually below the fold on arrival.
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }

  /* ---------- Focus, announcements, scroll ---------- */
  function focusEl(el) {
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }
  function announce(text) { if (liveEl) liveEl.textContent = text; }
  function scrollToEl(el, instant) {
    el.scrollIntoView({
      behavior: instant || (reduceMotion && reduceMotion.matches) ? "auto" : "smooth",
      block: "start"
    });
  }

  var scrollPos = {};
  var navIntent = false;   // the last hash change came from clicking a link here
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}

  var lastKey = null;

  function render(opts) {
    opts = opts || {};
    var h = hash();
    var r = parseRoute(h);
    var key = routeKey(r);
    var fresh = key !== lastKey;

    if (fresh) {
      var html = "", title = REPO, navKey = null;
      if (r.kind === "g") {
        var g = GROUPS[r.key];
        navKey = r.key;
        html = g ? groupHtml(g) : '<div class="empty"><p>Group not found.</p></div>';
        title = g ? g.label : "Not found";
      } else if (r.kind === "s") {
        var doc = BY_ID[r.id];
        if (doc) {
          navKey = doc.axis + "/" + doc.group;
          html = soulHtml(doc);
          title = doc.heading || doc.name;
        } else {
          html = '<div class="empty"><p>Document not found.</p></div>';
          title = "Not found";
        }
      } else if (r.kind === "q") {
        html = searchHtml(r.q);
        title = "Search: " + r.q;
      } else {
        html = homeHtml();
        title = "SOUL Library";
      }
      mainEl.innerHTML = html;
      lastKey = key;
      setActiveNav(navKey);
      document.title = title + " — SOUL Library (" + REPO + ")";
      setupSpy();

      var h1 = mainEl.querySelector("h1");
      var sub = mainEl.querySelector(".sect-head .sub, .hero .lede");
      announce((h1 ? h1.textContent.trim() : title) + (sub ? ". " + sub.textContent.trim() : ""));
    }

    var target = r.kind === "s" && r.slug ? document.getElementById(secId(r.slug)) : null;
    // Coming back to a route takes precedence over its section anchor: the
    // reader wants where they were, not the top of the section.
    if (opts.restore && scrollPos[h] != null) {
      window.scrollTo(0, scrollPos[h]);
    } else if (target) {
      scrollToEl(target, fresh);
      if (opts.focus) focusEl(target.querySelector("h2") || target);
    } else if (fresh) {
      window.scrollTo(0, 0);
      // Route changes move focus to the heading so the new page is announced
      // and keyboard paging starts from it. Never on boot, never while typing.
      if (opts.focus) focusEl(mainEl.querySelector("h1") || mainEl);
    }
    closeSide(false);
  }

  /* ------------------------------------------------------------------ *
   * Search                                                              *
   * The query lives in the hash, so results are linkable and the back   *
   * button leaves search. One history entry is pushed when search       *
   * starts; later keystrokes replace it rather than piling up.          *
   * ------------------------------------------------------------------ */
  var selfHash = null;     // a hash this code just set
  var searchPushed = false;
  var searchTimer = null;

  function setHash(h, push) {
    selfHash = h;
    if (push) location.hash = h;
    else location.replace("#" + h);
  }

  function resultRows() { return [].slice.call(mainEl.querySelectorAll(".results .row")); }

  var activeOpt = -1;
  function setActiveOption(n) {
    var rows = resultRows();
    if (!rows.length) {
      activeOpt = -1;
      searchInput.removeAttribute("aria-activedescendant");
      return;
    }
    activeOpt = Math.max(0, Math.min(rows.length - 1, n));
    rows.forEach(function (row, i) {
      var on = i === activeOpt;
      row.classList.toggle("sel", on);
      row.setAttribute("aria-selected", on ? "true" : "false");
    });
    // Focus stays in the input; the listbox tracks it by id instead, so the
    // arrow keys keep working for the whole list.
    searchInput.setAttribute("aria-activedescendant", rows[activeOpt].id);
    if (rows[activeOpt].scrollIntoView) rows[activeOpt].scrollIntoView({ block: "nearest" });
  }

  function runSearch() {
    var q = searchInput.value.trim();
    if (!q) { leaveSearch(); return; }
    // render() scrolls to the top synchronously, while hashchange (which is
    // what normally records the outgoing position) only fires afterwards. So
    // the position has to be banked here, before the page moves.
    if (!searchPushed) scrollPos[hash()] = window.scrollY;
    setHash("/q/" + encodeURIComponent(q), !searchPushed);
    searchPushed = true;
    render({ focus: false });
    searchInput.setAttribute("aria-expanded", "true");
    activeOpt = -1;
    searchInput.removeAttribute("aria-activedescendant");
    var n = resultRows().length;
    announce(plural(n, "result", "results") + " for " + q);
  }

  function leaveSearch() {
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    activeOpt = -1;
    if (searchPushed) { searchPushed = false; history.back(); }
    else if (parseRoute(hash()).kind === "q") { setHash("/", false); render({ focus: false }); }
  }

  function syncSearch(h) {
    var r = parseRoute(h);
    if (r.kind === "q") {
      if (searchInput.value !== r.q) searchInput.value = r.q;
      searchInput.setAttribute("aria-expanded", "true");
    } else {
      searchInput.value = "";
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.removeAttribute("aria-activedescendant");
      searchPushed = false;
      activeOpt = -1;
    }
  }

  /* ---------- Sidebar drawer (mobile) ---------- */
  function setInert(on) {
    [mainEl, footEl].forEach(function (el) {
      if (!el) return;
      if (on) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }
  function openSide() {
    sideEl.classList.add("open");
    scrimEl.classList.add("open");
    menuBtn.setAttribute("aria-expanded", "true");
    setInert(true);
    var first = sideEl.querySelector(".navlink");
    if (first) first.focus();
  }
  function closeSide(returnFocus) {
    var wasOpen = sideEl.classList.contains("open");
    sideEl.classList.remove("open");
    scrimEl.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    setInert(false);
    if (wasOpen && returnFocus) menuBtn.focus();
  }

  menuBtn.addEventListener("click", openSide);
  scrimEl.addEventListener("click", function () { closeSide(true); });

  /* ---------- Wire events ---------- */
  window.addEventListener("hashchange", function (e) {
    var h = hash();
    if (selfHash === h) { selfHash = null; return; }   // already rendered by runSearch
    selfHash = null;
    if (e && e.oldURL) {
      var at = e.oldURL.indexOf("#");
      scrollPos[at >= 0 ? e.oldURL.slice(at + 1) || "/" : "/"] = window.scrollY;
    }
    syncSearch(h);
    render({ focus: true, restore: !navIntent });
    navIntent = false;
  });

  // Capture, so the flag is set before the hash change lands. A click that
  // will not produce a hashchange must not set it, or it survives to the next
  // Back and sends the reader to the top instead of where they were.
  document.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (a && a.getAttribute("href").slice(1) !== hash()) navIntent = true;
  }, true);

  searchInput.addEventListener("input", function () {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      e.preventDefault();
      searchInput.value = "";
      if (searchTimer) clearTimeout(searchTimer);
      leaveSearch();
      searchInput.blur();
      return;
    }
    var rows = resultRows();
    if (!rows.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveOption(activeOpt < 0 ? 0 : activeOpt + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveOption(activeOpt <= 0 ? 0 : activeOpt - 1); }
    else if (e.key === "Home") { e.preventDefault(); setActiveOption(0); }
    else if (e.key === "End") { e.preventDefault(); setActiveOption(rows.length - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      var row = rows[activeOpt < 0 ? 0 : activeOpt];
      if (row) {
        navIntent = true;
        searchPushed = false;
        location.hash = row.getAttribute("href").slice(1);
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault(); searchInput.focus(); searchInput.select();
      return;
    }
    if (e.key === "Escape" && sideEl.classList.contains("open")) {
      e.preventDefault(); closeSide(true);
    }
  });

  // Axis tiles on the home page scroll rather than route.
  mainEl.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-jump]") : null;
    if (t) {
      e.preventDefault();
      var target = document.getElementById(t.getAttribute("data-jump"));
      if (target) scrollToEl(target);
    }
  });

  // The skip link must not become a route.
  var skip = document.querySelector(".skip");
  if (skip) {
    skip.addEventListener("click", function (e) {
      e.preventDefault();
      focusEl(mainEl);
      mainEl.scrollIntoView({ block: "start" });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-theme-btn]"), function (b) {
    b.addEventListener("click", function () { applyTheme(b.getAttribute("data-theme-btn")); });
  });

  /* ------------------------------------------------------------------ *
   * Boot                                                                *
   * ------------------------------------------------------------------ */
  applyTheme(getMode());
  syncSearch(hash());
  render({ focus: false });
})();
