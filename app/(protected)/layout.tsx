import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/layout/SidebarContext'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Middleware already handles auth redirects, but we need to ensure user exists
  // If user is null here, it means auth user exists but no user record in DB
  // Redirect with a flag to break potential redirect loops
  if (!user) {
    redirect('/login?invalid_session=1')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar userRole={user.role} />
        <main className="flex-1 min-w-0 lg:ml-64">
          <div className="p-4 pt-2 lg:p-8 lg:pt-8">
            <div className="lg:hidden flex items-center shrink-0 mb-2">
              <SidebarTrigger />
            </div>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
