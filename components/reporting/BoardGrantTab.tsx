import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ComputedActuals } from '@/lib/reportingComputed'
import type { Database } from '@/types/database'

type ProgrammeMetricRow = Database['public']['Tables']['programme_metrics']['Row']

export interface FundingEntryLight {
  programme: string
  awarded_amount: number | null
  cash_received_ytd: number | null
  total_spend_charged_ytd: number | null
}

export interface StaffTimesheetRow {
  role: string | null
  program: string | null
  hours: number
}

interface BoardGrantTabProps {
  fundingEntries: FundingEntryLight[]
  staffTimesheetRows: StaffTimesheetRow[]
  computedActuals: ComputedActuals
  metrics: ProgrammeMetricRow[]
}

function fmtSGD(n: number): string {
  return `$${n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function sumField(entries: FundingEntryLight[], field: keyof FundingEntryLight): number {
  return entries.reduce((acc, e) => acc + (Number(e[field]) || 0), 0)
}

function sumFieldForProg(entries: FundingEntryLight[], prog: string, field: keyof FundingEntryLight): number {
  return entries
    .filter((e) => e.programme === prog)
    .reduce((acc, e) => acc + (Number(e[field]) || 0), 0)
}

function getNum(val: string | undefined): number {
  return parseInt(val ?? '0', 10) || 0
}

function deriveStatus(metrics: ProgrammeMetricRow[], programme: string | null): 'on_track' | 'needs_attention' | 'no_data' {
  const rows = programme
    ? metrics.filter((m) => m.programme === programme)
    : metrics
  if (rows.length === 0) return 'no_data'
  if (rows.some((m) => m.status === 'needs_attention' || m.status === 'off_track')) return 'needs_attention'
  if (rows.every((m) => m.status === 'on_track')) return 'on_track'
  return 'needs_attention'
}

function StatusBadge({ status }: { status: 'on_track' | 'needs_attention' | 'no_data' }) {
  if (status === 'on_track') {
    return <span className="rounded px-2 py-1 text-sm font-medium bg-green-100 text-green-800">On Track</span>
  }
  if (status === 'no_data') {
    return <span className="rounded px-2 py-1 text-sm font-medium bg-gray-100 text-gray-600">NO DATA</span>
  }
  return (
    <span className="rounded px-2 py-1 text-sm font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
      NEEDS ATTENTION
    </span>
  )
}

const PROGRAMME_ROWS = [
  {
    key: 'Champions',
    label: 'Champions',
    fundingKey: 'Champions',
    metricKey: 'champions',
    participantsPath: ['champions', 'active_players_enrolled'],
    completionsPath: ['champions', 'players_completing_full_season'],
    primaryOutcome: 'Football, academic & life-change outcomes',
  },
  {
    key: 'STAY in the Game',
    label: 'STAY in the Game',
    fundingKey: 'STAY in the Game',
    metricKey: 'stay_in_the_game',
    participantsPath: ['stay_in_the_game', 'participants_enrolled'],
    completionsPath: ['stay_in_the_game', 'participants_completing'],
    primaryOutcome: 'Mental wellbeing improvement',
  },
  {
    key: 'Schools',
    label: 'Schools',
    fundingKey: 'Schools',
    metricKey: 'schools',
    participantsPath: ['schools', 'total_students_reached'],
    completionsPath: null,
    primaryOutcome: 'Teacher satisfaction / Champions',
  },
] as const

export function BoardGrantTab({ fundingEntries, staffTimesheetRows, computedActuals, metrics }: BoardGrantTabProps) {
  // ── Portfolio Snapshot aggregates ──────────────────────────────────────────
  const totalAwarded = sumField(fundingEntries, 'awarded_amount')
  const totalCashReceived = sumField(fundingEntries, 'cash_received_ytd')
  const totalSpend = sumField(fundingEntries, 'total_spend_charged_ytd')
  const balanceRemaining = totalAwarded - totalSpend

  const champParticipants = getNum(computedActuals.champions?.active_players_enrolled?.ytd)
  const sitgParticipants = getNum(computedActuals.stay_in_the_game?.participants_enrolled?.ytd)
  const schoolsParticipants = getNum(computedActuals.schools?.total_students_reached?.ytd)
  const totalParticipants = champParticipants + sitgParticipants + schoolsParticipants

  const champCompletions = getNum(computedActuals.champions?.players_completing_full_season?.ytd)
  const sitgCompletions = getNum(computedActuals.stay_in_the_game?.participants_completing?.ytd)
  const totalCompletions = champCompletions + sitgCompletions

  const paidHours = staffTimesheetRows
    .filter((r) => r.role?.toLowerCase() !== 'volunteer')
    .reduce((acc, r) => acc + r.hours, 0)
  const volunteerHours = staffTimesheetRows
    .filter((r) => r.role?.toLowerCase() === 'volunteer')
    .reduce((acc, r) => acc + r.hours, 0)

  const costPerParticipant = totalParticipants > 0 ? totalSpend / totalParticipants : null
  const spendingPace = totalAwarded > 0 ? `${((totalSpend / totalAwarded) * 100).toFixed(0)}% of total` : '—'
  const portfolioStatus = deriveStatus(metrics, null)

  // ── Per-programme calculations ─────────────────────────────────────────────
  const progRows = PROGRAMME_ROWS.map((prog) => {
    const fundingReceived = sumFieldForProg(fundingEntries, prog.fundingKey, 'cash_received_ytd')
    const spendYTD = sumFieldForProg(fundingEntries, prog.fundingKey, 'total_spend_charged_ytd')
    const staffHours = staffTimesheetRows
      .filter((r) => r.program === prog.fundingKey && r.role?.toLowerCase() !== 'volunteer')
      .reduce((acc, r) => acc + r.hours, 0)
    const participants = getNum(computedActuals[prog.participantsPath[0]]?.[prog.participantsPath[1]]?.ytd)
    const completions = prog.completionsPath
      ? getNum(computedActuals[prog.completionsPath[0]]?.[prog.completionsPath[1]]?.ytd)
      : 0
    const cpp = participants > 0 ? spendYTD / participants : null
    const hpp = participants > 0 ? staffHours / participants : null
    const status = deriveStatus(metrics, prog.metricKey)
    const outcomeResult =
      participants > 0
        ? `${participants} reached; ${fmtSGD(cpp ?? 0)} cost/participant`
        : '—'

    return { ...prog, fundingReceived, spendYTD, staffHours, participants, completions, cpp, hpp, status, outcomeResult }
  })

  // Totals row
  const allFundingReceived = progRows.reduce((a, r) => a + r.fundingReceived, 0)
  const allSpendYTD = progRows.reduce((a, r) => a + r.spendYTD, 0)
  const allStaffHours = progRows.reduce((a, r) => a + r.staffHours, 0)
  const allCpp = totalParticipants > 0 ? allSpendYTD / totalParticipants : null
  const allHpp = totalParticipants > 0 ? allStaffHours / totalParticipants : null
  const allOutcomeResult =
    totalParticipants > 0
      ? `${totalParticipants} reached; ${fmtSGD(allCpp ?? 0)} cost/participant`
      : '—'

  // ── Snapshot metric cell helper ────────────────────────────────────────────
  const SnapRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-2 border-b border-gray-200 py-2 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
    </div>
  )

  const TH = 'px-3 py-2.5 text-left text-sm font-semibold text-white whitespace-nowrap'
  const TD = 'px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap'
  const TDR = 'px-3 py-2.5 text-sm text-gray-700 text-right tabular-nums whitespace-nowrap'

  return (
    <div className="space-y-6">
      {/* ── PORTFOLIO SNAPSHOT ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="bg-[#1e3a5f] px-4 py-2">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">Portfolio Snapshot</h2>
        </div>

        <div className="grid grid-cols-1 gap-0 divide-y divide-gray-200 bg-white sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          {/* Financial */}
          <div className="p-4">
            <SnapRow label="Total funding awarded (SGD)" value={fmtSGD(totalAwarded)} />
            <SnapRow label="Cash received YTD (SGD)" value={fmtSGD(totalCashReceived)} />
            <SnapRow label="Spend charged YTD (SGD)" value={fmtSGD(totalSpend)} />
            <SnapRow label="Balance remaining (SGD)" value={fmtSGD(balanceRemaining)} />
          </div>

          {/* Programme reach */}
          <div className="p-4">
            <SnapRow label="Participants reached YTD" value={String(totalParticipants)} />
            <SnapRow label="Programme completions YTD" value={String(totalCompletions)} />
            <SnapRow label="Paid staff hours YTD" value={paidHours.toFixed(1)} />
            <SnapRow label="Volunteer hours YTD" value={volunteerHours.toFixed(1)} />
          </div>

          {/* Outcomes */}
          <div className="p-4">
            <SnapRow label="Donor-ready case studies" value="0" />
            <SnapRow label="Overall cost / participant" value={costPerParticipant !== null ? fmtSGD(costPerParticipant) : '—'} />
            <div className="flex items-center justify-between gap-2 border-b border-gray-200 py-2">
              <span className="text-sm text-gray-600">Overall portfolio status</span>
              <StatusBadge status={portfolioStatus} />
            </div>
            <SnapRow label="Spending pace" value={spendingPace} />
          </div>
        </div>
      </div>

      {/* ── PROGRAMME SUMMARY TABLE ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="bg-[#1e3a5f] px-4 py-2">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            Programme Summary for Board Review
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="bg-[#1e3a5f]">
                <th className={`${TH} min-w-[140px]`}>Programme</th>
                <th className={`${TH} min-w-[120px] text-right`}>Funding Received YTD</th>
                <th className={`${TH} min-w-[100px] text-right`}>Spend YTD</th>
                <th className={`${TH} min-w-[110px] text-right`}>Paid Staff Hours</th>
                <th className={`${TH} min-w-[120px] text-right`}>Participants Reached</th>
                <th className={`${TH} min-w-[100px] text-right`}>Completions</th>
                <th className={`${TH} min-w-[120px] text-right`}>Cost / Participant</th>
                <th className={`${TH} min-w-[130px] text-right`}>Hours / Participant</th>
                <th className={`${TH} min-w-[170px]`}>Primary Outcome</th>
                <th className={`${TH} min-w-[200px]`}>Outcome Result</th>
                <th className={`${TH} min-w-[130px]`}>Overall Status</th>
                <th className={`${TH} min-w-[160px]`}>Board Action / Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {progRows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className={TD}>{row.label}</td>
                  <td className={TDR}>{fmtSGD(row.fundingReceived)}</td>
                  <td className={TDR}>{fmtSGD(row.spendYTD)}</td>
                  <td className={TDR}>{row.staffHours.toFixed(1)}</td>
                  <td className={TDR}>{row.participants}</td>
                  <td className={TDR}>{row.completions}</td>
                  <td className={TDR}>{row.cpp !== null ? fmtSGD(row.cpp) : '—'}</td>
                  <td className={TDR}>{row.hpp !== null ? row.hpp.toFixed(2) : '—'}</td>
                  <td className={TD}>{row.primaryOutcome}</td>
                  <td className={TD}>{row.outcomeResult}</td>
                  <td className={`${TD}`}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className={TD}></td>
                </tr>
              ))}

              {/* All Programmes totals row */}
              <tr className="bg-blue-50 font-semibold">
                <td className={`${TD} font-semibold`}>All Programmes</td>
                <td className={TDR}>{fmtSGD(allFundingReceived)}</td>
                <td className={TDR}>{fmtSGD(allSpendYTD)}</td>
                <td className={TDR}>{allStaffHours.toFixed(1)}</td>
                <td className={TDR}>{totalParticipants}</td>
                <td className={TDR}>{totalCompletions}</td>
                <td className={TDR}>{allCpp !== null ? fmtSGD(allCpp) : '—'}</td>
                <td className={TDR}>{allHpp !== null ? allHpp.toFixed(2) : '—'}</td>
                <td className={TD}>Portfolio level</td>
                <td className={TD}>{allOutcomeResult}</td>
                <td className={TD}>
                  <StatusBadge status={portfolioStatus} />
                </td>
                <td className={TD}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FUNDING REGISTER LINK ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Link
          href="/funding-register"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          View Funding Register
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
