# VAT Calculator Source Handoff

Prepared for: Claude Code / implementation agent  
Prepared by: Codex  
Verification date: 2026-05-12 Europe/Tallinn  
Reference page: https://www.kalkulaator.ee/et/kaibemaksukalkulaator  
Reference script: https://www.kalkulaator.ee/js/vatCalc.js

## 1. Decision

Build the VAT / käibemaks calculator third.

Reason: after Automaks and Salary, VAT is the fastest useful utility to add. It is broad-use, simple enough to ship quickly, and appears in the reference site's TOP 5 list. It gives the aggregator another everyday calculator while keeping the same source-parity workflow.

Current rollout order:

1. Automaks calculator - built
2. Salary calculator - source handoff ready
3. VAT calculator - this handoff
4. Loan calculator
5. Aggregator homepage/navigation once enough calculators exist

## 2. Source Verification

Live source was fetched on 2026-05-12.

| File | Live URL | Local snapshot | SHA-256 |
| --- | --- | --- | --- |
| vatCalc.js | https://www.kalkulaator.ee/js/vatCalc.js | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12-vat\vatCalc.js | 85E7935CFEAB4AAF80932F9565DA3D26D802003E3958FE6A61F42F5C390C073E |
| vat.html | https://www.kalkulaator.ee/et/kaibemaksukalkulaator | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12-vat\vat.html | fetched 2026-05-12 |

The live page was opened in the in-app browser. Browser title:

```txt
Käibemaksukalkulaator
```

The live DOM showed:

- VAT rates: 9%, 13%, 22%, 24%
- input modes:
  - Hind käibemaksuta
  - Käibemaks
  - Hind käibemaksuga
- sidebar TOP 5 includes "5. Käibemaks"

## 3. MVP Scope

Build a standalone VAT calculator with exact parity to the reference script.

MVP must include:

- VAT rate selector:
  - 9%
  - 13%
  - 22%
  - 24%
- calculation mode selector:
  - net price known
  - VAT amount known
  - gross price known
- input field for the selected mode
- output fields:
  - net price / price without VAT
  - VAT amount
  - gross price / price with VAT
- optional coefficient display:
  - VAT-from-gross coefficient
  - VAT-from-net coefficient
- parsing for comma decimals and spaces
- golden tests for every rate and mode

Do not implement country-specific VAT tables in this MVP. The source page has a country dropdown, but `vatCalc.js` does not use it for calculation.

## 4. Recommended Product Improvements

The reference page is very old and table-like. The new calculator should feel like a clean business utility.

Recommended UX:

- segmented control for VAT rate
- segmented control for "I know net / VAT / gross"
- single prominent input field that changes label according to mode
- three-result summary:
  - without VAT
  - VAT
  - with VAT
- mini formula explanation under the result
- quick chips:
  - 100
  - 1000
  - 10 000
- copy/share result later, not mandatory for MVP
- no unnecessary country dropdown in MVP

Useful Estonian labels:

```txt
Käibemaksuta hind
Käibemaks
Käibemaksuga hind
Käibemaksumäär
```

## 5. Source UI Inputs

Source form:

```html
<form method="POST" id="vatcalculator">
```

### Country Select

Source HTML includes:

```txt
Country select, name="Country"
onChange="javascript:clear.click()"
```

The country dropdown starts at line 166 in the fetched HTML and contains many countries. It is not used by `vatCalc.js`. Changing it only triggers the clear/reset button through the old global `clear` name.

Implementation decision:

- omit country select from MVP
- optionally mention later that EU VAT lookup could become a future separate feature

### VAT Rate Radios

HTML:

```txt
VAT_9  value 9   label 9%
VAT_13 value 13  label 13% (01.01.2025 - ...)
VAT_22 value 22  label 22% (... - 30.06.2025)
VAT_24 value 24  label 24% (01.07.2025 - ...)
```

Important source quirk:

All four VAT radio inputs are marked `CHECKED` in the raw HTML.

```html
<input ... id="VAT_9" value="9" CHECKED>
<input ... id="VAT_13" value="13" CHECKED>
<input ... id="VAT_22" value="22" CHECKED>
<input ... id="VAT_24" value="24" CHECKED>
```

Because these are a single radio group, browsers resolve the checked state to one active radio. In modern browser behavior the last checked radio wins, so the practical default is 24%.

Implementation recommendation:

- explicitly default to 24%
- do not copy the invalid "all checked" HTML

### Calculation Mode Radios

HTML:

```txt
F1 value 1 -> Hind käibemaksuta / net price known, default checked
F2 value 2 -> Käibemaks / VAT amount known
F3 value 3 -> Hind käibemaksuga / gross price known
```

Internal type:

```ts
type VatInputMode = "net" | "vat" | "gross";
```

### Text Inputs

```txt
NetPrice -> net price / price without VAT
VATsum -> VAT amount
Price -> gross price / price with VAT
VATpct1 -> hidden/disabled coefficient field for gross-to-VAT multiplier
VATpct2 -> hidden/disabled coefficient field for net-to-VAT multiplier
```

HTML `maxlength`:

```txt
NetPrice maxlength 9
VATsum maxlength 9
Price maxlength 9
```

Do not enforce this old maxlength as a product rule unless desired. Use sane numeric validation instead.

## 6. Recommended Input Model

```ts
type VatRate = 0.09 | 0.13 | 0.22 | 0.24;

type VatCalculatorInput = {
  rate: VatRate;
  mode: "net" | "vat" | "gross";
  amount: number;
};
```

## 7. Recommended Output Model

```ts
type VatCalculatorResult = {
  netPrice: number;
  vatAmount: number;
  grossPrice: number;
  coefficients: {
    vatFromGross: number;
    vatFromNet: number;
  };
  derived: {
    rate: number;
    mode: "net" | "vat" | "gross";
  };
  warnings: string[];
};
```

Display format:

```txt
money -> two decimals
coefficients -> six decimals
```

## 8. Source Calculation Logic

Source function:

```js
function vatCalc() {
  if (F1.checked) { ... }
  else if (F2.checked) { ... }
  else if (F3.checked) { ... }
}
```

VAT rate:

```js
VATrate = getCheckedValue(document.forms['vatcalculator'].elements['VAT']) / 100
```

### Mode F1: Net Price Known

Source:

```js
Price.value = round(NetPrice * (1 + VATrate), 2);
VATsum.value = round(NetPrice * VATrate, 2);
VATpct1.value = "× " + round(VATrate / (1 + VATrate), 6);
VATpct2.value = "× " + round(VATrate, 6);
```

Formula:

```txt
grossPrice = netPrice * (1 + rate)
vatAmount = netPrice * rate
vatFromGrossCoefficient = rate / (1 + rate)
vatFromNetCoefficient = rate
```

### Mode F2: VAT Amount Known

Source:

```js
Price.value = round(VATsum * (1 + VATrate) / VATrate, 2);
NetPrice.value = round(VATsum / VATrate, 2);
VATpct1.value = "× " + round(VATrate / (1 + VATrate), 6);
VATpct2.value = "× " + round(VATrate, 6);
```

Formula:

```txt
grossPrice = vatAmount * (1 + rate) / rate
netPrice = vatAmount / rate
vatFromGrossCoefficient = rate / (1 + rate)
vatFromNetCoefficient = rate
```

### Mode F3: Gross Price Known

Source:

```js
NetPrice.value = round(Price / (1 + VATrate), 2);
VATsum.value = round(Price * VATrate / (1 + VATrate), 2);
VATpct1.value = "× " + round(VATrate / (1 + VATrate), 6);
VATpct2.value = "× " + round(VATrate, 6);
```

Formula:

```txt
netPrice = grossPrice / (1 + rate)
vatAmount = grossPrice * rate / (1 + rate)
vatFromGrossCoefficient = rate / (1 + rate)
vatFromNetCoefficient = rate
```

## 9. Parsing and Rounding

Source parsing:

```js
parseFloat(document.getElementById(fieldId).value.replace(",", ".").replace(/\s/g, ""))
```

Implications:

- comma decimals are accepted
- spaces are removed
- `"1 000,50"` becomes `1000.50`
- invalid input becomes `NaN`

Source rounding:

```js
function round(n, dec) {
  X = n * Math.pow(10, dec);
  X = Math.round(X);
  return (X / Math.pow(10, dec)).toFixed(dec);
}
```

Implications:

- money values are strings with two decimals
- coefficient values are strings with six decimals
- the source uses undeclared global `X`
- implementation should use local numeric helpers and format at display boundary

Recommended helpers:

```ts
parseLocalizedNumber(input: string): number
roundMoney(value: number): number
roundCoefficient(value: number): number
formatMoney(value: number): string
```

## 10. Disable Function Quirk

Source:

```js
function disable() {
  controlPairs['F1'] = 'NetPrice';
  controlPairs['F2'] = 'VATsum';
  controlPairs['F3'] = 'Price';

  ...

  if (toggle.checked) field.disabled = false;
  // else field.disabled = true;
  field.className = toggle.checked ? enabledClass : disabledClass;
}
```

Important:

- the code that disables non-selected fields is commented out
- mode selection mostly changes CSS class, not actual input availability
- calculation still depends on which mode radio is selected

Implementation recommendation:

- in the new UI, show one active input and computed read-only results
- do not copy the old "all fields technically editable" behavior
- tests should focus on calculation mode, not disabled-state parity

## 11. Chart Behavior

Source chart:

```js
var A = getFieldFloatValue("NetPrice");
var B = getFieldFloatValue("VATsum");

data.addRows([
  ['Price', A],
  ['VAT', B]
]);
```

Important:

- chart "Price" slice is actually net price, not gross price
- chart uses Google Visualization
- if inputs are empty, chart can show NaN

MVP recommendation:

- skip chart or render a small native breakdown bar
- label it correctly as "Net price" and "VAT"
- do not import Google Visualization

## 12. Source Quirks and Implementation Warnings

1. Raw HTML marks all VAT rate radios as `CHECKED`; implement explicit 24% default.
2. Country dropdown is not used in calculation.
3. `disable()` does not disable non-selected inputs; implement cleaner UX.
4. Source uses global variables without `var` for `Price`, `VATsum`, `NetPrice`, `VATpct1`, `VATpct2`, and `X`.
5. Source returns fixed-decimal strings from `round`; implementation should use numbers internally.
6. Chart "Price" means net price.
7. Empty inputs produce NaN behavior in the old chart; new UX should validate input.
8. The 13%, 22%, and 24% labels include validity dates. Preserve these labels.
9. VAT rate changes trigger calculation immediately in source.
10. Reset button clears text fields only; it does not reset rates or mode.

## 13. Golden Fixtures

All outputs below follow the exact source formulas and rounding.

### Fixture A: Default Rate, Net 100

Default rate should be treated as 24%.

Input:

```json
{
  "rate": 0.24,
  "mode": "net",
  "amount": 100
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 24.00,
  "grossPrice": 124.00,
  "coefficients": {
    "vatFromGross": 0.193548,
    "vatFromNet": 0.240000
  }
}
```

### Fixture B: 24%, Net 100

Input:

```json
{
  "rate": 0.24,
  "mode": "net",
  "amount": 100
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 24.00,
  "grossPrice": 124.00,
  "coefficients": {
    "vatFromGross": 0.193548,
    "vatFromNet": 0.240000
  }
}
```

### Fixture C: 22%, Net 100

Input:

```json
{
  "rate": 0.22,
  "mode": "net",
  "amount": 100
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 22.00,
  "grossPrice": 122.00,
  "coefficients": {
    "vatFromGross": 0.180328,
    "vatFromNet": 0.220000
  }
}
```

### Fixture D: 13%, Net 100

Input:

```json
{
  "rate": 0.13,
  "mode": "net",
  "amount": 100
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 13.00,
  "grossPrice": 113.00,
  "coefficients": {
    "vatFromGross": 0.115044,
    "vatFromNet": 0.130000
  }
}
```

### Fixture E: 9%, Net 100

Input:

```json
{
  "rate": 0.09,
  "mode": "net",
  "amount": 100
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 9.00,
  "grossPrice": 109.00,
  "coefficients": {
    "vatFromGross": 0.082569,
    "vatFromNet": 0.090000
  }
}
```

### Fixture F: 24%, VAT Amount 24

Input:

```json
{
  "rate": 0.24,
  "mode": "vat",
  "amount": 24
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 24.00,
  "grossPrice": 124.00,
  "coefficients": {
    "vatFromGross": 0.193548,
    "vatFromNet": 0.240000
  }
}
```

### Fixture G: 24%, Gross 124

Input:

```json
{
  "rate": 0.24,
  "mode": "gross",
  "amount": 124
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 24.00,
  "grossPrice": 124.00,
  "coefficients": {
    "vatFromGross": 0.193548,
    "vatFromNet": 0.240000
  }
}
```

### Fixture H: 24%, Gross 100

Input:

```json
{
  "rate": 0.24,
  "mode": "gross",
  "amount": 100
}
```

Expected:

```json
{
  "netPrice": 80.65,
  "vatAmount": 19.35,
  "grossPrice": 100.00,
  "coefficients": {
    "vatFromGross": 0.193548,
    "vatFromNet": 0.240000
  }
}
```

### Fixture I: 24%, Net "1 000,50"

Input string:

```json
{
  "rate": 0.24,
  "mode": "net",
  "amountString": "1 000,50"
}
```

Parsed amount:

```json
{
  "amount": 1000.50
}
```

Expected:

```json
{
  "netPrice": 1000.50,
  "vatAmount": 240.12,
  "grossPrice": 1240.62,
  "coefficients": {
    "vatFromGross": 0.193548,
    "vatFromNet": 0.240000
  }
}
```

### Fixture J: 13%, VAT Amount 13

Input:

```json
{
  "rate": 0.13,
  "mode": "vat",
  "amount": 13
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 13.00,
  "grossPrice": 113.00,
  "coefficients": {
    "vatFromGross": 0.115044,
    "vatFromNet": 0.130000
  }
}
```

### Fixture K: 22%, Gross 122

Input:

```json
{
  "rate": 0.22,
  "mode": "gross",
  "amount": 122
}
```

Expected:

```json
{
  "netPrice": 100.00,
  "vatAmount": 22.00,
  "grossPrice": 122.00,
  "coefficients": {
    "vatFromGross": 0.180328,
    "vatFromNet": 0.220000
  }
}
```

## 14. Implementation File Structure

Follow the Automaks and Salary module style.

Recommended files:

```txt
src/calculators/vat/types.ts
src/calculators/vat/constants.ts
src/calculators/vat/calculate.ts
src/calculators/vat/calculate.test.ts
src/calculators/vat/format.ts
src/components/calculators/vat/VatCalculator.tsx
src/app/kaibemaksukalkulaator/page.tsx
```

For Estonian SEO, prefer:

```txt
/kaibemaksukalkulaator
```

Optionally add an alias later:

```txt
/vat
```

## 15. Test Requirements

Minimum tests:

- parse comma decimal
- parse spaces
- invalid input handling
- rate constants
- default rate is 24%
- net-known mode for 9%, 13%, 22%, 24%
- VAT-known mode
- gross-known mode
- coefficient calculation
- two-decimal money rounding
- six-decimal coefficient rounding
- fixtures A-K

Tests should compare numeric rounded values, not formatted strings, except when testing formatting directly.

## 16. Claude Build Instructions

When implementing:

1. Read this handoff fully before coding.
2. Start with pure calculation module and tests.
3. Do not implement country dropdown in MVP.
4. Default VAT rate to 24%.
5. Preserve source formulas exactly.
6. Use fixtures A-K as golden tests.
7. Keep logic out of React components.
8. Build UI only after tests pass.
9. Use existing project design language from Automaks.
10. Run `npm test`, `npm run lint`, and `npm run build`.
11. Verify in browser after implementation.

## 17. Open Product Choices

Not blockers:

- whether to show coefficient fields in the main UI or details panel
- whether to include chart/breakdown bar
- whether to include a future country-specific VAT lookup
- whether to add quick copy/share controls

Default recommendation:

- show coefficients in a small "Calculation details" disclosure
- skip country dropdown
- skip Google chart
- ship a clean, fast utility with exact math

