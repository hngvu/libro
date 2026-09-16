import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import type { MembershipPlanResponse, UserSubscriptionResponse } from '@/types/api'
import { Button } from '@/components/ui/button'
import {
  IconCrown,
  IconCheck,
  IconCreditCard,
  IconSparkles,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'

interface MembershipPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void
}

export function MembershipPage({ onOpenAuth }: MembershipPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [subscribingCode, setSubscribingCode] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const checkoutStatus = searchParams.get('status')

  const fetchMembershipData = async () => {
    setLoading(true)
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        api.getMembershipPlans(),
        user ? api.getMySubscription() : Promise.resolve(null),
      ])

      if (plansRes.status === 'fulfilled') {
        const activePlans = (plansRes.value || []).filter((p) => p.status === 'ACTIVE')
        setPlans(activePlans)
      } else {
        setPlans([])
      }

      if (subRes.status === 'fulfilled') {
        setSubscription(subRes.value)
      } else {
        setSubscription(null)
      }
    } catch (err) {
      console.error('Failed to load membership data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembershipData()
  }, [user])

  const handleSubscribe = async (planCode: string) => {
    if (!user) {
      onOpenAuth('login')
      return
    }

    setSubscribingCode(planCode)
    try {
      const res = await api.createSubscriptionCheckoutSession(
        planCode,
        selectedCycle,
        `${window.location.origin}/membership?status=success`
      )
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate subscription checkout session')
      setSubscribingCode(null)
    }
  }

  const handleOpenCustomerPortal = async () => {
    setOpeningPortal(true)
    try {
      const res = await api.createCustomerPortalSession(window.location.href)
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open billing customer portal')
      setOpeningPortal(false)
    }
  }

  const getPlanPrice = (plan: MembershipPlanResponse, cycle: 'MONTHLY' | 'YEARLY') => {
    if (!plan.prices || plan.prices.length === 0) return 0
    const matched = plan.prices.find((p) => p.billingCycle === cycle)
    if (matched) return matched.price
    return plan.prices[0]?.price || 0
  }

  const faqs = [
    {
      q: 'How do membership borrow limits work?',
      a: 'Each membership tier allows you to borrow a specific number of books simultaneously. For example, with a Pro Reader plan you can have up to 10 books checked out at once. Once you return a book, your slot immediately opens up for another checkout.',
    },
    {
      q: 'Can I change or cancel my subscription anytime?',
      a: 'Yes, absolutely. You can upgrade, downgrade, or cancel your subscription at any time via the Stripe Customer Portal with a single click. Your benefits will remain active until the end of your current billing period.',
    },
    {
      q: 'What happens to my active loans if I downgrade?',
      a: 'You will continue to keep your currently borrowed books until their scheduled due dates. New checkouts will adhere to your new tier limits once existing books are returned.',
    },
    {
      q: 'How does the Yearly billing discount work?',
      a: 'When you choose Yearly billing, you receive approximately 2 months free (~20% discount) compared to paying month-to-month. The discount is automatically applied during checkout.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We use Stripe for all payment processing, supporting Visa, Mastercard, American Express, Apple Pay, Google Pay, and international bank cards.',
    },
  ]

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* 1. Header & Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#3d4b3e]/10 dark:bg-[#3d4b3e]/30 text-[#3d4b3e] dark:text-[#c8d0b7] text-xs font-semibold">
          <IconCrown size={14} className="text-amber-500" />
          <span>Libro Reader Memberships</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e2320] dark:text-[#f5f3e6]">
          Read More, Keep Longer, Explore Freely
        </h1>

        <p className="text-xs sm:text-sm text-[#6f7f64] dark:text-[#c8d0b7] leading-relaxed">
          Upgrade your reading experience with extended borrowing privileges, generous loan durations, and priority holds across our entire library catalog.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center p-1 rounded-[6px] bg-[#c8d0b7]/25 dark:bg-[#252c28] border border-[#c8d0b7]/60 dark:border-[#3d4b3e] shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedCycle('MONTHLY')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
                selectedCycle === 'MONTHLY'
                  ? 'bg-white dark:bg-[#3d4b3e] text-[#1e2320] dark:text-[#f5f3e6] shadow-xs'
                  : 'text-[#6f7f64] dark:text-[#c8d0b7] hover:text-[#1e2320]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setSelectedCycle('YEARLY')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCycle === 'YEARLY'
                  ? 'bg-white dark:bg-[#3d4b3e] text-[#1e2320] dark:text-[#f5f3e6] shadow-xs'
                  : 'text-[#6f7f64] dark:text-[#c8d0b7] hover:text-[#1e2320]'
              }`}
            >
              <span>Yearly Billing</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-[3px]">
                Save ~20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stripe Return Feedback Alerts */}
      {checkoutStatus === 'success' && (
        <div className="p-4 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <IconCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold">Subscription checkout completed successfully!</p>
              <p className="text-[11px] opacity-90">Your new borrowing limits are now active on your account.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/loans')}
            className="text-xs h-7 rounded-[4px] border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            Go to My Bookshelf
          </Button>
        </div>
      )}

      {/* 2. Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-[#6f7f64] dark:text-[#c8d0b7] text-xs">
            Loading membership plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-[#faf9f4] dark:bg-[#252c28] rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] text-xs text-[#6f7f64]">
            No membership plans available at the moment.
          </div>
        ) : (
          plans.map((plan, idx) => {
            const price = getPlanPrice(plan, selectedCycle)
            const isFreePlan = plan.code?.toUpperCase() === 'FREE' || price === 0
            const isCurrentPlan = Boolean(
              user &&
              (subscription?.planCode?.toUpperCase() === plan.code?.toUpperCase() ||
                (!subscription?.planCode && isFreePlan))
            )
            const isHighlighted = idx === 1 || plan.code.toLowerCase().includes('standard') || plan.code.toLowerCase().includes('pro')

            return (
              <div
                key={plan.id || plan.code}
                className={`relative rounded-[6px] p-5 sm:p-6 transition-all flex flex-col justify-between ${
                  isHighlighted
                    ? 'border-2 border-[#3d4b3e] dark:border-[#c8d0b7] bg-white dark:bg-[#252c28] shadow-sm'
                    : 'border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#222825] hover:border-[#3d4b3e]/60'
                }`}
              >
                {/* Popular / Recommended Badge */}
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3d4b3e] dark:bg-[#c8d0b7] text-[#f5f3e6] dark:text-[#1e2320] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    <IconSparkles size={11} /> Recommended
                  </div>
                )}

                <div>
                  {/* Title & Description */}
                  <div className="border-b border-[#c8d0b7]/40 dark:border-[#3d4b3e] pb-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base text-[#1e2320] dark:text-[#f5f3e6]">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] min-h-[32px] line-clamp-2">
                      {plan.description || 'Standard reading privileges across the library collection.'}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#1e2320] dark:text-[#f5f3e6]">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#6f7f64] dark:text-[#c8d0b7] font-medium">
                        / {selectedCycle === 'MONTHLY' ? 'month' : 'year'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6f7f64]/80 dark:text-[#c8d0b7]/80 block mt-0.5">
                      {isFreePlan
                        ? 'Always free for library members'
                        : selectedCycle === 'YEARLY'
                        ? `Billed annually ($${(price / 12).toFixed(2)}/mo)`
                        : 'Billed monthly, cancel anytime'}
                    </span>
                  </div>

                  {/* Feature Bullets */}
                  <div className="space-y-2.5 pt-2 border-t border-[#c8d0b7]/40 dark:border-[#3d4b3e]">
                    <div className="text-[11px] font-semibold text-[#6f7f64] dark:text-[#c8d0b7] uppercase tracking-wide">
                      Plan Inclusions
                    </div>

                    <ul className="space-y-2 text-xs text-[#1e2320] dark:text-[#f5f3e6]">
                      <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <IconCheck size={11} stroke={2.5} />
                        </div>
                        <span><strong>{plan.maxActiveLoans}</strong> concurrent borrowed book{plan.maxActiveLoans > 1 ? 's' : ''}</span>
                      </li>

                      <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <IconCheck size={11} stroke={2.5} />
                        </div>
                        <span><strong>{plan.loanDurationDays} days</strong> loan reading window</span>
                      </li>

                      {plan.maxRenewals > 0 && (
                        <li className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <IconCheck size={11} stroke={2.5} />
                          </div>
                          <span><strong>{plan.maxRenewals}</strong> online renewal(s) per loan</span>
                        </li>
                      )}

                      {!isFreePlan && (
                        <li className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <IconCheck size={11} stroke={2.5} />
                          </div>
                          <span>Advance reservation & hold queue</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-6">
                  {isCurrentPlan ? (
                    subscription?.stripeCustomerId && subscription.status === 'ACTIVE' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={openingPortal}
                        onClick={handleOpenCustomerPortal}
                        className="w-full text-xs h-9 rounded-[5px] border-emerald-600 text-emerald-700 dark:text-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 cursor-pointer font-semibold gap-1.5"
                      >
                        <IconCreditCard size={14} />
                        {openingPortal ? 'Opening Portal...' : 'Manage Billing & Invoices'}
                      </Button>
                    ) : (
                      <div className="w-full text-xs h-9 rounded-[5px] border border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center justify-center font-semibold select-none shadow-2xs">
                        <IconCheck size={15} stroke={2.5} className="mr-1.5 text-emerald-600 dark:text-emerald-400" /> Current Plan
                      </div>
                    )
                  ) : isFreePlan ? (
                    <Button
                      variant="outline"
                      className="w-full text-xs h-9 rounded-[5px] border-[#c8d0b7] dark:border-[#3d4b3e] text-[#6f7f64] dark:text-[#c8d0b7] cursor-default font-semibold"
                      disabled
                    >
                      Free Default Tier
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.code)}
                      disabled={subscribingCode === plan.code}
                      className={`w-full text-xs h-9 rounded-[5px] font-semibold cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-[#3d4b3e] text-[#f5f3e6] hover:bg-[#2d382e] dark:bg-[#c8d0b7] dark:text-[#1e2320]'
                          : 'bg-[#1e2320] text-[#f5f3e6] hover:bg-[#3d4b3e] dark:bg-[#3d4b3e] dark:text-[#f5f3e6]'
                      }`}
                    >
                      {subscribingCode === plan.code ? (
                        'Connecting Stripe...'
                      ) : !user ? (
                        'Sign In to Subscribe'
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 4. Comparison Table Matrix */}
      <div className="space-y-4 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
            Compare Plan Capabilities Side-by-Side
          </h2>
          <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
            Find the right balance of checkout capacity and duration for your reading habits.
          </p>
        </div>

        <div className="border border-[#c8d0b7] dark:border-[#3d4b3e] rounded-[6px] overflow-hidden bg-white dark:bg-[#252c28] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf9f4] dark:bg-[#2a322e] border-b border-[#c8d0b7] dark:border-[#3d4b3e]">
                  <th className="p-3 font-semibold text-[#1e2320] dark:text-[#f5f3e6] min-w-[200px]">
                    Membership Privileges
                  </th>
                  {plans.map((p) => (
                    <th key={p.code} className="p-3 font-semibold text-[#1e2320] dark:text-[#f5f3e6] text-center min-w-[130px]">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c8d0b7]/40 dark:divide-[#3d4b3e]/40">
                <tr>
                  <td className="p-3 font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                    Max Concurrent Borrowed Books
                  </td>
                  {plans.map((p) => (
                    <td key={p.code} className="p-3 text-center font-bold text-[#3d4b3e] dark:text-[#c8d0b7]">
                      {p.maxActiveLoans} {p.maxActiveLoans > 1 ? 'titles' : 'title'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                    Standard Loan Duration
                  </td>
                  {plans.map((p) => (
                    <td key={p.code} className="p-3 text-center text-[#6f7f64] dark:text-[#c8d0b7]">
                      {p.loanDurationDays} days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                    Online Self-Renewals
                  </td>
                  {plans.map((p) => (
                    <td key={p.code} className="p-3 text-center text-[#6f7f64] dark:text-[#c8d0b7]">
                      {p.maxRenewals} times/loan
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                    Advance Book Reservations
                  </td>
                  {plans.map((p) => {
                    const isFree = p.code?.toUpperCase() === 'FREE'
                    return (
                      <td key={p.code} className="p-3 text-center text-emerald-600 dark:text-emerald-400">
                        {isFree ? (
                          <span className="text-[#6f7f64] dark:text-[#c8d0b7] font-semibold">—</span>
                        ) : (
                          <IconCheck size={16} className="mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                    Stripe Secure Automated Invoicing
                  </td>
                  {plans.map((p) => {
                    const isFree = p.code?.toUpperCase() === 'FREE'
                    return (
                      <td key={p.code} className="p-3 text-center text-emerald-600 dark:text-emerald-400">
                        {isFree ? (
                          <span className="text-[#6f7f64] dark:text-[#c8d0b7] font-semibold">—</span>
                        ) : (
                          <IconCheck size={16} className="mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[#1e2320] dark:text-[#f5f3e6]">
                    Customer Portal Self-Service
                  </td>
                  {plans.map((p) => {
                    const isFree = p.code?.toUpperCase() === 'FREE'
                    return (
                      <td key={p.code} className="p-3 text-center text-emerald-600 dark:text-emerald-400">
                        {isFree ? (
                          <span className="text-[#6f7f64] dark:text-[#c8d0b7] font-semibold">—</span>
                        ) : (
                          <IconCheck size={16} className="mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. FAQ Accordion */}
      <div className="space-y-4 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#1e2320] dark:text-[#f5f3e6]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#6f7f64] dark:text-[#c8d0b7]">
            Everything you need to know about our library membership policies.
          </p>
        </div>

        <div className="space-y-2 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div
                key={faq.q}
                className="rounded-[6px] border border-[#c8d0b7] dark:border-[#3d4b3e] bg-[#faf9f4] dark:bg-[#252c28] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-3.5 text-left text-xs sm:text-sm font-semibold text-[#1e2320] dark:text-[#f5f3e6] flex items-center justify-between gap-3 cursor-pointer hover:bg-[#c8d0b7]/15 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <IconChevronUp size={16} className="text-[#6f7f64] shrink-0" />
                  ) : (
                    <IconChevronDown size={16} className="text-[#6f7f64] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs text-[#6f7f64] dark:text-[#c8d0b7] leading-relaxed border-t border-[#c8d0b7]/30 dark:border-[#3d4b3e]/40">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. Footer Support Banner */}
      <div className="p-6 rounded-[6px] bg-[#3d4b3e] text-[#f5f3e6] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-bold text-sm sm:text-base">
            Need Institutional or Custom Group Access?
          </h3>
          <p className="text-xs text-[#c8d0b7]">
            We offer specialized rates and tailored limits for schools, reading clubs, and research universities.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="text-xs h-8 px-4 rounded-[4px] border-[#c8d0b7] text-[#f5f3e6] hover:bg-white hover:text-[#1e2320] shrink-0 self-start sm:self-auto cursor-pointer"
        >
          Explore Catalog
        </Button>
      </div>
    </div>
  )
}
