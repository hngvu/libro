import { useState, useEffect } from 'react'
import type { MembershipPlanResponse, UserSubscriptionResponse } from '@/types/api'
import { api } from '@/services/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconCrown, IconCheck, IconCreditCard } from '@tabler/icons-react'

interface MembershipPlansModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MembershipPlansModal({ open, onOpenChange }: MembershipPlansModalProps) {
  const [plans, setPlans] = useState<MembershipPlanResponse[]>([])
  const [subscription, setSubscription] = useState<UserSubscriptionResponse | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [subscribingCode, setSubscribingCode] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    if (open) {
      api.getMembershipPlans()
        .then((res) => setPlans(res || []))
        .catch(() => setPlans([]))
      api.getMySubscription()
        .then((res) => setSubscription(res))
        .catch(() => setSubscription(null))
    }
  }, [open])

  const handleSubscribe = async (planCode: string, cycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY') => {
    setSubscribingCode(planCode)
    try {
      const res = await api.createSubscriptionCheckoutSession(
        planCode,
        cycle,
        `${window.location.origin}/membership?status=success`
      )
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate subscription checkout')
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
      alert(err.message || 'Failed to open customer portal')
      setOpeningPortal(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-[6px]" onClose={() => onOpenChange(false)}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-xl text-[#1e2320] dark:text-[#f5f3e6] flex items-center gap-2">
                <IconCrown size={22} className="text-amber-500" />
                Choose Your Libro Membership Tier
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Unlock higher concurrent borrowing limits, extended loan durations, and renewals with Stripe.
              </p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center p-1 rounded-[6px] bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedCycle('MONTHLY')}
                className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-all cursor-pointer ${
                  selectedCycle === 'MONTHLY'
                    ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycle('YEARLY')}
                className={`px-3 py-1 text-xs font-semibold rounded-[4px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCycle === 'YEARLY'
                    ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Yearly</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-[3px]">
                  Save ~20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {plans.map((p) => {
              const isCurrent = subscription?.planCode === p.code || (!subscription?.planCode && p.code === 'FREE')
              const matchedPrice =
                p.prices?.find((pr) => pr.billingCycle === selectedCycle) || p.prices?.[0]
              const priceValue = matchedPrice ? Number(matchedPrice.price) : 0
              const cycleText = matchedPrice?.billingCycle === 'YEARLY' ? 'year' : 'month'

              return (
                <div
                  key={p.code}
                  className={`rounded-[6px] border p-4 flex flex-col justify-between transition-all ${
                    p.code === 'VIP'
                      ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                      : isCurrent
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-foreground">{p.name}</h4>
                      {p.code === 'VIP' && (
                        <Badge variant="warning" className="text-[10px] uppercase font-bold rounded-[4px]">
                          Popular
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="success" className="text-[10px] uppercase font-bold rounded-[4px]">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black">${priceValue.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">/{cycleText}</span>
                    </div>
                    <p className="text-xs text-muted-foreground min-h-[36px]">{p.description}</p>
                    <ul className="space-y-2 text-xs text-foreground/80 border-t border-border pt-3">
                      <li className="flex items-center gap-2">
                        <IconCheck size={14} className="text-emerald-500 shrink-0" />
                        <span><strong>{p.maxActiveLoans}</strong> active books at a time</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={14} className="text-emerald-500 shrink-0" />
                        <span><strong>{p.loanDurationDays} days</strong> loan duration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <IconCheck size={14} className="text-emerald-500 shrink-0" />
                        <span><strong>{p.maxRenewals}</strong> allowed renewals</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-auto">
                    {isCurrent ? (
                      subscription?.stripeCustomerId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={openingPortal}
                          onClick={handleOpenCustomerPortal}
                          className="w-full text-xs rounded-[5px] gap-1"
                        >
                          <IconCreditCard size={14} />
                          {openingPortal ? 'Opening Portal...' : 'Manage Billing'}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled className="w-full text-xs rounded-[5px]">
                          Current Plan
                        </Button>
                      )
                    ) : priceValue === 0 ? (
                      <Button variant="outline" size="sm" disabled className="w-full text-xs rounded-[5px]">
                        Free Base Tier
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={subscribingCode === p.code}
                        onClick={() => handleSubscribe(p.code, selectedCycle)}
                        className="w-full text-xs gap-1.5 bg-[#3d4b3e] hover:bg-[#2b352c] text-white rounded-[5px]"
                      >
                        <IconCreditCard size={14} />
                        {subscribingCode === p.code ? 'Redirecting...' : `Subscribe for $${priceValue.toFixed(2)}`}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}