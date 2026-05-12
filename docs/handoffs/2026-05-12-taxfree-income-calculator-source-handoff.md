# Maksuvaba Tulu Calculator Source Handoff

Prepared for: Claude Code / implementation agent  
Prepared by: Codex  
Verification date: 2026-05-12 Europe/Tallinn  
Reference page: https://www.kalkulaator.ee/et/maksuvaba-tulu-kalkulaator  
Reference script: https://www.kalkulaator.ee/js/taxfreeCalc.js

## 1. Decision

Build the Maksuvaba tulu calculator next.

Reason: this calculator is #3 in kalkulaator.ee's own TOP 5 and is strategically connected to the salary calculator already built in this project. It is smaller than salary, but trust-sensitive because users are checking tax-free income thresholds. It also lets us reuse the existing salary tax-free concepts while offering a clearer standalone tool.

Important source reality:

- The live reference page title is **"2025. a. maksuvaba tulu kalkulaator"**.
- The live form exposes only one year radio: **2025**.
- The right-side explanatory copy also mentions **2026** rules, but `taxfreeCalc.js` has no active 2026 branch.
- Therefore, exact source parity is **2025 only**. A modern product may add a separate 2026 mode using the explanatory text / existing salary constants, but that must be clearly separated from the 2025 source-parity logic.

Recommended rollout order:

1. Automaks calculator - built
2. Salary calculator - built
3. VAT calculator - built
4. Loan calculator - built
5. Maksuvaba tulu calculator - this handoff
6. Next candidates: Annuity, Intressitousu moju, Mooteuhikute converter

## 2. Source Verification

Live source was fetched on 2026-05-12.

| File | Live URL | Local snapshot | SHA-256 |
| --- | --- | --- | --- |
| taxfreeCalc.js | https://www.kalkulaator.ee/js/taxfreeCalc.js | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12-taxfree\taxfreeCalc.js | 76C254905FDFB0DFEADE3153A9E1BD1F4700711D019C8C5FE17DA157A05A94B0 |
| taxfree.html | https://www.kalkulaator.ee/et/maksuvaba-tulu-kalkulaator | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12-taxfree\taxfree.html | C11EA2BE5CCCECC10FAD6B94DB6321CC9A58EA3DBFF1E919EA857CCDFBC7C77D |

The live page was opened in the in-app browser. Browser title:

```txt
2025. a. maksuvaba tulu kalkulaator
```

Live DOM confirmed:

- heading: `home >> 2025. a. maksuvaba tulu kalkulaator`
- active year control: `2025`
- input modes:
  - `Brutopalk`
  - `Netopalk`
- amount field default: `0.00`
- period selector:
  - `tunnis`
  - `kuus`, selected
  - `aastas`
- checkboxes:
  - employee unemployment insurance `1.6%`, checked
  - funded pension / II pillar, checked
- result:
  - `Maksuvaba tulu`
  - result period selector: `kuus`, selected; `aastas`
- TOP 5 includes:
  - `3. Maksuvaba tulu`

The live DOM did not expose a visible 2026 form option. The source HTML has commented-out radios for 2022 and 2023, and an active 2025 radio only.

## 3. MVP Scope

Build a standalone Maksuvaba tulu calculator with exact 2025 parity to `taxfreeCalc.js`.

MVP must include:

- source-parity 2025 calculation path
- input mode:
  - gross wage
  - net wage
- amount
- input period:
  - hourly
  - monthly
  - annual
- work hours per month, shown only for hourly input
- employee unemployment insurance toggle
- funded pension toggle
- 2025 funded pension contribution selector:
  - 2%
  - 4%
  - 6%
- output period:
  - monthly
  - annual
- outputs:
  - tax-free income amount
  - annual revenue used by the formula, useful as secondary detail
- golden source-parity fixtures

Optional product extension:

- Add a 2026 mode using the reference page's explanatory text and the already built salary constants:
  - regular tax-free income: 700 EUR/month, 8400 EUR/year
  - pension-age tax-free income: 776 EUR/month, 9312 EUR/year
- Keep this separate from the 2025 `taxfreeCalc.js` parity function.
- Label it clearly in tests and code as a product extension, not a source-derived `taxfreeCalc.js` branch.

Do not integrate EMTA APIs, account login, personal pension lookups, declarations, or advice wording in MVP.

## 4. Recommended Product Improvements

The reference UI is outdated and internally inconsistent. The new UI should be clearer than the source while preserving source parity.

Recommended UX:

- default to the current useful view, but make 2025 source parity available
- use segmented controls:
  - year / rule set
  - gross vs net
  - hourly/monthly/annual
  - monthly/annual output
- show the formula threshold visually:
  - up to 14,400 annual income: full 7,848/year
  - 14,400 to 25,200: sliding reduction
  - above 25,200: zero
- show "annual income used" as a secondary line
- show low-income behavior explicitly when tax-free income equals contribution-adjusted income
- show II pillar contribution selector whenever funded pension is enabled for 2025
- never hide the 2/4/6% selector by default like the source does
- product UI should show validation messages instead of raw `NaN`
- pure calculation tests should still preserve source parsing/rounding quirks

Useful Estonian labels:

```txt
Maksuvaba tulu
Brutopalk
Netopalk
Tunnis
Kuus
Aastas
Tootundide arv kuus
Tootaja tootuskindlustusmakse
Kogumispension (II sammas)
Aastatulu arvestuses
```

## 5. Source UI Inputs

Source form:

```html
<form name="tax_free_income">
```

### Year

Active source HTML:

```txt
year2025 -> value 2025, checked
```

Commented-out source HTML:

```txt
year2022 -> value 2022, label 2018-2022
year2023 -> value 2023, label 2023-2024
```

There is no active `year2026` element.

Important source quirk:

```js
var year2022 = document.getElementById("year2022");
var year2023 = document.getElementById("year2023");
var year2025 = document.getElementById("year2025");

if (year2025.checked == true) { year = 2025; }
else if (year2023.checked == true) { year = 2023; }
else if (year2022.checked == true) { year = 2022; }
```

Because `year2025` is active and checked, the missing commented-out elements are not dereferenced in normal page use. Do not copy this brittle DOM logic into the new app.

### Input Mode

Source radios:

```txt
input_2 -> Brutopalk, value 2, checked by default
input_3 -> Netopalk, value 3
```

Internal type:

```ts
type TaxFreeInputMode = "gross" | "net";
```

There is no employer-cost input mode in this standalone source page.

### Amount

Source amount field:

```txt
eur -> value "0.00"
```

This is interpreted as gross or net depending on input mode.

### Input Period

Source select:

```txt
period value 1 -> tunnis / hourly
period value 2 -> kuus / monthly, selected
period value 3 -> aastas / annual
```

Source behavior:

```js
if (period == 1) { workhours = workhours; }
else { workhours = 1; }

if (period == 3) { nper = 12; }
else { nper = 1; }
```

Meaning:

- hourly input: `eur * workhours` becomes monthly amount
- monthly input: `eur` is monthly amount
- annual input: `eur` is annual amount
- `nper = 12` only for annual input; otherwise `1`

### Work Hours

Source input:

```txt
workhours -> visible only when period selectedIndex == 0 / hourly
```

If the user selects hourly, the source multiplies `eur * workhours`. If `workhours` is blank, `parseFloat("")` gives `NaN`.

### Employee Unemployment Insurance

Source checkbox:

```txt
ui2_x -> checked by default
```

Source rate:

```js
uip2 = 0.016;
uip2 = ui2_x.checked ? uip2 : 0;
```

This is employee unemployment insurance only.

### Funded Pension

Source checkbox:

```txt
pension_x -> checked by default
```

Source select:

```txt
contribution_rate_2025:
  0.02 -> 2%, selected by browser default
  0.04 -> 4%
  0.06 -> 6%
```

Source behavior:

```js
if (year == 2025) {
  fp1 = pension_x.checked ? parseFloat(contributionRate2025.value) : 0;
} else {
  fp1 = pension_x.checked ? 0.02 : 0;
}
```

Important UI bug:

- The contribution row is `style="display:none"` in HTML.
- It is only shown by `toggleContributionVisibility(...)`.
- The page has 2025 selected by default, but there is no page-load call to reveal the row.
- Clicking the 2025 radio can reveal it, but the default visible live DOM did not show the 2/4/6 selector.
- Calculation still reads the hidden select and uses 2% by default.

New UI should show the selector clearly when pension is enabled.

### Output Period

Source select:

```txt
taxfree_period value 1 -> kuus / monthly, selected
taxfree_period value 12 -> aastas / annual
```

Source variable:

```js
var i = tfp.options[tfp.selectedIndex].value;
```

This is a string in JS, but arithmetic coerces it to number.

### Outputs

Source output fields:

```txt
annual_revenue -> hidden, disabled
taxfree_sum    -> visible text input
```

`annual_revenue` is important for tests even though it is hidden.

## 6. Source Constants

For active 2025 source parity:

```txt
income tax rate (itr): 0.22
employee unemployment insurance (uip2): 0.016 if enabled
funded pension employee contribution (fp1): 0.02 / 0.04 / 0.06 if enabled
taxfree_min: 7848 annual
sliding lower: 14400 annual revenue
sliding upper: 25200 annual revenue
sliding range: 10800
```

Source has historical branches:

```js
var itr = (year >= 2025) ? 0.22 : 0.20;

if (year >= 2023) { taxfree_min = 7848; }
else { taxfree_min = 6000; }
```

But the live standalone form only exposes 2025.

## 7. Source Rounding

Source rounding:

```js
function round(n, dec) {
  X = n * Math.pow(10, dec);
  X = Math.round(X);
  return (X / Math.pow(10, dec)).toFixed(dec);
}
```

Important:

- returns a string
- uses `Math.round`
- pads decimals with `toFixed`
- leaks global `X`
- formulas often rely on JavaScript coercing rounded strings back to numbers

For parity tests, assert fixed-decimal strings.

## 8. Source Parsing

Source parser:

```js
function getFieldFloatValue(fieldId) {
  return parseFloat(document.getElementById(fieldId).value.replace("\,", "."));
}
```

Quirks:

- only first comma is replaced
- spaces are not removed
- `"1600,50"` parses as `1600.5`
- `"1 600"` parses as `1`
- `""` parses as `NaN`
- `"1000EUR"` parses as `1000`

Use a source-parity parser in tests. Product UI can normalize and validate more nicely, but keep the pure source-parity function exact.

## 9. Gross Input Calculation

When `Brutopalk` is checked:

```js
annual_revenue.value = round(eur * workhours * 12 / nper, 2);
```

Where:

```txt
monthlyGrossEquivalent = eur * workhours
annualRevenue = monthlyGrossEquivalent * 12 / nper
```

Examples:

- monthly 1000 -> annual revenue 12000
- hourly 10 and 160 hours -> annual revenue 19200
- annual 24000 -> annual revenue 24000 because `nper = 12`

## 10. Net Input Reverse Calculation

When `Netopalk` is checked, source reconstructs the gross annual revenue.

Source branch:

```js
X = round(((eur*workhours*12/nper)/(1-itr) - 25200*(1 - (1*fp1+1*uip2))) / (-((25200-14400)/taxfree_min)*(1 - (1*fp1+1*uip2)) - 1 + 1/(1-itr)), 2);
if (X < 0) n=0;
else if (((eur*workhours*12/nper)*(1 - (fp1 + 1 * uip2)))<taxfree_min && X > taxfree_min) n=eur*workhours;
else if (X > taxfree_min) n=taxfree_min*nper/12;
else n = round(X*nper/12, 2);
income_tax_rate = (((eur*workhours*(1-(1*fp1+1*uip2))*12/nper)-n)<=0) ? 0 : itr;
annual_revenue.value = round((round(((((eur*workhours)-1*n)/(1 - income_tax_rate))+1*n)/(1-(1*fp1+1*uip2)),2))*12/nper, 2);
```

Interpretation:

- `X` is an intermediate tax-free amount solver.
- `n` is the tax-free amount used in the reverse net-to-gross calculation for the selected period.
- `income_tax_rate` becomes zero when net income after employee deductions does not exceed `n`.
- `annual_revenue` is reconstructed through a rounded intermediate monthly/period gross.

Important source quirks:

- `X` is a string from `round`, then compared numerically through JS coercion.
- `n` is undeclared and leaks global.
- `n` can be a string when assigned from `round(X*nper/12, 2)`.
- The formula uses the same 2025 thresholds even for net mode.

## 11. Tax-Free Amount Calculation

After annual revenue is known, the source computes visible `taxfree_sum`.

Source branch:

```js
if (annual_revenue.value > 25200) {
  tfs.value = round(0, 2);
}
else if (annual_revenue.value * (1 - (1*fp1+1*uip2)) < taxfree_min) {
  if (input_3.checked == true) {
    tfs.value = round(eur*workhours*12/nper*i/12, 2);
  }
  else {
    tfs.value = round(eur*workhours*(1-(1*fp1+1*uip2))*12/nper*i/12, 2);
  }
}
else if (annual_revenue.value < 14400) {
  tfs.value = round(taxfree_min*i/12, 2);
}
else {
  tfs.value = round((round(taxfree_min-(taxfree_min*(annual_revenue.value-14400)/(25200-14400)), 2))*i/12, 2);
}
```

Rules:

1. Annual revenue above 25,200 -> tax-free income 0.
2. If annual revenue after employee deductions is below 7,848:
   - gross input: tax-free income equals contribution-adjusted income
   - net input: tax-free income equals net input
3. Annual revenue below 14,400 -> full tax-free income 7,848/year.
4. Annual revenue from 14,400 to 25,200 -> sliding formula:

```txt
7848 - 7848 * (annualRevenue - 14400) / 10800
```

5. Output period multiplier:

```txt
monthly output: i = 1
annual output: i = 12
```

Important:

- The upper boundary is `> 25200`, not `>= 25200`.
- At exactly 25,200, the sliding formula returns 0.
- The lower check is `< 14400`, not `<= 14400`.
- At exactly 14,400, the sliding formula returns full 7,848/year.
- The sliding branch rounds the annual tax-free result to 2 decimals, then divides/multiplies to output period and rounds again.

## 12. 2026 Handling

The reference page text says:

```txt
Alates aastast 2026 on maksuvaba tulu koigile (v.a. vanaduspensioniealistele)
700 eurot kuus ja 8400 eurot aastas, vanaduspensioni ikka joudnud tootaja
maksuvaba tulu on 776 eurot kuus (9312 eurot aastas).
```

But:

- `taxfreeCalc.js` has no active 2026 form radio.
- `taxfreeCalc.js` has no `year2026` element lookup.
- The active HTML form is 2025.
- The title is 2025.

Implementation recommendation:

- Implement `calculateTaxFree2025SourceParity()` exactly from this handoff.
- If adding 2026 UI, implement it as a separate `calculateTaxFreeModern()` or `calculateTaxFreeByYear()` wrapper using existing salary constants.
- Keep 2025 source-parity tests untouched.

## 13. Recommended Internal API

Suggested types:

```ts
export type TaxFreeInputMode = "gross" | "net";
export type TaxFreeInputPeriod = "hourly" | "monthly" | "annual";
export type TaxFreeOutputPeriod = "monthly" | "annual";
export type TaxFreeYear = 2025 | 2026;

export interface TaxFreeInput {
  year: TaxFreeYear;
  inputMode: TaxFreeInputMode;
  amount: number | string;
  inputPeriod: TaxFreeInputPeriod;
  workHoursPerMonth?: number | string;
  includeEmployeeUnemployment: boolean;
  includeFundedPension: boolean;
  fundedPensionRate: 0.02 | 0.04 | 0.06;
  outputPeriod: TaxFreeOutputPeriod;
  retired?: boolean;
}

export interface TaxFreeResult {
  taxFreeAmount: string;
  annualRevenue: string;
  outputPeriod: TaxFreeOutputPeriod;
  sourceParity: boolean;
  warnings: string[];
}
```

Recommended files:

```txt
src/calculators/taxfree/calculate.ts
src/calculators/taxfree/types.ts
src/calculators/taxfree/fixtures.ts
src/calculators/taxfree/calculate.test.ts
src/components/calculators/taxfree/TaxFreeCalculator.tsx
src/app/maksuvaba-tulu-kalkulaator/page.tsx
```

Follow existing project rule: calculation logic belongs in `src/calculators/...`, not React components.

## 14. Golden Fixtures

These fixtures were generated from the exact `taxfreeCalc.js` formulas.

Defaults unless specified:

```json
{
  "year": 2025,
  "inputMode": "gross",
  "inputPeriod": "monthly",
  "includeEmployeeUnemployment": true,
  "includeFundedPension": true,
  "fundedPensionRate": 0.02,
  "outputPeriod": "monthly"
}
```

### Fixture A - Gross Monthly 1000, Full Allowance

Input:

```json
{ "amount": 1000 }
```

Expected:

```json
{
  "annual_revenue": "12000.00",
  "taxfree_sum": "654.00"
}
```

### Fixture B - Gross Monthly 500, Low-Income Contribution-Adjusted Branch

Input:

```json
{ "amount": 500 }
```

Expected:

```json
{
  "annual_revenue": "6000.00",
  "taxfree_sum": "482.00"
}
```

Reason: `500 * (1 - 0.02 - 0.016) = 482`.

### Fixture C - Gross Monthly 1200, Lower Boundary

Input:

```json
{ "amount": 1200 }
```

Expected:

```json
{
  "annual_revenue": "14400.00",
  "taxfree_sum": "654.00"
}
```

At exactly 14,400, the source uses the sliding branch, but result is still full allowance.

### Fixture D - Gross Monthly 1600, Sliding Reduction

Input:

```json
{ "amount": 1600 }
```

Expected:

```json
{
  "annual_revenue": "19200.00",
  "taxfree_sum": "363.33"
}
```

### Fixture E - Gross Monthly 2100, Upper Boundary

Input:

```json
{ "amount": 2100 }
```

Expected:

```json
{
  "annual_revenue": "25200.00",
  "taxfree_sum": "0.00"
}
```

At exactly 25,200, the source does not enter the `> 25200` branch. Sliding formula returns 0.

### Fixture F - Gross Monthly 2100.01, Above Upper Boundary

Input:

```json
{ "amount": 2100.01 }
```

Expected:

```json
{
  "annual_revenue": "25200.12",
  "taxfree_sum": "0.00"
}
```

### Fixture G - Gross Monthly 1600, Annual Output

Input:

```json
{
  "amount": 1600,
  "outputPeriod": "annual"
}
```

Expected:

```json
{
  "annual_revenue": "19200.00",
  "taxfree_sum": "4360.00"
}
```

### Fixture H - Gross Hourly 10 EUR, 160 Hours

Input:

```json
{
  "amount": 10,
  "inputPeriod": "hourly",
  "workHoursPerMonth": 160
}
```

Expected:

```json
{
  "annual_revenue": "19200.00",
  "taxfree_sum": "363.33"
}
```

### Fixture I - Gross Annual 24000

Input:

```json
{
  "amount": 24000,
  "inputPeriod": "annual"
}
```

Expected:

```json
{
  "annual_revenue": "24000.00",
  "taxfree_sum": "72.67"
}
```

### Fixture J - Net Monthly 1000

Input:

```json
{
  "amount": 1000,
  "inputMode": "net"
}
```

Expected:

```json
{
  "annual_revenue": "13662.96",
  "taxfree_sum": "654.00"
}
```

### Fixture K - Net Monthly 500, Low-Income Net Branch

Input:

```json
{
  "amount": 500,
  "inputMode": "net"
}
```

Expected:

```json
{
  "annual_revenue": "6224.04",
  "taxfree_sum": "500.00"
}
```

For net input in low-income branch, source uses net amount directly, not contribution-adjusted gross.

### Fixture L - Gross Monthly 500, No Employee Unemployment

Input:

```json
{
  "amount": 500,
  "includeEmployeeUnemployment": false
}
```

Expected:

```json
{
  "annual_revenue": "6000.00",
  "taxfree_sum": "490.00"
}
```

### Fixture M - Gross Monthly 500, No Funded Pension

Input:

```json
{
  "amount": 500,
  "includeFundedPension": false
}
```

Expected:

```json
{
  "annual_revenue": "6000.00",
  "taxfree_sum": "492.00"
}
```

### Fixture N - Gross Monthly 500, Pension 4%

Input:

```json
{
  "amount": 500,
  "fundedPensionRate": 0.04
}
```

Expected:

```json
{
  "annual_revenue": "6000.00",
  "taxfree_sum": "472.00"
}
```

### Fixture O - Gross Monthly 500, Pension 6%

Input:

```json
{
  "amount": 500,
  "fundedPensionRate": 0.06
}
```

Expected:

```json
{
  "annual_revenue": "6000.00",
  "taxfree_sum": "462.00"
}
```

### Fixture P - Net Monthly 1600, Above Upper Boundary After Reverse Gross

Input:

```json
{
  "amount": 1600,
  "inputMode": "net"
}
```

Expected:

```json
{
  "annual_revenue": "25534.68",
  "taxfree_sum": "0.00"
}
```

### Fixture Q - Decimal Comma Parsing

Input:

```json
{
  "amount": "1600,50"
}
```

Expected:

```json
{
  "annual_revenue": "19206.00",
  "taxfree_sum": "362.97"
}
```

### Fixture R - Space Parsing Source Quirk

Input:

```json
{
  "amount": "1 600"
}
```

Expected:

```json
{
  "annual_revenue": "12.00",
  "taxfree_sum": "0.96"
}
```

Reason: `parseFloat("1 600")` returns `1`.

## 15. Test Requirements

Minimum tests:

- fixtures A-R
- parser tests:
  - `"1600,50"` -> `1600.5`
  - `"1 600"` -> `1`
  - `"1000EUR"` -> `1000`
  - `""` -> `NaN`
- rounding tests:
  - `roundSource(12000, 2)` -> `"12000.00"`
  - sliding formula double-round behavior
- boundary tests:
  - exactly 14,400 annual revenue
  - exactly 25,200 annual revenue
  - above 25,200 annual revenue
- low-income branch tests:
  - gross mode uses contribution-adjusted amount
  - net mode uses net amount directly
- period tests:
  - hourly multiplies by work hours
  - annual uses `nper = 12`
  - output annual uses `i = 12`
- UI state tests:
  - funded pension selector visible when funded pension enabled for 2025
  - work hours visible only for hourly input

If implementing 2026 as a product extension, add separate tests:

- 2026 regular monthly -> `700.00`
- 2026 regular annual -> `8400.00`
- 2026 retired monthly -> `776.00`
- 2026 retired annual -> `9312.00`

Do not mix 2026 extension tests into source-parity fixture names.

## 16. Existing Project Reuse

The current project already has a salary calculator with tax-free logic:

```txt
src/calculators/salary/calculate.ts
src/calculators/salary/constants.ts
src/calculators/salary/types.ts
```

Relevant constants already exist:

```txt
INCOME_TAX_RATE[2025] = 0.22
EMPLOYEE_UNEMPLOYMENT_RATE = 0.016
TAX_FREE_ANNUAL[2025] = 7848
TAX_FREE_MONTHLY[2025] = 654
TAX_FREE_ANNUAL[2026] = 8400
TAX_FREE_MONTHLY[2026] = 700
RETIRED_TAX_FREE_ANNUAL = 9312
RETIRED_TAX_FREE_MONTHLY = 776
SLIDING_LOWER = 14400
SLIDING_UPPER = 25200
SLIDING_RANGE = 10800
```

Implementation guidance:

- Reuse constants where appropriate.
- Do not import the full salary calculator into the standalone tax-free calculator if it makes the logic harder to test.
- A shared helper is acceptable only if it remains small and preserves existing salary tests.
- Keep `calculateTaxFree...` pure and independently tested.

## 17. Implementation Instructions For Claude

1. Read project `STACK.md`.
2. Read this handoff completely.
3. Inspect existing salary calculator structure before adding files.
4. Add a new route:

```txt
/maksuvaba-tulu-kalkulaator
```

5. Add pure calculation module:

```txt
src/calculators/taxfree/
```

6. Add UI component:

```txt
src/components/calculators/taxfree/TaxFreeCalculator.tsx
```

7. Add homepage aggregator card/link.
8. Implement 2025 source-parity calculation first.
9. Add fixtures A-R and tests.
10. Add 2026 mode only as a separate product extension, if included.
11. Keep calculation logic out of React components.
12. Run full tests.
13. Deploy only after tests pass and verify in browser.

## 18. Claude Build Prompt

Use this prompt when handing the task to Claude:

```txt
We are continuing the kalkulaator.ee alternative project at C:\Users\Kasutaja\Claude_Projects\kalkulaator.

Task: build the Maksuvaba tulu calculator as the next calculator in the aggregator.

Read first:
C:\Users\Kasutaja\Claude_Projects\kalkulaator\STACK.md
C:\Users\Kasutaja\Claude_Projects\kalkulaator\docs\handoffs\2026-05-12-taxfree-income-calculator-source-handoff.md

Requirements:
- Implement exact 2025 source-parity logic from kalkulaator.ee taxfreeCalc.js.
- Add pure logic under src/calculators/taxfree/.
- Add tests and golden fixtures A-R from the handoff.
- Preserve source quirks in the pure calculation layer: source rounding strings, comma parsing, space parsing, gross/net differences, low-income contribution-adjusted branch, net reverse annual revenue formula, boundary comparisons, output period multiplier, and 2/4/6% funded pension rates.
- Build a modern UI route at /maksuvaba-tulu-kalkulaator using the existing design system.
- Add the calculator to the homepage aggregator/navigation.
- Reuse salary constants where sensible, but keep the standalone tax-free calculation pure and independently tested.
- If adding 2026, keep it as a separate product extension using existing salary constants; do not pretend taxfreeCalc.js has a 2026 branch.
- Keep calculation logic out of UI components.
- Run the existing project test suite and add/verify taxfree tests.
- Deploy only after tests pass, then verify in browser.

Do not add EMTA API integration, personal tax declaration features, login, or advice wording. MVP is pure client-side source parity plus modern UX.
```

