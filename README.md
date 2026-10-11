# Cleaning Out Cobwebs

**[Click Here to Launch the Interactive Activity](https://financeprofessormckee.github.io/Cleaning-Out-Cobwebs-Activity/)**

> **Status:** v1 prototype under review with David Friedman. Not yet accessibility-audited
> for teaching release.

Explore delayed production responses and how speculation can change price and quantity cycles. Producers set this year's output from last year's price. Students compare the same market with and without a finite-cash speculator across converging, repeating, and diverging presets, stepping year by year or running continuously.

## Educator Guide: Classroom Integration

This activity is a browser adaptation of Proposal 25 in David Friedman's
[Living Paper](http://daviddfriedman.com/Living_Paper/living_paper.htm) catalog of teaching programs
([original program descriptions](http://daviddfriedman.com/Living_Paper/Program_Descriptions/program_descriptions.htm)).

### The Economic Model

* **Cobweb dynamics:** linear supply and demand with a one-year production lag.
* **Speculation:** a threshold speculator with finite cash buys low and sells high, with market impact, compared against an identical baseline.
* **Self-checks:** four optional experiments on stabilization and its limits.

The full model, its adaptations from Friedman's description, and acceptance cases are in
[SPECIFICATION.md](SPECIFICATION.md). The recorded source brief is in [DESIGN.md](DESIGN.md).
The detailed review is in [REVIEW.md](REVIEW.md); the ambitious alternative's
interface and analysis additions are documented in [PROPOSAL.md](PROPOSAL.md).

### Running it locally

Open `index.html` in a browser. There's no build step, installation, or server, and
everything is local. Model tests run with Node: `node tests/model-tests.cjs`.
Observation/export tests run with `node tests/analysis-tests.cjs`. Optional
Playwright browser checks run with `node tests/browser-tests.cjs`; see the review
for setup and scope.

### License and Citation

The source code for this web application is licensed under the [MIT License](LICENSE). You
are free to use, modify, and distribute the software, consistent with the Living Paper's
request that code based on Friedman's proposals remain open source.

The economic concepts are David Friedman's. The West Texas A&M University name, seal, and
branding assets are not covered by the license and do not imply institutional endorsement
of derivative works. If you use or adapt this activity, please cite this repository.

---
*Economic concepts: [David Friedman](http://daviddfriedman.com/Living_Paper/living_paper.htm). Development: [Eric McKee](https://github.com/financeprofessormckee),
Paul and Virginia Engler College of Business, West Texas A&M University.*
