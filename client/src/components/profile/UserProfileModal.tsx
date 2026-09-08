import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import {
  IconUser,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react'

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setPhone(user.phone || '')
    }
  }, [user])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await api.updateCurrentUser({
        fullName,
        phone: phone || undefined,
      })
      await refreshUser()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#3d4b3e] text-[#f5f3e6] flex items-center justify-center font-bold text-lg shadow-xs">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <DialogTitle className="font-serif">{user.fullName || user.username}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-0.5">
                <span className="text-[#6f7f64] dark:text-[#c8d0b7]">@{user.username}</span>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'LIBRARIAN' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 mb-3 ${
              message.type === 'success'
                ? 'bg-[#c8d0b7]/40 text-[#1e2320] border border-[#c8d0b7]'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {message.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
              Registered Email
            </label>
            <div className="relative">
              <IconMail className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
              <Input value={user.email} disabled className="pl-9 bg-[#c8d0b7]/20 cursor-not-allowed opacity-80" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
              Full Name
            </label>
            <div className="relative">
              <IconUser className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
              <Input
                required
                className="pl-9"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#1e2320] dark:text-[#f5f3e6]">
              Phone Number
            </label>
            <div className="relative">
              <IconPhone className="absolute left-3 top-2.5 text-[#6f7f64]" size={16} />
              <Input
                className="pl-9"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-[#c8d0b7]/30 dark:bg-[#3d4b3e]/30 rounded-lg text-xs text-[#1e2320] dark:text-[#f5f3e6] border border-[#c8d0b7] dark:border-[#3d4b3e]">
            <IconShieldCheck size={18} className="text-[#3d4b3e] dark:text-[#c8d0b7] shrink-0" />
            <span>Account is verified and currently <strong>{user.status}</strong>.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
