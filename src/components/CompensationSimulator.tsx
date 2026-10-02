import { useState } from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import scenarioData from '../data/scenario.json'
import {
  calculateScenarioCommission,
  SMB_COMMISSION_RULES,
  type ScenarioEmployee,
} from '../utils/commissions'
import './CompensationSimulator.css'

const employees = scenarioData as ScenarioEmployee[]

const money = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

export default function CompensationSimulator() {
  const [tier1, setTier1] = useState(1.3)
  const [tier2, setTier2] = useState(1.5)

  const results = employees.map((employee) => {
    const simulated = calculateScenarioCommission(employee, tier1, tier2)

    return {
      ...employee,
      simulated,
      delta: simulated - employee.actualCommission,
    }
  })

  const currentTotal = results.reduce(
    (sum, employee) => sum + employee.actualCommission, 0
  )

  const simulatedTotal = results.reduce(
    (sum, employee) => sum + employee.simulated, 0
  )

  const delta = simulatedTotal - currentTotal

  const affected = results.filter(
    (employee) => Math.abs(employee.delta) > 0.005
  ).length

  return (
    <div className="simulator-stack">
      <section className="simulator-controls">
        <div className="simulator-section-heading">
          <div>
            <div className="eyebrow">SCENARIO MODELING</div>
            <h2>SMB AE Accelerator Simulator</h2>
            <p>
              Adjust the marginal accelerator multipliers to model June 2026
              commission expense. Ramping and Enterprise AEs remain unchanged.
            </p>
          </div>
          <button
            className="simulator-reset"
            type="button"
            onClick={() => {
              setTier1(SMB_COMMISSION_RULES.proposedTier1Multiplier)
              setTier2(SMB_COMMISSION_RULES.proposedTier2Multiplier)
            }}
          >
            <RotateCcw size={16} />
            Reset scenario
          </button>
        </div>

        <div className="simulator-slider-grid">
          <div className="simulator-slider-card">
            <div className="simulator-slider-top">
              <div>
                <span className="simulator-slider-label">TIER 1 ACCELERATOR</span>
                <p>$30,000–$40,000 credited revenue</p>
              </div>
              <strong>{tier1.toFixed(2)}×</strong>
            </div>
            <input
              aria-label="Tier 1 accelerator multiplier"
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={tier1}
              onChange={(event) => setTier1(Number(event.target.value))}
            />
            <div className="simulator-slider-scale">
              <span>1.00×</span>
              <span>Current: 1.20×</span>
              <span>2.00×</span>
            </div>
          </div>

          <div className="simulator-slider-card">
            <div className="simulator-slider-top">
              <div>
                <span className="simulator-slider-label">TIER 2 ACCELERATOR</span>
                <p>Above $40,000 credited revenue</p>
              </div>
              <strong>{tier2.toFixed(2)}×</strong>
            </div>
            <input
              aria-label="Tier 2 accelerator multiplier"
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={tier2}
              onChange={(event) => setTier2(Number(event.target.value))}
            />
            <div className="simulator-slider-scale">
              <span>1.00×</span>
              <span>Current: 1.30×</span>
              <span>2.00×</span>
            </div>
          </div>
        </div>
      </section>

      <section className="simulator-metrics">
        <article>
          <span>CURRENT AE COMMISSIONS</span>
          <strong>{money(currentTotal)}</strong>
          <small>Original June 2026 payouts</small>
        </article>
        <article>
          <span>SIMULATED AE COMMISSIONS</span>
          <strong>{money(simulatedTotal)}</strong>
          <small>Based on selected multipliers</small>
        </article>
        <article>
          <span>INCREMENTAL EXPENSE</span>
          <strong className={delta >= 0 ? 'simulator-positive' : 'simulator-negative'}>
            {delta > 0 ? '+' : ''}{money(delta)}
          </strong>
          <small>Change from original commissions</small>
        </article>
        <article>
          <span>EMPLOYEES AFFECTED</span>
          <strong>{affected}</strong>
          <small>Of {employees.length} Account Executives</small>
        </article>
      </section>

      <section className="simulator-table-panel">
        <div className="simulator-section-heading">
          <div>
            <div className="eyebrow">EMPLOYEE-LEVEL IMPACT</div>
            <h2>Scenario Comparison</h2>
            <p>Original and simulated commissions for all Account Executives.</p>
          </div>
          <SlidersHorizontal size={20} />
        </div>

        <div className="simulator-table-scroll">
          <table className="simulator-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>ROLE</th>
                <th className="numeric">CREDITED REVENUE</th>
                <th className="numeric">CURRENT</th>
                <th className="numeric">SIMULATED</th>
                <th className="numeric">CHANGE</th>
              </tr>
            </thead>
            <tbody>
              {[...results]
                .sort((a, b) => b.delta - a.delta)
                .map((employee) => (
                  <tr key={employee.name}>
                    <td className="simulator-employee-name">
                      {employee.name}
                      {employee.isRamping && <small>Ramping</small>}
                    </td>
                    <td>{employee.role}</td>
                    <td className="numeric">{money(employee.creditedRevenue)}</td>
                    <td className="numeric">{money(employee.actualCommission)}</td>
                    <td className="numeric">{money(employee.simulated)}</td>
                    <td className={`numeric ${
                      employee.delta > 0.005
                        ? 'simulator-positive'
                        : employee.delta < -0.005
                          ? 'simulator-negative'
                          : ''
                    }`}>
                      {employee.delta > 0.005 ? '+' : ''}
                      {money(employee.delta)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
