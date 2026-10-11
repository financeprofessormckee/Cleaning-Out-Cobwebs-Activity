(function () {
  'use strict';
  var M = CobwebModel, state = M.start(M.initial()), timer = null, dirty = false, promptId = null;
  var keys = Object.keys(M.LIMITS), $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var num = function (n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function announce(text) { $('announcement').textContent = text; }
  function errors(map) {
    keys.forEach(function (key) { $('error-' + key).textContent = map[key] || ''; if (map[key]) $(key).setAttribute('aria-invalid', 'true'); else $(key).removeAttribute('aria-invalid'); });
  }
  function clearSuccess() { $('prompt-feedback').textContent = ''; }
  function priceLimits() {
    var A = $('A').value, B = $('B').value;
    var valid = !M.validate(A, 'A') && !M.validate(B, 'B');
    ['initialPrice', 'buy', 'sell'].forEach(function (key) {
      if (valid) $(key).max = Number(A) / Number(B);
      else $(key).removeAttribute('max');
    });
    $('price-limit').textContent = valid ? 'Current form price ceiling A/B: ' + money(Number(A) / Number(B)) + '.' : 'Enter valid A and B values to calculate the price ceiling.';
  }
  function syncFields() {
    keys.forEach(function (key) { $(key).value = state.params[key]; });
    priceLimits();
    dirty = false; errors({}); $('draft-status').textContent = ''; $('preset-status').textContent = '';
  }
  function controls() {
    var end = M.finished(state);
    $('step').disabled = dirty || end; $('play').disabled = dirty || end;
    $('play').textContent = timer === null ? 'Run' : 'Pause';
    $('check').disabled = dirty;
  }
  function pause() { if (timer !== null) { clearInterval(timer); timer = null; } controls(); }
  function status(run) {
    var name = run.speculation ? 'Speculation' : 'Baseline';
    if (run.status === 'boundary') return name + ': stopped before year ' + run.stop.year + '. ' + run.stop.reason + ' (output ' + num(run.stop.production) + ' units; pre-trade price ' + money(run.stop.preTradePrice) + '). Valid results retained; no rescue outside the linear domain.';
    if (run.status === 'horizon') return name + ': completed ' + state.params.years + ' years.';
    return name + ': ready for year ' + (run.history[run.history.length - 1].year + 1) + '.';
  }
  function cell(row, value, header) { var td = document.createElement(header ? 'th' : 'td'); if (header) td.scope = 'row'; td.textContent = value; row.appendChild(td); }
  function tables() {
    var market = document.createDocumentFragment(), finance = document.createDocumentFragment();
    for (var year = 0; year <= state.year; year++) {
      var b = state.baseline.history[year], s = state.speculation.history[year];
      if (!b && !s) continue;
      var tr = document.createElement('tr'); tr.dataset.year = year;
      cell(tr, year, true);
      [b && b.price, b && b.production, s && s.price, s && s.production, s && s.consumption].forEach(function (v) { cell(tr, num(v)); });
      market.appendChild(tr);
      if (s) {
        var fr = document.createElement('tr'); fr.dataset.year = year; cell(fr, year, true);
        [s.trade, s.cash, s.inventory, s.valuation, s.wealth].forEach(function (v) { cell(fr, num(v)); });
        cell(fr, s.constraint || (year === 0 ? 'Initial cash; no inventory.' : 'No resource constraint.')); finance.appendChild(fr);
      }
    }
    $('market-table').querySelector('tbody').replaceChildren(market);
    $('finance-table').querySelector('tbody').replaceChildren(finance);
  }
  function currentResults() {
    var fragment = document.createDocumentFragment();
    [state.baseline, state.speculation].forEach(function (run) {
      var row = run.history[run.history.length - 1], article = document.createElement('article'), heading = document.createElement('h3');
      heading.textContent = (run.speculation ? 'With' : 'Without') + ' speculation · year ' + row.year; article.appendChild(heading);
      function paragraph(text) { var node = document.createElement('p'); node.textContent = text; article.appendChild(node); }
      if (!row.year) paragraph('Prior price ' + money(row.price) + '. ' + (run.stop ? 'No valid production year was completed. ' + status(run) : 'Production begins when you step year 1.'));
      else {
        paragraph('Output = ' + num(state.params.C) + ' + ' + num(state.params.D) + ' × ' + money(row.previousPrice) + ' = ' + num(row.production) + ' units.');
        paragraph('Pre-trade price = (' + num(state.params.A) + ' − ' + num(row.production) + ') / ' + num(state.params.B) + ' = ' + money(row.preTradePrice) + '.');
        if (run.speculation) paragraph('Trade ' + num(row.trade) + ' units; clearing price = ' + money(row.preTradePrice) + ' + (' + num(row.trade) + ' / ' + num(state.params.B) + ') = ' + money(row.price) + '. Consumer purchases: ' + num(row.consumption) + ' units.');
        else paragraph('Clearing price: ' + money(row.price) + '; consumer purchases: ' + num(row.consumption) + ' units.');
      }
      if (run.speculation) {
        paragraph('Cash ' + money(row.cash) + ' · Inventory ' + num(row.inventory) + ' units · Inventory valuation ' + money(row.valuation) + ' · Wealth ' + money(row.wealth) + '.');
        if (row.constraint) paragraph(row.constraint);
      }
      fragment.appendChild(article);
    });
    $('current-results').replaceChildren(fragment);
  }
  function render() {
    var eq = M.equilibrium(state.params);
    $('run-progress').textContent = 'Attempted through year ' + state.year + ' of ' + state.params.years + '. Last valid year: baseline ' + state.baseline.history[state.baseline.history.length - 1].year + ', speculation ' + state.speculation.history[state.speculation.history.length - 1].year + '. Both runs use the applied parameters.';
    $('equilibrium').textContent = 'Equilibrium: price ' + money(eq.price) + '; quantity ' + num(eq.quantity) + ' units. P* = (A − C)/(B + D).';
    $('stability').textContent = eq.behavior + ' baseline: D/B = ' + num(eq.ratio) + '. Price deviations reverse sign each year and ' + (eq.behavior === 'Converging' ? 'shrink.' : eq.behavior === 'Repeating' ? 'retain their size.' : 'grow until this linear model reaches its boundary.') + ' An exact equilibrium start stays there; speculation has a separate trajectory.';
    $('baseline-status').textContent = status(state.baseline); $('speculation-status').textContent = status(state.speculation);
    currentResults(); tables(); CobwebGraph.render(state); controls();
  }
  function restart(params, message) { pause(); state = M.start(params); syncFields(); clearSuccess(); render(); announce(message); }
  function step(automatic) {
    if (dirty || M.finished(state)) return;
    var baselineStatus = state.baseline.status, speculationStatus = state.speculation.status;
    state = M.advance(state);
    if (M.finished(state)) pause();
    render();
    if (!automatic || baselineStatus !== state.baseline.status || speculationStatus !== state.speculation.status) announce('Attempted through year ' + state.year + '. ' + status(state.baseline) + ' ' + status(state.speculation));
  }
  keys.forEach(function (key) {
    $(key).addEventListener('input', function () { pause(); dirty = true; clearSuccess(); priceLimits(); $('draft-status').textContent = 'Unapplied changes. Apply and restart, or Restart run to discard drafts. Existing results use the previous settings.'; controls(); });
  });
  $('parameters').addEventListener('submit', function (event) {
    event.preventDefault(); pause();
    var values = {}; keys.forEach(function (key) { values[key] = $(key).value; });
    var invalid = M.validateParameters(values); errors(invalid);
    if (Object.keys(invalid).length) {
      dirty = true; controls(); $('draft-status').textContent = 'Correct the marked fields. Applied parameters and results are unchanged.';
      $(Object.keys(invalid)[0]).focus(); announce('Parameters not applied. Correct the marked fields.'); return;
    }
    restart(values, 'Parameters applied. Both runs restarted at year zero.');
  });
  document.querySelectorAll('[data-preset]').forEach(function (button) {
    button.addEventListener('click', function () {
      pause(); var p = M.preset(button.dataset.preset, state.params), invalid = M.validateParameters(p);
      if (Object.keys(invalid).length) { $('preset-status').textContent = 'Preset not loaded: retained thresholds exceed its $100 maximum. Adjust and apply the thresholds first.'; announce($('preset-status').textContent); return; }
      promptId = null; $('prompt-panel').hidden = true;
      restart(p, button.textContent + ' loaded. Applied cash, thresholds, and duration retained.');
    });
  });
  $('defaults').addEventListener('click', function () { promptId = null; $('prompt-panel').hidden = true; restart(M.initial(), 'All default settings restored.'); });
  $('restart').addEventListener('click', function () { restart(state.params, 'Both runs restarted using applied parameters. Drafts discarded.'); });
  $('step').addEventListener('click', function () { step(false); });
  $('play').addEventListener('click', function () {
    if (timer !== null) { pause(); announce('Playback paused at year ' + state.year + '.'); return; }
    if (dirty || M.finished(state)) return;
    timer = setInterval(function () { step(true); }, 700); controls(); announce('Running one year every 700 milliseconds. Use Pause to stop.');
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  document.querySelectorAll('[data-prompt]').forEach(function (button) {
    button.addEventListener('click', function () {
      promptId = button.dataset.prompt; var prompt = M.PROMPTS[promptId];
      restart(M.scenario(promptId), prompt.title + ' loaded.');
      $('prompt-panel').hidden = false; $('prompt-title').textContent = prompt.title; $('prompt-question').textContent = prompt.question;
      $('prompt-instructions').textContent = 'Run through at least year ' + prompt.years + ' using these starting conditions. Then choose an explanation.';
      $('answer').replaceChildren();
      var placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose an explanation'; $('answer').appendChild(placeholder);
      prompt.options.forEach(function (choice) { var option = document.createElement('option'); option.value = choice[0]; option.textContent = choice[1]; $('answer').appendChild(option); });
    });
  });
  $('answer').addEventListener('change', clearSuccess);
  $('check').addEventListener('click', function () {
    if (dirty) return;
    if (!$('answer').value) { $('prompt-feedback').textContent = 'Choose an explanation before checking.'; $('answer').focus(); return; }
    var result = M.checkPrompt(promptId, state, $('answer').value); $('prompt-feedback').textContent = result.message;
  });
  syncFields(); render();
})();
