import { useRef } from 'react'
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

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={`block text-xs font-medium ${t.subTextColor}`}>
          {label}
        </label>
      )}

      {/* Editor Box */}
      <div
        className={`rounded-md border overflow-hidden transition-all ${
          isDark ? 'border-[#2c323e] bg-[#16181d]' : 'border-gray-200 bg-white'
        }`}
      >
        {/* Formatting Toolbar */}
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

        {/* Textarea */}
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
      </div>
    </div>
  )
}
