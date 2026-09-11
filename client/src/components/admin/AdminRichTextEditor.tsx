import { useState, useRef } from 'react'
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconQuote,
  IconCode,
  IconLink,
  IconEye,
  IconEdit,
} from '@tabler/icons-react'
import { useAdmin } from './AdminContext'

interface AdminRichTextEditorProps {
  label?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

export function AdminRichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Write book description / synopsis...',
  minHeight = '240px',
  className = '',
}: AdminRichTextEditorProps) {
  const { t, isDark } = useAdmin()
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormatting = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end) || defaultText

    const newText =
      value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 10)
  }

  const handleAddLink = () => {
    const url = prompt('Enter URL (e.g. https://...):')
    if (url) {
      insertFormatting('[', `](${url})`, 'link text')
    }
  }

  // Simple Markdown to HTML preview renderer
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return '<p class="text-xs opacity-50 italic">No description provided.</p>'
    }

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold mt-3 mb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold mt-3 mb-1.5">$1</h1>')
      // Bold & Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Quotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-blue-500 pl-3 my-1 italic opacity-80">$1</blockquote>')
      // Code block
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/20 p-2 rounded text-xs font-mono my-1.5 overflow-x-auto">$1</pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-500 underline">$1</a>')
      // Lists
      .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-xs">$1</li>')
      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-xs">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '<div class="h-2"></div>')
      .replace(/\n/g, '<br/>')

    return html
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className={`block text-xs font-medium ${t.subTextColor}`}>
            {label}
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab('write')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                tab === 'write'
                  ? isDark
                    ? 'bg-[#252a34] text-white shadow-2xs'
                    : 'bg-gray-200 text-gray-900 shadow-2xs'
                  : t.mutedColor
              }`}
            >
              <IconEdit size={13} />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                tab === 'preview'
                  ? isDark
                    ? 'bg-[#252a34] text-white shadow-2xs'
                    : 'bg-gray-200 text-gray-900 shadow-2xs'
                  : t.mutedColor
              }`}
            >
              <IconEye size={13} />
              <span>Preview</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Box */}
      <div
        className={`rounded-md border overflow-hidden transition-all ${
          isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Formatting Toolbar (Only in Write mode) */}
        {tab === 'write' && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 border-b flex-wrap ${
              isDark ? 'border-[#232732] bg-[#121316]' : 'border-gray-100 bg-gray-50/70'
            }`}
          >
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold text')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Bold (Ctrl+B)"
            >
              <IconBold size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic text')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Italic (Ctrl+I)"
            >
              <IconItalic size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Strikethrough"
            >
              <IconStrikethrough size={15} />
            </button>

            <span className={`w-px h-4 mx-1 ${isDark ? 'bg-[#2c323e]' : 'bg-gray-200'}`} />

            <button
              type="button"
              onClick={() => insertFormatting('## ', '', 'Heading 2')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Heading 2"
            >
              <IconH2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('### ', '', 'Heading 3')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Heading 3"
            >
              <IconH3 size={15} />
            </button>

            <span className={`w-px h-4 mx-1 ${isDark ? 'bg-[#2c323e]' : 'bg-gray-200'}`} />

            <button
              type="button"
              onClick={() => insertFormatting('- ', '', 'List item')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Bullet List"
            >
              <IconList size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('1. ', '', 'List item')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Numbered List"
            >
              <IconListNumbers size={15} />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ', '', 'Quote')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Quote"
            >
              <IconQuote size={15} />
            </button>

            <span className={`w-px h-4 mx-1 ${isDark ? 'bg-[#2c323e]' : 'bg-gray-200'}`} />

            <button
              type="button"
              onClick={() => insertFormatting('`', '`', 'code')}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Inline Code"
            >
              <IconCode size={15} />
            </button>
            <button
              type="button"
              onClick={handleAddLink}
              className={`p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer ${t.subTextColor}`}
              title="Insert Link"
            >
              <IconLink size={15} />
            </button>
          </div>
        )}

        {/* Textarea or Preview */}
        {tab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                insertFormatting('**', '**', 'bold text')
              } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault()
                insertFormatting('*', '*', 'italic text')
              }
            }}
            placeholder={placeholder}
            style={{ minHeight }}
            className={`w-full p-4 text-sm leading-relaxed outline-none resize-y font-normal ${t.inputBg} border-none rounded-none focus:ring-0`}
          />
        ) : (
          <div
            style={{ minHeight }}
            className={`p-4 text-sm overflow-y-auto leading-relaxed ${t.titleColor}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>
    </div>
  )
}
