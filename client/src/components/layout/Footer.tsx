import { Link } from 'react-router-dom'

interface FooterProps {
  onOpenAuth?: (mode?: 'login' | 'register') => void
}

export function Footer({ onOpenAuth }: FooterProps) {
  return (
    <footer className="w-full border-t border-[#dfd9cb] dark:border-[#2f3a31] bg-[#f8f5ee]/80 dark:bg-[#181f19]/80 text-[#5a6a58] dark:text-[#9fab97] transition-colors mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        {/* Main Grid: Brand + Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand & Manifesto Column (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <Link
              to="/"
              className="inline-block select-none"
            >
              <span className="font-serif text-2xl font-bold tracking-tight text-[#2c392d] dark:text-[#d8e2cf] hover:text-[#4d664f] transition-colors">
                libro
              </span>
            </Link>

            <p className="text-xs sm:text-[13px] leading-relaxed max-w-sm text-[#5e6e5c] dark:text-[#9fab97]">
              A mindful reading sanctuary and open community library. Curated volumes, physical and digital circulation, completely free of noise, trackers, and advertisements.
            </p>
          </div>

          {/* Navigation Links Columns (7 cols split into 3 groups) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Column 1: Discovery */}
            <div className="space-y-3">
              <h4
                className="text-xs font-bold uppercase tracking-wider text-[#2c392d] dark:text-[#d8e2cf]"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
              >
                Discovery
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Curated Catalog
                  </Link>
                </li>
                <li>
                  <Link to="/?genre=philosophy" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Philosophy & Essays
                  </Link>
                </li>
                <li>
                  <Link to="/?genre=classics" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Timeless Classics
                  </Link>
                </li>
                <li>
                  <Link to="/?genre=fiction" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Literary Fiction
                  </Link>
                </li>
                <li>
                  <Link to="/?genre=science" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Science & Nature
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Library Services */}
            <div className="space-y-3">
              <h4
                className="text-xs font-bold uppercase tracking-wider text-[#2c392d] dark:text-[#d8e2cf]"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
              >
                Library Services
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/activity" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    My Active Loans
                  </Link>
                </li>
                <li>
                  <Link to="/activity" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Holds & Reserves
                  </Link>
                </li>
                <li>
                  <Link to="/membership" className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors">
                    Patron Plans
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => onOpenAuth?.('register')}
                    className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    Join as Patron
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenAuth?.('login')}
                    className="hover:text-[#2c392d] dark:hover:text-[#d8e2cf] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    Patron Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Sanctuary & Ethos */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4
                className="text-xs font-bold uppercase tracking-wider text-[#2c392d] dark:text-[#d8e2cf]"
                style={{ fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif" }}
              >
                Sanctuary
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <span className="text-[#7a8a78] dark:text-[#8e9f8c] block font-medium">Reading Rooms</span>
                  <span className="text-[11px] text-[#8f9f8c] dark:text-[#6d7d6b]">Open Daily 08:00 – 21:00</span>
                </li>
                <li>
                  <span className="text-[#7a8a78] dark:text-[#8e9f8c] block font-medium">Circulation Desk</span>
                  <span className="text-[11px] text-[#8f9f8c] dark:text-[#6d7d6b]">Physical & Digital Copies</span>
                </li>
                <li>
                  <span className="text-[#7a8a78] dark:text-[#8e9f8c] block font-medium">Quiet Hours</span>
                  <span className="text-[11px] text-[#8f9f8c] dark:text-[#6d7d6b]">Always observed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
