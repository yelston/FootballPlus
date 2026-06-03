import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FundingRegisterList } from '@/components/funding-register/FundingRegisterList'

export default async function FundingRegisterPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!['admin', 'board'].includes(user.role)) {
    redirect('/')
  }

  const supabase = createClient()

  const { data: entriesRaw } = await supabase
    .from('funding_register')
    .select('*')
    .order('created_at', { ascending: false })

  const entries = (entriesRaw ?? []).map((row: any) => ({
    id: row.id as string,
    grant_donor_name: row.grant_donor_name as string,
    restriction_type: row.restriction_type as string,
    programme: row.programme as string,
    grant_code: row.grant_code as string | null,
    start_date: row.start_date as string | null,
    end_date: row.end_date as string | null,
    awarded_amount: row.awarded_amount as number | null,
    cash_received_ytd: row.cash_received_ytd as number | null,
    budget_allocated_ytd: row.budget_allocated_ytd as number | null,
    total_spend_charged_ytd: row.total_spend_charged_ytd as number | null,
    reporting_due: row.reporting_due as string | null,
    required_kpi_notes: row.required_kpi_notes as string | null,
    other_non_labour_spend_ytd: row.other_non_labour_spend_ytd as number | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))

  return (
    <FundingRegisterList
      initialEntries={entries}
      canEdit={user.role === 'admin'}
    />
  )
}
