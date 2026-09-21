import { Link } from 'react-router-dom'

interface FooterProps {
  onOpenAuth?: (mode?: 'login' | 'register') => void
}

export function Footer({ onOpenAuth: _onOpenAuth }: FooterProps) {
  return (
    <footer className="w-full border-t border-[#dfd9cb]/70 dark:border-[#2f3a31]/70 bg-[#f8f5ee]/80 dark:bg-[#181f19]/80 text-[#7a8a78] dark:text-[#8e9f8c] transition-colors mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex items-center justify-center text-xs">
        {/* Dot-separated links */}
        <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 select-none">
          <Link to="/" className="hover:underline hover:text-[#2c392d] dark:hover:text-[#d8e2cf] transition-colors">
            About
          </Link>
          <span className="text-[#b5bea9] dark:text-[#3d4c3f] text-[10px]">·</span>
          <Link to="/" className="hover:underline hover:text-[#2c392d] dark:hover:text-[#d8e2cf] transition-colors">
            Help &amp; Support
          </Link>
          <span className="text-[#b5bea9] dark:text-[#3d4c3f] text-[10px]">·</span>
          <Link to="/" className="hover:underline hover:text-[#2c392d] dark:hover:text-[#d8e2cf] transition-colors">
            Privacy
          </Link>
          <span className="text-[#b5bea9] dark:text-[#3d4c3f] text-[10px]">·</span>
          <Link to="/" className="hover:underline hover:text-[#2c392d] dark:hover:text-[#d8e2cf] transition-colors">
            Terms of Service
          </Link>
          <span className="text-[#b5bea9] dark:text-[#3d4c3f] text-[10px]">·</span>
          <a
            href="mailto:contact@libro.library"
            className="hover:underline hover:text-[#2c392d] dark:hover:text-[#d8e2cf] transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
