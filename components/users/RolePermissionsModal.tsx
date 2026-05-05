'use client'

import { useState } from 'react'
import { ShieldCheck, Eye, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Permission = 'view' | 'view+write' | 'none'

type RoleKey = 'admin' | 'board' | 'coach' | 'staff' | 'volunteer'

const ROLES: { key: RoleKey; label: string }[] = [
  { key: 'admin', label: 'Admin' },
  { key: 'board', label: 'Board' },
  { key: 'coach', label: 'Coach' },
  { key: 'staff', label: 'Staff' },
  { key: 'volunteer', label: 'Volunteer' },
]

const PAGES: { label: string; permissions: Record<RoleKey, Permission> }[] = [
  {
    label: 'Dashboard',
    permissions: {
      admin: 'view',
      board: 'view',
      coach: 'view',
      staff: 'view',
      volunteer: 'view',
    },
  },
  {
    label: 'FP Team',
    permissions: {
      admin: 'view+write',
      board: 'none',
      coach: 'none',
      staff: 'none',
      volunteer: 'none',
    },
  },
  {
    label: 'Players',
    permissions: {
      admin: 'view+write',
      board: 'view',
      coach: 'view+write',
      staff: 'view+write',
      volunteer: 'view',
    },
  },
  {
    label: 'Teams',
    permissions: {
      admin: 'view+write',
      board: 'view',
      coach: 'view+write',
      staff: 'view+write',
      volunteer: 'view',
    },
  },
  {
    label: 'Attendance',
    permissions: {
      admin: 'view+write',
      board: 'view',
      coach: 'view+write',
      staff: 'view+write',
      volunteer: 'view',
    },
  },
  {
    label: 'Positions',
    permissions: {
      admin: 'view+write',
      board: 'view',
      coach: 'view+write',
      staff: 'view+write',
      volunteer: 'view',
    },
  },
  {
    label: 'Staff',
    permissions: {
      admin: 'view+write',
      board: 'view',
      coach: 'none',
      staff: 'none',
      volunteer: 'none',
    },
  },
]

function PermissionCell({ permission }: { permission: Permission }) {
  if (permission === 'none') {
    return <span className="text-muted-foreground">—</span>
  }
  if (permission === 'view+write') {
    return (
      <div className="flex flex-col items-center gap-0.5 text-xs text-foreground">
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> View</span>
        <span className="flex items-center gap-1"><PenLine className="h-3 w-3" /> Write</span>
      </div>
    )
  }
  return (
    <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
      <Eye className="h-3 w-3" /> View
    </span>
  )
}

export function RolePermissionsButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Role Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Role Permissions</DialogTitle>
          <DialogDescription>
            Access levels for each role across all pages.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Page</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role.key} className="text-center">
                    {role.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAGES.map((page) => (
                <TableRow key={page.label}>
                  <TableCell className="font-medium">{page.label}</TableCell>
                  {ROLES.map((role) => (
                    <TableCell key={role.key} className="text-center">
                      <PermissionCell permission={page.permissions[role.key]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
