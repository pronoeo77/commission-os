import { useState } from 'react'
import employeeData from '../data/employees.json'
import './CommissionLogic.css'

type Employee = {
  name: string
  'Current Role': string
  employee_group: string
  commission_usd: number
  credited_revenue?: number
  produced_credit?: number
  ramp_floor?: number
  is_ramping?: boolean
  base_commission_usd?: number
  retention_spiff_usd?: number
  retained_100_pct?: boolean
  new_rollup_credit?: number
  existing_rollup_credit?: number
  metric_1_commission_usd?: number
  metric_2_commission_usd?: number
  all_descendants?: number
}

const employees: Employee[] = employeeData

const money = (value = 0) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

function CommissionLogic() {
  const [selectedId, setSelectedId] = useState(employees[0].name)

  const employee =
    employees.find((item) => item.name === selectedId) ??
    employees[0]

  const isAE = employee.employee_group === 'Account Executive'
  const isAM = employee.employee_group === 'Account Manager'

  const revenue = employee.credited_revenue ?? 0
  const role = employee['Current Role']

  const isSMB = role.startsWith('SMB')
  const rate = isSMB ? 0.16 : 0.10
  const tier1 = isSMB ? 30000 : 60000
  const tier2 = isSMB ? 40000 : 80000

  const baseRevenue = Math.min(revenue, tier1)
  const middleRevenue = Math.max(
    Math.min(revenue, tier2) - tier1,
    0
  )
  const topRevenue = Math.max(revenue - tier2, 0)

  const aePayRows = employee.is_ramping
    ? [
      {
        label: `All credited revenue at ${(rate * 100).toFixed(0)}%`,
        amount: revenue * rate,
      },
    ]
    : [
      {
        label: `First ${money(tier1)} at ${(rate * 100).toFixed(0)}%`,
        amount: baseRevenue * rate,
      },
      {
        label: `Next ${money(middleRevenue)} at ${(rate * 120).toFixed(0)}%`,
        amount: middleRevenue * rate * 1.2,
      },
      {
        label: `Remaining ${money(topRevenue)} at ${(rate * 130).toFixed(0)}%`,
        amount: topRevenue * rate * 1.3,
      },
    ]
  const amBaseRate =
    revenue > 0
      ? (employee.base_commission_usd ?? 0) / revenue
      : 0

  const amPayRows = [
    {
      label: 'Base commission',
      formula: `${money(revenue)} × ${(amBaseRate * 100).toFixed(4)}%`,
      amount: employee.base_commission_usd ?? 0,
    },
    {
      label: 'Retention SPIFF',
      amount: employee.retention_spiff_usd ?? 0,
    },
  ]

  const managementIsHead = role === 'Head of Sales & AM'
  const managementIsSales =
    role.includes('AE Manager') || role === 'Director of Sales'

  const managementPayRows = managementIsHead
    ? [
      {
        label: 'New-customer revenue',
        revenue: employee.new_rollup_credit ?? 0,
        amount: employee.metric_1_commission_usd ?? 0,
      },
      {
        label: 'Existing-customer revenue',
        revenue: employee.existing_rollup_credit ?? 0,
        amount: employee.metric_2_commission_usd ?? 0,
      },
    ]
    : [
      {
        label: managementIsSales
          ? 'New-customer revenue'
          : 'Existing-customer revenue',
        revenue: managementIsSales
          ? (employee.new_rollup_credit ?? 0)
          : (employee.existing_rollup_credit ?? 0),
        amount: employee.metric_1_commission_usd ?? 0,
      },
    ]

  const steps = isAE
    ? [
      {
        title: '1. Your credited revenue',
        value: money(revenue),
        detail: `Produced credit: ${money(employee.produced_credit)}.
Ramp floor: ${money(employee.ramp_floor)}.`,
      },
      {
        title: '2. Your commission rules',
        value: employee.is_ramping
          ? 'Standard rate'
          : 'Accelerator tiers',
        detail: 'Higher commission rates apply only to revenue within each tier.',
      },
    ]
    : isAM
      ? [
        {
          title: '1. Your credited revenue',
          value: money(revenue),
          detail: `Credited revenue is the higher of produced credit (${money(employee.produced_credit)}) and ramp floor (${money(employee.ramp_floor)}).`,
        },
        {
          title: '2. Your base commission',
          value: money(employee.base_commission_usd),
          detail: 'Base commission equals credited revenue multiplied by your role-specific payout rate.',
        },
        {
          title: '3. Your retention bonus',
          value: money(employee.retention_spiff_usd),
          detail: `100% retention requirement: ${employee.retained_100_pct ? 'Met' : 'Not met'}. Ramping: ${employee.is_ramping ? 'Yes' : 'No'}. Eligible non-ramping SMB Account Managers receive $500; Enterprise Account Managers receive $1,500.`,
        },
      ]
      : [
        {
          title: '1. Your team revenue',
          value: money(
            (employee.new_rollup_credit ?? 0) +
            (employee.existing_rollup_credit ?? 0)
          ),
          detail: `New-customer credit: ${money(employee.new_rollup_credit)}. Existing-customer credit: ${money(employee.existing_rollup_credit)}. Reporting descendants: ${employee.all_descendants ?? 0}.`,
        },
        {
          title: '2. Your commission components',
          value: money(
            (employee.metric_1_commission_usd ?? 0) +
            (employee.metric_2_commission_usd ?? 0)
          ),
          detail: `First commission component: ${money(employee.metric_1_commission_usd)}. Second commission component: ${money(employee.metric_2_commission_usd)}. Applicable revenue metrics depend on the management role.`,
        },
      ]

  return (
    <div className="logic-page">
      <div className="eyebrow">COMMISSION TRANSPARENCY</div>
      <h2>How Was My Commission Calculated?</h2>
      <p>
        Select an employee to see the June 2026 commission
        calculation explained step by step.
      </p>

      <div className="logic-selector">
        <label htmlFor="commission-employee">Select employee</label>
        <select
          id="commission-employee"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {employees.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} — {item['Current Role']}
            </option>
          ))}
        </select>
      </div>

      <div className="logic-workflow">
        {steps.map((step) => (
          <div className="logic-step" key={step.title}>
            <h3>{step.title}</h3>
            <strong>{step.value}</strong>
            <details>
              <summary>Show how this was calculated</summary>

              {isAE && step.title === '2. Your commission rules' ? (
                <div className="logic-pay-statement">
                  {aePayRows.map((row, index) => (
                    <div className="logic-pay-row" key={index}>
                      <span>{row.label}</span>
                      <strong>{money(row.amount)}</strong>
                    </div>
                  ))}

                  <div className="logic-pay-row logic-pay-total">
                    <span>Total commission</span>
                    <strong>{money(employee.commission_usd)}</strong>
                  </div>

                  <p>
                    {employee.is_ramping
                      ? 'Ramping employees receive the standard commission rate without accelerators.'
                      : 'Higher commission rates apply only to revenue within each tier.'}
                  </p>
                </div>
              ) : isAM && step.title === '3. Your retention bonus' ? (
                <div className="logic-pay-statement">
                  {amPayRows.map((row) => (
                    <div className="logic-pay-row" key={row.label}>
                      <span>
                        {row.label}
                        {'formula' in row && row.formula && (
                          <small className="logic-pay-formula">
                            {row.formula}
                          </small>
                        )}
                      </span>
                      <strong>{money(row.amount)}</strong>
                    </div>
                  ))}

                  <div className="logic-pay-row logic-pay-total">
                    <span>Total commission</span>
                    <strong>{money(employee.commission_usd)}</strong>
                  </div>

                  <p>
                    The retention SPIFF is paid only when the employee meets
                    the 100% retention requirement and is not ramping.
                  </p>
                </div>
              ) : !isAE && !isAM && step.title === '2. Your commission components' ? (
                <div className="logic-pay-statement">
                  {managementPayRows.map((row) => {
                    const rate = row.revenue > 0
                      ? row.amount / row.revenue
                      : 0

                    return (
                      <div className="logic-pay-row" key={row.label}>
                        <span>
                          {row.label}
                          <small className="logic-pay-formula">
                            {money(row.revenue)} × {(rate * 100).toFixed(4)}%
                          </small>
                        </span>
                        <strong>{money(row.amount)}</strong>
                      </div>
                    )
                  })}

                  <div className="logic-pay-row logic-pay-total">
                    <span>Total commission</span>
                    <strong>{money(employee.commission_usd)}</strong>
                  </div>

                  <p>
                    Management commissions are calculated from eligible team revenue,
                    not as a percentage of employees' commission payments.
                  </p>
                </div>
              ) : (
                <p>{step.detail}</p>
              )}

            </details>
          </div>
        ))}

        <div className="logic-step logic-final">
          <h3>Your Final Commission</h3>
          <strong>{money(employee.commission_usd)}</strong>
          <p>{role} · June 2026</p>
        </div>
      </div>
    </div>
  )
}

export default CommissionLogic