import { useEffect } from 'react'

export const DEFAULT_PAGE_TITLE = 'Libro — Mindful Reading Sanctuary & Library Catalog'

export function formatPageTitle(title?: string | null): string {
  if (!title) return DEFAULT_PAGE_TITLE
  if (title.endsWith('Libro') || title.endsWith('Libro Admin')) return title
  return `${title} | Libro`
}

export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = formatPageTitle(title)
  }, [title])
}
