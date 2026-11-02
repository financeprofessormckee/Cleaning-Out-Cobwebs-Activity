# Cleaning Out Cobwebs — browser specification (v1)

- **Decided:** 2026-10-01, by Eric McKee; David Friedman's review is invited.
- **Reference:** Proposal 25, recorded in DESIGN.md from the Living Paper descriptions. The live page was unavailable during planning. Fresh code; no legacy import.

## Learning objective and decisions

Explore delayed production, converging/repeating/diverging cobwebs, and stabilization with limited speculation resources. One good, divisible quantities, annual steps, zero storage cost and interest; no borrowing or short selling. Hog/corn coupling, multiple speculators, perfect foresight, manual trading, and storage costs are deferred. The clearing rule, presets, controls, and four optional self-checks are adaptation decisions, not verified legacy behavior.

## Mathematics

Consumer demand Qd = A − BP; production in year t is Qt = C + D P(t−1). Without speculation Pt = (A − Qt)/B. Equilibrium P* = (A − C)/(B + D), Q* = C + DP*. Baseline price deviations multiply by −D/B: converge below magnitude 1, repeat at 1, diverge above 1 (an exact equilibrium start remains there).

Both runs start at the same prior price. The speculator starts with cash and no inventory. Each year calculate production and pre-trade price p0. Positive x buys inventory; negative x sells. If p0 < buy, x = min(B(buy − p0), Qt, xCash), with xCash = 2cash/(sqrt(p0² + 4cash/B) + p0) for positive cash and zero otherwise. If p0 > sell, x = −min(inventory, B(p0 − sell)). Otherwise x = 0. Clearing P = p0 + x/B; consumer purchases = Qt − x; cash changes by −xP and inventory by x. All units trade at the resulting clearing price; that price determines next year's production.

Wealth = cash + inventory × current price; explicitly label inventory valuation, not guaranteed liquidation proceeds. Keep full precision; display two decimals, normalize only numerical residue within 1e-9 of zero, and use a 1e-9 comparison tolerance for computed threshold equality. A trade limited by cash or inventory reports the limitation.

Before trading, stop each run independently if production or pre-trade price is negative beyond numerical tolerance. Retain valid history and explain attempted year/value; do not plot invalid results. This deliberately excludes speculative rescue outside the linear domain. Zero price is valid; reaching equilibrium does not end a run. The other run continues until its own boundary or duration.

## Controls, presets, and prompts

Defaults: A 200, B 2, C 25, D 1.5, prior price $70; cash $2,000, buy $40, sell $60; duration 40 years. Repeating preset: A 200/B 2/C 0/D 2/prior $70. Diverging: A 200/B 2/C 0/D 3/prior $50. Presets retain applied cash, thresholds, and duration; if retained thresholds exceed the new demand choke price, refuse the preset with an associated error and retain the run. All standard presets have the same choke price.

Ranges: A 50–500 and C 0–100 in whole units, C < A; B 0.5–5 and D 0.1–8 in 0.1 steps; initial price/buy/sell 0–A/B in 0.1 steps, buy < sell; cash $0–$10,000 in cents; duration 1–100 whole years. Reject blank/nonfinite/out-of-range/off-step entries. Native numeric fields stage drafts; edits pause playback, clear completed feedback, and disable Step/Run until Apply and restart accepts the entire form. Errors associate with fields; invalid Apply preserves applied parameters and history. Restart run discards drafts and retains applied parameters. Restore defaults restores all settings and clears the active prompt.

Step advances both active runs one year. Run/Pause advances every 700 ms; stop when both runs finish, when editing/loading a scenario, and when the page is hidden. Restart, Apply, and presets clear histories. Year zero has starting price/cash/zero inventory and no production. Completed runs are not padded with fabricated data.

Four prompt buttons load fresh default-policy scenarios, clear answers and progress, and restart: (1) default converge, run ≥10 years, answer “Approaches equilibrium”; (2) repeating, run ≥4 years, answer “Repeats”; (3) diverging with $2,000, run ≥5 years, answer “Speculation stabilizes this example”; (4) diverging with $100, run ≥5 years, answer “Limited cash can prevent stabilization”. Each Check requires the scenario's exact applied settings, the conceptual answer, and the observed result. A subsequent parameter draft, Apply, Restart, preset, or answer change clears success. Explain failure/success; no grade or persistence.

## Interface and accessibility

Local classic scripts: js/model.js exposes CobwebModel in browsers and CommonJS; js/graph.js renders SVG; js/app.js manages DOM/playback. The DOM-free model exposes limits, validation, defaults/presets/prompt scenarios, equilibrium, initialization, annual transitions, and prompt checks. No services, analytics, URL sharing, persistence, multiplayer, or build framework.

Adjacent baseline/speculation cobweb plots share axes and show supply, consumer demand, and equilibrium. Production points in the speculation plot can be off consumer demand: a labelled horizontal inventory-trade connector joins production to consumer purchases at the clearing price. Separate price and quantity time-series show both runs; the latter also distinguishes speculative consumer purchases. Equivalent tables include year, price, output, consumption, trade, cash, inventory, inventory valuation, and wealth, with status/constraint explanations. Generated summaries and worked current-year equations explain values without relying on graphics or color.

Native controls provide the complete keyboard and single-pointer route. Require visible unobscured focus, 44px primary controls, associated errors, polite announcements for deliberate actions (not every automatic frame), stable focus, distinct line patterns/labels, labelled focusable table scrollers, 320px reflow, and reduced motion. Preserve local WT/Engler assets and credits. Functional checks are not a WCAG conformance claim.

## Acceptance and freeze

Verify equilibrium $50/100 units; default first year 130 units/$35; repeating $30/$70; divergent prices $25, $62.50, $6.25, $90.625 then boundary before year 5. With $2,000 divergent speculation buys 30 units at $40, leaves $800, and stays $40; $100 reaches a year-5 boundary. Independently test clearing, cash/inventory conservation, constraints, zero price/cash, exact thresholds, validation, deterministic restarts, and all prompts. Browser-check keyboard, playback, drafts, preset retention, independent stops, table/graph agreement, file and HTTP opening, and 1280/640/375/320px; smoke-check all seven pages. Record measurements/limits in VERIFICATION.md (in the authoring collection).

Commit/push privately and freeze verified v1 for David's review. The other three frozen activities stay unchanged. No public publishing, outreach, or monitoring. Before teaching release: David's feedback, WCAG 2.2/2.1 AA audit including Parsing, ACCESSIBILITY.md and Accessibility Conformance Report.docx, with screen-reader/classroom evaluation and unresolved release terms addressed.

## Approved development revision — 2026-10-22

Eric McKee approved adoption of JfowlerSIAI's public PR #2 (the cobweb lab), commit `b117d73a124b1ab4c58eabadfaf64c80d33eef37`, based on `a7003f80d77a48a283cf82753617c01bd553e0cf`. The restrained PR #1 (`be4443eb79b3fe7d36c758a36f09aac4920e8149`) is not adopted separately; PR #2 contains its fixes. The v1 specification above is retained as history; this revision supersedes its layout and development freeze. David's review is invited. Public transfer, merging, and deployment are separate tasks.

The economics are unchanged: `js/model.js` and its 470,460-check suite are byte-for-byte v1. One good, one finite-cash speculator, no storage cost, interest, borrowing or shorting, the market-impact clearing rule, the pre-trade boundary, and independent stopping all stay. The approved revision adds:

- Presets and the four guided experiments first, a section navigation, the nine settings in a collapsed disclosure, a noscript explanation, and a playback dock that stays visible on tall desktop screens (not on small or short viewports).
- Review of already-computed years (Previous year, a year slider, Latest year). Reviewing pauses playback and never changes history; Step/Run replays saved years before computing new ones.
- Complete run (until both runs stop, never padding a stopped run) and three playback speeds (1.4, 0.7, 0.25 s/year).
- Labelled buy/sell guide lines in the speculative diagram and a wealth/cash chart (the wealth plot follows Friedman's one-good description; cash + inventory × price remains a valuation, not liquidation proceeds).
- A descriptive matching-year comparison: RMS distance from P* over production years valid in both runs, excluding the shared prior price, with an explanation instead of Infinity for a zero baseline. It makes no claim about long-term stability, profit or welfare.
- A user-initiated full-precision CSV of all computed observations, applied parameters and separate boundary rows; bounded scrollable tables and a print view.
- PR #1's fixes: boundary reasons kept at year zero and in graph text, attempted versus last valid year distinguished, per-run boundary announcements during playback, native price maxima following valid draft A/B, a prompt to choose before checking an unanswered question, and notes on preset retention and missing table values.

`js/analysis.js` is DOM-free observation/export logic tested by `tests/analysis-tests.cjs`. `tests/browser-tests.cjs` (Playwright/Chromium) is developer-only; the delivered page loads only local classic scripts. Preserve the MIT license and JfowlerSIAI contribution credit alongside the original credits. Fresh adoption verification is in VERIFICATION.md (in the authoring collection); the imported REVIEW.md and PROPOSAL.md are historical contributor evidence. Freeze again after verification pending Eric's desktop/phone review and requested corrections.
