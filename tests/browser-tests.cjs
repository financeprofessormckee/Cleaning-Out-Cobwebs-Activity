'use strict';
// Optional development check: npm install --no-save --package-lock=false playwright
// then npx playwright install chromium && node tests/browser-tests.cjs.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.clock.install();
    const url = process.env.ACTIVITY_URL || pathToFileURL(path.join(__dirname, '../index.html')).href;
    await page.goto(url);
    const text = id => page.locator('#' + id).textContent();
    const click = id => page.locator('#' + id).click();
    const fill = async values => {
      if (!await page.locator('#A').isVisible()) await page.locator('#settings-details > summary').click();
      for (const [key, value] of Object.entries(values)) await page.locator('#' + key).fill(String(value));
    };
    const step = async count => { for (let i = 0; i < count; i++) await click('step'); };
    assert.match(await text('equilibrium'), /\$50.00/);
    await page.locator('#step').focus();
    await page.keyboard.press('Enter');
    assert.match(await text('market-table'), /35.00/);
    assert.match(await text('finance-table'), /1,600.00/);

    // Drafts stop playback; rejected changes must preserve every existing row.
    await click('play');
    await page.clock.runFor(700);
    await fill({ A: '' });
    assert.equal(await text('play'), 'Run');
    assert.equal(await page.locator('#step').isDisabled(), true);
    const oldData = await text('market-table');
    await click('apply');
    assert.equal(await text('market-table'), oldData);
    assert.equal(await page.locator('#A').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'A');
    await click('restart');
    assert.equal(await page.locator('#A').inputValue(), '200');
    await fill({ A: 300 });
    assert.equal(await page.locator('#initialPrice').getAttribute('max'), '150');
    assert.match(await text('price-limit'), /150.00/);
    await click('defaults');

    // Boundaries before the first observation must be described in graph alternatives.
    await fill({ C: 100, D: 8, initialPrice: 100 });
    await click('apply'); await step(1);
    for (const id of ['baseline-summary', 'speculation-summary', 'baseline-plot-desc']) {
      assert.match(await text(id), /Stopped before year 1/);
    }
    assert.doesNotMatch(await text('current-results'), /Production begins when/);
    assert.match(await text('run-progress'), /Last valid year: baseline 0, speculation 0/);

    // A baseline stop is announced once even though speculation is still playing.
    await click('defaults');
    await page.locator('[data-preset="diverge"]').click();
    await click('play');
    await page.clock.runFor(3500);
    assert.match(await text('announcement'), /stopped before year 5/);
    assert.equal(await text('play'), 'Pause');
    await click('play');
    assert.equal(await page.locator('#market-table tbody tr').count(), 6);
    assert.equal(await page.locator('#market-table tbody tr').last().locator('td').first().textContent(), '—');
    assert.match(await text('speculation-summary'), /Year 5: price \$40/);

    // Presets retain the applied trading policy, and refuse an incompatible one.
    await click('defaults');
    await fill({ cash: 123.45, buy: 12.3, sell: 77.7, years: 12 });
    await click('apply');
    await page.locator('[data-preset="repeat"]').click();
    assert.equal(await page.locator('#cash').inputValue(), '123.45');
    assert.equal(await page.locator('#years').inputValue(), '12');
    await fill({ A: 500, B: 1, buy: 120, sell: 150 });
    await click('apply'); await step(1);
    const savedData = await text('market-table');
    await page.locator('[data-preset="converge"]').click();
    assert.match(await text('preset-status'), /Preset not loaded/);
    assert.equal(await text('market-table'), savedData);

    // All four learning checks remain attainable; a new draft clears success.
    for (const [id, years, answer] of [
      ['converge', 10, 'converges'], ['repeat', 4, 'repeats'],
      ['stabilize', 5, 'stabilizes'], ['limits', 5, 'limited']
    ]) {
      await page.locator('[data-prompt="' + id + '"]').click();
      await click('check');
      assert.match(await text('prompt-feedback'), /Choose an explanation/);
      await step(years);
      await page.locator('#answer').selectOption(answer);
      await click('check');
      assert.match(await text('prompt-feedback'), /^Done\./);
      await fill({ cash: 50 });
      assert.equal(await text('prompt-feedback'), '');
    }

    await click('defaults');
    await fill({ years: 1 }); await click('apply'); await step(1);
    assert.equal(await page.locator('#step').isDisabled(), true);
    assert.equal(await page.locator('#play').isDisabled(), true);
    assert.equal(await text('play'), 'Run');

    // Replaying saved history is reversible and does not pad stopped runs.
    await click('defaults');
    await page.locator('[data-preset="diverge"]').click();
    await click('finish');
    const completeData = await text('market-table');
    assert.equal(await page.locator('#market-table tbody tr').count(), 41);
    assert.match(await text('comparison-detail'), /Matching years 1–4/);
    assert.match(await text('comparison-result'), /100.0% smaller/);
    await click('previous');
    assert.match(await text('run-progress'), /Viewing year 39/);
    assert.equal(await text('market-table'), completeData);
    await page.locator('#review-year').fill('0');
    assert.match(await text('baseline-status'), /ready for year 1/);
    assert.match(await text('wealth-summary'), /Year 0/);
    await step(1);
    assert.match(await text('baseline-price'), /25.00/);
    assert.match(await text('speculation-price'), /40.00/);
    assert.match(await text('wealth-summary'), /cash \$800/);
    assert.equal(await text('market-table'), completeData);
    assert.equal(await page.locator('#market-table tr[aria-current="true"]').getAttribute('data-year'), '1');
    const downloadReady = page.waitForEvent('download');
    await click('export');
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), 'cobwebs-through-year-40.csv');
    const exported = await require('node:fs/promises').readFile(await download.path(), 'utf8');
    assert.match(exported, /boundary,baseline,5/);
    assert.match(exported, /observation,speculation,40/);
    await click('latest');
    assert.match(await text('run-progress'), /Viewing year 40/);
    assert.equal(await page.locator('#step').isDisabled(), true);
    await click('previous');
    await page.locator('#speed').selectOption('250');
    await click('play');
    await page.clock.runFor(250);
    assert.match(await text('run-progress'), /Viewing year 40/);
    assert.equal(await text('play'), 'Run');

    for (const width of [1280, 640, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Reflow at ' + width);
    }
    assert.deepEqual(failures, []);
    console.log('Browser checks passed: defaults, keyboard, drafts, boundaries, playback, presets, all prompts, and 320–1280px reflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
