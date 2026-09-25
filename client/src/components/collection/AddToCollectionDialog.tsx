import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import type { CollectionResponse } from '@/types/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  IconFolders,
  IconCheck,
  IconPlus,
  IconBookmark,
  IconX,
} from '@tabler/icons-react'

interface AddToCollectionDialogProps {
  open: boolean
  onClose: () => void
  bookId: number
  bookTitle: string
}

export function AddToCollectionDialog({
  open,
  onClose,
  bookId,
  bookTitle,
}: AddToCollectionDialogProps) {
  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [containingIds, setContainingIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !bookId) return

    setLoading(true)
    Promise.all([
      api.getMyCollections().catch(() => []),
      api.getMyCollectionsContainingBook(bookId).catch(() => []),
    ])
      .then(([cols, ids]) => {
        setCollections(cols || [])
        setContainingIds(ids || [])
      })
      .finally(() => setLoading(false))
  }, [open, bookId])

  const handleToggleCollection = async (collection: CollectionResponse) => {
    const isInside = containingIds.includes(collection.id)
    try {
      if (isInside) {
        await api.removeBookFromCollection(collection.id, bookId)
        setContainingIds((prev) => prev.filter((id) => id !== collection.id))
        setFeedback(`Removed from "${collection.name}"`)
      } else {
        await api.addBookToCollection(collection.id, bookId)
        setContainingIds((prev) => [...prev, collection.id])
        setFeedback(`Added to "${collection.name}"`)
      }
      setTimeout(() => setFeedback(null), 2500)
      window.dispatchEvent(new CustomEvent('libro:collections-changed'))
      if (collection.isDefault) {
        window.dispatchEvent(
          new CustomEvent('libro:bookmarks-changed', {
            detail: { bookId, bookmarked: !isInside },
          })
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      setFeedback(`Error: ${msg}`)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCollectionName.trim()
    if (!trimmed || creating) return

    setCreating(true)
    try {
      const created = await api.createCollection({ name: trimmed })
      await api.addBookToCollection(created.id, bookId)
      setCollections((prev) => [...prev, created])
      setContainingIds((prev) => [...prev, created.id])
      setNewCollectionName('')
      setShowCreateInput(false)
      setFeedback(`Created and added to "${created.name}"`)
      setTimeout(() => setFeedback(null), 2500)
      window.dispatchEvent(new CustomEvent('libro:collections-changed'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create collection'
      setFeedback(`Error: ${msg}`)
      setTimeout(() => setFeedback(null), 3000)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        onClose={onClose}
        className="max-w-[420px] p-5 bg-white dark:bg-[#1f2320] border border-[#d6d2c4] dark:border-[#3d4b3e] rounded-xl shadow-2xl"
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#ece8de] dark:border-[#384239]">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#2e7d56]/10 text-[#2e7d56] dark:text-[#66bb6a] flex items-center justify-center">
                <IconFolders size={18} />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base text-[#181818] dark:text-[#f5f3e6] leading-tight">
                  Add to Collection
                </h3>
                <p className="text-[11px] text-[#666] dark:text-[#aaa] truncate max-w-[240px]">
                  {bookTitle}
                </p>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="px-3 py-1.5 rounded-md bg-[#2e7d56]/10 text-[#2e7d56] dark:text-[#66bb6a] text-xs font-medium animate-in fade-in">
              {feedback}
            </div>
          )}

          {/* Collection List */}
          <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 -mr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#888]">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#888]">No collections yet.</div>
            ) : (
              collections.map((c) => {
                const isInside = containingIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleCollection(c)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors cursor-pointer select-none ${
                      isInside
                        ? 'border-[#2e7d56] bg-[#2e7d56]/8 dark:bg-[#2e7d56]/20 text-[#181818] dark:text-[#f5f3e6]'
                        : 'border-[#e4e0d4] dark:border-[#333d36] hover:bg-[#f6f4ee] dark:hover:bg-[#28312b] text-[#333] dark:text-[#ccc]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {c.isDefault ? (
                        <IconBookmark size={16} className="text-[#2e7d56] shrink-0" />
                      ) : (
                        <IconFolders size={16} className="text-[#888] shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-medium text-xs sm:text-[13px] block truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-[#888]">
                          {c.bookCount} {c.bookCount === 1 ? 'book' : 'books'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        isInside
                          ? 'bg-[#2e7d56] border-[#2e7d56] text-white'
                          : 'border-[#bbb] dark:border-[#555]'
                      }`}
                    >
                      {isInside && <IconCheck size={13} stroke={2.5} />}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* New Collection Form */}
          <div className="pt-2 border-t border-[#ece8de] dark:border-[#384239]">
            {showCreateInput ? (
              <form onSubmit={handleCreateAndAdd} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Collection name (e.g. Summer Reads)"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 h-8 px-2.5 text-xs rounded-md border border-[#ccc] dark:border-[#444] bg-white dark:bg-[#252c28] text-[#181818] dark:text-[#f5f3e6] focus:outline-none focus:border-[#2e7d56]"
                />
                <button
                  type="submit"
                  disabled={!newCollectionName.trim() || creating}
                  className="h-8 px-3 rounded-md bg-[#2e7d56] hover:bg-[#256646] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {creating ? '...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateInput(false)}
                  className="h-8 px-2 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 cursor-pointer"
                >
                  <IconX size={14} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateInput(true)}
                className="w-full h-8 rounded-md border border-dashed border-[#bbb] dark:border-[#555] hover:border-[#2e7d56] hover:text-[#2e7d56] text-[#666] dark:text-[#aaa] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <IconPlus size={14} />
                <span>Create New Collection</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
