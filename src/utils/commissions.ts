export const SMB_COMMISSION_RULES = {
  standardRate: 0.16,
  tier1Start: 30000,
  tier1End: 40000,
  tier2Start: 40000,
  currentTier1Multiplier: 1.2,
  currentTier2Multiplier: 1.3,
  proposedTier1Multiplier: 1.3,
  proposedTier2Multiplier: 1.5,
}

export type ScenarioEmployee = {
  name: string
  role: string
  isRamping: boolean
  creditedRevenue: number
  actualCommission: number
  proposedCommission: number
  scenarioDelta: number
}

export function calculateAcceleratedCommission(
  revenue: number,
  standardRate: number,
  tier1Multiplier: number,
  tier2Multiplier: number,
): number {
  const standardBand = Math.min(revenue, 30000)

  const tier1Revenue = Math.max(
    Math.min(revenue, 40000) - 30000,
    0,
  )

  const tier2Revenue = Math.max(revenue - 40000, 0)

  return (
    standardBand * standardRate +
    tier1Revenue * standardRate * tier1Multiplier +
    tier2Revenue * standardRate * tier2Multiplier
  )
}

export function calculateScenarioCommission(
  employee: ScenarioEmployee,
  tier1Multiplier: number,
  tier2Multiplier: number,
): number {
  if (employee.role !== 'SMB Account Executive') {
    return employee.actualCommission
  }

  if (employee.isRamping) {
    return employee.creditedRevenue * SMB_COMMISSION_RULES.standardRate
  }

  return calculateAcceleratedCommission(
    employee.creditedRevenue,
    SMB_COMMISSION_RULES.standardRate,
    tier1Multiplier,
    tier2Multiplier,
  )
}
