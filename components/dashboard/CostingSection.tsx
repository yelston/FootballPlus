import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CostingData } from './types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface CostingSectionProps {
  costingData: CostingData
}

export function CostingSection({ costingData }: CostingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Costing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Total */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Total Monthly All-In Cost</p>
          <p className="mt-1 text-3xl font-bold">
            {formatCurrency(costingData.totalAllInMonthlyCost)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Based on current cost engine entries</p>
        </div>

        {/* Staff table */}
        {costingData.byStaff.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">By Staff Member</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Monthly Cost</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Hourly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {costingData.byStaff.map((row, i) => (
                    <tr key={row.userId} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.role ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.allInMonthlyCost != null ? formatCurrency(row.allInMonthlyCost) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {row.blendedHourlyCost != null ? formatCurrency(row.blendedHourlyCost) + '/hr' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Manage entries in the{' '}
              <a href="/staff" className="underline underline-offset-2 hover:text-foreground">
                Staff section
              </a>
            </p>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">No costing entries yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
