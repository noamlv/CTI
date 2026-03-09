const chartColors = {
  blue: "#2563EB",
  cyan: "#0EA5E9",
  green: "#10B981",
  indigo: "#4F46E5",
  amber: "#F59E0B",
};

const trustSeries = [
  { name: "PNP", color: chartColors.blue, values: [18.8, 28.2, 24.6, 21.2, 20.5, 17.6, 14.5] },
  { name: "Poder Judicial", color: chartColors.indigo, values: [10.5, 13.2, 15.1, 12.7, 12.6, 11.7, 11.7] },
  { name: "Ministerio Público", color: chartColors.green, values: [12.8, 14.5, 14.6, 12.8, 11.7, 11.2, 10.4] },
];

const victimSeries = [
  { name: "Victimización", color: chartColors.blue, values: [26.6, 23.4, 18.2, 22.9, 27.1, 27.1, 25.2] },
];

const homicideSeries = [
  { name: "Tasa de homicidios", color: chartColors.indigo, values: [7.4, 5.8, 8.6, 8.6, 9.3, 10.1, 10.7] },
];

const extortionSeries = [
  { name: "Denuncias por extorsión", color: chartColors.amber, values: [3865, 2837, 4735, 16346, 22675, 22361, 26585] },
];

const cyberSeries = [
  { name: "Delitos informáticos", color: chartColors.cyan, values: [7999, 10064, 16843, 23651, 32100, 44813, 42383] },
];

const kidnapSeries = [
  { name: "Secuestro", color: chartColors.green, values: [1214, 895, 1122, 1321, 1325, 1261, 1192] },
];

const years = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"];
const percentFormatter = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat("es-PE");

const victimTop = [
  ["Puno", 35.1],
  ["Cusco", 34.8],
  ["Junín", 34.6],
  ["Arequipa", 34.3],
  ["Tacna", 31.3],
  ["Lima Metropolitana", 30.1],
];

const victimBottom = [
  ["Cajamarca", 14.1],
  ["Huánuco", 14.6],
  ["Tumbes", 16.3],
  ["Lambayeque", 16.9],
  ["Áncash", 17.6],
  ["Amazonas", 18.1],
];

const homicideTop = [
  ["Madre de Dios", 24.6],
  ["Prov. Const. del Callao", 23.6],
  ["Región Lima", 23.1],
  ["Tumbes", 20.6],
];

const homicideBottom = [
  ["Tacna", 3.3],
  ["Loreto", 3.4],
  ["Apurímac", 3.8],
  ["Ayacucho", 4.0],
  ["Amazonas", 4.1],
];

const extortionTop = [
  ["Tumbes", 220.6],
  ["La Libertad", 204.1],
  ["Región Lima", 132.2],
  ["Piura", 130.8],
  ["Lima Metropolitana", 107.3],
  ["Prov. Const. del Callao", 76.1],
];

const extortionDistricts = [
  ["Lima", 1578],
  ["San Juan de Lurigancho", 1461],
  ["Ate", 815],
  ["Comas", 722],
  ["Puente Piedra", 635],
  ["Villa El Salvador", 575],
];

const rendered = new Set();

function formatValue(value, kind) {
  if (kind === "percent" || kind === "rate") return percentFormatter.format(value);
  return integerFormatter.format(value);
}

function linePath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function attachTooltip(container, tooltip, html, event) {
  if (!container || !tooltip) return;
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left + 12;
  const y = event.clientY - rect.top - 12;
  tooltip.innerHTML = html;
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(x, rect.width - 180)}px`;
  tooltip.style.top = `${Math.max(8, y)}px`;
}

function hideTooltip(tooltip) {
  if (tooltip) tooltip.hidden = true;
}

function animateLines(mount) {
  mount.querySelectorAll(".chart-line").forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 900ms ease";
    requestAnimationFrame(() => {
      path.style.strokeDashoffset = "0";
    });
  });
}

function renderLegend(targetId, series) {
  const el = document.getElementById(targetId);
  if (!el || rendered.has(targetId)) return;
  el.innerHTML = series
    .map(
      (item) => `<span><span class="dot" style="background:${item.color}"></span>${item.name}</span>`
    )
    .join("");
  rendered.add(targetId);
}

function renderLineChart({ mountId, tooltipId, labels, series, valueKind }) {
  const mount = document.getElementById(mountId);
  const tooltip = document.getElementById(tooltipId);
  if (!mount || rendered.has(mountId)) return;

  const width = 920;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 42, left: 46 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const values = series.flatMap((item) => item.values);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const safeMin = Math.floor(min * 0.85);
  const safeMax = Math.ceil(max * 1.12);
  const ticks = 5;

  const xFor = (index) => padding.left + (chartW / (labels.length - 1)) * index;
  const yFor = (value) => padding.top + chartH - ((value - safeMin) / (safeMax - safeMin)) * chartH;

  const grid = [];
  for (let i = 0; i < ticks; i += 1) {
    const tickValue = safeMin + ((safeMax - safeMin) / (ticks - 1)) * i;
    const y = yFor(tickValue);
    grid.push(`<line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`);
    grid.push(
      `<text class="tick-label" x="${padding.left - 10}" y="${y + 4}" text-anchor="end">${formatValue(tickValue, valueKind)}</text>`
    );
  }

  const xTicks = labels
    .map((label, index) => `<text class="axis-label" x="${xFor(index)}" y="${height - 12}" text-anchor="middle">${label}</text>`)
    .join("");

  const lines = series
    .map((item, seriesIndex) => {
      const points = item.values.map((value, index) => ({ x: xFor(index), y: yFor(value), value, label: labels[index] }));
      const path = linePath(points);
      const dots = points
        .map(
          (point, pointIndex) =>
            `<circle class="line-point" cx="${point.x}" cy="${point.y}" r="4.5" fill="${item.color}" data-series="${seriesIndex}" data-index="${pointIndex}"></circle>`
        )
        .join("");
      return `<path class="chart-line" d="${path}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>${dots}`;
    })
    .join("");

  mount.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">
      ${grid.join("")}
      ${xTicks}
      ${lines}
    </svg>
  `;

  mount.querySelectorAll(".line-point").forEach((point) => {
    point.addEventListener("mouseenter", (event) => {
      const seriesIndex = Number(event.target.dataset.series);
      const pointIndex = Number(event.target.dataset.index);
      const item = series[seriesIndex];
      const value = item.values[pointIndex];
      attachTooltip(
        mount,
        tooltip,
        `<strong>${item.name}</strong><br>${labels[pointIndex]}<br>${formatValue(value, valueKind)}`,
        event
      );
    });
    point.addEventListener("mousemove", (event) => {
      const seriesIndex = Number(event.target.dataset.series);
      const pointIndex = Number(event.target.dataset.index);
      const item = series[seriesIndex];
      const value = item.values[pointIndex];
      attachTooltip(
        mount,
        tooltip,
        `<strong>${item.name}</strong><br>${labels[pointIndex]}<br>${formatValue(value, valueKind)}`,
        event
      );
    });
    point.addEventListener("mouseleave", () => hideTooltip(tooltip));
  });

  animateLines(mount);
  requestAnimationFrame(() => mount.classList.add("is-rendered"));
  rendered.add(mountId);
}

function renderRankList(targetId, rows, suffix = "") {
  const el = document.getElementById(targetId);
  if (!el || rendered.has(targetId)) return;
  el.innerHTML = rows
    .map(
      ([label, value], index) => `
        <div class="rank-item">
          <div>
            <strong><span class="rank-order">${index + 1}.</span> ${label}</strong>
          </div>
          <span class="rank-chip">${suffix ? formatValue(value, "rate") : formatValue(value, "count")}</span>
        </div>
      `
    )
    .join("");
  rendered.add(targetId);
}

const renderers = {
  "legend-trust": () => renderLegend("legend-trust", trustSeries),
  "chart-trust": () =>
    renderLineChart({
      mountId: "chart-trust",
      tooltipId: "tooltip-trust",
      labels: years,
      series: trustSeries,
      valueKind: "percent",
    }),
  "chart-victim": () =>
    renderLineChart({
      mountId: "chart-victim",
      tooltipId: "tooltip-victim",
      labels: years,
      series: victimSeries,
      valueKind: "percent",
    }),
  "rank-victim-top": () => renderRankList("rank-victim-top", victimTop, "%"),
  "rank-victim-bottom": () => renderRankList("rank-victim-bottom", victimBottom, "%"),
  "chart-homicide": () =>
    renderLineChart({
      mountId: "chart-homicide",
      tooltipId: "tooltip-homicide",
      labels: years,
      series: homicideSeries,
      valueKind: "rate",
    }),
  "rank-homicide-top": () => renderRankList("rank-homicide-top", homicideTop, "por 100 mil"),
  "rank-homicide-bottom": () => renderRankList("rank-homicide-bottom", homicideBottom, "por 100 mil"),
  "chart-extortion": () =>
    renderLineChart({
      mountId: "chart-extortion",
      tooltipId: "tooltip-extortion",
      labels: years,
      series: extortionSeries,
      valueKind: "count",
    }),
  "rank-extortion-top": () => renderRankList("rank-extortion-top", extortionTop, "por 100 mil"),
  "rank-extortion-districts": () => renderRankList("rank-extortion-districts", extortionDistricts),
  "chart-cyber": () =>
    renderLineChart({
      mountId: "chart-cyber",
      tooltipId: "tooltip-cyber",
      labels: years,
      series: cyberSeries,
      valueKind: "count",
    }),
  "chart-kidnap": () =>
    renderLineChart({
      mountId: "chart-kidnap",
      tooltipId: "tooltip-kidnap",
      labels: years,
      series: kidnapSeries,
      valueKind: "count",
    }),
};

function canRender(element) {
  const panel = element.closest(".tab-panel");
  return !panel || panel.classList.contains("is-active");
}

function renderWithin(root) {
  if (!root) return;
  root.querySelectorAll("[id]").forEach((node) => {
    if (renderers[node.id] && canRender(node)) {
      renderers[node.id]();
    }
  });
}

function activateTabs() {
  document.querySelectorAll("[data-tabs]").forEach((group) => {
    const buttons = group.querySelectorAll(".tab-btn");
    const panels = group.querySelectorAll(".tab-panel");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.tabTarget;
        buttons.forEach((item) => item.classList.toggle("is-active", item === button));
        panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === target));
        renderWithin(group.querySelector(`#${target}`));
      });
    });
  });
}

function setupLazyRendering() {
  const blocks = document.querySelectorAll(".visual-block");
  if (!("IntersectionObserver" in window)) {
    blocks.forEach((block) => renderWithin(block));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        renderWithin(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  blocks.forEach((block) => observer.observe(block));
}

function animateDiagnosticBars(container) {
  container.querySelectorAll(".dx-bar-fill[data-width]").forEach((bar) => {
    if (bar.dataset.animated === "1") return;
    bar.style.width = `${bar.dataset.width}%`;
    bar.dataset.animated = "1";
  });
}

function setupRevealAnimations() {
  const targets = document.querySelectorAll(".reveal-on-scroll");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => {
      target.classList.add("is-visible");
      animateDiagnosticBars(target);
    });
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        animateDiagnosticBars(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -6% 0px",
    }
  );

  targets.forEach((target) => revealObserver.observe(target));
}

function linkifyReferenceUrls(listEl) {
  if (!listEl || listEl.dataset.linkified === "1") return;
  listEl.querySelectorAll("li").forEach((item) => {
    item.innerHTML = item.innerHTML.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  });
  listEl.dataset.linkified = "1";
}

function setupReferencesNLP() {
  const listEl = document.getElementById("refs-listing");
  if (!listEl || listEl.dataset.nlpReady === "1") return;

  linkifyReferenceUrls(listEl);

  const rows = [...listEl.querySelectorAll("li")]
    .map((item) => item.textContent.trim())
    .filter(Boolean);

  const stopwords = new Set([
    "para", "entre", "sobre", "desde", "with", "from", "that", "this", "using", "effects",
    "effect", "review", "systematic", "study", "studies", "policy", "policing", "crime",
    "criminal", "seguridad", "ciudadana", "peru", "peruano", "latin", "america", "office",
    "nations", "united", "journal", "report", "evidence", "analysis", "impact", "approaches",
    "investigacion", "aplicada", "del", "las", "los", "una", "uno", "and", "the", "for",
    "con", "sin", "sobre", "citizen", "global", "campbell", "reviews", "de", "la", "el",
    "hernandez", "instituto", "nacional", "cies",
  ]);

  const termCounts = new Map();
  const yearCounts = new Map();

  rows.forEach((row) => {
    const yearMatch = row.match(/\((19|20)\d{2}[a-z]?\)/i) || row.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = yearMatch[0].replace(/[()a-z]/gi, "");
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }

    const normalized = row
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/https?:\/\/\S+/g, " ");

    const tokens = normalized.match(/[a-z]{4,}/g) || [];
    tokens.forEach((token) => {
      if (stopwords.has(token)) return;
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    });
  });

  const topTerms = [...termCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const byYear = [...yearCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));

  function renderBars(targetId, entries, kind = "term") {
    const target = document.getElementById(targetId);
    if (!target) return;
    if (!entries.length) {
      target.innerHTML = `<p class="panel-note">Sin datos suficientes.</p>`;
      return;
    }
    const max = Math.max(...entries.map((entry) => entry[1]));
    target.innerHTML = entries
      .map(
        ([label, value]) => `
          <div class="refs-bar-row">
            <span class="refs-bar-label">${kind === "term" ? label.charAt(0).toUpperCase() + label.slice(1) : label}</span>
            <div class="refs-bar-track">
              <span class="refs-bar-fill ${kind === "year" ? "year" : ""}" data-width="${(value / max) * 100}"></span>
            </div>
            <span class="refs-bar-value">${value}</span>
          </div>
        `
      )
      .join("");
    requestAnimationFrame(() => {
      target.querySelectorAll(".refs-bar-fill[data-width]").forEach((bar) => {
        bar.style.width = `${bar.dataset.width}%`;
      });
    });
  }

  renderBars("refs-terms", topTerms, "term");
  renderBars("refs-years", byYear, "year");

  const totalEl = document.getElementById("refs-total");
  const yearsEl = document.getElementById("refs-years-count");
  if (totalEl) totalEl.textContent = `${rows.length}`;
  if (yearsEl) yearsEl.textContent = `${yearCounts.size}`;

  listEl.dataset.nlpReady = "1";
}

function setupProblemTreeFilters() {
  const buttons = [...document.querySelectorAll("[data-tree-filter-target]")];
  if (!buttons.length) return;

  const groups = new Map();
  buttons.forEach((button) => {
    const targetId = button.dataset.treeFilterTarget;
    if (!groups.has(targetId)) groups.set(targetId, []);
    groups.get(targetId).push(button);
  });

  groups.forEach((groupButtons, targetId) => {
    const tree = document.getElementById(targetId);
    if (!tree) return;

    groupButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.treeFilter || "all";
        tree.dataset.treeFilterState = filter;
        groupButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      });
    });
  });
}

activateTabs();
setupLazyRendering();
setupRevealAnimations();
setupReferencesNLP();
setupProblemTreeFilters();
