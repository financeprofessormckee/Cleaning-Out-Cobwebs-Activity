/* Local SVG views; all numeric results also appear in tables and text. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var COLORS = { supply: '#1a5a9e', demand: '#9a4a00', baseline: '#5c0025', speculation: '#1d6b35', consumer: '#595959', axis: '#595959' };
  function el(tag, attrs, content) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function number(n) { return n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function top(n) { return Math.max(1, Math.ceil(n * 1.05 / 10) * 10); }
  function frame(id, xmax, ymax, xlabel, ylabel, summary) {
    var svg = document.getElementById(id), title = svg.querySelector('title'), desc = svg.querySelector('desc');
    desc.textContent = summary;
    svg.replaceChildren(title, desc);
    var plot = el('g'); svg.appendChild(plot);
    var left = 62, right = 502, upper = 30, bottom = 298;
    var x = function (v) { return left + v / xmax * (right - left); };
    var y = function (v) { return bottom - v / ymax * (bottom - upper); };
    for (var i = 0; i <= 4; i++) {
      var xv = xmax * i / 4, yv = ymax * i / 4;
      plot.appendChild(el('line', { x1: left, x2: right, y1: y(yv), y2: y(yv), stroke: '#ddd' }));
      plot.appendChild(el('text', { x: x(xv), y: bottom + 21, 'text-anchor': 'middle' }, number(xv)));
      plot.appendChild(el('text', { x: left - 9, y: y(yv) + 4, 'text-anchor': 'end' }, number(yv)));
    }
    plot.appendChild(el('path', { d: 'M' + left + ',' + upper + 'V' + bottom + 'H' + right, fill: 'none', stroke: COLORS.axis }));
    plot.appendChild(el('text', { x: (left + right) / 2, y: 344, 'text-anchor': 'middle' }, xlabel));
    plot.appendChild(el('text', { x: left, y: 17 }, ylabel));
    return { svg: svg, plot: plot, x: x, y: y };
  }
  function line(f, points, color, dash, name, width) {
    f.plot.appendChild(el('polyline', { points: points.map(function (p) { return f.x(p[0]) + ',' + f.y(p[1]); }).join(' '),
      fill: 'none', stroke: color, 'stroke-width': width || 2.5, 'stroke-dasharray': dash || '', 'data-series': name }));
  }
  function dot(f, q, p, color, hollow) { f.plot.appendChild(el('circle', { cx: f.x(q), cy: f.y(p), r: 4, fill: hollow ? '#fff' : color, stroke: color, 'stroke-width': 2 })); }
  function latest(run) { return run.history[run.history.length - 1]; }
  function runSummary(run) {
    var row = latest(run), text = run.speculation ? 'With speculation. ' : 'Without speculation. ';
    if (!row.year) text += 'Starting prior price $' + number(row.price) + '; no valid production year has run.';
    else text += 'Year ' + row.year + ': price $' + number(row.price) + ', output ' + number(row.production) + ', consumer purchases ' + number(row.consumption) + ' units.';
    if (run.speculation) text += ' Cash $' + number(row.cash) + ', inventory ' + number(row.inventory) + ' units; inventory valuation $' + number(row.valuation) + '; wealth $' + number(row.wealth) + '.';
    if (run.stop) text += ' Stopped before year ' + run.stop.year + ': ' + run.stop.reason.toLowerCase() + ' (attempted output ' + number(run.stop.production) + ' units; pre-trade price $' + number(run.stop.preTradePrice) + '). Invalid results are not plotted.';
    return text;
  }
  function cobweb(id, run, p, eq, xmax, ymax) {
    var summary = runSummary(run), f = frame(id, xmax, ymax, 'Quantity (units)', 'Price ($)', summary);
    line(f, [[0, p.A / p.B], [p.A, 0]], COLORS.demand, '8 5', 'demand');
    var supplyP = Math.min(ymax, (xmax - p.C) / p.D);
    line(f, [[p.C, 0], [p.C + p.D * supplyP, supplyP]], COLORS.supply, '', 'supply');
    dot(f, eq.quantity, eq.price, COLORS.axis, true);
    f.plot.appendChild(el('text', { x: 502, y: 17, 'text-anchor': 'end' }, '○ = equilibrium'));
    var path = [[0, p.initialPrice]], lastQ = 0;
    var traded = run.history.filter(function (r) { return Math.abs(r.trade) > CobwebModel.EPS; });
    var lastTrade = traded[traded.length - 1];
    run.history.slice(1).forEach(function (row) {
      path.push([lastQ, row.previousPrice], [row.production, row.previousPrice], [row.production, row.price]);
      lastQ = row.production;
    });
    var color = run.speculation ? COLORS.speculation : COLORS.baseline;
    if (run.history.length > 1) line(f, path, color, run.speculation ? '7 4' : '', 'cobweb', 2);
    traded.forEach(function (row) {
      line(f, [[row.production, row.price], [row.consumption, row.price]], COLORS.consumer, '2 4', 'inventory-trade', 3);
      dot(f, row.consumption, row.price, COLORS.consumer, true);
      if (row === lastTrade) {
        f.plot.appendChild(el('text', { x: f.x((row.production + row.consumption) / 2), y: f.y(row.price) - 8, 'text-anchor': 'middle' }, (row.trade > 0 ? 'Buy ' : 'Sell ') + number(Math.abs(row.trade))));
      }
    });
    var row = latest(run);
    if (row.year) dot(f, row.production, row.price, color, false);
    document.getElementById(id === 'baseline-plot' ? 'baseline-summary' : 'speculation-summary').textContent = summary;
  }
  function render(state) {
    var p = state.params, eq = CobwebModel.equilibrium(p), both = state.baseline.history.concat(state.speculation.history);
    var qmax = top(Math.max.apply(null, [p.A, eq.quantity].concat(both.map(function (r) { return Math.max(r.production || 0, r.consumption || 0); }))));
    var pmax = top(Math.max.apply(null, [p.A / p.B, p.initialPrice, eq.price].concat(both.map(function (r) { return r.price; }))));
    cobweb('baseline-plot', state.baseline, p, eq, qmax, pmax);
    cobweb('speculation-plot', state.speculation, p, eq, qmax, pmax);
    var timeMax = Math.max(8, Math.ceil(state.year / 4) * 4), b = latest(state.baseline), s = latest(state.speculation);
    var priceSummary = 'Latest baseline price: $' + number(b.price) + ' at year ' + b.year + '; latest speculative price: $' + number(s.price) + ' at year ' + s.year + '. Equilibrium: $' + number(eq.price) + '. Stopped runs end at their last valid year.';
    var f = frame('price-plot', timeMax, top(Math.max.apply(null, [eq.price].concat(both.map(function (r) { return r.price; })))), 'Year', 'Price ($)', priceSummary);
    line(f, [[0, eq.price], [timeMax, eq.price]], COLORS.axis, '3 4', 'equilibrium', 1.5);
    [state.baseline, state.speculation].forEach(function (run) {
      var color = run.speculation ? COLORS.speculation : COLORS.baseline;
      line(f, run.history.map(function (r) { return [r.year, r.price]; }), color, run.speculation ? '8 4' : '', run.speculation ? 'speculation' : 'baseline');
      var r = latest(run); dot(f, r.year, r.price, color, false);
    });
    document.getElementById('price-summary').textContent = priceSummary;
    var quantitySummary = state.year === 0 ? 'No production years yet. Equilibrium quantity: ' + number(eq.quantity) + ' units.' : 'Latest baseline output: ' + (b.production === null ? 'not available' : number(b.production)) + ' at year ' + b.year + '; speculative output: ' + (s.production === null ? 'not available' : number(s.production)) + ' and consumer purchases: ' + (s.consumption === null ? 'not available' : number(s.consumption)) + ' at year ' + s.year + '. Quantities are absent in year zero.';
    var fq = frame('quantity-plot', timeMax, top(Math.max.apply(null, [eq.quantity].concat(both.map(function (r) { return Math.max(r.production || 0, r.consumption || 0); })))), 'Year', 'Quantity (units)', quantitySummary);
    line(fq, [[0, eq.quantity], [timeMax, eq.quantity]], COLORS.axis, '3 4', 'equilibrium', 1.5);
    [[state.baseline, 'production', COLORS.baseline, '', 'baseline'], [state.speculation, 'production', COLORS.speculation, '8 4', 'speculation'], [state.speculation, 'consumption', COLORS.consumer, '2 4', 'consumer']].forEach(function (series) {
      var rows = series[0].history.slice(1);
      if (!rows.length) return;
      line(fq, rows.map(function (r) { return [r.year, r[series[1]]]; }), series[2], series[3], series[4]);
      var r = rows[rows.length - 1]; dot(fq, r.year, r[series[1]], series[2], series[1] === 'consumption');
    });
    document.getElementById('quantity-summary').textContent = quantitySummary;
  }
  window.CobwebGraph = { render: render, runSummary: runSummary };
})();
