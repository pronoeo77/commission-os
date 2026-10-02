import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, ShieldAlert, SlidersHorizontal, Workflow,
  TrendingUp, ArrowUpRight, CalendarDays, Search, ChevronDown, X,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import employeeData from './data/employees.json'
import exceptionData from './data/exceptions.json'
import CompensationSimulator from './components/CompensationSimulator'
import CommissionLogic from './components/CommissionLogic'
import './App.css'

type Employee = {
  name: string
  'Current Role': string
  employee_group: string
  commission_usd: number
  credited_revenue?: number
  produced_credit?: number
  attainment?: number
  prorated_quota?: number
  is_ramping?: boolean
  ramp_floor?: number
  retention_ratio?: number
  retention_spiff_usd?: number
  existing_accounts?: number
  base_commission_usd?: number
  new_rollup_credit?: number
  existing_rollup_credit?: number
  metric_1_commission_usd?: number
  metric_2_commission_usd?: number
  all_descendants?: number
}

const employees = employeeData as Employee[]
const money = (amount: number | undefined) =>
  (amount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const percent = (ratio: number | undefined) =>
  ratio === undefined ? '—' : `${(ratio * 100).toFixed(1)}%`

const groups = ['All Employees', 'Account Executive', 'Account Manager', 'Management']
const groupTotals = groups.slice(1).map((group) => ({
  group,
  people: employees.filter((employee) => employee.employee_group === group),
}))
const totalPayout = employees.reduce((sum, employee) => sum + employee.commission_usd, 0)
const metrics = [
  { label: 'Total Commissions', value: money(totalPayout), detail: 'June 2026 · Corrected', icon: TrendingUp },
  { label: 'Account Executives', value: money(groupTotals[0].people.reduce((sum, employee) => sum + employee.commission_usd, 0)), detail: `${groupTotals[0].people.length} employees`, icon: Users },
  { label: 'Account Managers', value: money(groupTotals[1].people.reduce((sum, employee) => sum + employee.commission_usd, 0)), detail: `${groupTotals[1].people.length} employees`, icon: ArrowUpRight },
  { label: 'Management', value: money(groupTotals[2].people.reduce((sum, employee) => sum + employee.commission_usd, 0)), detail: `${groupTotals[2].people.length} employees`, icon: Workflow },
]
const navigation = [
  { label: 'Executive Overview', icon: LayoutDashboard },
  { label: 'Commission Explorer', icon: Users },
  { label: 'Revenue Integrity', icon: ShieldAlert },
  { label: 'Compensation Simulator', icon: SlidersHorizontal },
  { label: 'Commission Logic', icon: Workflow },
]
const commissionChartData = groupTotals.map(({ group, people }) => ({
  category: group === 'Account Executive' ? 'Account Executives' : group === 'Account Manager' ? 'Account Managers' : 'Management',
  commissions: people.reduce((sum, employee) => sum + employee.commission_usd, 0),
}))

function DetailField({ label, value }: { label: string; value: string }) {
  return <div className="explorer-detail-field"><span>{label}</span><strong>{value}</strong></div>
}

function CommissionExplorer() {
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('All Employees')
  const [sort, setSort] = useState('highest')
  const [selectedName, setSelectedName] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedName) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedName(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedName])
  const filtered = employees.filter((employee) =>
    (group === 'All Employees' || employee.employee_group === group) &&
    `${employee.name} ${employee['Current Role']}`.toLowerCase().includes(search.toLowerCase().trim()),
  ).sort((a, b) => sort === 'highest' ? b.commission_usd - a.commission_usd : sort === 'lowest' ? a.commission_usd - b.commission_usd : a.name.localeCompare(b.name))
  const selected = employees.find((employee) => employee.name === selectedName)
  const filteredTotal = filtered.reduce((sum, employee) => sum + employee.commission_usd, 0)

  return (
    <div className="explorer-stack">
      <section className="explorer-summary">
        <div><span>EMPLOYEES SHOWN</span><strong>{filtered.length}<small> / {employees.length}</small></strong></div>
        <div><span>FILTERED PAYOUT</span><strong>{money(filteredTotal)}</strong></div>
        <div><span>AVERAGE PAYOUT</span><strong>{money(filtered.length ? filteredTotal / filtered.length : 0)}</strong></div>
      </section>
      <section className="explorer-panel">
        <div className="explorer-panel-heading"><div><div className="eyebrow">EMPLOYEE-LEVEL ANALYSIS</div><h2>Commission Ledger</h2><p>Explore corrected June 2026 payouts across all employee groups.</p></div><span className="explorer-count">{filtered.length} records</span></div>
        <div className="explorer-toolbar">
          <label className="explorer-search"><Search size={17}/><input aria-label="Search employees" placeholder="Search employee or role..." value={search} onChange={(event) => setSearch(event.target.value)}/></label>
          <label className="explorer-select"><select aria-label="Filter employee group" value={group} onChange={(event) => setGroup(event.target.value)}>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={16}/></label>
          <label className="explorer-select"><select aria-label="Sort employees" value={sort} onChange={(event) => setSort(event.target.value)}><option value="highest">Payout: High to Low</option><option value="lowest">Payout: Low to High</option><option value="name">Name: A to Z</option></select><ChevronDown size={16}/></label>
        </div>
        <div className="explorer-table-scroll"><table className="explorer-table"><thead><tr><th>EMPLOYEE</th><th>ROLE</th><th>GROUP</th><th className="numeric">CREDITED REVENUE</th><th className="numeric">ATTAINMENT</th><th className="numeric">COMMISSION</th></tr></thead><tbody>{filtered.map((employee) => <tr key={employee.name} className={selectedName === employee.name ? 'selected' : ''} onClick={() => setSelectedName(employee.name)}><td><button className="explorer-name" type="button" onClick={() => setSelectedName(employee.name)}>{employee.name}</button></td><td>{employee['Current Role']}</td><td><span className="explorer-group-tag">{employee.employee_group}</span></td><td className="numeric">{employee.employee_group === 'Management' ? '—' : money(employee.credited_revenue)}</td><td className="numeric">{percent(employee.attainment)}</td><td className="numeric explorer-commission">{money(employee.commission_usd)}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="explorer-empty">No employees match your search.</p>}</div>
      </section>
      {selected && (
        <div className="commission-drawer-layer">
          <button className="commission-drawer-backdrop" type="button" aria-label="Close commission details" onClick={() => setSelectedName(null)} />
          <aside className="commission-drawer" role="dialog" aria-modal="true" aria-label={`Commission details for ${selected.name}`}>
            <div className="commission-drawer-header">
              <div><div className="eyebrow">COMMISSION BREAKDOWN</div><h2>{selected.name}</h2><p>{selected['Current Role']} · June 2026</p></div>
              <button className="commission-drawer-close" type="button" aria-label="Close details" onClick={() => setSelectedName(null)}><X size={20}/></button>
            </div>
            <div className="commission-drawer-content">
              <div className="commission-drawer-total"><span>Total commission</span><strong>{money(selected.commission_usd)}</strong></div>
              <div className="commission-drawer-fields">
                {selected.employee_group === 'Management' ? <>
                  <DetailField label="New customer rollup" value={money(selected.new_rollup_credit)}/>
                  <DetailField label="Existing customer rollup" value={money(selected.existing_rollup_credit)}/>
                  <DetailField label="New customer commission component" value={money(selected.metric_1_commission_usd)}/>
                  <DetailField label="Existing customer commission component" value={money(selected.metric_2_commission_usd)}/>
                  <DetailField label="Team descendants" value={String(selected.all_descendants ?? '—')}/>
                </> : <>
                  <DetailField label="Credited revenue" value={money(selected.credited_revenue)}/>
                  <DetailField label="Produced credit" value={money(selected.produced_credit)}/>
                  <DetailField label="Prorated quota" value={money(selected.prorated_quota)}/>
                  <DetailField label="Quota attainment" value={percent(selected.attainment)}/>
                  <DetailField label="Ramping" value={selected.is_ramping ? 'Yes' : 'No'}/>
                  <DetailField label="Ramp floor" value={money(selected.ramp_floor)}/>
                  {selected.employee_group === 'Account Manager' && <>
                    <DetailField label="Existing accounts" value={String(selected.existing_accounts ?? '—')}/>
                    <DetailField label="Retention ratio" value={percent(selected.retention_ratio)}/>
                    <DetailField label="Retention SPIFF" value={money(selected.retention_spiff_usd)}/>
                    <DetailField label="Base commission" value={money(selected.base_commission_usd)}/>
                  </>}
                </>}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}


type RevenueException = {
  rank: number
  severity: 'Critical' | 'High' | 'Low'
  exception_type: string
  dataset: string
  records_touched: number
  credit_or_revenue_affected: number
  payout_impact_usd: number
  reps_affected: number
  treatment: string
}

const exceptions = exceptionData as RevenueException[]
const exceptionExposure = exceptions.reduce((sum, item) => sum + item.payout_impact_usd, 0)

function RevenueIntegrity() {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('All Severities')
  const [selectedRank, setSelectedRank] = useState<number | null>(null)
  const selected = exceptions.find((item) => item.rank === selectedRank)
  const filtered = exceptions.filter((item) =>
    (severity === 'All Severities' || item.severity === severity) &&
    `${item.exception_type} ${item.dataset} ${item.treatment}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  useEffect(() => {
    if (selectedRank === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedRank(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedRank])

  return (
    <div className="explorer-stack">
      <section className="explorer-summary integrity-summary">
        <div><span>CONTROL EXCEPTIONS</span><strong>{exceptions.length}</strong><small>Documented findings</small></div>
        <div><span>QUANTIFIED PAYOUT EXPOSURE</span><strong>{money(exceptionExposure)}</strong><small>Exception ledger exposure, not net correction</small></div>
        <div><span>CRITICAL / HIGH FINDINGS</span><strong>{exceptions.filter((item) => item.severity !== 'Low').length}</strong><small>1 Critical · 3 High</small></div>
      </section>
      <section className="explorer-panel">
        <div className="explorer-panel-heading">
          <div><div className="eyebrow">REVENUE CONTROL ANALYSIS</div><h2>Exceptions Ledger</h2><p>June 2026 findings, payout exposure, and documented treatments.</p></div>
          <span className="explorer-count">{filtered.length} of {exceptions.length} findings</span>
        </div>
        <div className="explorer-toolbar">
          <label className="explorer-search"><Search size={17}/><input aria-label="Search exceptions" placeholder="Search exceptions or datasets..." value={query} onChange={(event) => setQuery(event.target.value)}/></label>
          <label className="explorer-select"><select aria-label="Filter severity" value={severity} onChange={(event) => setSeverity(event.target.value)}>{['All Severities', 'Critical', 'High', 'Low'].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16}/></label>
        </div>
        <div className="explorer-table-scroll">
          <table className="explorer-table integrity-table">
            <thead><tr><th>RANK</th><th>SEVERITY</th><th>CONTROL EXCEPTION</th><th className="numeric">RECORDS</th><th className="numeric">REPS</th><th className="numeric">PAYOUT EXPOSURE</th></tr></thead>
            <tbody>{filtered.map((item) => <tr key={item.rank} onClick={() => setSelectedRank(item.rank)} className={selectedRank === item.rank ? 'selected' : ''}>
              <td>#{item.rank}</td><td><span className={`integrity-severity severity-${item.severity.toLowerCase()}`}>{item.severity}</span></td>
              <td className="integrity-exception-name"><button className="explorer-name" type="button" onClick={() => setSelectedRank(item.rank)}>{item.exception_type}</button><span>{item.dataset}</span></td>
              <td className="numeric">{item.records_touched.toLocaleString()}</td><td className="numeric">{item.reps_affected.toLocaleString()}</td>
              <td className="numeric explorer-commission">{money(item.payout_impact_usd)}</td>
            </tr>)}</tbody>
          </table>
          {filtered.length === 0 && <p className="explorer-empty">No exceptions match your filters.</p>}
        </div>
        <p className="integrity-footnote">Payout exposure is the sum of amounts documented in the Exceptions Ledger; it is not the net difference between corrected and uncorrected commissions.</p>
      </section>
      {selected && <div className="commission-drawer-layer">
        <button className="commission-drawer-backdrop" type="button" aria-label="Close exception details" onClick={() => setSelectedRank(null)}/>
        <aside className="commission-drawer" role="dialog" aria-modal="true" aria-label={`Details for ${selected.exception_type}`}>
          <div className="commission-drawer-header"><div><div className="eyebrow">CONTROL EXCEPTION #{selected.rank}</div><h2>{selected.exception_type}</h2><span className={`integrity-severity severity-${selected.severity.toLowerCase()}`}>{selected.severity}</span></div><button className="commission-drawer-close" type="button" aria-label="Close details" onClick={() => setSelectedRank(null)}><X size={20}/></button></div>
          <div className="commission-drawer-content">
            <div className="commission-drawer-total"><span>Quantified payout exposure</span><strong>{money(selected.payout_impact_usd)}</strong></div>
            <div className="commission-drawer-fields">
              <DetailField label="Records touched" value={String(selected.records_touched)}/>
              <DetailField label="Reps affected" value={String(selected.reps_affected)}/>
              <DetailField label="Credit or revenue affected" value={money(selected.credit_or_revenue_affected)}/>
              <div className="explorer-detail-field"><span>Source dataset</span><strong className="integrity-long-value">{selected.dataset}</strong></div>
              <div className="explorer-detail-field"><span>Documented corrective treatment</span><p className="integrity-treatment">{selected.treatment}</p></div>
            </div>
          </div>
        </aside>
      </div>}
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Executive Overview')
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">C</div><div><strong>CommissionOS</strong><span>Revenue Intelligence</span></div></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="navigation">{navigation.map((item) => { const Icon = item.icon; return <button type="button" className={`nav-item ${activePage === item.label ? 'active' : ''}`} key={item.label} onClick={() => setActivePage(item.label)}><Icon size={19} strokeWidth={1.8}/><span>{item.label}</span></button> })}</nav>
        <div className="sidebar-footer"><div className="status-dot"/>June 2026 · Analysis Ready</div>
      </aside>
      <main className="dashboard-main">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {activePage}</div><div className="period"><CalendarDays size={16}/>June 2026</div></header>
        <div className="dashboard-content">
          <div className="page-heading"><div><div className="eyebrow">REVENUE OPERATIONS</div><h1>{activePage}</h1><p>A unified view of commission performance, revenue credit, and compensation operations.</p></div><div className="report-tag"><span className="status-dot"/>Corrected Model</div></div>
          {activePage === 'Executive Overview' ? <>
            <section className="metrics-grid">{metrics.map((metric) => { const Icon = metric.icon; return <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><div className="metric-icon"><Icon size={19} strokeWidth={1.8}/></div></div><div className="metric-value">{metric.value}</div><div className="metric-detail">{metric.detail}</div></article> })}</section>
            <section className="insight-panel"><div><div className="eyebrow">MONTHLY SNAPSHOT</div><h2>June 2026 Commission Summary</h2><p>Commission payouts across account executives, account managers, and management.</p></div><div className="summary-rows">{commissionChartData.map((item) => <div key={item.category}><span>{item.category}</span><strong>{money(item.commissions)}</strong></div>)}<div className="summary-total"><span>Total Commissions</span><strong>{money(totalPayout)}</strong></div></div></section>
            <section className="insight-panel commission-chart-panel"><div><div className="eyebrow">PAYOUT ANALYSIS</div><h2>Commission Distribution</h2><p>Compare June 2026 commission payouts across the three employee groups.</p></div><div style={{ width: '100%', height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={commissionChartData} layout="vertical" margin={{ top: 10, right: 20, left: 15, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`}/><YAxis type="category" dataKey="category" width={135} tick={{ fontSize: 11 }}/><Tooltip formatter={(value) => money(Number(value))}/><Bar dataKey="commissions" fill="#7472ed" radius={[0, 6, 6, 0]} barSize={25}/></BarChart></ResponsiveContainer></div></section>
          </> : activePage === 'Commission Explorer' ? <CommissionExplorer/> : activePage === 'Revenue Integrity' ? <RevenueIntegrity/> : activePage === 'Compensation Simulator' ? <CompensationSimulator/> : activePage === 'Commission Logic' ? <CommissionLogic/> : <section className="insight-panel"><div><div className="eyebrow">COMMISSIONOS WORKSPACE</div><h2>{activePage}</h2><p>This workspace is being prepared for the June 2026 compensation analysis.</p></div></section>}
        </div>
      </main>
    </div>
  )
}
export default App
