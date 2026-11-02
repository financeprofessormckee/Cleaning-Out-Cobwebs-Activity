'use strict';
const assert = require('node:assert/strict');
const M = require('../js/model.js');
const A = require('../js/analysis.js');
function run(p) { let s = M.start(p); while (!M.finished(s)) s = M.advance(s); return s; }
function close(a, b) { assert.ok(Math.abs(a - b) < 1e-8, a + ' vs ' + b); }
const s = run(M.preset('diverge'));
const original = JSON.stringify(s);
for (let year = 0; year <= s.year; year++) {
  const view = A.atYear(s, year);
  assert.equal(view.year, year);
  assert.equal(view.baseline.history.length, Math.min(year + 1, 5));
  assert.equal(view.speculation.history.length, year + 1);
  assert.equal(view.baseline.status, year >= 5 ? 'boundary' : 'active');
  assert.equal(view.speculation.status, year === 40 ? 'horizon' : 'active');
  assert.equal(Boolean(view.baseline.stop), year >= 5);
}
assert.equal(JSON.stringify(s), original);
for (const year of [-1, 41, 1.5, NaN, '1']) assert.throws(() => A.atYear(s, year), RangeError);
assert.equal(A.compare(A.atYear(s, 0)).years, 0);
const comparison = A.compare(s);
assert.equal(comparison.years, 4);
close(comparison.baselineRms, Math.sqrt((225 + 506.25 + 1139.0625 + 2562.890625) / 4));
close(comparison.speculationRms, 0);
close(comparison.reduction, 100);
const stationary = run(Object.assign(M.initial(), { initialPrice: 50 }));
assert.equal(A.compare(stationary).reduction, null);
const noCash = run(Object.assign(M.initial(), { cash: 0 }));
close(A.compare(noCash).reduction, 0);
const early = run(Object.assign(M.initial(), { C: 100, D: 8, initialPrice: 100 }));
assert.equal(A.compare(early).years, 0);
assert.equal(A.atYear(early, 0).baseline.status, 'active');
assert.equal(A.atYear(early, 1).baseline.status, 'boundary');

const csv = A.csv(s).trim().split('\r\n').map(row => row.split(','));
const header = csv.shift();
assert.equal(header.length, 24);
assert.equal(csv.length, 47); // 5 baseline observations, one boundary, 41 speculative observations.
for (const row of csv) assert.equal(row.length, header.length);
const boundary = csv.find(row => row[0] === 'boundary');
assert.deepEqual(boundary.slice(0, 3), ['boundary', 'baseline', '5']);
assert.equal(boundary[12], ''); // No invented price for an invalid year.
assert.equal(boundary[23], '-35.9375');
const initial = csv.find(row => row[0] === 'observation' && row[1] === 'baseline');
assert.equal(initial[13], '');
assert.equal(initial[16], ''); // A baseline market is not a second speculator.
const limited = run(M.scenario('limits'));
const first = A.csv(limited).trim().split('\r\n').find(row => row.startsWith('observation,speculation,1,')).split(',');
assert.equal(first[15], String(limited.speculation.history[1].trade));
console.log('Analysis checks passed: immutable replay, independent boundaries, matched-year RMS, zero denominator, and full-precision CSV.');
