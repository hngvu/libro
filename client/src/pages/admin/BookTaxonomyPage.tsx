import { useState, useEffect } from 'react'
import { IconTags, IconUsers, IconPlus, IconRefresh, IconSearch, IconPencil } from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'
import type { GenrePublicResponse } from '@/types/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuthorItem {
  id: number
  name: string
  nationality: string
  bookCount: number
  bornYear: number
}

const DEFAULT_AUTHORS: AuthorItem[] = [
  { id: 1, name: 'Robert C. Martin', nationality: 'United States', bookCount: 5, bornYear: 1952 },
  { id: 2, name: 'J.K. Rowling', nationality: 'United Kingdom', bookCount: 7, bornYear: 1965 },
  { id: 3, name: 'George Orwell', nationality: 'United Kingdom', bookCount: 3, bornYear: 1903 },
  { id: 4, name: 'Haruki Murakami', nationality: 'Japan', bookCount: 6, bornYear: 1949 },
  { id: 5, name: 'Martin Fowler', nationality: 'United Kingdom', bookCount: 4, bornYear: 1963 },
]

export function BookTaxonomyPage() {
  const { t, isDark, showFeedback } = useAdmin()
  const [activeTab, setActiveTab] = useState<'genres' | 'authors'>('genres')

  // Genres state
  const [genres, setGenres] = useState<GenrePublicResponse[]>([])
  const [, setGenreLoading] = useState(false)
  const [genreKeyword, setGenreKeyword] = useState('')

  // Authors state
  const [authors] = useState<AuthorItem[]>(DEFAULT_AUTHORS)
  const [authorKeyword, setAuthorKeyword] = useState('')

  const fetchGenres = async () => {
    setGenreLoading(true)
    try {
      const res = await api.getGenres()
      setGenres(res.content || [])
    } catch {
      // Fallback genres if network error
      setGenres([
        { name: 'Software Engineering', handle: 'software-engineering', description: 'Programming and architecture' },
        { name: 'Fantasy & Fiction', handle: 'fantasy-fiction', description: 'Imaginative realms and fiction' },
        { name: 'Classic Literature', handle: 'classic-literature', description: 'Timeless masterpieces' },
        { name: 'Science & Nature', handle: 'science-nature', description: 'Exploration of physical reality' },
        { name: 'History & Biography', handle: 'history-biography', description: 'Memoirs and historical records' },
      ])
    } finally {
      setGenreLoading(false)
    }
  }

  useEffect(() => {
    fetchGenres()
  }, [])

  const filteredGenres = genres.filter(
    (g) =>
      g.name.toLowerCase().includes(genreKeyword.toLowerCase()) ||
      g.handle.toLowerCase().includes(genreKeyword.toLowerCase())
  )

  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(authorKeyword.toLowerCase()) ||
      a.nationality.toLowerCase().includes(authorKeyword.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <div className="flex items-center justify-between">
          <TabsList className={`p-1 rounded-xl border ${t.cardBg}`}>
            <TabsTrigger
              value="genres"
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'genres'
                  ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                  : t.subTextColor
              }`}
            >
              <span className="flex items-center gap-1.5">
                <IconTags size={15} /> Categories / Genres ({genres.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="authors"
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'authors'
                  ? isDark ? 'bg-[#28303d] text-white shadow-xs' : 'bg-gray-900 text-white shadow-xs'
                  : t.subTextColor
              }`}
            >
              <span className="flex items-center gap-1.5">
                <IconUsers size={15} /> Authors Directory ({authors.length})
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: GENRES */}
        <TabsContent value="genres" className="space-y-4 outline-none pt-3">
          <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${t.cardBg}`}>
            <div className="relative w-full sm:w-80">
              <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
              <input
                placeholder="Filter categories..."
                value={genreKeyword}
                onChange={(e) => setGenreKeyword(e.target.value)}
                className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchGenres}
                className={`h-9 px-3 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
              >
                <IconRefresh size={14} /> Refresh
              </button>
              <button
                onClick={() => showFeedback('success', 'New category modal trigger')}
                className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
              >
                <IconPlus size={15} /> Add Category
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Category Name</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Handle / Slug</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Description</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {filteredGenres.map((g) => (
                    <tr key={g.handle} className={`border-b transition-colors ${t.tableRow}`}>
                      
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>
                        <span className="flex items-center gap-2">
                          <IconTags size={15} className="text-blue-400" />
                          {g.name}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-mono text-xs ${t.subTextColor}`}>#{g.handle}</td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{g.description || 'Standard library classification'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                              isDark ? 'text-[#8c94a5] hover:text-white' : 'text-gray-500 hover:text-gray-900'
                            }`}
                            title="Edit Category"
                          >
                            <IconPencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: AUTHORS */}
        <TabsContent value="authors" className="space-y-4 outline-none pt-3">
          <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl border ${t.cardBg}`}>
            <div className="relative w-full sm:w-80">
              <IconSearch size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.mutedColor}`} />
              <input
                placeholder="Filter authors by name or nationality..."
                value={authorKeyword}
                onChange={(e) => setAuthorKeyword(e.target.value)}
                className={`h-9 pl-8.5 pr-3 text-xs w-full rounded-xl border outline-none transition ${t.inputBg}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showFeedback('success', 'Add author modal trigger')}
                className={`h-9 px-3.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
              >
                <IconPlus size={15} /> Add Author Profile
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border overflow-hidden shadow-xs ${t.tableWrapper}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${t.tableHead}`}>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Author Name</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Country / Origin</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Birth Year</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider">Titles in Catalog</th>
                    <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {filteredAuthors.map((a) => (
                    <tr key={a.id} className={`border-b transition-colors ${t.tableRow}`}>
                      <td className={`py-3 px-4 text-xs font-medium ${t.titleColor}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-500 font-bold flex items-center justify-center text-xs">
                            {a.name.charAt(0)}
                          </div>
                          <span>{a.name}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-xs ${t.subTextColor}`}>{a.nationality}</td>
                      <td className={`py-3 px-4 font-mono text-xs ${t.subTextColor}`}>{a.bornYear}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${t.statusMuted}`}>
                          {a.bookCount} books
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors cursor-pointer ${
                            isDark ? 'text-[#8c94a5] hover:text-white' : 'text-gray-500 hover:text-gray-900'
                          }`}
                          title="Edit Author"
                        >
                          <IconPencil size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
