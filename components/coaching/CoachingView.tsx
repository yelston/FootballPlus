'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UploadDialog } from '@/components/coaching/UploadDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Pencil, Trash2, ExternalLink, FileText, MoreHorizontal } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/use-media-query'
import type { Database } from '@/types/database'

type CoachingDocumentRow = Database['public']['Tables']['coaching_documents']['Row']
type CoachingDocument = CoachingDocumentRow & { uploaderName: string | null }

interface CoachingViewProps {
  documents: CoachingDocument[]
  canEdit: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}


export function CoachingView({ documents: initialDocuments, canEdit }: CoachingViewProps) {
  const router = useRouter()
  const toast = useToast()
  const isMobile = useIsMobile()

  const [documents, setDocuments] = useState(initialDocuments)

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<CoachingDocument | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CoachingDocument | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function handleUploadSuccess() {
    router.refresh()
    // Optimistically reflect the change after server refresh
    setUploadOpen(false)
    setEditingDocument(null)
  }

  function handleEdit(doc: CoachingDocument) {
    setEditingDocument(doc)
    setUploadOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const supabase = createClient()
      if (deleteTarget.filePath) {
        await supabase.storage.from('coaching-documents').remove([deleteTarget.filePath])
      }
      const { error } = await supabase
        .from('coaching_documents')
        .delete()
        .eq('id', deleteTarget.id)
      if (error) throw error

      setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      toast.success('Document deleted.')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {canEdit && (
            <Button onClick={() => { setEditingDocument(null); setUploadOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No documents yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(doc.updatedAt)}{doc.uploaderName ? ` · ${doc.uploaderName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                        title="Open PDF"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(doc)} className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(doc)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <UploadDialog
          open={uploadOpen}
          onOpenChange={(open) => { setUploadOpen(open); if (!open) setEditingDocument(null) }}
          editingDocument={editingDocument}
          onSuccess={handleUploadSuccess}
        />
        <ConfirmDialog
          open={!!deleteTarget}
          title={`Delete "${deleteTarget?.name}"?`}
          description="This will permanently remove the document and its file. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
          loading={deleteLoading}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {canEdit && (
          <div className="flex justify-end">
            <Button onClick={() => { setEditingDocument(null); setUploadOpen(true) }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        )}
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No documents yet.{canEdit ? ' Upload the first one.' : ''}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {doc.description ?? <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.updatedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.uploaderName ?? <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open PDF
                        </Button>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(doc)} className="cursor-pointer">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(doc)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={(open) => { setUploadOpen(open); if (!open) setEditingDocument(null) }}
        editingDocument={editingDocument}
        onSuccess={handleUploadSuccess}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the document and its file. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        loading={deleteLoading}
      />
    </>
  )
}
