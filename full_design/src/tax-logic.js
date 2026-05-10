/* ============================================================
   tax-logic.js — Estonian Vehicle Tax computations
   Implements Mootorsõidukimaksu seadus (2025/2026 ruleset).
   Pure functions — no DOM, no React. Easy to unit-test.
   ============================================================ */

(function (root) {
  "use strict";

  // ----- Vehicle type constants -----
  const TYPES = {
    M1:    "M1",
    N1:    "N1",
    MOTO:  "MOTO",     // Mootorratas / ATV
    MS2:   "MS2",      // Maastikusõiduk
    T1B:   "T1B_T5",   // Traktor T1b / T5
    T3:    "T3"        // Traktor T3
  };

  const ENGINES = { ICE: "ICE", HEV: "HEV", PHEV: "PHEV", EV: "EV" };
  const CO2_STD = { WLTP: "WLTP", NEDC: "NEDC", NONE: "NONE" };
  const FUEL    = { PETROL: "PETROL", DIESEL: "DIESEL" };

  // ----- Helpers -----
  const round = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

  /**
   * Vehicle age, in years, computed at the start of the next tax year (1 Jan).
   * Per brief: "Sõiduki vanus arvestatakse järgmise maksuaasta algusest"
   */
  function vehicleAge(registrationDate, today = new Date()) {
    if (!registrationDate) return 0;
    const reg = new Date(registrationDate);
    if (isNaN(reg.getTime())) return 0;
    // Reference = 1 January of next calendar year.
    const ref = new Date(today.getFullYear() + 1, 0, 1);
    const diffMs = ref - reg;
    const years = diffMs / (365.25 * 24 * 60 * 60 * 1000);
    return Math.max(0, years);
  }

  /**
   * Age coefficient for annual tax (decreases over time).
   * Approximation: linear decay from 1.0 at year 0 to 0.0 at year 20.
   * Brief example: 5.67 yrs → 0.92  ⇒  coef = max(0, 1 - age*0.014..)
   * We use: coef = clamp(1 - 0.014 * age, 0.30, 1.0)  (floors to keep aged vehicles paying base)
   * Over 20 years → annual tax fully exempt.
   */
  function annualAgeCoef(age) {
    if (age >= 20) return 0;
    return Math.max(0.30, 1 - 0.014 * age);
  }

  /**
   * Age coefficient for registration fee.
   * Steeper decay; bottoms at 0.05.
   */
  function regAgeCoef(age) {
    if (age >= 20) return 0.05;
    return Math.max(0.05, 1 - 0.092 * age);
  }

  // ============================================================
  // CO2 estimation (when CO2_STD = NONE)
  // ============================================================
  function estimateCo2({ powerKw = 0, kerbMassKg = 0, age = 0, fuel = FUEL.PETROL }) {
    if (!powerKw || !kerbMassKg) return null;
    // Heuristic: ~ 80 + 0.5*kW + 0.04*mass + age*0.6 (diesel slightly lower)
    let g = 80 + 0.5 * powerKw + 0.04 * kerbMassKg + 0.6 * age;
    if (fuel === FUEL.DIESEL) g -= 8;
    return Math.max(60, Math.round(g));
  }

  // ============================================================
  // ANNUAL TAX (Aastamaks)
  // ============================================================
  function computeAnnual(input) {
    const {
      vehicleType, engine, registrationDate,
      co2Std, co2, grossMassKg, isCamper,
      fuel, powerKw, kerbMassKg, engineCcm
    } = input;

    const age = vehicleAge(registrationDate);
    const ageCoef = annualAgeCoef(age);

    const out = {
      total: 0,
      base: 0,
      co2Component: 0,
      massComponent: 0,
      ageCoef,
      age,
      lines: [],
      notes: []
    };

    // ---- Motorcycle / ATV ----
    if (vehicleType === TYPES.MOTO) {
      if (engine === ENGINES.EV) {
        out.notes.push("Elektrimootorratas on maksuvaba");
        return out;
      }
      out.base = 30 * ageCoef;
      out.total = round(out.base);
      out.lines.push({ key: "base", label: "Baasosa", amount: round(out.base),
        explain: "Fikseeritud baasosa mootorratta/ATV eest" });
      return out;
    }

    // ---- Off-road / tractor ----
    if (vehicleType === TYPES.MS2 || vehicleType === TYPES.T1B || vehicleType === TYPES.T3) {
      const baseByType = { MS2: 40, T1B_T5: 50, T3: 25 };
      out.base = (baseByType[vehicleType] || 30) * ageCoef;
      out.total = round(out.base);
      out.lines.push({ key: "base", label: "Baasosa", amount: round(out.base),
        explain: "Fikseeritud baasosa sõiduki tüübi eest" });
      return out;
    }

    // ---- M1 / N1 ----
    if (age >= 20) {
      out.notes.push("Üle 20-aastane sõiduk on aastamaksust vabastatud");
      return out;
    }

    // Base
    out.base = 50;
    out.lines.push({ key: "base", label: "Baasosa", amount: round(out.base),
      explain: "Fikseeritud baasosa sõiduauto/kaubiku eest" });

    // CO2 component
    let co2Used = co2;
    let co2Estimated = false;
    if (engine === ENGINES.EV) {
      co2Used = 0;
    } else if (co2Std === CO2_STD.NONE) {
      const est = estimateCo2({ powerKw, kerbMassKg, age, fuel });
      if (est != null) { co2Used = est; co2Estimated = true; }
    } else if (co2Std === CO2_STD.NEDC && typeof co2 === "number") {
      // Convert NEDC → WLTP (approx +21%)
      co2Used = co2 * 1.21;
    }

    let co2Amount = 0;
    let co2Explain = "";
    if (engine === ENGINES.PHEV && co2Std === CO2_STD.NONE) {
      // Special exception
      co2Amount = 0;
      co2Explain = "Pistikhübriidil puuduva CO₂ andmetega CO₂ osa aastamaksust ei arvestata";
      out.notes.push(co2Explain);
      out.lines.push({ key: "co2", label: "CO₂ eriheite osa", amount: null, dash: true,
        explain: co2Explain });
    } else if (engine === ENGINES.EV) {
      out.lines.push({ key: "co2", label: "CO₂ eriheite osa", amount: 0,
        explain: "Elektrisõiduk — CO₂ heide 0 g/km" });
    } else if (co2Used != null) {
      co2Amount = co2BandAnnual(co2Used) * ageCoef;
      co2Explain = `CO₂ heide ${Math.round(co2Used)} g/km${co2Estimated ? " (hinnanguline)" : ""}, vanuskoefitsient ${ageCoef.toFixed(2)}`;
      out.lines.push({ key: "co2", label: "CO₂ eriheite osa", amount: round(co2Amount),
        explain: co2Explain });
      if (co2Estimated) {
        out.notes.push(`CO₂ heide hinnanguline: ~${Math.round(co2Used)} g/km (arvutatud võimsuse, massi ja vanuse põhjal)`);
      }
    }
    out.co2Component = round(co2Amount);

    // Mass component
    const massThreshold = engine === ENGINES.EV ? 2400 : 2000;
    let massAmount = 0;
    let massExplain;
    if (typeof grossMassKg === "number" && grossMassKg > 0) {
      if (grossMassKg > massThreshold) {
        const over = grossMassKg - massThreshold;
        massAmount = (over * 0.20) * ageCoef;
        massExplain = `Täismass ${grossMassKg} kg (üle ${massThreshold} kg piiri), vanuskoefitsient ${ageCoef.toFixed(2)}`;
      } else {
        massExplain = `Täismass ${grossMassKg} kg (piirini ${massThreshold} kg massiosa puudub)`;
      }
      out.lines.push({ key: "mass", label: "Massiosa", amount: round(massAmount),
        explain: massExplain });
    }
    out.massComponent = round(massAmount);

    // Camper discount
    if (vehicleType === TYPES.M1 && isCamper) {
      const camperFactor = 0.5;
      out.co2Component = round(out.co2Component * camperFactor);
      out.massComponent = round(out.massComponent * camperFactor);
      out.notes.push("Elamuauto: CO₂ ja massi osa rakendub 50%");
      // Adjust line items
      out.lines = out.lines.map(l => {
        if (l.key === "co2" && typeof l.amount === "number") return { ...l, amount: round(l.amount * camperFactor) };
        if (l.key === "mass" && typeof l.amount === "number") return { ...l, amount: round(l.amount * camperFactor) };
        return l;
      });
    }

    out.total = round(out.base + out.co2Component + out.massComponent);
    return out;
  }

  // CO2 banded rate for annual tax (€ per year, before age coef)
  function co2BandAnnual(g) {
    if (g <= 117) return Math.max(0, (g - 0)) * 0.30;
    if (g <= 150) return 117 * 0.30 + (g - 117) * 1.20;
    if (g <= 200) return 117 * 0.30 + 33 * 1.20 + (g - 150) * 2.00;
    return 117 * 0.30 + 33 * 1.20 + 50 * 2.00 + (g - 200) * 3.00;
  }

  // ============================================================
  // REGISTRATION FEE (Registreerimistasu)
  // ============================================================
  function computeRegistration(input) {
    const {
      vehicleType, engine, registrationDate,
      co2Std, co2, grossMassKg, isCamper,
      fuel, powerKw, kerbMassKg
    } = input;

    const age = vehicleAge(registrationDate);
    const ageCoef = regAgeCoef(age);

    const out = {
      total: 0,
      base: 0,
      co2Component: 0,
      massComponent: 0,
      ageCoef,
      age,
      lines: [],
      notes: [],
      hidden: false
    };

    // No registration fee for motorcycles / off-road / tractors per brief
    if (vehicleType !== TYPES.M1 && vehicleType !== TYPES.N1) {
      out.hidden = true;
      return out;
    }

    out.base = 150;
    out.lines.push({ key: "base", label: "Baasosa", amount: round(out.base),
      explain: "Fikseeritud baasosa" });

    // CO2
    let co2Used = co2;
    let co2Estimated = false;
    if (engine === ENGINES.EV) {
      co2Used = 0;
    } else if (co2Std === CO2_STD.NONE) {
      const est = estimateCo2({ powerKw, kerbMassKg, age, fuel });
      if (est != null) { co2Used = est; co2Estimated = true; }
    } else if (co2Std === CO2_STD.NEDC && typeof co2 === "number") {
      co2Used = co2 * 1.21;
    }

    let co2Amount = 0;
    let co2Explain = "";
    if (engine === ENGINES.PHEV && co2Std === CO2_STD.NONE) {
      co2Amount = 230;
      co2Explain = "Fikseeritud registreerimistasu CO₂ osa";
      out.lines.push({ key: "co2", label: "CO₂ eriheite osa", amount: round(co2Amount),
        explain: co2Explain });
    } else if (engine === ENGINES.EV) {
      out.lines.push({ key: "co2", label: "CO₂ eriheite osa", amount: 0,
        explain: "Elektrisõiduk — CO₂ heide 0 g/km" });
    } else if (co2Used != null) {
      co2Amount = co2BandReg(co2Used) * ageCoef;
      co2Explain = `CO₂ heide ${Math.round(co2Used)} g/km${co2Estimated ? " (hinnanguline)" : ""}, vanuskoefitsient ${ageCoef.toFixed(2)}`;
      out.lines.push({ key: "co2", label: "CO₂ eriheite osa", amount: round(co2Amount),
        explain: co2Explain });
    }
    out.co2Component = round(co2Amount);

    // Mass
    const massThreshold = engine === ENGINES.EV ? 2400 : 2000;
    let massAmount = 0;
    let massExplain;
    if (typeof grossMassKg === "number" && grossMassKg > 0) {
      if (grossMassKg > massThreshold) {
        const over = grossMassKg - massThreshold;
        massAmount = (over * 1.0) * ageCoef;
        massExplain = `Täismass ${grossMassKg} kg, vanuskoefitsient ${ageCoef.toFixed(2)}`;
      } else {
        massExplain = `Täismass ${grossMassKg} kg (piirini ${massThreshold} kg massiosa puudub)`;
      }
      out.lines.push({ key: "mass", label: "Massiosa", amount: round(massAmount),
        explain: massExplain });
    }
    out.massComponent = round(massAmount);

    // Camper discount
    if (vehicleType === TYPES.M1 && isCamper) {
      const f = 0.5;
      out.co2Component = round(out.co2Component * f);
      out.massComponent = round(out.massComponent * f);
      out.lines = out.lines.map(l => {
        if (l.key === "co2" && typeof l.amount === "number" && !(engine === ENGINES.PHEV && co2Std === CO2_STD.NONE))
          return { ...l, amount: round(l.amount * f) };
        if (l.key === "mass" && typeof l.amount === "number")
          return { ...l, amount: round(l.amount * f) };
        return l;
      });
    }

    out.total = round(out.base + out.co2Component + out.massComponent);
    return out;
  }

  function co2BandReg(g) {
    if (g <= 117) return g * 0.5;
    if (g <= 150) return 117 * 0.5 + (g - 117) * 4.0;
    if (g <= 200) return 117 * 0.5 + 33 * 4.0 + (g - 150) * 7.5;
    return 117 * 0.5 + 33 * 4.0 + 50 * 7.5 + (g - 200) * 12.0;
  }

  // ============================================================
  // VAN (N1) classification: powerKw / kerbMassKg ratio
  // ============================================================
  function vanClassification(powerKw, kerbMassKg) {
    if (!powerKw || !kerbMassKg) return null;
    const ratio = powerKw / kerbMassKg;
    if (ratio > 0.20) {
      return { strong: true, label: "Klassifitseeritud: võimsam kaubik", ratio: ratio };
    }
    return { strong: false, label: "Klassifitseeritud: nõrgem kaubik", ratio: ratio };
  }

  // ============================================================
  // INPUT VALIDITY — minimum required fields per type
  // ============================================================
  function hasMinimumInputs(input) {
    const { vehicleType, engine, registrationDate,
            co2Std, co2, grossMassKg, engineCcm,
            powerKw, kerbMassKg } = input;
    if (!registrationDate) return false;

    if (vehicleType === "MOTO") {
      return engine === "EV" || (typeof engineCcm === "number" && engineCcm > 0);
    }
    if (vehicleType === "MS2" || vehicleType === "T1B_T5" || vehicleType === "T3") {
      return true; // base only
    }
    // M1 / N1
    if (engine === "EV") {
      return typeof grossMassKg === "number" && grossMassKg > 0;
    }
    if (co2Std === "NONE") {
      return typeof powerKw === "number" && powerKw > 0
          && typeof kerbMassKg === "number" && kerbMassKg > 0
          && typeof grossMassKg === "number" && grossMassKg > 0;
    }
    return typeof co2 === "number" && co2 > 0
        && typeof grossMassKg === "number" && grossMassKg > 0;
  }

  // ============================================================
  // EXPORT
  // ============================================================
  root.TaxLogic = {
    TYPES, ENGINES, CO2_STD, FUEL,
    vehicleAge, annualAgeCoef, regAgeCoef,
    estimateCo2,
    computeAnnual,
    computeRegistration,
    vanClassification,
    hasMinimumInputs,
    round
  };
})(typeof window !== "undefined" ? window : globalThis);
