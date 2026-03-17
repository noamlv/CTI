(function () {
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell);
        if (row.some(function (item) { return item !== ''; })) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    if (!rows.length) return [];
    const headers = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (values) {
      const record = {};
      headers.forEach(function (header, index) {
        record[header] = (values[index] || '').trim();
      });
      return record;
    });
  }

  function median(values) {
    if (!values.length) return 0;
    const sorted = values.slice().sort(function (a, b) { return a - b; });
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function byLinea(rows) {
    const map = new Map();
    rows.forEach(function (row) {
      const key = row.linea;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(Number(row.mediana_general || 0));
    });
    return Array.from(map.entries()).map(function (entry) {
      return { linea: entry[0], score: median(entry[1]) };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  function consensusWeight(label) {
    return { 'Alto': 3, 'Medio-alto': 2, 'Medio': 1, 'Bajo': 0 }[label] ?? -1;
  }

  function renderKPIs(rows) {
    const mount = document.getElementById('delphi-kpis');
    if (!mount) return;
    const total = rows.length;
    const experts = median(rows.map(function (row) { return Number(row.n_respuestas || 0); }));
    const high = rows.filter(function (row) { return Number(row.mediana_general || 0) >= 4.5; }).length;
    const lowConsensus = rows.filter(function (row) { return consensusWeight(row.consenso) <= 1; }).length;
    mount.innerHTML = [
      ['Prioridades evaluadas', total],
      ['Participantes reportados', experts],
      ['Prioridades con mediana >= 4.5', high],
      ['Prioridades con consenso medio o bajo', lowConsensus]
    ].map(function (item) {
      return '<article class="delphi-kpi"><span class="label">' + item[0] + '</span><strong class="value">' + item[1] + '</strong></article>';
    }).join('');
  }

  function renderTable(rows, mountId, mode) {
    const mount = document.getElementById(mountId);
    if (!mount) return;
    const sorted = rows.slice().sort(function (a, b) {
      if (mode === 'top') return Number(b.mediana_general) - Number(a.mediana_general);
      const diff = consensusWeight(a.consenso) - consensusWeight(b.consenso);
      return diff !== 0 ? diff : Number(a.mediana_general) - Number(b.mediana_general);
    }).slice(0, 5);
    mount.innerHTML = '<table class="delphi-table"><thead><tr><th>Código</th><th>Prioridad</th><th>Mediana</th><th>Consenso</th></tr></thead><tbody>' +
      sorted.map(function (row) {
        return '<tr><td>' + row.codigo + '</td><td>' + row.prioridad + '</td><td>' + Number(row.mediana_general).toFixed(1) + '</td><td>' + row.consenso + '</td></tr>';
      }).join('') +
      '</tbody></table>';
  }

  function renderLineBars(rows) {
    const mount = document.getElementById('delphi-line-bars');
    if (!mount) return;
    const palette = {
      'Línea 1': '#2563EB',
      'Línea 2': '#0EA5E9',
      'Línea 3': '#7C3AED'
    };
    mount.innerHTML = byLinea(rows).map(function (item) {
      const width = Math.max(10, (item.score / 5) * 100);
      return '<div class="delphi-line-row">' +
        '<div class="delphi-line-meta"><strong>' + item.linea + '</strong><span>' + item.score.toFixed(2) + ' / 5</span></div>' +
        '<div class="delphi-line-track"><span class="delphi-line-fill" style="width:' + width + '%; background:' + (palette[item.linea] || '#111111') + ';"></span></div>' +
      '</div>';
    }).join('');
  }

  function setupRevealAnimations() {
    const targets = document.querySelectorAll('.reveal-on-scroll');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (target) {
        target.classList.add('is-visible');
      });
      return;
    }

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (target) {
      revealObserver.observe(target);
    });
  }

  function setupForm(config) {
    const link = document.getElementById('delphi-form-link');
    const note = document.getElementById('delphi-form-note');
    const wrap = document.getElementById('delphi-form-embed-wrap');
    const iframe = document.getElementById('delphi-form-embed');
    const statusCard = document.getElementById('delphi-status-card');
    if (!link || !note || !wrap || !iframe || !statusCard) return;

    if (config.formUrl) {
      link.href = config.formUrl;
      link.classList.remove('is-disabled');
      link.removeAttribute('aria-disabled');
      note.textContent = config.formEmbedUrl
        ? 'Completa el formulario directamente en esta página o ábrelo en una pestaña aparte.'
        : 'El formulario ya está habilitado para participantes.';
      statusCard.hidden = !!config.formEmbedUrl;
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.classList.add('is-disabled');
      note.textContent = 'La ronda aún no está habilitada. El formulario aparecerá aquí cuando se active la participación.';
      statusCard.hidden = false;
    }

    if (config.formEmbedUrl) {
      wrap.hidden = false;
      iframe.src = config.formEmbedUrl;
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  function toggleResults(show) {
    const title = document.getElementById('delphi-results-section');
    const block = document.getElementById('delphi-results-block');
    if (title) title.hidden = !show;
    if (block) block.hidden = !show;
  }

  async function loadRows(config) {
    if (!config.summaryCsvUrl) return [];
    try {
      const response = await fetch(config.summaryCsvUrl, { cache: 'no-store' });
      const text = await response.text();
      return parseCSV(text).filter(function (row) { return row.codigo; });
    } catch (error) {
      console.error('No se pudo cargar el resumen Delphi', error);
      return [];
    }
  }

  async function init() {
    const config = window.DELPHI_CONFIG || {};
    setupRevealAnimations();
    setupForm(config);
    const shouldShowResults = !!config.showResults;
    toggleResults(shouldShowResults);
    if (!shouldShowResults) return;

    setText('delphi-results-source', config.sourceLabel);
    setText('delphi-results-intro', config.resultsIntro);
    const rows = await loadRows(config);
    if (!rows.length) {
      setText('delphi-results-source', 'Aún no hay resultados disponibles para visualización.');
      return;
    }
    renderKPIs(rows);
    renderTable(rows, 'delphi-top-priorities', 'top');
    renderTable(rows, 'delphi-low-consensus', 'consensus');
    renderLineBars(rows);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
