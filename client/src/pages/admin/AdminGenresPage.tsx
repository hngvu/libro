import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  IconSearch,
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
import { api } from '@/services/api'
import type { GenreResponse } from '@/types/api'

export function AdminGenresPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, isDark, showFeedback } = useAdmin()

  const initialKeyword = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'default') as 'default' | 'name-asc' | 'name-desc' | 'books-desc' | 'books-asc'

  const [genres, setGenres] = useState<GenreResponse[]>([])
  const [sortBy, setSortBy] = useState<typeof initialSort>(initialSort)
  const [keyword, setKeyword] = useState(initialKeyword)
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('search', keyword.trim())
    if (sortBy && sortBy !== 'default') params.set('sort', sortBy)
    setSearchParams(params, { replace: true })
  }, [keyword, sortBy, setSearchParams])

  const sortedGenres = useMemo(() => {
    const list = [...genres]
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortBy === 'name-desc') {
      return list.sort((a, b) => b.name.localeCompare(a.name))
    }
    if (sortBy === 'books-desc') {
      return list.sort((a, b) => (b.bookCount || 0) - (a.bookCount || 0))
    }
    if (sortBy === 'books-asc') {
      return list.sort((a, b) => (a.bookCount || 0) - (b.bookCount || 0))
    }
    return list
  }, [genres, sortBy])

  const fetchGenres = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.adminGetGenres({
        keyword: keyword || undefined,
        page: 1,
        size: 100,
      })
      setGenres(res.content || [])
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load genres')
    } finally {
      setLoading(false)
    }
  }, [keyword, showFeedback])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  const toggleSelectGenre = (id: number) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedGenreIds.length === sortedGenres.length) {
      setSelectedGenreIds([])
    } else {
      setSelectedGenreIds(sortedGenres.map((g) => g.id))
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedGenreIds.length} selected category(ies)?`)) return
    try {
      for (const id of selectedGenreIds) {
        await api.adminDeleteGenre(id)
      }
      showFeedback('success', `${selectedGenreIds.length} category(ies) deleted successfully!`)
      setSelectedGenreIds([])
      fetchGenres()
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete selected categories')
    }
  }



  return (
    <div className="space-y-4">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-[60%]">
          <div className="relative flex-1">
            <IconSearch size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
            <input
              placeholder="Search genre name..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGenres()}
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
                    : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50'
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
                Default
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
                onClick={() => setSortBy('books-asc')}
                className={sortBy === 'books-asc' ? 'font-semibold text-blue-500' : ''}
              >
                Books Count (Low to High)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={() => navigate('/admin/genres/new')}
            className={`h-9 px-4 text-sm font-semibold rounded-md transition-all cursor-pointer ${t.primaryBtn}`}
          >
            Add Genre
          </button>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between pt-0.5 text-xs font-mono">
        <span className={t.mutedColor}>Total {sortedGenres.length} genres</span>
      </div>

      {/* Genres Table - Frameless style matching BookCatalogPage */}
      {loading ? (
        <div className={`p-10 text-center text-sm ${t.subTextColor}`}>
          Loading categories...
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`h-11 border-b ${isDark ? 'border-[#22262e]' : 'border-gray-200'} ${t.tableHead}`}>
                <th className="w-10 px-3 text-center align-middle">
                  <Checkbox
                    checked={
                      sortedGenres.length > 0 && selectedGenreIds.length === sortedGenres.length
                        ? true
                        : selectedGenreIds.length > 0
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleSelectAll}
                    title="Select all"
                    className={
                      isDark
                        ? '!border-[#3e4756] hover:!border-[#5a667b]'
                        : '!border-gray-400 hover:!border-gray-500'
                    }
                  />
                </th>

                {/* Category Name / Selected Actions */}
                <th className="px-4 text-left align-middle">
                  {selectedGenreIds.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs sm:text-sm font-semibold normal-case whitespace-nowrap ${t.titleColor}`}>
                        {selectedGenreIds.length} selected
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`h-6 px-2 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer select-none normal-case whitespace-nowrap ${
                              isDark
                                ? 'bg-[#181a20] border-[#3e4756] text-[#cbd2de] hover:text-white hover:border-[#5a667b]'
                                : 'bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400'
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
                            Delete Selected ({selectedGenreIds.length})
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedGenreIds([])}>
                            Deselect all
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <span className={`text-xs sm:text-[13px] font-semibold ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                      Genre Name
                    </span>
                  )}
                </th>

                {/* Books Column */}
                <th className={`w-28 px-4 text-right text-xs sm:text-[13px] font-semibold align-middle whitespace-nowrap ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                  Books
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {sortedGenres.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`py-12 text-center text-sm ${t.subTextColor}`}>
                    No categories found. Click "Add Genre" to create one.
                  </td>
                </tr>
              ) : (
                sortedGenres.map((g) => {
                  const isSelected = selectedGenreIds.includes(g.id)
                  return (
                    <tr
                      key={g.id}
                      onClick={() => navigate(`/admin/genres/${g.id}`)}
                      className={`group border-b transition-colors cursor-pointer ${
                        isDark ? 'border-[#20242c]' : 'border-gray-200'
                      } ${
                        isSelected
                          ? isDark
                            ? 'bg-[#1e232b]'
                            : 'bg-blue-50/60'
                          : t.tableRow
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td
                        className="w-10 px-3 text-center align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectGenre(g.id)}
                          className={
                            isDark
                              ? '!border-[#3e4756] hover:!border-[#5a667b]'
                              : '!border-gray-400 hover:!border-gray-500'
                          }
                        />
                      </td>

                      {/* Clean Category Name (No tag icon, no ID) */}
                      <td className="py-3 px-4">
                        <span className={`font-medium text-sm ${t.titleColor}`}>
                          {g.name}
                        </span>
                      </td>

                      {/* Books Count */}
                      <td className="w-28 py-3 px-4 text-right">
                        <span className={`text-sm font-mono font-normal ${isDark ? 'text-[#8c94a5]' : 'text-gray-600'}`}>
                          {g.bookCount ?? 0}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
