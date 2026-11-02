/* Observation and export helpers. The economic transition rules remain in model.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.CobwebAnalysis = factory(root.CobwebModel);
})(typeof self !== 'undefined' ? self : this, function (M) {
  'use strict';

  function atYear(state, year) {
    if (!Number.isInteger(year) || year < 0 || year > state.year) throw new RangeError('Choose a computed year.');
    function snapshot(run) {
      var history = run.history.filter(function (row) { return row.year <= year; });
      var stop = run.stop && run.stop.year <= year ? run.stop : null;
      return Object.assign({}, run, { history: history, stop: stop,
        status: stop ? 'boundary' : history[history.length - 1].year >= state.params.years ? 'horizon' : 'active' });
    }
    return { params: state.params, year: year, baseline: snapshot(state.baseline), speculation: snapshot(state.speculation) };
  }

  // Compare only matching valid production years. Neither pad stopped runs nor
  // include the deliberately shared prior-year price in an outcome measure.
  function compare(state) {
    var years = Math.min(state.baseline.history.length, state.speculation.history.length) - 1;
    if (!years) return { years: 0, baselineRms: null, speculationRms: null, reduction: null };
    var equilibrium = M.equilibrium(state.params).price;
    function rms(run) {
      var sum = 0;
      for (var year = 1; year <= years; year++) sum += Math.pow(run.history[year].price - equilibrium, 2);
      return Math.sqrt(sum / years);
    }
    var b = rms(state.baseline), s = rms(state.speculation);
    return { years: years, baselineRms: b, speculationRms: s, reduction: b > M.EPS ? 100 * (b - s) / b : null };
  }

  function csv(state) {
    var p = state.params;
    var columns = ['record', 'run', 'year', 'A', 'B', 'C', 'D', 'initial_price', 'initial_cash', 'buy_below', 'sell_above', 'duration_years',
      'price', 'production', 'consumer_purchases', 'trade', 'cash', 'inventory', 'inventory_valuation', 'wealth', 'status', 'constraint', 'attempted_production', 'attempted_pre_trade_price'];
    var rows = [columns];
    function prefix(record, name, year) { return [record, name, year, p.A, p.B, p.C, p.D, p.initialPrice, p.cash, p.buy, p.sell, p.years]; }
    [state.baseline, state.speculation].forEach(function (run) {
      var name = run.speculation ? 'speculation' : 'baseline';
      run.history.forEach(function (r) {
        rows.push(prefix('observation', name, r.year).concat([r.price, r.production, r.consumption, run.speculation ? r.trade : '',
          run.speculation ? r.cash : '', run.speculation ? r.inventory : '', run.speculation ? r.valuation : '', run.speculation ? r.wealth : '',
          r.year === p.years ? 'horizon' : r.year === 0 ? 'initial' : 'valid', r.constraint, '', '']));
      });
      if (run.stop) rows.push(prefix('boundary', name, run.stop.year).concat(['', '', '', '', '', '', '', '', 'boundary', run.stop.reason, run.stop.production, run.stop.preTradePrice]));
    });
    function escape(value) {
      var text = value === null || value === undefined ? '' : String(value);
      return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }
    return rows.map(function (row) { return row.map(escape).join(','); }).join('\r\n') + '\r\n';
  }

  return { atYear: atYear, compare: compare, csv: csv };
});
