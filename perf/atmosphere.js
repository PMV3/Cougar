// Standard-atmosphere helpers shared by the planning page (and available to
// the other pages). Plain global functions; no dependencies.
//
// Constants are ICAO ISA: sea-level 288.15 K / 1013.25 hPa, tropospheric lapse
// 1.98 degC per 1000 ft (0.0065 K/m), used exactly as in the Flight Manual's
// Section 5.1 Figure 2 "Pressure altitude / density altitude correspondence
// chart". Checked against that chart: agreement within about 100 ft over the
// operational range (OAT 0 to 45 degC, Hp -2000 to 10000 ft), drifting to a
// few hundred feet only near -50 degC.

var ATM = (function () {
    'use strict';

    var ISA_T0_K = 288.15;
    var ISA_P0_HPA = 1013.25;
    var LAPSE_C_PER_FT = 0.0019812;   // 1.9812 degC per 1000 ft
    var PRESSURE_EXPONENT = 5.2559;   // (1 - 6.87535e-6 * Hp)^5.2559 = P/P0
    var FT_PER_HPA_LINEAR = 27.3;     // only for display cross-checks

    // Pressure altitude (ft) from field elevation (ft) and QNH (hPa).
    // Same formula as the STEP1 quick-info bar.
    function pressureAltitude(elevationFt, qnhHpa) {
        if (!isFinite(elevationFt) || !isFinite(qnhHpa) || qnhHpa <= 0) return null;
        return elevationFt + 145366.45 * (1 - Math.pow(qnhHpa / ISA_P0_HPA, 0.190284));
    }

    // ISA temperature (degC) at a pressure altitude (ft).
    function isaTemperature(hpFt) {
        return 15 - LAPSE_C_PER_FT * hpFt;
    }

    // Density altitude (ft) from pressure altitude (ft) and OAT (degC).
    function densityAltitude(hpFt, oatC) {
        if (!isFinite(hpFt) || !isFinite(oatC)) return null;
        var delta = Math.pow(1 - 6.87535e-6 * hpFt, PRESSURE_EXPONENT);  // P/P0
        var theta = (oatC + 273.15) / ISA_T0_K;                            // T/T0
        var sigma = delta / theta;                                          // rho/rho0
        return 145442.16 * (1 - Math.pow(sigma, 0.234969));
    }

    // Temperature deviation from ISA (degC) at a pressure altitude.
    function isaDeviation(hpFt, oatC) {
        return oatC - isaTemperature(hpFt);
    }

    return {
        pressureAltitude: pressureAltitude,
        densityAltitude: densityAltitude,
        isaTemperature: isaTemperature,
        isaDeviation: isaDeviation,
        FT_PER_HPA_LINEAR: FT_PER_HPA_LINEAR
    };
})();
