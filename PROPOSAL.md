# Proposal: a more interactive cobweb lab

This is an alternative to the restrained refinement proposal, based independently
on `a7003f8`. It includes those fixes; select one proposal to merge. The original
SPECIFICATION and DESIGN documents remain the v1 record. This document describes
the proposed additions, all subject to the author's review.

## Why change the interface?

The original puts nine inputs before the first Step control, separates that
control from its plots, and places its four learning experiments after four
charts. At a 1280×900 viewport, the original Step control begins approximately
1,302 pixels down the page and the first experiment heading approximately 3,164
pixels down. Iterating between a question, an action, and its result requires
repeated scrolling. Long histories are also difficult to revisit without
restarting, and wealth is tabulated but never graphed.

The proposed interface puts presets and the existing four questions first,
collapses optional advanced settings, and keeps playback controls available while
viewing graphs on tall desktop screens. Sticky behavior is disabled on small or
short viewports. It retains the maroon institutional identity and local assets,
with a restrained serif title and compact comparison cards.

## Capabilities

| Addition | Teaching purpose | Defined behavior |
| --- | --- | --- |
| Previous year, year slider, Latest year | Revisit how yesterday's price became today's output and clearing price | Reviews only already-computed years, pauses playback, never changes history |
| Step/Run during review | Replay an explanation without a separate simulation | Replays saved observations, then advances the same deterministic model |
| Complete run | Compare the entire chosen horizon without waiting | Computes until both independent runs have stopped; never pads a stopped run |
| Three playback speeds | Adapt the pace for demonstration or inspection | Changing speed pauses; Run resumes at 1.4, 0.7, or 0.25 seconds per year |
| Policy guide lines | Connect the trader's thresholds to the cobweb | Buy/sell levels are labelled in the speculative diagram |
| Wealth/cash chart | Make the finite resource constraint visible through time | Uses the original model's cash and marked-to-market wealth; stops with the run |
| Matching-year comparison | Put a number on whether this example softened the cycle | RMS distance from P*, using the same valid production years in both runs |
| Full-precision CSV | Let students independently calculate and discuss the results | Includes all computed observations, all applied parameters, and separate boundary rows |
| Bounded tables and print view | Keep long runs inspectable | Scrollable, labelled tables with header retention; printing removes controls and expands tables |

The wealth plot follows an explicit feature in Friedman's original one-good
description. Replay, completion, RMS comparisons, and CSV are additions for this
browser adaptation, not claims about the original program.

## Guardrails for interpretation

1. **The economics are unchanged.** `js/model.js` is byte-for-byte identical to
   the original. One good, one speculator, no storage cost, no interest, no
   borrowing/shorting, and the same pre-trade boundary apply. Coupled hog/corn
   markets and alternative trading strategies remain outside this proposal.
2. **Past views are complete snapshots of observed history.** Before a boundary's
   attempted year, that run is active; at and after it, the last valid observation
   and the boundary reason remain visible. Replaying does not erase later data.
   Graph axes use all computed history to stay fixed while reviewing.
3. **The comparison uses years 1…N common to both markets.** The shared prior price
   is excluded. If a baseline stops before year 5 while speculation continues to
   year 40, the comparison uses years 1–4. No missing values become zeros.
4. **The comparison is descriptive.** RMS is sqrt(mean((price − P*)²)), not the
   standard deviation around each run's own mean. The percentage reduction is
   (baseline RMS − speculative RMS) / baseline RMS × 100. A zero denominator
   yields an explanation, not Infinity. A larger speculative RMS is reported as
   larger, rather than hidden. This does not establish long-term stability,
   realized profit, welfare, or universal benefits of speculation.
5. **CSV exports all computed data, not only the displayed past.** Parameter
   drafts do not contaminate it. Year-zero production is blank; invalid prices
   appear only in separately identified attempted-boundary fields. Baseline
   financial balances are blank because it has no speculator. Export has no
   network side effect or storage permission requirement.
6. **No new persistence or services.** Classic local scripts, static assets,
   native controls, and no production dependencies retain direct `file:` use.

## Validation and limitations

The original 470,460 model checks pass unchanged. `tests/analysis-tests.cjs`
independently checks replay immutability/status transitions, the divergent preset's
RMS from hand-calculated prices, missing/zero comparison cases, and CSV precision,
column consistency, and boundary encoding. `tests/browser-tests.cjs` covers the
original interactions and the new review/export/playback behavior at 320–1280px.

Chromium `file:` operation, mobile-width reflow, screenshots, and DOM/ARIA
reference checks were verified. Browser emulation is not a physical-device or
screen-reader audit. Print styling is included but printer-specific pagination
is not certified. Review and accessibility release gates remain in place.
