# Salary Calculator Source Handoff

Prepared for: Claude Code / implementation agent  
Prepared by: Codex  
Verification date: 2026-05-12 Europe/Tallinn  
Reference page: https://www.kalkulaator.ee/et/palgakalkulaator  
Reference script: https://www.kalkulaator.ee/js/wageCalc.js

## 1. Decision

Build the salary / payroll tax calculator second, after Automaks.

Reason: it is the highest-value evergreen calculator on the reference site after Automaks. It has strong SEO demand, high trust requirements, and enough calculation complexity that exact parity matters. This should become the second pillar calculator in the aggregator.

Recommended rollout order:

1. Automaks calculator - already built
2. Salary calculator - this handoff
3. VAT calculator
4. Loan calculator
5. Aggregator homepage/navigation once 3-4 calculators exist

## 2. Source Verification

Live source was fetched again on 2026-05-12.

| File | Live URL | Local snapshot | SHA-256 |
| --- | --- | --- | --- |
| wageCalc.js | https://www.kalkulaator.ee/js/wageCalc.js | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12\wageCalc.js | 0AD0167DBEBCA97C41DFAFAEC3A381BDD2A99D78A74C1CE47A068EE525ACD1E4 |
| salary.html | https://www.kalkulaator.ee/et/palgakalkulaator | C:\Users\Kasutaja\AppData\Local\Temp\kalkulaator-source-2026-05-12\salary.html | fetched 2026-05-12 |

The live `wageCalc.js` file was downloaded and hash-compared against the local source snapshot. The hash matched.

The live page was also opened in the in-app browser and exercised directly. The browser title was:

```txt
Palga ja maksude kalkulaator 2026 - Palgakalkulaator 2026 - Tootasu kalkulaator 2026
```

Live browser fixtures were collected from the actual visible page DOM after interacting with the form.

## 3. MVP Scope

Build a standalone salary calculator that matches the reference calculation logic for 2022-2026.

MVP must include:

- input year: 2022, 2023, 2024, 2025, 2026
- input mode: employer cost, gross wage, net wage
- period: hourly, monthly, annual
- work hours per month when hourly
- tax-free income toggle
- automatic tax-free income calculation
- manual tax-free income field
- annual revenue override mode for 2022-2025
- pension-age / retired checkbox for 2025-2026 tax-free amount
- minimum social tax toggle
- employer unemployment insurance toggle
- employee unemployment insurance toggle
- funded pension toggle
- funded pension contribution selector 2%, 4%, 6% for 2025+
- result breakdown:
  - employer total cost / wage fund
  - social tax
  - employer unemployment insurance
  - gross wage
  - funded pension employee contribution
  - employee unemployment insurance
  - income tax
  - net wage
- percent view based on employer cost, gross wage, or net wage
- chart breakdown values:
  - state taxes
  - local government tax share
  - net wage
  - pension fund total

Do not integrate external payroll APIs in MVP. Calculation is pure client-side.

## 4. Recommended Product Improvements

The reference UI is old and hard to reason through. The new version should improve UX while preserving calculation parity.

Recommended UX:

- start with one compact form, not a table
- make "I know gross / net / employer cost" a segmented control
- make hourly/monthly/annual a segmented control
- show "what changed" explanation when year changes
- show exact applied tax-free amount
- show annualized income used for tax-free calculation
- explain employer cost vs gross vs net in short inline help
- expose advanced controls in a collapsible section:
  - social tax minimum
  - manual tax-free income
  - annual revenue override
  - unemployment insurance toggles
  - pension contribution
- show a "parity mode" note in code comments/tests, not in product UI

Avoid:

- no login
- no database
- no saved payroll profiles
- no tax advice wording
- no automatic legal correction that breaks parity unless explicitly separated from source-parity mode

## 5. Source UI Inputs

Use these exact source IDs as the source mapping. The implementation can use cleaner enum names internally.

### Year

HTML radios:

```txt
year2022 -> 2022
year2023 -> 2023
year2024 -> 2024
year2025 -> 2025
year2026 -> 2026, default checked
```

Internal type:

```ts
type SalaryYear = 2022 | 2023 | 2024 | 2025 | 2026;
```

### Input Mode

HTML radios:

```txt
input_1 -> employer cost / palgafond
input_2 -> gross wage / brutopalk, default checked
input_3 -> net wage / netopalk
```

Internal type:

```ts
type SalaryInputMode = "employerCost" | "gross" | "net";
```

### Amount

HTML input:

```txt
eur
```

This is the user-entered amount. Its meaning depends on input mode and period.

### Period

HTML select:

```txt
period value 1 -> hourly
period value 2 -> monthly, default
period value 3 -> annual
```

When hourly is selected, `workhours` appears and `amount * workhours` becomes the calculation base.

HTML input:

```txt
workhours, default 160
```

### Tax-Free Income Controls

Main toggle:

```txt
taxfree_x, default checked
```

Tax-free mode radio:

```txt
F1 -> manual/current tax-free amount mode, default checked
F2 -> annual revenue mode
```

Manual tax-free amount:

```txt
taxfree_sum
```

Tax-free amount period:

```txt
taxfree_period value 1 -> monthly, default
taxfree_period value 12 -> annual
```

Annual revenue override:

```txt
annual_revenue
```

Important UI visibility:

- `taxfree_row` is visible only when `taxfree_x` is checked.
- `taxfree_heading`, `taxfree_period_row`, and `revenue_row` are visible only when `taxfree_x` is checked and year <= 2025.
- These advanced tax-free rows are hidden for 2026 because the source treats 2026 tax-free income as flat.

### Retired / Pension-Age Checkbox

HTML checkbox:

```txt
isRetired
```

Visible only for year >= 2025.

Important parity warning:

In the source, this checkbox only affects tax-free income. It does not automatically disable employee unemployment insurance. The help text implies pension-age treatment for unemployment insurance, but the code does not enforce it.

### Deduction Toggles

HTML checkboxes:

```txt
socialtax_x -> apply minimum social tax, default unchecked
ui1_x -> employer unemployment insurance, default checked
ui2_x -> employee unemployment insurance, default checked
pension_x -> funded pension / II pillar, default checked
```

### Funded Pension Contribution Selector

HTML select:

```txt
contribution_rate_2025
0.02 -> 2%, default
0.04 -> 4%
0.06 -> 6%
```

Visible only for year >= 2025.

For years before 2025, the source ignores the selector and uses 2% when `pension_x` is checked.

### Percent Base Radios

These affect only the percent columns, not the EUR results.

```txt
pct1 -> percentages based on employer cost / wage fund, default checked
pct2 -> percentages based on gross wage
pct3 -> percentages based on net wage
```

## 6. Recommended Input Model

```ts
type SalaryCalculatorInput = {
  year: 2022 | 2023 | 2024 | 2025 | 2026;
  inputMode: "employerCost" | "gross" | "net";
  amount: number;
  period: "hourly" | "monthly" | "annual";
  workHoursPerMonth?: number;

  taxFreeEnabled: boolean;
  taxFreeMode: "calculatedOrManual" | "annualRevenue";
  taxFreeAmount?: number;
  taxFreeAmountPeriod?: "monthly" | "annual";
  annualRevenue?: number;
  retired: boolean;

  applyMinimumSocialTax: boolean;
  includeEmployerUnemployment: boolean;
  includeEmployeeUnemployment: boolean;
  includeFundedPension: boolean;
  fundedPensionRate?: 0.02 | 0.04 | 0.06;

  percentBase?: "employerCost" | "gross" | "net";
};
```

## 7. Recommended Output Model

```ts
type SalaryCalculatorResult = {
  employerCost: number;
  socialTax: number;
  employerUnemployment: number;
  gross: number;
  fundedPensionEmployee: number;
  employeeUnemployment: number;
  incomeTax: number;
  net: number;

  taxFreeApplied: number;
  annualRevenueUsed: number | null;

  chart: {
    stateTaxes: number;
    localGovernmentTaxes: number;
    netWage: number;
    pensionFund: number;
  };

  percentages: {
    employerCost: number;
    socialTax: number;
    employerUnemployment: number;
    gross: number;
    fundedPensionEmployee: number;
    employeeUnemployment: number;
    incomeTax: number;
    net: number;
  };

  derived: {
    calculationBaseAmount: number;
    periodMultiplier: 1 | 12;
    taxFreeAnnualLimit: number;
    incomeTaxRate: number;
    employeePensionRate: number;
    socialTaxFundedPensionRate: number;
    employerUnemploymentRate: number;
    employeeUnemploymentRate: number;
    minimumSocialTaxAmount: number;
  };

  warnings: string[];
};
```

If exact source parity is required for impossible low employer-cost cases, allow `NaN`-style invalid results. For product UX, prefer a validation error while keeping a parity test around the source behavior.

## 8. Constants

### Income Tax Rate

```txt
2022: 0.20
2023: 0.20
2024: 0.20
2025: 0.22
2026: 0.22
```

Source rule:

```js
itr = (year >= 2025) ? 0.22 : 0.20
```

### Social Tax

```txt
social tax rate = 0.33
```

### Minimum Social Tax Amount

These are monthly minimum social tax amounts, not the base wage amounts.

```txt
2022: 192.72
2023: 215.82
2024: 239.25
2025: 270.60
2026: 292.38
```

Implied minimum monthly bases:

```txt
2022: 584.00
2023: 654.00
2024: 725.00
2025: 820.00
2026: 886.00
```

### Unemployment Insurance

```txt
employer unemployment insurance rate = 0.008
employee unemployment insurance rate = 0.016
```

Each can be disabled by its corresponding checkbox.

### Funded Pension

Employee contribution `fp1`:

```txt
if year >= 2025:
  fp1 = selected contribution_rate_2025 when pension_x checked, else 0
else:
  fp1 = 0.02 when pension_x checked, else 0
```

Social-tax-funded pension share `fp2` for chart split:

```txt
fp2 = 0.04 when pension_x checked, else 0
```

Important:

- `fp1` is withheld from gross wage.
- `fp2` is not withheld from gross wage.
- `fp2` is used only in chart/tax split, where part of social tax is reclassified into pension fund.

### Local Government Tax Share

```txt
loc = 0.1129
```

The source comment says this is from 2025, but the implementation applies `0.1129` to all selected years. Preserve this in parity mode.

## 9. Tax-Free Income Basis

Annual tax-free basis:

```txt
retired and year 2025 or 2026: 9312 per year / 776 per month
year 2026: 8400 per year / 700 per month
year 2023, 2024, 2025: 7848 per year / 654 per month
year 2022: 6000 per year / 500 per month
```

2026:

```txt
flat tax-free amount, no sliding reduction
```

Retired in 2025 or 2026:

```txt
flat 9312 annual / 776 monthly
```

2022-2025 non-retired:

```txt
if annual income > 25200:
  tax-free = 0
else if annual income < 14400:
  tax-free = annual base
else:
  tax-free = annual base - annual base * (annual income - 14400) / (25200 - 14400)
```

Source uses fixed thresholds:

```txt
lower threshold = 14400
upper threshold = 25200
range = 10800
```

## 10. Period Handling

The source converts the entered amount into `sum`.

```txt
if period == hourly:
  workhours = entered workhours
  nper = 1
  sum = amount * workhours

if period == monthly:
  workhours = 1
  nper = 1
  sum = amount

if period == annual:
  workhours = 1
  nper = 12
  sum = amount
```

Output period:

- hourly input outputs monthly-equivalent results
- monthly input outputs monthly results
- annual input outputs annual results

Important source quirk:

For annual period in 2026, the tax-free input field can still visibly show `700.00`, but `wageCalc()` multiplies by `nper = 12`, so the applied tax-free amount becomes `8400`. Do not copy the misleading UI behavior. In the new UI, show the applied tax-free amount clearly.

## 11. Calculation Flow

The source entrypoint is:

```js
outputCalc() {
  revenueCalc();
  wageCalc();
}
```

This two-step flow matters.

`revenueCalc()`:

- computes/updates `annual_revenue`
- computes/updates `taxfree_sum`

`wageCalc()`:

- reads the current tax-free fields
- calculates gross, taxes, net, employer cost, chart values, and percentages

Do not implement this as one naive "gross minus taxes" formula. The reverse net and tax-free logic depend on the two-step source flow.

## 12. revenueCalc Logic

Definitions:

```txt
eur = entered amount
workhours = entered workhours if hourly, else 1
nper = 12 if annual period, else 1
sum = eur * workhours
itr = 0.22 for 2025+, else 0.20
uip1 = 0.008 if employer UI enabled, else 0
uip2 = 0.016 if employee UI enabled, else 0
fp1 = employee funded pension rate
taxfree_min = annual tax-free basis
i = taxfree_period value, 1 monthly or 12 annual
```

### Annual Revenue Calculation

Only runs when `taxfree_x` is checked.

Employer cost input:

```txt
if min social tax enabled and sum < socialtax_min:
  annual_revenue = NaN
else if min social tax enabled and sum < (socialtax_min / 0.33) * (1 + 0.33 + uip1):
  annual_revenue = ((sum - socialtax_min) / (1 + uip1)) * 12 / nper
else:
  annual_revenue = (sum / (1 + 0.33 + uip1)) * 12 / nper
```

Gross input:

```txt
annual_revenue = sum * 12 / nper
```

Net input:

The source solves an intermediate `X` to handle sliding tax-free income:

```txt
X =
  (
    (sum * 12 / nper) / (1 - itr)
    - 25200 * (1 - (fp1 + uip2))
  )
  /
  (
    -((25200 - 14400) / taxfree_min) * (1 - (fp1 + uip2))
    - 1
    + 1 / (1 - itr)
  )
```

Then:

```txt
if X < 0:
  n = 0
else if ((sum * (1 - (fp1 + uip2)) * 12 / nper) < taxfree_min) and X > taxfree_min:
  n = sum
else if X > taxfree_min:
  n = taxfree_min * nper / 12
else:
  n = X * nper / 12
```

Then:

```txt
income_tax_rate =
  ((sum * (1 - (fp1 + uip2)) * 12 / nper) - n) <= 0
    ? 0
    : itr

annual_revenue =
  round(
    round((((sum - n) / (1 - income_tax_rate)) + n) / (1 - (fp1 + uip2)), 2)
    * 12 / nper,
    2
  )
```

Implementation note:

The source uses undeclared variable `n`. In the new implementation, make this a local variable like `taxFreeForNetReverse`.

### Tax-Free Amount Calculation in revenueCalc

After `annual_revenue` is set:

```txt
if year == 2026 or (retired and year == 2025):
  taxfree_sum = taxfree_min * i / 12
else if annual_revenue > 25200:
  taxfree_sum = 0
else if annual_revenue * (1 - (fp1 + uip2)) < taxfree_min:
  if input mode is net:
    taxfree_sum = sum * 12 / nper * i / 12
  else if input mode is gross:
    taxfree_sum = sum * (1 - (fp1 + uip2)) * 12 / nper * i / 12
  else if input mode is employer cost:
    if min social tax enabled and sum < threshold:
      taxfree_sum =
        ((sum - socialtax_min) / (1 + uip1))
        * (1 - (fp1 + uip2))
        * 12 / nper
        * i / 12
    else:
      taxfree_sum =
        (sum / (1 + 0.33 + uip1))
        * (1 - (fp1 + uip2))
        * 12 / nper
        * i / 12
else if annual_revenue < 14400:
  taxfree_sum = taxfree_min * i / 12
else:
  taxfree_sum =
    round(taxfree_min - taxfree_min * (annual_revenue - 14400) / (25200 - 14400), 2)
    * i / 12
```

Important:

For 2026, the source ignores sliding annual income and uses the flat amount.

For retired 2026, the first condition `year == 2026` already applies, and because `taxfree_min` was set to 9312, retired 2026 receives 776/month.

## 13. wageCalc Logic

`wageCalc()` recalculates the year constants and then reads the fields set by `revenueCalc()`.

### Tax-Free Amount Used by wageCalc

Monthly tax-free basis `tfm`:

```txt
retired and year 2025 or 2026: 776
year 2026: 700
year >= 2023: 654
else: 500
```

Annual basis:

```txt
taxfree_min = tfm * 12
```

The source reads `taxfree_sum` and `taxfree_period`:

```txt
i = taxfree_period value
tfs = (taxfree_sum / i > tfm) ? tfm * i : taxfree_sum / i
```

Then:

```txt
if year == 2026 or (year == 2025 and retired):
  tfm_real = round(tfs * nper, 2)
else if F1 checked:
  if tfs * nper / i > tfm * nper / i:
    tfm_real = tfm
  else if tfs < 0:
    tfm_real = 0
  else:
    tfm_real = round(tfs * nper, 2)
else if F2 checked:
  if annual_revenue > 25200:
    tfm_real = 0
  else if annual_revenue < 14400:
    tfm_real = taxfree_min * nper / 12
  else:
    tfm_real =
      round(
        round(taxfree_min - taxfree_min * (annual_revenue - 14400) / (25200 - 14400), 2)
        * nper / 12,
        2
      )
```

Finally:

```txt
taxfree = taxfree_x checked ? tfm_real : 0
```

## 14. Gross Calculation by Input Mode

Definitions:

```txt
sum = amount * workhours
income_tax_rate = (sum - taxfree <= 0) ? 0 : itr
minimum employer-cost threshold =
  (socialtax_min / 0.33) * (1 + 0.33 + uip1)
```

### Employer Cost Input

```txt
if minimum social tax enabled and sum < socialtax_min:
  gross = NaN
else if minimum social tax enabled and sum < minimum employer-cost threshold:
  gross = (sum - socialtax_min) / (1 + uip1)
else:
  gross = sum / (1 + 0.33 + uip1)
```

### Gross Input

```txt
gross = sum
```

### Net Input

```txt
gross =
  (
    ((sum - taxfree) / (1 - income_tax_rate)) + taxfree
  )
  /
  (1 - (fp1 + uip2))
```

This uses the tax-free amount prepared earlier.

## 15. Taxes and Net

Social tax:

```txt
if input mode is employerCost and minimum social tax enabled and sum < socialtax_min:
  socialTax = NaN
else if input mode is employerCost and minimum social tax enabled and sum < minimum employer-cost threshold:
  socialTax = socialtax_min
else if minimum social tax enabled and gross * 0.33 < socialtax_min:
  socialTax = socialtax_min
else:
  socialTax = gross * 0.33
```

Employer unemployment:

```txt
employerUnemployment = gross * uip1
```

Employee unemployment:

```txt
employeeUnemployment = gross * uip2
```

Employee funded pension:

```txt
fundedPensionEmployee = gross * fp1
```

Income tax:

```txt
if gross < taxfree + gross * (uip2 + fp1):
  incomeTax = 0
else:
  incomeTax = (gross - employeeUnemployment - fundedPensionEmployee - taxfree) * itr
```

Net:

```txt
net = gross - employeeUnemployment - fundedPensionEmployee - incomeTax
```

Employer cost / wage fund:

```txt
employerCost = gross + employerUnemployment + socialTax
```

## 16. Chart Values

The source pie chart uses these hidden fields.

```txt
localGovernmentTaxes = gross * 0.1129
pensionFund = gross * (fp1 + fp2)
stateTaxes =
  employerUnemployment
  + employeeUnemployment
  + socialTax
  + incomeTax
  - gross * fp2
  - localGovernmentTaxes
```

Where:

```txt
fp2 = 0.04 if funded pension is enabled, else 0
```

The sum of chart slices equals employer cost:

```txt
stateTaxes + localGovernmentTaxes + net + pensionFund = employerCost
```

## 17. Percent Columns

Percent mode `pct1`, default:

```txt
base = employerCost
```

Percent mode `pct2`:

```txt
base = gross
```

Percent mode `pct3`:

```txt
base = net
```

Each visible row percentage is:

```txt
rowValue / base * 100
```

The source rounds percentages to two decimals.

## 18. Rounding and Parsing

Source parsing:

```js
parseFloat(value.replace(",", ".").replace(/\s/g, ""))
```

This means:

- comma decimals are accepted
- spaces are removed
- invalid input can become `NaN`

Source rounding:

```js
round(n, dec) {
  X = n * Math.pow(10, dec);
  X = Math.round(X);
  return (X / Math.pow(10, dec)).toFixed(dec);
}
```

Important:

- source returns strings from `round`
- later arithmetic relies on JavaScript coercion
- implementation should use numeric values internally and format at the boundary
- golden tests should compare rounded numeric outputs to two decimals

## 19. UI Behavior and Visibility

From `salary.html`:

### Hours Row

```txt
hours_row visible only when period == hourly
```

### Tax-Free Advanced Rows

```txt
taxfree_row visible if taxfree_x checked
taxfree_heading visible if taxfree_x checked and year <= 2025
taxfree_period_row visible if taxfree_x checked and year <= 2025
revenue_row visible if taxfree_x checked and year <= 2025
```

### Contribution Selector

```txt
contribution_row visible if year >= 2025
```

### Retired Row

```txt
isRetired_row visible if year >= 2025
```

### Source Order Quirk: Annual Revenue Field

When `F2` annual revenue mode is selected:

- typing in `annual_revenue` calls `wageCalc()` only
- typing in the main amount field calls `outputCalc()`, which runs `revenueCalc()` and overwrites `annual_revenue`

Therefore, on the source site, if the user enters annual revenue and then changes the salary amount, the annual revenue field can be overwritten. In the new product, make annual revenue override explicit and stable.

## 20. Source Quirks and Implementation Warnings

1. `minmax()` references `year` without declaring it. This can behave incorrectly or depend on browser globals. Implement the intended clamp logic cleanly.
2. `tfm_real` is assigned without `var` in `wageCalc()`. Use local variables.
3. `X` and `n` in `revenueCalc()` are fragile source variables. Use local variables.
4. Retired checkbox only affects tax-free amount in source. It does not automatically disable employee unemployment insurance.
5. The source hardcodes local government tax share `0.1129` for all years.
6. Annual period with 2026 tax-free income can display a monthly-looking tax-free field while applying the annual amount internally.
7. Employer-cost input lower than minimum social tax with minimum social tax enabled returns `NaN` strings in source. Prefer a validation error in UX but keep a parity test.
8. The source uses string outputs and numeric coercion. Use numbers internally.
9. Do not put calculation logic inside React components. Keep pure calculation modules like Automaks.
10. Keep parity mode first. Any legal correction or UX simplification must be separate and tested.

## 21. Live Browser Parity Fixtures

These fixtures were collected from the live page using the in-app browser on 2026-05-12.

Unless specified otherwise:

```txt
period = monthly
taxfree enabled = true
retired = false
minimum social tax = false
employer unemployment = true
employee unemployment = true
funded pension = true
funded pension rate = 2%
percent base = employer cost
```

### Fixture A: 2026 Gross 2000 Default

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly",
  "taxFreeEnabled": true,
  "retired": false,
  "applyMinimumSocialTax": false,
  "includeEmployerUnemployment": true,
  "includeEmployeeUnemployment": true,
  "includeFundedPension": true,
  "fundedPensionRate": 0.02
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 270.16,
  "net": 1657.84,
  "taxFreeApplied": 700.00,
  "chart": {
    "stateTaxes": 672.36,
    "localGovernmentTaxes": 225.80,
    "netWage": 1657.84,
    "pensionFund": 120.00
  }
}
```

### Fixture B: 2026 Net Reverse to Gross

Input:

```json
{
  "year": 2026,
  "inputMode": "net",
  "amount": 1657.84,
  "period": "monthly"
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 270.16,
  "net": 1657.84,
  "taxFreeApplied": 700.00
}
```

### Fixture C: 2026 Employer Cost Reverse to Gross

Input:

```json
{
  "year": 2026,
  "inputMode": "employerCost",
  "amount": 2676.00,
  "period": "monthly"
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 270.16,
  "net": 1657.84,
  "taxFreeApplied": 700.00
}
```

### Fixture D: 2025 Gross 2000 Sliding Tax-Free

Input:

```json
{
  "year": 2025,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly"
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 408.17,
  "net": 1519.83,
  "taxFreeApplied": 72.67,
  "chart": {
    "stateTaxes": 810.37,
    "localGovernmentTaxes": 225.80,
    "netWage": 1519.83,
    "pensionFund": 120.00
  }
}
```

### Fixture E: 2026 Gross 500 With Minimum Social Tax

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 500,
  "period": "monthly",
  "applyMinimumSocialTax": true
}
```

Expected:

```json
{
  "employerCost": 796.38,
  "socialTax": 292.38,
  "employerUnemployment": 4.00,
  "gross": 500.00,
  "fundedPensionEmployee": 10.00,
  "employeeUnemployment": 8.00,
  "incomeTax": 0.00,
  "net": 482.00,
  "taxFreeApplied": 700.00,
  "chart": {
    "stateTaxes": 227.93,
    "localGovernmentTaxes": 56.45,
    "netWage": 482.00,
    "pensionFund": 30.00
  }
}
```

### Fixture F: 2026 Gross 2000 With 6% Funded Pension

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly",
  "fundedPensionRate": 0.06
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 120.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 252.56,
  "net": 1595.44,
  "taxFreeApplied": 700.00,
  "chart": {
    "stateTaxes": 654.76,
    "localGovernmentTaxes": 225.80,
    "netWage": 1595.44,
    "pensionFund": 200.00
  }
}
```

### Fixture G: 2026 Gross 2000 Retired

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly",
  "retired": true
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 253.44,
  "net": 1674.56,
  "taxFreeApplied": 776.00,
  "chart": {
    "stateTaxes": 655.64,
    "localGovernmentTaxes": 225.80,
    "netWage": 1674.56,
    "pensionFund": 120.00
  }
}
```

Parity note:

The source still applies employee unemployment insurance here because `ui2_x` remains checked. Do not automatically disable it in parity mode.

### Fixture H: 2026 Gross 2000 With Tax-Free Disabled

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly",
  "taxFreeEnabled": false
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 424.16,
  "net": 1503.84,
  "taxFreeApplied": 0.00,
  "chart": {
    "stateTaxes": 826.36,
    "localGovernmentTaxes": 225.80,
    "netWage": 1503.84,
    "pensionFund": 120.00
  }
}
```

### Fixture I: 2025 Gross 2000 With Annual Revenue Override 30000

Input:

```json
{
  "year": 2025,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly",
  "taxFreeMode": "annualRevenue",
  "annualRevenue": 30000
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 424.16,
  "net": 1503.84,
  "taxFreeApplied": 0.00,
  "annualRevenueUsed": 30000
}
```

Live-page note:

On the source page, this only holds if annual revenue is entered after the salary amount. If the salary amount is edited after annual revenue, `outputCalc()` overwrites `annual_revenue`.

### Fixture J: 2026 Hourly Gross 10 x 160 Hours

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 10,
  "period": "hourly",
  "workHoursPerMonth": 160
}
```

Expected:

```json
{
  "employerCost": 2140.80,
  "socialTax": 528.00,
  "employerUnemployment": 12.80,
  "gross": 1600.00,
  "fundedPensionEmployee": 32.00,
  "employeeUnemployment": 25.60,
  "incomeTax": 185.33,
  "net": 1357.07,
  "taxFreeApplied": 700.00
}
```

### Fixture K: 2026 Annual Gross 24000

Input:

```json
{
  "year": 2026,
  "inputMode": "gross",
  "amount": 24000,
  "period": "annual"
}
```

Expected:

```json
{
  "employerCost": 32112.00,
  "socialTax": 7920.00,
  "employerUnemployment": 192.00,
  "gross": 24000.00,
  "fundedPensionEmployee": 480.00,
  "employeeUnemployment": 384.00,
  "incomeTax": 3241.92,
  "net": 19894.08,
  "taxFreeApplied": 8400.00,
  "chart": {
    "stateTaxes": 8067.92,
    "localGovernmentTaxes": 2709.60,
    "netWage": 19894.08,
    "pensionFund": 1440.00
  }
}
```

### Fixture L: 2022 Gross 2000 Old Income Tax Rate

Input:

```json
{
  "year": 2022,
  "inputMode": "gross",
  "amount": 2000,
  "period": "monthly"
}
```

Expected:

```json
{
  "employerCost": 2676.00,
  "socialTax": 660.00,
  "employerUnemployment": 16.00,
  "gross": 2000.00,
  "fundedPensionEmployee": 40.00,
  "employeeUnemployment": 32.00,
  "incomeTax": 374.49,
  "net": 1553.51,
  "taxFreeApplied": 55.56
}
```

## 22. Implementation File Structure

Follow the existing Automaks architecture.

Recommended files:

```txt
src/calculators/salary/types.ts
src/calculators/salary/constants.ts
src/calculators/salary/calculate.ts
src/calculators/salary/calculate.test.ts
src/calculators/salary/format.ts
src/components/calculators/salary/SalaryCalculator.tsx
src/app/palgakalkulaator/page.tsx
```

If the app chooses English route names:

```txt
src/app/salary/page.tsx
```

But for Estonian SEO, prefer:

```txt
/palgakalkulaator
```

## 23. Test Requirements

Minimum tests:

- constants by year
- income tax rate by year
- social tax minimum by year
- 2026 flat tax-free amount
- 2025 sliding tax-free amount
- 2022 tax-free amount
- retired 2025/2026 tax-free amount
- employer cost to gross
- gross to net
- net to gross
- minimum social tax branch
- low employer-cost invalid branch
- hourly period
- annual period
- funded pension 2%, 4%, 6%
- pension disabled
- unemployment toggles disabled
- annual revenue override
- all live fixtures A-L above

Tests should use numeric values and assert two-decimal rounded results.

## 24. Claude Build Instructions

When implementing:

1. Read this handoff fully before coding.
2. Do not start by designing UI. Start with pure calculation modules and tests.
3. Preserve exact source parity first.
4. Use the live fixtures in this document as golden tests.
5. Keep all calculation logic outside React components.
6. Implement validation as a layer around calculation, not mixed into formulas.
7. Make source quirks explicit in comments where they affect behavior.
8. After tests pass, build the UI using the existing Automaks visual system.
9. Run `npm test`, `npm run lint`, and `npm run build`.
10. Verify in browser after implementation.

## 25. Open Product Choices

These are choices for the product owner, not blockers for parity implementation:

- whether to expose 2022-2024 in the main UI or hide them behind "older years"
- whether to show a legal caveat for pension-age unemployment insurance
- whether to include the percent columns in MVP or keep them as a details panel
- whether route should be `/palgakalkulaator` only or also `/salary`
- whether the manual tax-free amount should be framed as "advanced"

Default recommendation:

- include all years visible
- show advanced controls collapsed by default
- use `/palgakalkulaator`
- include percent and chart breakdown in a results details panel

