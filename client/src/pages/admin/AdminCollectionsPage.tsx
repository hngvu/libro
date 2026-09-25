import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconEdit,
  IconBook2,
  IconX,
  IconCheck,
  IconPin,
  IconFilter2,
  IconChevronDown,
  IconArrowsUpDown,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdmin } from '@/components/admin/AdminContext'
import { AdminFilterSelect } from '@/components/admin/AdminFilterSelect'
import { api } from '@/services/api'
import type { CollectionResponse, BookPublicResponse } from '@/types/api'

export function AdminCollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as
    | 'default'
    | 'name-asc'
    | 'name-desc'
    | 'books-desc'
    | 'pinned-first'
  const initialStatus = searchParams.get('status') || ''

  const [collections, setCollections] = useState<CollectionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>(() => {
    const fields: string[] = []
    if (initialStatus) fields.push('status')
    return fields
  })
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>([])

  // Modal: Create / Edit Collection
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<CollectionResponse | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPinned, setFormPinned] = useState(false)
  const [formDisplayOrder, setFormDisplayOrder] = useState(0)
  const [saving, setSaving] = useState(false)

  // Modal: Manage Books in Collection
  const [manageBooksCol, setManageBooksCol] = useState<CollectionResponse | null>(null)
  const [booksInCol, setBooksInCol] = useState<BookPublicResponse[]>([])
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogResults, setCatalogResults] = useState<BookPublicResponse[]>([])

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    if (statusFilter) params.set('status', statusFilter)
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, statusFilter, setSearchParams])

  const fetchCollections = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.adminGetCuratedCollections()
      setCollections(data || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch curated collections'
      showFeedback('error', msg)
    } finally {
      setLoading(false)
    }
  }, [showFeedback])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  const filteredAndSortedCollections = useMemo(() => {
    let list = collections.filter(
      (c) =>
        c.name.toLowerCase().includes(keyword.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(keyword.toLowerCase()))
    )

    if (statusFilter === 'pinned') {
      list = list.filter((c) => c.pinned)
    } else if (statusFilter === 'unpinned') {
      list = list.filter((c) => !c.pinned)
    }

    if (sortBy === 'name-asc') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortBy === 'name-desc') {
      return [...list].sort((a, b) => b.name.localeCompare(a.name))
    }
    if (sortBy === 'books-desc') {
      return [...list].sort((a, b) => (b.bookCount || 0) - (a.bookCount || 0))
    }
    if (sortBy === 'pinned-first') {
      return [...list].sort((a, b) =>
        b.pinned === a.pinned ? a.displayOrder - b.displayOrder : b.pinned ? 1 : -1
      )
    }

    return [...list].sort((a, b) => a.displayOrder - b.displayOrder)
  }, [collections, keyword, statusFilter, sortBy])

  const removeFilterField = (field: string) => {
    setActiveFilterFields((prev) => prev.filter((f) => f !== field))
    if (field === 'status') setStatusFilter('')
  }

  const resetAllFilters = () => {
    setActiveFilterFields([])
    setStatusFilter('')
  }

  const toggleSelectCollection = (id: number) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCollectionIds.length === filteredAndSortedCollections.length) {
      setSelectedCollectionIds([])
    } else {
      setSelectedCollectionIds(filteredAndSortedCollections.map((c) => c.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCollectionIds.length} selected collection(s)?`)) return
    try {
      for (const id of selectedCollectionIds) {
        await api.adminDeleteCuratedCollection(id)
      }
      showFeedback('success', `${selectedCollectionIds.length} collection(s) deleted successfully!`)
      setSelectedCollectionIds([])
      fetchCollections()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected collections')
    }
  }

  const handleBulkPin = async () => {
    try {
      for (const id of selectedCollectionIds) {
        await api.adminUpdateCuratedCollection(id, { pinned: true })
      }
      showFeedback('success', `Pinned ${selectedCollectionIds.length} collection(s) to homepage`)
      setSelectedCollectionIds([])
      fetchCollections()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to pin selected collections')
    }
  }

  const handleBulkUnpin = async () => {
    try {
      for (const id of selectedCollectionIds) {
        await api.adminUpdateCuratedCollection(id, { pinned: false })
      }
      showFeedback('success', `Unpinned ${selectedCollectionIds.length} collection(s) from homepage`)
      setSelectedCollectionIds([])
      fetchCollections()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to unpin selected collections')
    }
  }

  const openCreateModal = () => {
    setEditingCollection(null)
    setFormName('')
    setFormDesc('')
    setFormPinned(false)
    setFormDisplayOrder(collections.length + 1)
    setEditModalOpen(true)
  }

  const openEditModal = (c: CollectionResponse) => {
    setEditingCollection(c)
    setFormName(c.name)
    setFormDesc(c.description || '')
    setFormPinned(c.pinned)
    setFormDisplayOrder(c.displayOrder)
    setEditModalOpen(true)
  }

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || saving) return
    setSaving(true)
    try {
      if (editingCollection) {
        await api.adminUpdateCuratedCollection(editingCollection.id, {
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          pinned: formPinned,
          displayOrder: formDisplayOrder,
        })
        showFeedback('success', `Updated collection "${formName}"`)
      } else {
        await api.adminCreateCuratedCollection({
          name: formName.trim(),
          description: formDesc.trim() || undefined,
        })
        showFeedback('success', `Created curated collection "${formName}"`)
      }
      setEditModalOpen(false)
      fetchCollections()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed'
      showFeedback('error', msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCollection = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete curated collection "${name}"?`)) return
    try {
      await api.adminDeleteCuratedCollection(id)
      showFeedback('success', `Deleted collection "${name}"`)
      setCollections((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete collection'
      showFeedback('error', msg)
    }
  }

  const handleTogglePinned = async (c: CollectionResponse) => {
    try {
      await api.adminUpdateCuratedCollection(c.id, { pinned: !c.pinned })
      setCollections((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, pinned: !item.pinned } : item))
      )
      showFeedback('success', `${!c.pinned ? 'Pinned to' : 'Unpinned from'} reader homepage`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update pin'
      showFeedback('error', msg)
    }
  }

  // Manage Books Handlers
  const openManageBooks = async (c: CollectionResponse) => {
    setManageBooksCol(c)
    setLoadingBooks(true)
    setCatalogSearch('')
    setCatalogResults([])
    try {
      const res = await api.getCollectionBooks(c.id, 1, 100)
      setBooksInCol(res.content || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load books'
      showFeedback('error', msg)
    } finally {
      setLoadingBooks(false)
    }
  }

  const handleSearchCatalog = async (q: string) => {
    setCatalogSearch(q)
    if (!q.trim() || q.length < 2) {
      setCatalogResults([])
      return
    }
    try {
      const res = await api.getBooks({ keyword: q.trim(), size: 8 })
      setCatalogResults(res.content || [])
    } catch {
      setCatalogResults([])
    }
  }

  const handleAddBookToCol = async (book: BookPublicResponse) => {
    if (!manageBooksCol || !book.id) return
    try {
      await api.adminAddBookToCurated(manageBooksCol.id, book.id)
      setBooksInCol((prev) => [...prev, book])
      setManageBooksCol((prev) => (prev ? { ...prev, bookCount: prev.bookCount + 1 } : null))
      setCollections((prev) =>
        prev.map((c) => (c.id === manageBooksCol.id ? { ...c, bookCount: c.bookCount + 1 } : c))
      )
      setCatalogSearch('')
      setCatalogResults([])
      showFeedback('success', `Added "${book.title}" to collection`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add book'
      showFeedback('error', msg)
    }
  }

  const handleRemoveBookFromCol = async (bookId: number) => {
    if (!manageBooksCol) return
    try {
      await api.adminRemoveBookFromCurated(manageBooksCol.id, bookId)
      setBooksInCol((prev) => prev.filter((b) => b.id !== bookId))
      setManageBooksCol((prev) =>
        prev ? { ...prev, bookCount: Math.max(0, prev.bookCount - 1) } : null
      )
      setCollections((prev) =>
        prev.map((c) =>
          c.id === manageBooksCol.id ? { ...c, bookCount: Math.max(0, c.bookCount - 1) } : c
        )
      )
      showFeedback('success', 'Book removed from collection')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove book'
      showFeedback('error', msg)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar - Matching BookCatalogPage */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search collection name or description..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  sortBy !== 'default'
                    ? isDark
                      ? 'bg-[#252a34] border-blue-500/50 text-blue-400'
                      : 'bg-blue-50 border-blue-300 text-blue-600'
                    : isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-[#d3d8de] text-[#212b36] hover:border-[#b0b9c2] hover:bg-[#f4f6f8]'
                }`}
                title="Sort options"
              >
                <IconArrowsUpDown size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSortBy('default')}
                className={sortBy === 'default' ? 'font-semibold text-blue-500' : ''}
              >
                Default (Display Order)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-asc')}
                className={sortBy === 'name-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-desc')}
                className={sortBy === 'name-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('books-desc')}
                className={sortBy === 'books-desc' ? 'font-semibold text-blue-500' : ''}
              >
                Books Count (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('pinned-first')}
                className={sortBy === 'pinned-first' ? 'font-semibold text-blue-500' : ''}
              >
                Pinned First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={openCreateModal}
            className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Collection
          </button>
        </div>
      </div>

      {/* Filter Section Under Searchbar */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <div
          className={`h-9 flex items-center gap-1.5 px-3 rounded-md border text-xs sm:text-[13px] font-semibold select-none ${
            isDark ? 'bg-[#181a20] border-[#2c323e] text-[#cbd2de]' : 'bg-[#f4f6f8] border-[#d3d8de] text-[#212b36]'
          }`}
        >
          <IconFilter2 size={15} className={isDark ? 'text-slate-300' : 'text-[#637381]'} />
          <span>Filter</span>
        </div>

        {/* Status Filter */}
        {activeFilterFields.includes('status') && (
          <AdminFilterSelect
            label="Status"
            value={statusFilter}
            options={[
              { value: 'pinned', label: 'Pinned' },
              { value: 'unpinned', label: 'Standard' },
            ]}
            onChange={(val) => setStatusFilter(val)}
            onRemove={() => removeFilterField('status')}
            allLabel="All Collections"
          />
        )}

        {/* Add Filter Plus Button */}
        {activeFilterFields.length < 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-[#181a20] border-[#2c323e] text-[#8c94a5] hover:text-white hover:border-[#4d576a] hover:bg-[#20242c]'
                    : 'bg-white border-[#d3d8de] text-[#212b36] hover:border-[#b0b9c2] hover:bg-[#f4f6f8]'
                }`}
                title="Add filter"
              >
                <IconPlus size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveFilterFields(['status'])}>
                Status (Pinned)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset Button */}
        {activeFilterFields.length > 0 && (
          <button
            onClick={resetAllFilters}
            className="text-xs sm:text-[13px] text-blue-500 hover:underline px-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between pt-0.5 text-xs font-mono">
        <span className={t.mutedColor}>Total {filteredAndSortedCollections.length} collections</span>
      </div>

      {/* Catalog Table - Frameless style matching BookCatalogPage */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading collections...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-[#e1e5eb]'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      filteredAndSortedCollections.length > 0 &&
                      selectedCollectionIds.length === filteredAndSortedCollections.length
                        ? true
                        : selectedCollectionIds.length > 0
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                    title="Select all"
                    className={
                      isDark
                        ? '!border-[#3e4756] hover:!border-[#5a667b]'
                        : '!border-[#b0b9c2] hover:!border-[#637381]'
                    }
                  />
                </th>

                {/* Column 2: Collection / Selected Action */}
                <th className="px-4 text-left align-middle min-w-[240px]">
                  {selectedCollectionIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedCollectionIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`h-6 px-2 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer select-none normal-case whitespace-nowrap ${
                              isDark
                                ? 'bg-[#181a20] border-[#3e4756] text-[#cbd2de] hover:text-white hover:border-[#5a667b]'
                                : 'bg-white border-[#d3d8de] text-[#212b36] hover:border-[#b0b9c2]'
                            }`}
                          >
                            <span>Actions</span>
                            <IconChevronDown size={12} className="opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={handleBulkDelete}
                            className="text-rose-500 focus:text-rose-400"
                          >
                            Delete Selected ({selectedCollectionIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkPin}>
                            Pin to Homepage
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBulkUnpin}>
                            Unpin from Homepage
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedCollectionIds([])}>
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-[#475467]'}`}>
                      Collection
                    </span>
                  )}
                </th>

                {/* Column 3: Books */}
                <th className={`w-36 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-[#475467]'}`}>
                  Books
                </th>

                {/* Column 4: Order */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-[#475467]'}`}>
                  Order
                </th>

                {/* Column 5: Status */}
                <th className={`w-28 px-4 text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-[#475467]'}`}>
                  Status
                </th>

                {/* Column 6: Actions */}
                <th className={`w-36 px-4 text-right text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-[#475467]'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {filteredAndSortedCollections.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No curated collections found. Click "Add Collection" to create one.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCollections.map((c) => {
                  const isSelected = selectedCollectionIds.includes(c.id)
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openManageBooks(c)}
                      className={`group border-b transition-colors cursor-pointer ${
                        isDark ? 'border-[#20242c]' : 'border-[#eef1f4]'
                      } ${
                        isSelected
                          ? isDark
                            ? 'bg-[#1e232b]'
                            : 'bg-blue-50/60'
                          : t.tableRow
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectCollection(c.id)}
                          title={`Select ${c.name}`}
                          className={
                            isDark
                              ? '!border-[#3e4756] hover:!border-[#5a667b]'
                              : '!border-[#b0b9c2] hover:!border-[#637381]'
                          }
                        />
                      </td>

                      {/* 1. Collection Name + Slug + Description */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-sans font-medium text-sm truncate max-w-sm sm:max-w-md transition-colors ${t.titleColor} ${isDark ? 'group-hover:text-white' : 'group-hover:text-[#066fd1]'}`}>
                              {c.name}
                            </span>
                            <span className={`font-mono text-[11px] ${t.mutedColor}`}>
                              /{c.slug}
                            </span>
                          </div>
                          {c.description && (
                            <p className={`text-xs line-clamp-1 mt-0.5 ${isDark ? 'text-[#8c94a5]' : 'text-slate-600'}`}>
                              {c.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 2. Books count + mini preview covers */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${t.titleColor}`}>
                            {c.bookCount} {c.bookCount === 1 ? 'book' : 'books'}
                          </span>
                          {c.previewBooks && c.previewBooks.length > 0 && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {c.previewBooks.slice(0, 3).map((pb, idx) => (
                                <div
                                  key={pb.id || idx}
                                  className={`w-4 h-6 rounded-[1px] border overflow-hidden shrink-0 ${
                                    isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-slate-100 border-slate-300'
                                  }`}
                                >
                                  {pb.cover && (
                                    <img src={pb.cover} alt={pb.title} className="w-full h-full object-cover" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Order */}
                      <td className="py-3 px-4 align-middle">
                        <span className={`font-mono text-xs ${t.mutedColor}`}>
                          {c.displayOrder}
                        </span>
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3 px-4 align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleTogglePinned(c)}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold cursor-pointer transition-colors ${
                            c.pinned
                              ? isDark
                                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isDark
                              ? 'bg-[#181a20] text-[#8c94a5] border border-[#2c323e]'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Click to toggle pinned status"
                        >
                          <IconPin size={11} className={c.pinned ? 'fill-current' : ''} />
                          <span>{c.pinned ? 'Pinned' : 'Standard'}</span>
                        </button>
                      </td>

                      {/* 5. Actions */}
                      <td className="py-3 px-4 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openManageBooks(c)}
                            className={`h-7 px-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap ${
                              isDark
                                ? 'bg-[#181a20] border-[#3e4756] text-[#cbd2de] hover:text-white hover:border-[#5a667b]'
                                : 'bg-white border-[#d3d8de] text-[#212b36] hover:border-[#b0b9c2] hover:bg-[#f4f6f8]'
                            }`}
                          >
                            Manage Books
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              isDark ? 'text-[#8c94a5] hover:text-white' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Edit"
                          >
                            <IconEdit size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCollection(c.id, c.name)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Create Modal - Themed matching Admin Dialogs */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-xl border p-6 shadow-2xl space-y-4 ${
              isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-white border-[#d3d8de]'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <h3 className={`font-serif font-bold text-lg ${t.titleColor}`}>
                {editingCollection ? 'Edit Collection' : 'New Collection'}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isDark ? 'text-[#8c94a5] hover:text-white' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#cbd2de]' : 'text-gray-700'}`}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. World Literature & Classics"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={`h-9 px-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#cbd2de]' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of this theme or editorial reason..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className={`p-2.5 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-[#cbd2de]' : 'text-gray-700'}`}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className={`h-9 px-3 text-sm w-full rounded-md border outline-none transition font-mono ${t.inputBg}`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <Checkbox
                    id="formPinned"
                    checked={formPinned}
                    onCheckedChange={(checked) => setFormPinned(!!checked)}
                    className={
                      isDark
                        ? '!border-[#3e4756] hover:!border-[#5a667b]'
                        : '!border-[#b0b9c2] hover:!border-[#637381]'
                    }
                  />
                  <label
                    htmlFor="formPinned"
                    className={`text-xs font-semibold cursor-pointer ${isDark ? 'text-[#cbd2de]' : 'text-gray-700'}`}
                  >
                    Pin to homepage
                  </label>
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className={`h-9 px-4 rounded-md border text-sm font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#2c323e] text-[#cbd2de] hover:bg-[#20242c]'
                      : 'border-[#d3d8de] text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim() || saving}
                  className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer shadow-xs disabled:opacity-50 ${t.primaryBtn}`}
                >
                  {saving ? 'Saving...' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Books in Collection Modal - Themed matching Admin Dialogs */}
      {manageBooksCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-2xl rounded-xl border p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col ${
              isDark ? 'bg-[#181a20] border-[#2c323e]' : 'bg-white border-[#d3d8de]'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <div>
                <h3 className={`font-serif font-bold text-lg ${t.titleColor}`}>
                  Manage Books in "{manageBooksCol.name}"
                </h3>
                <p className={`text-xs ${t.subTextColor}`}>
                  {booksInCol.length} {booksInCol.length === 1 ? 'book' : 'books'} currently in this collection
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageBooksCol(null)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isDark ? 'text-[#8c94a5] hover:text-white' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Search and Add from Catalog */}
            <div className="relative shrink-0">
              <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
              <input
                type="text"
                placeholder="Search catalog by title, author, or ISBN to add..."
                value={catalogSearch}
                onChange={(e) => handleSearchCatalog(e.target.value)}
                className={`h-9 pl-9 pr-3 text-sm w-full rounded-md border outline-none transition ${t.inputBg}`}
              />

              {catalogResults.length > 0 && (
                <div
                  className={`absolute left-0 right-0 top-full mt-1 border rounded-lg shadow-xl z-20 max-h-56 overflow-y-auto divide-y ${
                    isDark
                      ? 'bg-[#1e232b] border-[#2c323e] divide-[#2c323e]'
                      : 'bg-white border-[#d3d8de] divide-gray-100'
                  }`}
                >
                  {catalogResults.map((book) => {
                    const alreadyIn = booksInCol.some((b) => b.id === book.id)
                    return (
                      <div
                        key={book.id || book.handle}
                        className={`p-2.5 flex items-center justify-between transition-colors ${
                          isDark ? 'hover:bg-[#252c38]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`w-8 h-11 rounded-[2px] border overflow-hidden shrink-0 ${
                              isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-slate-100 border-slate-300'
                            }`}
                          >
                            {book.cover ? (
                              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <IconBook2 size={16} className={`m-auto ${t.mutedColor}`} />
                            )}
                          </div>
                          <div className="truncate">
                            <p className={`text-xs font-semibold truncate ${t.titleColor}`}>
                              {book.title}
                            </p>
                            <p className={`text-[11px] truncate ${t.subTextColor}`}>
                              {book.authors && book.authors.length > 0
                                ? book.authors.map((a) => a.name).join(', ')
                                : 'Unknown Author'}
                            </p>
                          </div>
                        </div>

                        {alreadyIn ? (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                            <IconCheck size={14} /> Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddBookToCol(book)}
                            className={`h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer shrink-0 ${t.primaryBtn}`}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Current Books List */}
            <div className={`flex-1 overflow-y-auto divide-y pr-1 -mr-1 ${isDark ? 'divide-[#22262e]' : 'divide-gray-100'}`}>
              {loadingBooks ? (
                <div className={`py-12 text-center text-xs ${t.subTextColor}`}>
                  Loading collection books...
                </div>
              ) : booksInCol.length === 0 ? (
                <div className={`py-12 text-center text-xs ${t.subTextColor}`}>
                  No books in this collection yet. Use the search bar above to add books.
                </div>
              ) : (
                booksInCol.map((b) => (
                  <div key={b.id || b.handle} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-11 rounded-[2px] border overflow-hidden shrink-0 ${
                          isDark ? 'bg-[#16181d] border-[#2c323e]' : 'bg-slate-100 border-slate-300'
                        }`}
                      >
                        {b.cover ? (
                          <img src={b.cover} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <IconBook2 size={16} className={`m-auto ${t.mutedColor}`} />
                        )}
                      </div>
                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${t.titleColor}`}>
                          {b.title}
                        </p>
                        <p className={`text-[11px] truncate ${t.subTextColor}`}>
                          {b.authors && b.authors.length > 0
                            ? b.authors.map((a) => a.name).join(', ')
                            : 'Unknown Author'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => b.id && handleRemoveBookFromCol(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
                      title="Remove from collection"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={`pt-3 border-t flex justify-end shrink-0 ${isDark ? 'border-[#2c323e]' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={() => setManageBooksCol(null)}
                className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer shadow-xs ${t.primaryBtn}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
