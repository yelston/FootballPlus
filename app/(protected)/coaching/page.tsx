import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CoachingView } from '@/components/coaching/CoachingView'
import type { Database } from '@/types/database'
import { redirect } from 'next/navigation'

type CoachingDocumentRow = Database['public']['Tables']['coaching_documents']['Row']
type UserNameRow = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'name'>

export default async function CoachingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const canEdit = user.role === 'admin'

  const supabase = createClient()
  const [{ data: documents }, { data: users }] = await Promise.all([
    supabase
      .from('coaching_documents')
      .select('*')
      .order('createdAt', { ascending: false })
      .returns<CoachingDocumentRow[]>(),
    supabase
      .from('users')
      .select('id, name')
      .returns<UserNameRow[]>(),
  ])

  const userMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.name]))

  const enrichedDocuments = (documents ?? []).map((doc) => ({
    ...doc,
    uploaderName: doc.uploadedBy ? (userMap[doc.uploadedBy] ?? 'Unknown') : null,
  }))

  return (
    <div className="min-w-0 space-y-3 lg:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coaching</h1>
        <p className="text-muted-foreground">Coaching resources and documents</p>
      </div>
      <CoachingView documents={enrichedDocuments} canEdit={canEdit} />
    </div>
  )
}
