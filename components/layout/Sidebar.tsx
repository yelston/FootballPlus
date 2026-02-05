'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  UsersRound, 
  Calendar,
  LayoutList,
  LogOut
} from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'FP Team', href: '/fp-team', icon: Users, roles: ['admin'] },
  { name: 'Players', href: '/players', icon: UserCircle },
  { name: 'Teams', href: '/teams', icon: UsersRound },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Positions', href: '/positions', icon: LayoutList },
]

interface SidebarProps {
  userRole: 'admin' | 'coach' | 'volunteer'
}

export function Sidebar({ userRole }: SidebarProps) {
  const { isOpen, setIsOpen } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const filteredNavigation = navigation.filter((item) => {
    if (item.roles && !item.roles.includes(userRole)) {
      return false
    }
    return true
  })

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <Image
                src="/images/logo/FP Logo.png"
                alt="Football Plus Logo"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <UserCircle className="h-5 w-5" />
              My Profile
            </Link>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
