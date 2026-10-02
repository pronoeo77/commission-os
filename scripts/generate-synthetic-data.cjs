const fs = require("fs");
const path = require("path");

const managementRates = {
    "Head of Sales & AM": { newRate: 0.01, existingRate: 0.000865 },
    "Director of Sales": { newRate: 0.01, existingRate: 0 },
    "ENT AE Manager II": { newRate: 0.037, existingRate: 0 },
    "ENT AE Manager I": { newRate: 0.035, existingRate: 0 },
    "Director of ENT AM": { newRate: 0, existingRate: 0.002 },
    "Director of SMB AM": { newRate: 0, existingRate: 1 / 375 },
    "SMB AE Manager III": { newRate: 0.033, existingRate: 0 },
    "ENT AM Manager III": { newRate: 0, existingRate: 0.004 },
    "SMB AE Manager I": { newRate: 0.033, existingRate: 0 },
    "ENT AM Manager II": { newRate: 0, existingRate: 11 / 3000 },
    "SMB AM Manager III": { newRate: 0, existingRate: 1 / 180 },
    "SMB AM Manager I": { newRate: 0, existingRate: 1 / 225 },
    "ENT AM Manager I": { newRate: 0, existingRate: 1 / 300 },
};

const dataFolder = path.join(__dirname, "../src/data");

const employees = JSON.parse(
    fs.readFileSync(path.join(dataFolder, "employees.json"), "utf8")
);

// CommissionOS Synthetic Data Generator
// Generates reproducible fictional financial data.

// Fixed seed ensures the same results every time.
let seed = 2026;

function random() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
}

// Generate a random number between two values.
function randomBetween(min, max) {
    return min + random() * (max - min);
}

// Round a number to two decimal places.
function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Test the generator without changing any files.
console.log("CommissionOS Synthetic Data Generator");
console.log("Sample revenue:", roundMoney(randomBetween(20000, 80000)));

console.log("Employees loaded:", employees.length);

const groups = {};

for (const employee of employees) {
    const group = employee.employee_group;
    groups[group] = (groups[group] || 0) + 1;
}

console.log("Employee groups:", groups);

// Generate sample synthetic revenue for Account Executives.
const syntheticAEs = employees
    .filter((employee) => employee.employee_group === "Account Executive")
    .map((employee) => ({
        name: employee.name,
        role: employee["Current Role"],
        syntheticRevenue: roundMoney(
            employee["Current Role"].startsWith("SMB")
                ? randomBetween(10000, 65000)
                : randomBetween(25000, 110000)
        ),
    }));

console.log("\nFirst 5 synthetic Account Executives:");
console.table(syntheticAEs.slice(0, 5));

// Calculate AE commissions using the original compensation rules.
function calculateAECommission(revenue, role, isRamping) {
    const isSMB = role.startsWith("SMB");

    const rate = isSMB ? 0.16 : 0.10;
    const tier1 = isSMB ? 30000 : 60000;
    const tier2 = isSMB ? 40000 : 80000;

    // Ramping employees receive the standard rate only.
    if (isRamping) {
        return roundMoney(revenue * rate);
    }

    const standard = Math.min(revenue, tier1) * rate;

    const accelerator1 =
        Math.max(Math.min(revenue, tier2) - tier1, 0) *
        rate * 1.2;

    const accelerator2 =
        Math.max(revenue - tier2, 0) *
        rate * 1.3;

    return roundMoney(standard + accelerator1 + accelerator2);
}

// Preview synthetic commissions without modifying existing data.
const syntheticAECommissions = syntheticAEs.map((ae) => {
    const original = employees.find(
        (employee) => employee.name === ae.name
    );

    const producedRevenue = ae.syntheticRevenue;

    const creditedRevenue = original.is_ramping
        ? Math.max(producedRevenue, original.ramp_floor || 0)
        : producedRevenue;

    return {
        name: ae.name,
        producedRevenue,
        creditedRevenue,
        rampFloor: original.ramp_floor || 0,
        isRamping: original.is_ramping,
        commission: calculateAECommission(
            creditedRevenue,
            ae.role,
            original.is_ramping
        ),
    };
});

console.log("\nFirst 5 synthetic AE commissions:");
console.table(syntheticAECommissions.slice(0, 5));

// Generate synthetic Account Manager revenue and commissions.
const syntheticAMs = employees
    .filter((employee) => employee.employee_group === "Account Manager")
    .map((employee) => {
        const revenue = roundMoney(
            employee["Current Role"].startsWith("SMB")
                ? randomBetween(100000, 350000)
                : randomBetween(300000, 900000)
        );

        // Preserve the original role-specific base payout rate.
        const originalRate = employee["Current Role"].startsWith("SMB")
            ? 1 / 75
            : 1 / 150;

        const creditedRevenue = employee.is_ramping
            ? Math.max(revenue, employee.ramp_floor || 0)
            : revenue;

        const baseCommission = roundMoney(
            creditedRevenue * originalRate
        );

        // Preserve the original SPIFF eligibility and amount.
        const eligibleForSpiff =
            !employee.is_ramping &&
            employee.retained_100_pct === true;

        const spiff = eligibleForSpiff
            ? employee["Current Role"].startsWith("SMB")
                ? 500
                : 1500
            : 0;

        return {
            name: employee.name,
            role: employee["Current Role"],
            revenue,
            creditedRevenue,
            rampFloor: employee.ramp_floor || 0,
            isRamping: employee.is_ramping,
            baseCommission,
            spiff,
            totalCommission: roundMoney(baseCommission + spiff),
        };
    });


console.log("\nFirst 5 synthetic Account Managers:");
console.table(syntheticAMs.slice(0, 5));

// Load the fictional employee reporting hierarchy.
const hierarchy = JSON.parse(
    fs.readFileSync(
        path.join(dataFolder, "reporting-hierarchy.json"),
        "utf8"
    )
);

// Find all employees reporting directly or indirectly to a manager.
function getTeamMembers(managerName) {
    const team = [];
    const visited = new Set([managerName]);

    function findReports(name) {
        const directReports = hierarchy.filter(
            (relationship) => relationship.manager === name
        );

        for (const report of directReports) {
            if (visited.has(report.employee)) continue;

            visited.add(report.employee);
            team.push(report.employee);
            findReports(report.employee);
        }
    }

    findReports(managerName);
    return team;
}

// Verify management team sizes.
console.log("\nSynthetic hierarchy validation:");

const management = employees.filter(
    (employee) => employee.employee_group === "Management"
);

const results = management.map((manager) => ({
    manager: manager.name,
    teamSize: getTeamMembers(manager.name).length,
    expected: manager.all_descendants,
}));

console.table(results);

console.log(
    "All management teams match:",
    results.every((result) => result.teamSize === result.expected)
);

// Calculate synthetic management revenue rollups.
const syntheticRevenueByName = new Map();

for (const ae of syntheticAECommissions) {
    syntheticRevenueByName.set(ae.name, {
        newRevenue: ae.creditedRevenue,
        existingRevenue: 0,
    });
}

for (const am of syntheticAMs) {
    syntheticRevenueByName.set(am.name, {
        newRevenue: 0,
        existingRevenue: am.creditedRevenue,
    });
}

const syntheticManagement = management.map((manager) => {
    const teamMembers = getTeamMembers(manager.name);

    let newRevenue = 0;
    let existingRevenue = 0;

    for (const name of teamMembers) {
        const revenue = syntheticRevenueByName.get(name);

        if (!revenue) continue;

        newRevenue += revenue.newRevenue;
        existingRevenue += revenue.existingRevenue;
    }

    return {
        name: manager.name,
        role: manager["Current Role"],
        newRevenue: roundMoney(newRevenue),
        existingRevenue: roundMoney(existingRevenue),
    };
});

console.log("\nFirst 5 synthetic management rollups:");
console.table(syntheticManagement.slice(0, 5));

// Calculate management commissions using existing payout rates.
const syntheticManagementCommissions = syntheticManagement.map(
    (manager) => {
        const rates = managementRates[manager.role];

        if (!rates) {
            throw new Error(
                `Missing management commission rates for: ${manager.role}`
            );
        }

        const newCommission = roundMoney(
            manager.newRevenue * rates.newRate
        );

        const existingCommission = roundMoney(
            manager.existingRevenue * rates.existingRate
        );

        return {
            name: manager.name,
            newCommission,
            existingCommission,
            totalCommission: roundMoney(
                newCommission + existingCommission
            ),
        };
    }
);

console.log("\nFirst 5 synthetic management commissions:");
console.table(syntheticManagementCommissions.slice(0, 5));

// Validate that synthetic management commissions use the original rates.
const managementRateChecks = syntheticManagement.map((manager) => {
    const rates = managementRates[manager.role];

    const synthetic = syntheticManagementCommissions.find(
        (employee) => employee.name === manager.name
    );

    if (!rates || !synthetic) {
        throw new Error(
            `Missing management rates or commission for: ${manager.name}`
        );
    }

    const expectedNew = roundMoney(
        manager.newRevenue * rates.newRate
    );

    const expectedExisting = roundMoney(
        manager.existingRevenue * rates.existingRate
    );

    return {
        name: manager.name,
        matches:
            synthetic.newCommission === expectedNew &&
            synthetic.existingCommission === expectedExisting &&
            synthetic.totalCommission ===
            roundMoney(expectedNew + expectedExisting),
    };
});


console.log("\nManagement commission validation:");
console.log("Managers checked:", managementRateChecks.length);
console.log(
    "Commission mismatches:",
    managementRateChecks.filter((result) => !result.matches).length
);

// Validate retention SPIFF eligibility for all Account Managers.
const spiffChecks = syntheticAMs.map((am) => {
    const employee = employees.find(
        (e) => e.name === am.name
    );

    const expectedSpiff =
        !employee.is_ramping &&
            employee.retained_100_pct === true
            ? am.role.startsWith("SMB") ? 500 : 1500
            : 0;

    return {
        name: am.name,
        spiff: am.spiff,
        expected: expectedSpiff,
        matches: am.spiff === expectedSpiff,
    };
});

console.log("\nRetention SPIFF validation:");
console.log("Account Managers checked:", spiffChecks.length);
console.log(
    "SPIFF mismatches:",
    spiffChecks.filter((x) => !x.matches).length
);

console.log("\nRamping Account Managers:");
console.table(
    syntheticAMs.filter((am) => am.isRamping)
);

console.log(
    "Total synthetic SPIFF payout:",
    roundMoney(syntheticAMs.reduce((sum, am) => sum + am.spiff, 0))
);

// Validate all synthetic Account Manager commissions.
const amCommissionChecks = syntheticAMs.map((am) => {

    const rate = am.role.startsWith("SMB")
        ? 1 / 75
        : 1 / 150;

    const expectedBase = roundMoney(
        am.creditedRevenue * rate
    );

    const expectedTotal = roundMoney(
        expectedBase + am.spiff
    );

    return {
        name: am.name,
        matches:
            am.baseCommission === expectedBase &&
            am.totalCommission === expectedTotal,
    };
});

console.log("\nAccount Manager commission validation:");
console.log("Account Managers checked:", amCommissionChecks.length);
console.log(
    "Commission mismatches:",
    amCommissionChecks.filter((x) => !x.matches).length
);

// Validate all synthetic Account Executive commissions.
const aeCommissionChecks = syntheticAECommissions.map((ae) => {
    const original = employees.find(
        (employee) => employee.name === ae.name
    );

    const expectedCredit = original.is_ramping
        ? Math.max(ae.producedRevenue, original.ramp_floor || 0)
        : ae.producedRevenue;

    const expectedCommission = calculateAECommission(
        expectedCredit,
        original["Current Role"],
        original.is_ramping
    );

    return {
        name: ae.name,
        matches:
            ae.creditedRevenue === expectedCredit &&
            ae.commission === expectedCommission,
    };
});

console.log("\nAccount Executive commission validation:");
console.log("Account Executives checked:", aeCommissionChecks.length);
console.log(
    "Commission mismatches:",
    aeCommissionChecks.filter((x) => !x.matches).length
);

// Assemble all three portfolio-safe dashboard datasets.
const aeByName = new Map(syntheticAECommissions.map((item) => [item.name, item]));
const amByName = new Map(syntheticAMs.map((item) => [item.name, item]));
const mgmtByName = new Map(syntheticManagement.map((item) => [item.name, item]));
const mgmtCommissionByName = new Map(syntheticManagementCommissions.map((item) => [item.name, item]));

const syntheticEmployeeRecords = employees.map((employee, index) => {
    const record = { ...employee, hr_id: `SYN-HR-${String(index + 1).padStart(3, "0")}` };
    if (Object.hasOwn(record, "crm_owner_id")) {
        record.crm_owner_id = `SYN-CRM-${String(index + 1).padStart(3, "0")}`;
    }
    const ae = aeByName.get(employee.name);
    const am = amByName.get(employee.name);
    const manager = mgmtByName.get(employee.name);
    if (ae) {
        record.produced_credit = ae.producedRevenue;
        record.credited_revenue = ae.creditedRevenue;
        record.commission_usd = ae.commission;
        record.attainment = record.prorated_quota > 0
            ? ae.creditedRevenue / record.prorated_quota : null;
    } else if (am) {
        record.produced_credit = am.revenue;
        record.credited_revenue = am.creditedRevenue;
        record.base_commission_usd = am.baseCommission;
        record.retention_spiff_usd = am.spiff;
        record.commission_usd = am.totalCommission;
        record.attainment = record.prorated_quota > 0
            ? am.creditedRevenue / record.prorated_quota : null;
        // Synthetic ratio consistent with the retained eligibility category.
        record.retention_ratio = employee.retained_100_pct
            ? Math.round((1.01 + random() * 0.09) * 10000) / 10000
            : Math.round((0.83 + random() * 0.16) * 10000) / 10000;
        // Keep account counts plausible, but not sourced from assessment rows.
        record.existing_accounts = employee["Current Role"].startsWith("SMB")
            ? Math.floor(randomBetween(25, 41))
            : Math.floor(randomBetween(10, 22));
    } else if (manager) {
        const payout = mgmtCommissionByName.get(employee.name);
        record.all_descendants = getTeamMembers(employee.name).length;
        record.new_rollup_credit = manager.newRevenue;
        record.existing_rollup_credit = manager.existingRevenue;
        record.metric_1_commission_usd = payout.newCommission;
        record.metric_2_commission_usd = payout.existingCommission;
        record.commission_usd = payout.totalCommission;
    } else {
        throw new Error(`Employee has no synthetic calculation: ${employee.name}`);
    }
    return record;
});

// Recalculate the simulator from the same synthetic AE commissions.
function proposedSMBCommission(revenue, isRamping) {
    if (isRamping) return roundMoney(revenue * 0.16);
    return roundMoney(
        Math.min(revenue, 30000) * 0.16 +
        Math.max(Math.min(revenue, 40000) - 30000, 0) * 0.16 * 1.3 +
        Math.max(revenue - 40000, 0) * 0.16 * 1.5
    );
}
const syntheticScenario = syntheticEmployeeRecords
    .filter((employee) => employee.employee_group === "Account Executive")
    .map((employee) => {
        const actualCommission = employee.commission_usd;
        const proposedCommission = employee["Current Role"] === "SMB Account Executive"
            ? proposedSMBCommission(employee.credited_revenue, employee.is_ramping)
            : actualCommission;
        return {
            name: employee.name,
            role: employee["Current Role"],
            isRamping: employee.is_ramping,
            creditedRevenue: employee.credited_revenue,
            actualCommission,
            proposedCommission,
            scenarioDelta: roundMoney(proposedCommission - actualCommission),
        };
    });

// Fictional exception illustrations, not copied case-study measurements.
const syntheticExceptions = [
    {rank: 1, severity: "Critical", exception_type: "Later Closed Won opportunities would restart existing accounts", dataset: "Synthetic CRM / Synthetic Billing", records_touched: 18, credit_or_revenue_affected: 92500, payout_impact_usd: 15140, reps_affected: 12, treatment: "Use the earliest Closed Won opportunity to establish account go-live. Later expansions or renewals do not restart the 90-day new-customer window."},
    {rank: 2, severity: "High", exception_type: "AE credit recognized outside employment dates", dataset: "Synthetic HR / Synthetic Billing", records_touched: 41, credit_or_revenue_affected: 17450, payout_impact_usd: 1280, reps_affected: 3, treatment: "Pay individual AE credit only when the AE was employed on the recognition date. Preserve post-termination manager carry where the plan explicitly requires it."},
    {rank: 3, severity: "High", exception_type: "Closed Won account has no AE owner", dataset: "Synthetic CRM", records_touched: 3, credit_or_revenue_affected: 2150, payout_impact_usd: 0, reps_affected: 0, treatment: "Do not reassign a missing opportunity owner. Keep the credit unassigned and flag it for review."},
    {rank: 4, severity: "High", exception_type: "Stale closed_won_date on non-Closed-Won opportunity", dataset: "Synthetic CRM", records_touched: 8, credit_or_revenue_affected: 0, payout_impact_usd: 0, reps_affected: 6, treatment: "Ignore closed_won_date where opportunity_stage is not Closed Won. Opportunity stage governs."},
    {rank: 5, severity: "Low", exception_type: "Message extract row-count discrepancy", dataset: "Synthetic Messages", records_touched: 5, credit_or_revenue_affected: 0, payout_impact_usd: 0, reps_affected: 0, treatment: "Document the mismatch between the message extract and its accompanying summary; retain the raw extract for review."},
];

const total = (items) => roundMoney(items.reduce((sum, item) => sum + item.commission_usd, 0));
const payoutGroups = ["Account Executive", "Account Manager", "Management"];
const summary = payoutGroups.map((group) => ({
    group,
    employees: syntheticEmployeeRecords.filter((e) => e.employee_group === group).length,
    commission: total(syntheticEmployeeRecords.filter((e) => e.employee_group === group)),
}));
const scenarioMatches = syntheticScenario.every((item) =>
    item.actualCommission === aeByName.get(item.name).commission &&
    item.scenarioDelta === roundMoney(item.proposedCommission - item.actualCommission)
);
const managementMatches = syntheticEmployeeRecords
    .filter((item) => item.employee_group === "Management")
    .every((item) => item.commission_usd === roundMoney(item.metric_1_commission_usd + item.metric_2_commission_usd));
const uniqueIds = new Set(syntheticEmployeeRecords.map((item) => item.hr_id)).size === 80;
const checksPassed = syntheticEmployeeRecords.length === 80 &&
    syntheticScenario.length === 38 && syntheticExceptions.length === 5 &&
    uniqueIds && scenarioMatches && managementMatches &&
    results.every((item) => item.teamSize === item.expected) &&
    managementRateChecks.every((item) => item.matches) &&
    spiffChecks.every((item) => item.matches) &&
    amCommissionChecks.every((item) => item.matches) &&
    aeCommissionChecks.every((item) => item.matches);

console.log("\nPortfolio data validation:");
console.table(summary);
console.log("80 employees / 38 scenario rows / 5 exceptions:",
    syntheticEmployeeRecords.length, syntheticScenario.length, syntheticExceptions.length);
console.log("Unique synthetic IDs:", uniqueIds);
console.log("Scenario reconciles:", scenarioMatches);
console.log("Management reconciles:", managementMatches);
console.log("All validations passed:", checksPassed);
if (!checksPassed) throw new Error("Validation failed; dashboard files were not written.");

if (process.argv.includes("--write")) {
    for (const [filename, records] of [
        ["employees.json", syntheticEmployeeRecords],
        ["scenario.json", syntheticScenario],
        ["exceptions.json", syntheticExceptions],
    ]) {
        const target = path.join(dataFolder, filename);
        fs.writeFileSync(target, JSON.stringify(records, null, 2) + "\n", "utf8");
        console.log("Wrote", target);
    }
} else {
    console.log("Preview only. Run with --write to replace the three dashboard JSON files.");
}
