# Review of Cleaning Out Cobwebs

Reviewed the original `a7003f8` source, README, DESIGN, SPECIFICATION, all three
JavaScript modules, styles, markup, and tests against the one-good version of
[Friedman's Proposal 25](http://daviddfriedman.com/Living_Paper/Program_Descriptions/program_descriptions.htm).

## Assessment

The central experiment is well chosen: compare identical markets whose producers
react to the previous year's price, introducing a finite-cash, finite-inventory
speculator in just one run. The one-good scope, market-impact clearing rule,
independent stopping, and explicit limitations are internally consistent. The
baseline multiplier is −D/B, not D/B: its sign explains alternating deviations.
The cash-limited purchase uses the correct stable root of x(p0 + x/B) = cash.
The existing deterministic suite passes 470,460 checks, including 2,000 generated
parameter sets; no economic-model change is proposed in this branch.

## Findings and disposition

| Finding | Effect | This proposal |
| --- | --- | --- |
| `runSummary` returns early at year zero, before adding the boundary reason | A run that stops before year 1 is described as merely not started, including its SVG description | Preserve the boundary reason and attempted values in graph text |
| The year-zero worked explanation always says production begins on Step | Contradicts a terminal run with a disabled Step button | Explain that no valid production year completed |
| Automatic steps announce only when both runs finish | A screen-reader user can miss a baseline boundary while speculation continues for decades | Announce each run's status transition, without announcing every frame |
| “Through year 5” includes an invalid attempted year | Can be mistaken for a fifth valid observation | Distinguish attempted year from each run's last valid year |
| Native price maxima reflect applied A/B while A and B are being edited | Native number controls can disagree with the complete-form validator | Recalculate maxima from valid draft A/B and show the ceiling |
| Checking an unanswered question reports a conceptual error | Gives the wrong kind of guidance | Ask for a selection and focus the answer control |
| Preset retention and missing table values are easy to miss | Students may assume a fresh default policy or mistake absent values for zero | Explain both near the controls/data |
| Navigation requires repeated scrolling among settings, run, plots, experiments, and data | Slows classroom exploration, especially on small screens | Add an unobtrusive section navigation |
| No JavaScript fallback | Nonfunctional controls appear unexplained if scripts are disabled | Add a `noscript` explanation |

## Pedagogical cautions retained

- Stability is a property of these equations and starting conditions, not a
  general claim about all speculation or actual commodity markets.
- The diverging $2,000 example converges immediately to P* = $40; it retains
  inventory. Reaching a flat price does not establish a realized trading profit.
- The repeating example narrows the cycle; it does not eliminate it.
- Cash + inventory × current price is a marked-to-market valuation, not a
  guaranteed liquidation value, welfare measure, or profit after carrying costs.
- A boundary is the end of the chosen linear domain. Neither clipping negative
  prices to zero nor letting the speculator rescue an infeasible pre-trade year
  would be a neutral interface fix.
- Exact-equilibrium starts remain there even under the “Diverging” preset's
  slope relationship. Zero prices, cash, and output are valid edge cases.

## Scope

This is the restrained alternative. Original controls, section order, plots,
presets, four experiments, institution assets, credits, and offline operation are
retained. The separate ambitious proposal is an alternative against the same
original commit; do not merge both wholesale.

The original specification and source brief remain as historical v1 documents.
This file records the proposed interface changes to them. This is a review
proposal, not a teaching-release or accessibility-conformance claim.

## Validation

Run `node tests/model-tests.cjs`. Optional browser regression checks use Playwright:
install it in the development environment and its Chromium browser, then run
`node tests/browser-tests.cjs`. `CHROMIUM_EXECUTABLE` can select an existing
Chromium; `ACTIVITY_URL` can select an HTTP-served copy instead of the default
local `file:` URL. There is no application build step or runtime dependency.

The browser checks cover keyboard stepping, invalid Apply preserving history,
drafts pausing playback, dynamic price ceilings, pre-year-1 boundaries, a boundary
announcement during continued playback, independent table histories, retained
and rejected presets, all four guided checks, duration completion, console
errors, and reflow at 1280, 640, 375, and 320 CSS pixels.

Manual screen-reader, touch-device, cross-browser, and classroom evaluation remain
necessary before any accessibility audit or release decision.

Verified in Chromium 134 through local `file:` loading: all browser checks above
passed with no JavaScript errors; desktop and narrow layouts were inspected.
The full model suite and `git diff --check` also passed. HTTP serving and other
browser engines were not separately exercised during this review.
