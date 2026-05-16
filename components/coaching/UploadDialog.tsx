'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { Database } from '@/types/database'

type CoachingDocument = Database['public']['Tables']['coaching_documents']['Row']
type CoachingDocumentInsert = Database['public']['Tables']['coaching_documents']['Insert']
type CoachingDocumentUpdate = Database['public']['Tables']['coaching_documents']['Update']

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingDocument: CoachingDocument | null
  onSuccess: () => void
}

export function UploadDialog({ open, onOpenChange, editingDocument, onSuccess }: UploadDialogProps) {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(editingDocument?.name ?? '')
  const [description, setDescription] = useState(editingDocument?.description ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const isEditing = !!editingDocument

  useEffect(() => {
    if (open) {
      setName(editingDocument?.name ?? '')
      setDescription(editingDocument?.description ?? '')
      setSelectedFile(null)
      setFileError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open, editingDocument])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName(editingDocument?.name ?? '')
      setDescription(editingDocument?.description ?? '')
      setSelectedFile(null)
      setFileError(null)
    }
    onOpenChange(next)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFileError(null)
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File exceeds the 50 MB limit.')
        e.target.value = ''
        return
      }
      if (file.type !== 'application/pdf') {
        setFileError('Only PDF files are allowed.')
        e.target.value = ''
        return
      }
    }
    setSelectedFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (!isEditing && !selectedFile) {
      setFileError('Please select a PDF file.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      let fileUrl = editingDocument?.fileUrl ?? ''
      let filePath = editingDocument?.filePath ?? ''

      if (selectedFile) {
        // Remove old file if replacing
        if (isEditing && editingDocument.filePath) {
          await supabase.storage.from('coaching-documents').remove([editingDocument.filePath])
        }

        const sanitised = trimmedName.replace(/[^a-zA-Z0-9_-]/g, '_')
        filePath = `${Date.now()}-${sanitised}.pdf`

        const { error: uploadError } = await supabase.storage
          .from('coaching-documents')
          .upload(filePath, selectedFile, { contentType: 'application/pdf' })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('coaching-documents')
          .getPublicUrl(filePath)
        fileUrl = urlData.publicUrl
      }

      if (isEditing) {
        const updatePayload: CoachingDocumentUpdate = {
          name: trimmedName,
          description: description.trim() || null,
          fileUrl,
          filePath,
          updatedAt: new Date().toISOString(),
        }
        const { error } = await supabase
          .from('coaching_documents')
          .update(updatePayload as never)
          .eq('id', editingDocument.id)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const insertPayload: CoachingDocumentInsert = {
          name: trimmedName,
          description: description.trim() || null,
          fileUrl,
          filePath,
          uploadedBy: user?.id ?? null,
        }
        const { error } = await supabase
          .from('coaching_documents')
          .insert(insertPayload as never)
        if (error) throw error
      }

      toast.success(isEditing ? 'Document updated.' : 'Document uploaded.')
      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Document' : 'Upload Document'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="doc-name">Name</Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pre-season Drills Manual"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-description">Description</Label>
            <Textarea
              id="doc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-file">
              {isEditing ? 'Replace PDF (optional)' : 'PDF File'}
            </Label>
            <Input
              id="doc-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              required={!isEditing}
              className="cursor-pointer"
            />
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            <p className="text-xs text-muted-foreground">Maximum file size: 50 MB</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? 'Saving...' : 'Uploading...') : (isEditing ? 'Save Changes' : 'Upload')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
