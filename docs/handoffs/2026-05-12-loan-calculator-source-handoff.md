# Loan Calculator Source Handoff

Prepared for: Claude Code / implementation agent  
Prepared by: Codex  
Verification date: 2026-05-12 Europe/Tallinn  
Reference page: https://www.kalkulaator.ee/et/laenukalkulaator  
Reference script: https://www.kalkulaator.ee/js/loanCalc.js

## 1. Decision

Build the loan calculator fourth.

Reason: Automaks, Salary, and VAT are already live in this project. The next best calculator is the universal loan calculator because it is broad-use, has clear SEO value, and gives the aggregator a financial-planning pillar beyond taxes. It also has enough nontrivial calculation logic that exact source parity matters: the calculator can solve any one of four unknowns from the other three values.

Current rollout order:

1. Automaks calculator - built
2. Salary calculator - built
3. VAT calculator - built
4. Loan calculator - this handoff
5. More calculators: annuity, currency/SDR, time value of money, unit converters, BMI, fuel consumption

## 2. Source Verification

Live source was fetched on 2026-05-12.

| File | Live URL | Local snapshot | SHA-256 |
| --- | --- | --- | --- |
| loanCalc.js | https://www.kalkulaator.ee/js/loanCalc.js | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12-loan\loanCalc.js | E9481F4820693B1BCB789995772CC4C8FBFA705B74F9858C8B42AC4303DA7723 |
| loan.html | https://www.kalkulaator.ee/et/laenukalkulaator | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12-loan\loan.html | fetched 2026-05-12 |

The live page was opened in the in-app browser. Browser title:

```txt
Laenukalkulaator - leia laenu kuumakse, intress, periood voi maksimaalne laenusumma.
```

The live DOM showed:

- heading: "home >> Universaalne laenukalkulaator"
- source input fields:
  - Laenusumma
  - Kuumakse (annuiteet)
  - Aastane intressimaar
  - Laenu periood
  - aasta(t)
  - kuud
- output fields:
  - Intressid kokku
  - Tagasimaksed laenuandjale kokku
- default checked solve mode: Kuumakse (annuiteet)
- default checked period unit: aasta(t)

The visible browser page also confirmed the old table-like layout, right-side ads, top banner ad, and bottom sticky ad interference. The form UI was visible and matched the downloaded HTML. Exact calculation parity should be taken from `loanCalc.js`, not from visual scraping.

## 3. MVP Scope

Build a standalone universal loan calculator with exact parity to the reference script.

MVP must include:

- solve mode selector:
  - find loan amount
  - find monthly annuity payment
  - find annual interest rate
  - find loan period
- inputs:
  - loan amount / principal
  - monthly payment
  - annual nominal interest rate
  - period
  - period unit: years or months
- outputs:
  - calculated unknown value
  - total interest paid
  - total amount repaid to lender
- chart or compact breakdown:
  - loan amount / principal
  - interest
- exact decimal-comma parsing behavior in parity utility/tests
- golden tests for all four solve modes
- source-parity tests for the quirks listed below

Do not implement bank APIs, offers, credit scoring, amortization schedules, refinancing, fees, insurance, EURIBOR feeds, or saved loan profiles in MVP. Those are later product layers.

## 4. Recommended Product Improvements

The reference page is useful but old. The new version should preserve the calculation behavior while making the UX much clearer.

Recommended UX:

- use a segmented control for "I want to calculate":
  - Loan amount
  - Monthly payment
  - Interest rate
  - Period
- disable or visually lock only the field being solved
- put the calculated field at the top of results with a strong label
- use a second segmented control for period unit:
  - Years
  - Months
- show total repayment and total interest as separate result cards
- show a small principal vs interest bar, not a 3D pie chart
- include short inline copy that says this assumes a constant monthly annuity payment
- expose a "source parity" test mode only in tests/code, not in product UI
- validation should be user-friendly, but the calculation core must retain parity behavior for tests

Avoid:

- no "best loan offer" marketplace in MVP
- no bank rate assumptions
- no legal/financial advice wording
- no APR claims unless fees are added later
- no silent correction of source quirks inside the pure parity function

Useful Estonian labels:

```txt
Laenusumma
Kuumakse
Aastane intressimaar
Laenu periood
Intressid kokku
Tagasimaksed kokku
Arvutan
Aastates
Kuudes
```

## 5. Source UI Inputs

Source form starts inside:

```html
<div class="calculator"><script src="https://www.kalkulaator.ee/js/loanCalc.js"></script>
<form>
```

### Solve Mode Radios

Source radios:

```txt
F1 -> Laenusumma
F2 -> Kuumakse (annuiteet), default checked
F3 -> Aastane intressimaar
F4 -> Laenu periood
```

Internal type:

```ts
type LoanSolveMode =
  | "loanAmount"
  | "monthlyPayment"
  | "annualInterest"
  | "period";
```

Source behavior:

- radio `onclick="disable(); drawChart();"`
- the selected mode disables the associated input field
- no calculation is triggered directly by mode change except chart redraw
- calculation happens on input `keyup` / `change`

The source `disable()` mapping is:

```js
controlPairs['F1'] = 'PV';
controlPairs['F2'] = 'PMT';
controlPairs['F3'] = 'interest';
controlPairs['F4'] = 'period';
```

### Input Fields

Source fields:

```txt
PV       -> loan amount / principal, maxlength 10
PMT      -> monthly annuity payment, maxlength 9, disabled by default
interest -> annual nominal interest percent, maxlength 9
period   -> loan period, maxlength 9
```

Important names:

- `PV` means present value / principal / loan amount.
- `PMT` means constant monthly annuity payment.
- `interest` is annual nominal interest as a percent, not a monthly rate.
- `period` means either years or months depending on the period-unit radio.

### Period Unit Radios

Source radios:

```txt
T1 -> years, value 12, default checked
T2 -> months, value 1
```

Internal type:

```ts
type LoanPeriodUnit = "years" | "months";
```

Source does not read the radio `value` directly. It hardcodes:

```js
if (document.getElementById('T1').checked) { n = 12; }
else if (document.getElementById('T2').checked) { n = 1; }
```

Then:

```js
totalMonths = period * n
```

So:

- years mode: `period = 5` means `60` months
- months mode: `period = 60` means `60` months

### Output Fields

Source outputs:

```txt
total_interest -> Intressid kokku
total_sum      -> Tagasimaksed laenuandjale kokku
```

Both are disabled text inputs.

### Reset

Source reset button calls:

```js
resetValues(this.form)
```

That function clears all text inputs only. It does not reset solve-mode radios or period-unit radios.

## 6. Common Calculation Model

All non-rate solve modes share these variables:

```js
n = 12 if years mode, otherwise 1
r = interest / 100
t = period * n
z = 1 / (1 + r / 12)
div = 1 - Math.pow(z, t)
```

Where:

- `n` is months-per-entered-period-unit
- `r` is annual nominal decimal rate
- `t` is total number of monthly payments
- `z` is the monthly discount factor
- `div` is `1 - z^t`

The formulas assume:

- payments are monthly
- interest rate is constant
- payment is a constant annuity payment
- no origination fee
- no contract fee
- no insurance
- no variable EURIBOR changes
- no early repayment

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

- returns a string, not a number
- uses `Math.round`
- pads trailing decimals with `toFixed`
- leaks global `X` because it is not declared
- output values in formulas are often strings that JavaScript coerces back to numbers during subtraction/multiplication

Implementation guidance:

- calculation core can use numbers internally
- final parity output should match these exact fixed-decimal strings
- tests should assert strings, especially `"188.71"`, `"1322.60"`, and `"5.000"`

## 8. Parsing

Source parsing:

```js
function getFieldFloatValue(fieldId) {
  return parseFloat(document.getElementById(fieldId).value.replace("\,", "."));
}
```

Important quirks:

- only the first comma is replaced
- spaces are not removed
- `parseFloat("1 000")` becomes `1`, not `1000`
- `parseFloat("1,5")` becomes `1.5`
- `parseFloat("")` becomes `NaN`
- `parseFloat("abc")` becomes `NaN`
- `parseFloat("1000EUR")` becomes `1000`

Recommended implementation:

- Have a source-parity parser matching this behavior for golden tests.
- Product UI can separately normalize spaces and show validation errors, but the pure source-parity function should remain exact.

## 9. Solve Mode F1: Find Loan Amount

Source branch:

```js
if (document.getElementById('F1').checked) {
  var pv = document.getElementById('PV');
  var pmt = getFieldFloatValue('PMT');
  var r = getFieldFloatValue('interest') / 100;
  var t = getFieldFloatValue('period') * n;
  var z = 1 / (1 + r / 12);
  var div = 1 - Math.pow(z, t);

  pv.value = round((pmt * z * div) / (1 - z), 2);
  total_sum.value = round(pmt * t, 2);
  total_interest.value = round(total_sum.value - pv.value, 2);
}
```

Formula:

```txt
PV = PMT * z * (1 - z^t) / (1 - z)
total_sum = PMT * t
total_interest = total_sum - PV
```

Output formatting:

- `PV`: 2 decimals
- `total_sum`: 2 decimals
- `total_interest`: 2 decimals

Source quirk:

- If `interest = 0`, then `z = 1`, `1 - z = 0`, and this branch returns `NaN`.
- A mathematically nicer zero-interest branch would be `PV = PMT * t`, but the reference does not do that.

## 10. Solve Mode F2: Find Monthly Payment

This is the default source mode.

Source branch:

```js
else if (document.getElementById('F2').checked) {
  var pmt = document.getElementById('PMT');
  var pv = getFieldFloatValue('PV');
  var r = getFieldFloatValue('interest') / 100;
  var t = getFieldFloatValue('period') * n;
  var z = 1 / (1 + r / 12);
  var div = 1 - Math.pow(z, t);

  pmt.value = round((pv * (1 - z)) / (z * div), 2);
  total_sum.value = round(pmt.value * t, 2);
  total_interest.value = round(total_sum.value - pv, 2);
}
```

Formula:

```txt
PMT = PV * (1 - z) / (z * (1 - z^t))
total_sum = PMT * t
total_interest = total_sum - PV
```

Important:

- `PMT` is rounded to 2 decimals first.
- `total_sum` uses the rounded `PMT` string, not the unrounded raw payment.
- This is why totals can differ by a few cents from a mathematically unrounded amortization.

Output formatting:

- `PMT`: 2 decimals
- `total_sum`: 2 decimals
- `total_interest`: 2 decimals

Source quirk:

- If `interest = 0`, output becomes `NaN` because the formula divides by zero/zero.

## 11. Solve Mode F3: Find Annual Interest Rate

Source branch:

```js
else if (document.getElementById('F3').checked) {
  var pmt = getFieldFloatValue('PMT');
  var pv = getFieldFloatValue('PV');
  var r = document.getElementById('interest');
  var t = getFieldFloatValue('period') * n;
  var z = 1 / (1 + r / 12);
  var div = 1 - Math.pow(z, t);

  if (round(RATE(t, pmt, -pv, 0, 0, 0.01) * 100 * 12, 3) > 250) interest.value = "N/A";
  else interest.value = round(RATE(t, pmt, -pv, 0, 0, 0.01) * 100 * 12, 3) + " %";
  total_sum.value = round(pmt * t, 2);
  total_interest.value = round(total_sum.value - pv, 2);
}
```

The `z` and `div` variables in this branch are dead code. There is also a source bug:

```js
var r = document.getElementById('interest');
var z = 1 / (1 + r / 12);
```

`r` is an HTML element, not a number. That makes `z`/`div` invalid, but they are never used, so the calculator still works.

Actual rate formula:

```txt
monthlyRate = RATE(totalMonths, PMT, -PV, 0, 0, 0.01)
annualPercent = round(monthlyRate * 100 * 12, 3)
if annualPercent > 250:
  interest = "N/A"
else:
  interest = annualPercent + " %"
```

Important:

- This is nominal annual interest computed from a monthly rate.
- It is not APR with fees.
- The displayed value includes a space before `%`, for example `"4.999 %"`.
- The function calls `RATE(...)` twice in the non-N/A branch. New code can compute once if the output is identical.
- A commented-out source line would have displayed `"< 0"` for negative rates, but it is disabled. Negative rates can therefore display as negative percent strings.

## 12. Source RATE Function

Source line range: `loanCalc.js` lines 19-58.

The source uses a secant-method solver:

```js
function RATE(nper, pmt, pv, fv, type, guess) {
  var FINANCIAL_ACCURACY = 1.0e-9;
  var FINANCIAL_MAX_ITERATIONS = 100;
  var rate = guess;
  var i = 0;
  var x0 = 0;
  var x1 = rate;
  var y, y0, y1, x0, x1, f;

  if (Math.abs(rate) < FINANCIAL_ACCURACY) {
    y = pv * (1 + nper * rate) + pmt * (1 + rate * type) * nper + fv;
  } else {
    f = Math.exp(nper * Math.log(1 + rate));
    y = pv * f + pmt * (1 / rate + type) * (f - 1) + fv;
  }

  y0 = pv + pmt * nper + fv;
  y1 = pv * f + pmt * (1 / rate + type) * (f - 1) + fv;

  while ((Math.abs(y0 - y1) > FINANCIAL_ACCURACY) && (i < FINANCIAL_MAX_ITERATIONS)) {
    rate = (y1 * x0 - y0 * x1) / (y1 - y0);
    x0 = x1;
    x1 = rate;

    if (Math.abs(rate) < FINANCIAL_ACCURACY) {
      y = pv * (1 + nper * rate) + pmt * (1 + rate * type) * nper + fv;
    } else {
      f = Math.exp(nper * Math.log(1 + rate));
      y = pv * f + pmt * (1 / rate + type) * (f - 1) + fv;
    }

    y0 = y1;
    y1 = y;
    i++;
  }
  return rate;
}
```

Implementation notes:

- Preserve the same accuracy: `1.0e-9`.
- Preserve maximum iterations: `100`.
- Preserve starting guess: `0.01`.
- Preserve sign convention: pass `pv` as negative principal: `RATE(t, pmt, -pv, 0, 0, 0.01)`.
- Preserve annualization: `monthlyRate * 100 * 12`.

Do not replace this with a different library function unless tests prove exact output parity. Even small differences can change the 3-decimal interest output.

## 13. Solve Mode F4: Find Loan Period

Source branch:

```js
else if (document.getElementById('F4').checked) {
  var pmt = getFieldFloatValue('PMT');
  var pv = getFieldFloatValue('PV');
  var r = getFieldFloatValue('interest') / 100;
  var t = document.getElementById('period');
  var z = 1 / (1 + r / 12);
  var div = 1 - Math.pow(z, t);

  t.value = round(Math.log(1 - (((1 - z) * pv) / (z * pmt))) / (n * Math.log(z)), 3);
  total_sum.value = round(pmt * t.value * n, 2);
  total_interest.value = round(total_sum.value - pv, 2);
}
```

Formula:

```txt
period = ln(1 - (((1 - z) * PV) / (z * PMT))) / (n * ln(z))
total_sum = PMT * roundedPeriod * n
total_interest = total_sum - PV
```

Important:

- `period` is rounded to 3 decimals.
- `total_sum` uses the rounded period string, not the unrounded raw value.
- In years mode, the formula divides by `12 * ln(z)`, so output is years.
- In months mode, the formula divides by `1 * ln(z)`, so output is months.

Source quirks:

- `div` is calculated but never used.
- If payment is too small to amortize the loan, the log argument becomes invalid and output is `"NaN"`.
- If interest is 0, `ln(z) = ln(1) = 0`, so output becomes `NaN`/invalid.

## 14. Chart Behavior

Source chart:

```js
var A = getFieldFloatValue("PV");
var B = getFieldFloatValue("total_interest");

data.addRows([
  ['Loan Amount', A],
  ['Interest', B]
]);
```

Chart options:

```txt
type: Google Visualization PieChart
width: 320
height: 100%
colors: #1aaef8, #fdbe6f
backgroundColor: #f7f7f7
is3D: true
legend: right
```

MVP should not reproduce the 3D Google pie chart. Use a native, accessible horizontal split bar or compact donut. Calculation parity matters, not visual chart parity.

## 15. Exact Source Quirks Claude Must Preserve In Tests

Preserve in pure calculation tests:

- monthly payments are always monthly, even when period is entered as years
- years mode only changes `period * 12`
- `PMT` is rounded before total repayment is computed in F2
- `period` is rounded before total repayment is computed in F4
- source rounding returns strings with fixed decimals
- zero interest produces `NaN` in F1/F2/F4 instead of using simple zero-interest formulas
- empty inputs produce `NaN`
- spaces inside numbers are not normalized
- only the first comma is replaced with a decimal point
- annual interest output is a string with a trailing space before `%`
- interest over 250 displays `"N/A"` but total repayment/interest still calculate
- negative interest results are not suppressed because the `< 0` branch is commented out

Product UX may validate and explain these cases, but do not lose source-parity test coverage.

## 16. Recommended Internal API

Suggested pure calculation shape:

```ts
export type LoanSolveMode =
  | "loanAmount"
  | "monthlyPayment"
  | "annualInterest"
  | "period";

export type LoanPeriodUnit = "years" | "months";

export interface LoanInput {
  solveMode: LoanSolveMode;
  periodUnit: LoanPeriodUnit;
  principal?: number | string;
  monthlyPayment?: number | string;
  annualInterestPercent?: number | string;
  period?: number | string;
}

export interface LoanResult {
  solveMode: LoanSolveMode;
  periodUnit: LoanPeriodUnit;
  principal?: string;
  monthlyPayment?: string;
  annualInterestPercent?: string;
  period?: string;
  totalInterest: string;
  totalRepayment: string;
}
```

Recommended file layout:

```txt
src/calculators/loan/calculate.ts
src/calculators/loan/types.ts
src/calculators/loan/fixtures.ts
src/calculators/loan/calculate.test.ts
src/components/calculators/loan/LoanCalculator.tsx
src/app/laenukalkulaator/page.tsx
```

Follow the existing project rule: no calculation logic inside UI components.

## 17. Golden Fixtures

These fixtures were generated from the exact source formulas in `loanCalc.js`.

### Fixture A - Default F2, Years, Find Monthly Payment

Input:

```json
{
  "solveMode": "monthlyPayment",
  "periodUnit": "years",
  "PV": 10000,
  "interest": 5,
  "period": 5
}
```

Expected:

```json
{
  "PMT": "188.71",
  "total_interest": "1322.60",
  "total_sum": "11322.60"
}
```

### Fixture B - F1, Years, Find Loan Amount

Input:

```json
{
  "solveMode": "loanAmount",
  "periodUnit": "years",
  "PMT": 200,
  "interest": 5,
  "period": 5
}
```

Expected:

```json
{
  "PV": "10598.14",
  "total_interest": "1401.86",
  "total_sum": "12000.00"
}
```

### Fixture C - F3, Years, Find Annual Interest

Input:

```json
{
  "solveMode": "annualInterest",
  "periodUnit": "years",
  "PV": 10000,
  "PMT": 188.71,
  "period": 5
}
```

Expected:

```json
{
  "interest": "4.999 %",
  "total_interest": "1322.60",
  "total_sum": "11322.60"
}
```

Note: This is `4.999 %`, not `5.000 %`, because the input PMT is already rounded to cents.

### Fixture D - F4, Years, Find Period

Input:

```json
{
  "solveMode": "period",
  "periodUnit": "years",
  "PV": 10000,
  "PMT": 188.71,
  "interest": 5
}
```

Expected:

```json
{
  "period": "5.000",
  "total_interest": "1322.60",
  "total_sum": "11322.60"
}
```

### Fixture E - F2, Months, Same Loan As Fixture A

Input:

```json
{
  "solveMode": "monthlyPayment",
  "periodUnit": "months",
  "PV": 10000,
  "interest": 5,
  "period": 60
}
```

Expected:

```json
{
  "PMT": "188.71",
  "total_interest": "1322.60",
  "total_sum": "11322.60"
}
```

### Fixture F - F1, Months

Input:

```json
{
  "solveMode": "loanAmount",
  "periodUnit": "months",
  "PMT": 200,
  "interest": 5,
  "period": 60
}
```

Expected:

```json
{
  "PV": "10598.14",
  "total_interest": "1401.86",
  "total_sum": "12000.00"
}
```

### Fixture G - F3, High Interest Becomes N/A

Input:

```json
{
  "solveMode": "annualInterest",
  "periodUnit": "months",
  "PV": 1000,
  "PMT": 500,
  "period": 3
}
```

Expected:

```json
{
  "interest": "N/A",
  "total_interest": "500.00",
  "total_sum": "1500.00"
}
```

Raw calculated annual interest before N/A threshold:

```txt
280.502
```

### Fixture H - Decimal Comma Equivalent, F2

This fixture validates comma parsing. Source parses `"5,5"` as `5.5`.

Input:

```json
{
  "solveMode": "monthlyPayment",
  "periodUnit": "years",
  "PV": 10000,
  "interest": "5,5",
  "period": 5
}
```

Expected:

```json
{
  "PMT": "191.01",
  "total_interest": "1460.60",
  "total_sum": "11460.60"
}
```

### Fixture I - Long Mortgage-Like Loan

Input:

```json
{
  "solveMode": "monthlyPayment",
  "periodUnit": "years",
  "PV": 150000,
  "interest": 4.2,
  "period": 30
}
```

Expected:

```json
{
  "PMT": "733.53",
  "total_interest": "114070.80",
  "total_sum": "264070.80"
}
```

### Fixture J - F3, Short Consumer Loan

Input:

```json
{
  "solveMode": "annualInterest",
  "periodUnit": "months",
  "PV": 500,
  "PMT": 100,
  "period": 6
}
```

Expected:

```json
{
  "interest": "65.662 %",
  "total_interest": "100.00",
  "total_sum": "600.00"
}
```

### Fixture K - F4, Months, Find Period

Input:

```json
{
  "solveMode": "period",
  "periodUnit": "months",
  "PV": 1000,
  "PMT": 100,
  "interest": 12
}
```

Expected:

```json
{
  "period": "10.589",
  "total_interest": "58.90",
  "total_sum": "1058.90"
}
```

### Fixture L - F4, Payment Too Small

Input:

```json
{
  "solveMode": "period",
  "periodUnit": "years",
  "PV": 10000,
  "PMT": 10,
  "interest": 5
}
```

Expected source-parity output:

```json
{
  "period": "NaN",
  "total_interest": "NaN",
  "total_sum": "NaN"
}
```

Product UI should not show raw `NaN` to users. The pure source-parity function should still cover it.

### Fixture M - F2, Zero Interest Source Quirk

Input:

```json
{
  "solveMode": "monthlyPayment",
  "periodUnit": "years",
  "PV": 10000,
  "interest": 0,
  "period": 5
}
```

Expected source-parity output:

```json
{
  "PMT": "NaN",
  "total_interest": "NaN",
  "total_sum": "NaN"
}
```

Product UI can add a non-parity user-friendly zero-interest calculation later, but do not mix that into the source-parity calculation.

## 18. Test Requirements

Minimum tests:

- one test for every fixture A-M
- parser tests:
  - `"5,5"` -> `5.5`
  - `"1 000"` -> `1`
  - `"1000EUR"` -> `1000`
  - `""` -> `NaN`
- round tests:
  - `round(188.705, 2)` behavior must match `Math.round`
  - fixed decimal padding: `round(12000, 2)` -> `"12000.00"`
- F2 total uses rounded PMT, not raw PMT
- F4 total uses rounded period, not raw period
- F3 high-interest threshold returns `"N/A"`
- F3 normal output includes space before `%`

Suggested Vitest style:

```ts
expect(result.monthlyPayment).toBe("188.71");
expect(result.totalInterest).toBe("1322.60");
expect(result.totalRepayment).toBe("11322.60");
```

## 19. Implementation Instructions For Claude

1. Read the current project `STACK.md`.
2. Follow existing calculator architecture and naming conventions.
3. Add pure calculator logic under `src/calculators/loan/`.
4. Keep calculation logic out of React components.
5. Implement source-parity helpers:
   - parse field value like source
   - round like source
   - RATE like source
6. Add golden fixtures A-M.
7. Add a route:

```txt
/laenukalkulaator
```

8. Add a calculator card/link to the homepage aggregator.
9. Use the existing design system, not the old reference styling.
10. For UI validation:
    - users should see clear validation messages instead of `NaN`
    - tests should still call the pure source-parity logic and assert `NaN` strings where the source would produce them
11. Run the full test suite.
12. Deploy after tests pass and verify with browser, not curl alone.

## 20. Claude Build Prompt

Use this prompt when handing the task to Claude:

```txt
We are continuing the kalkulaator.ee alternative project at C:\Users\Kasutaja\Claude_Projects\kalkulaator.

Task: build the Loan Calculator / Laenukalkulaator as the next calculator in the aggregator.

Read first:
C:\Users\Kasutaja\Claude_Projects\kalkulaator\STACK.md
C:\Users\Kasutaja\Claude_Projects\kalkulaator\docs\handoffs\2026-05-12-loan-calculator-source-handoff.md

Requirements:
- Implement exact source-parity calculation logic from kalkulaator.ee loanCalc.js.
- Add pure logic under src/calculators/loan/.
- Add tests and golden fixtures A-M from the handoff.
- Preserve source quirks in the pure calculation layer: source rounding strings, comma parsing, zero-interest NaN behavior, F2 totals from rounded PMT, F4 totals from rounded period, F3 RATE solver, N/A threshold over 250, and the space before %.
- Build a modern UI route at /laenukalkulaator using the existing design system.
- Add the calculator to the homepage aggregator/navigation.
- Keep calculation logic out of UI components.
- Run the existing project test suite and add/verify loan tests.
- Deploy only after tests pass, then verify in browser.

Do not invent bank-specific logic, APR fees, EURIBOR, or external APIs. MVP is pure client-side parity plus modern UX.
```

