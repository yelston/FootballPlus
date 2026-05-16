'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
  UsersRound,
  Calendar,
  LayoutList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Home,
  BarChart2,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/auth'

interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  roles?: UserRole[]
}

interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Players', href: '/players', icon: UserCircle },
      { name: 'Attendance', href: '/attendance', icon: Calendar },
      { name: 'Coaching', href: '/coaching', icon: BookOpen },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reporting', href: '/reporting', icon: BarChart2, roles: ['admin', 'board'] },
    ],
  },
  {
    label: 'People & Operations',
    items: [
      { name: 'Staff', href: '/staff', icon: Briefcase, roles: ['admin', 'board'] },
      { name: 'FP Team', href: '/fp-team', icon: ShieldCheck, roles: ['admin'] },
    ],
  },
  {
    label: 'Setup',
    items: [
      { name: 'Teams', href: '/teams', icon: UsersRound },
      { name: 'Positions', href: '/positions', icon: LayoutList },
      { name: 'Houses', href: '/house', icon: Home },
    ],
  },
]

interface SidebarProps {
  userRole: UserRole
}

export function Sidebar({ userRole }: SidebarProps) {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapsed } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [prefetched] = useState(() => new Set<string>())

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handlePrefetch = (href: string) => {
    if (prefetched.has(href)) {
      return
    }
    prefetched.add(href)
    router.prefetch(href)
  }

  const navigationGroupsForRole = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles && !item.roles.includes(userRole)) {
          return false
        }
        return true
      }),
    }))
    .filter((group) => group.items.length > 0)

  const activeGroupLabels = navigationGroupsForRole
    .filter((group) =>
      group.items.some((item) =>
        pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
      )
    )
    .map((group) => group.label)

  const defaultOpenGroups = activeGroupLabels.length > 0
    ? activeGroupLabels
    : navigationGroupsForRole.map((group) => group.label)

  const visibleNavigationItems = navigationGroupsForRole.flatMap((group) => group.items)

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
          'fixed top-0 left-0 z-40 h-screen bg-card border-r transition-[transform,width] duration-300 lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'lg:w-64',
          'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={cn('flex h-16 items-center border-b', isCollapsed ? 'justify-center px-2' : 'px-6')}>
            {isCollapsed ? (
              <Link href="/" onClick={() => setIsOpen(false)}>
                <Image
                  src="/images/logo/FP Logo.png"
                  alt="Football Plus Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  priority
                />
              </Link>
            ) : (
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
            )}
          </div>

          {/* Nav */}
          <nav className={cn('flex-1 py-4', isCollapsed ? 'space-y-1 px-2' : 'space-y-5 px-3')}>
            {isCollapsed ? (
              visibleNavigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(item.href))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => handlePrefetch(item.href)}
                    onFocus={() => handlePrefetch(item.href)}
                    title={item.name}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors justify-center gap-0',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                  </Link>
                )
              })
            ) : (
              <Accordion
                type="multiple"
                defaultValue={defaultOpenGroups}
                className="space-y-2"
              >
                {navigationGroupsForRole.map((group) => (
                  <AccordionItem key={group.label} value={group.label} className="border-b-0">
                    <AccordionTrigger className="rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:bg-accent hover:text-accent-foreground hover:no-underline">
                      {group.label}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 pb-1 pt-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href ||
                          (item.href !== '/' && pathname?.startsWith(item.href))

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            onMouseEnter={() => handlePrefetch(item.href)}
                            onFocus={() => handlePrefetch(item.href)}
                            className={cn(
                              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors gap-3',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </nav>

          {/* Bottom section */}
          <div className={cn('border-t p-4', isCollapsed && 'flex flex-col items-center px-2')}>
            <Link
              href="/profile"
              title={isCollapsed ? 'My Profile' : undefined}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isCollapsed ? 'justify-center gap-0 w-full' : 'gap-3',
                pathname === '/profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <UserCircle className="h-5 w-5 shrink-0" />
              {!isCollapsed && 'My Profile'}
            </Link>
            <Button
              variant="ghost"
              title={isCollapsed ? 'Sign Out' : undefined}
              className={cn(
                'mt-2 w-full',
                isCollapsed ? 'justify-center px-0' : 'justify-start gap-3'
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && 'Sign Out'}
            </Button>
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-full bg-background border shadow-sm absolute -right-4 top-1/2 -translate-y-1/2 hover:bg-accent transition-colors z-50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
