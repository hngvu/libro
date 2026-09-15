import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSettings,
  IconSun,
  IconMoon,
  IconLogout,
  IconExternalLink,
  IconCheck,
  IconDeviceFloppy,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import { useAdmin } from '@/components/admin/AdminContext'
import { api } from '@/services/api'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout, isAdmin, isLibrarian } = useAuth()
  const {
    t,
    isDark,
    toggleThemeMode,
    circulationSettings,
    setCirculationSettings,
    showFeedback,
  } = useAdmin()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [policiesForm, setPoliciesForm] = useState({
    'loan.default_days': String(circulationSettings.defaultLoanDays || 7),
    'loan.standard_renewal_days': String(circulationSettings.defaultRenewDays || 14),
    'reservation.default_hold_days': '3',
    'fine.daily_rate': String(circulationSettings.finePerDayOverdue || 0.5),
    'fine.default_lost_fee': '20.00',
    'fine.default_damaged_fee': '10.00',
    maxRenewalsAllowed: String(circulationSettings.maxRenewalsAllowed || 2),
  })

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.adminGetSettings()
      const map: Record<string, string> = {}
      data.forEach((item) => {
        map[item.settingKey] = item.settingValue
      })

      setPoliciesForm((prev) => ({
        ...prev,
        'loan.default_days': map['loan.default_days'] ?? prev['loan.default_days'],
        'loan.standard_renewal_days': map['loan.standard_renewal_days'] ?? prev['loan.standard_renewal_days'],
        'reservation.default_hold_days': map['reservation.default_hold_days'] ?? prev['reservation.default_hold_days'],
        'fine.daily_rate': map['fine.daily_rate'] ?? prev['fine.daily_rate'],
        'fine.default_lost_fee': map['fine.default_lost_fee'] ?? prev['fine.default_lost_fee'],
        'fine.default_damaged_fee': map['fine.default_damaged_fee'] ?? prev['fine.default_damaged_fee'],
      }))

      setCirculationSettings((prev) => ({
        ...prev,
        defaultLoanDays: Number(map['loan.default_days']) || prev.defaultLoanDays,
        defaultRenewDays: Number(map['loan.standard_renewal_days']) || prev.defaultRenewDays,
        finePerDayOverdue: Number(map['fine.daily_rate']) || prev.finePerDayOverdue,
      }))
    } catch (err: any) {
      showFeedback('error', err?.message || 'Không thể tải cài đặt hệ thống từ máy chủ')
    } finally {
      setLoading(false)
    }
  }, [setCirculationSettings, showFeedback])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload: Record<string, string> = {
        'loan.default_days': policiesForm['loan.default_days'],
        'loan.standard_renewal_days': policiesForm['loan.standard_renewal_days'],
        'reservation.default_hold_days': policiesForm['reservation.default_hold_days'],
        'fine.daily_rate': policiesForm['fine.daily_rate'],
        'fine.default_lost_fee': policiesForm['fine.default_lost_fee'],
        'fine.default_damaged_fee': policiesForm['fine.default_damaged_fee'],
      }

      await api.adminBulkUpdateSettings(payload)

      setCirculationSettings((prev) => ({
        ...prev,
        defaultLoanDays: Number(policiesForm['loan.default_days']) || prev.defaultLoanDays,
        defaultRenewDays: Number(policiesForm['loan.standard_renewal_days']) || prev.defaultRenewDays,
        maxRenewalsAllowed: Number(policiesForm.maxRenewalsAllowed) || prev.maxRenewalsAllowed,
        finePerDayOverdue: Number(policiesForm['fine.daily_rate']) || prev.finePerDayOverdue,
      }))

      showFeedback('success', 'Đã lưu cấu hình chính sách lưu thông & tiền phạt vào cơ sở dữ liệu!')
    } catch (err: any) {
      showFeedback('error', err?.message || 'Lỗi khi lưu cấu hình chính sách vào cơ sở dữ liệu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Giao diện & Theme (Appearance) */}
      <div className={`p-5 rounded-2xl border ${t.cardBg}`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div>
            <h3 className={`text-sm font-bold font-sans ${t.titleColor}`}>Giao diện & Chủ đề (Appearance)</h3>
            <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
              Chọn giao diện hiển thị phù hợp: Giao diện tối hiện đại (SaaS Midnight) hoặc Nền trắng chữ đen tối giản.
            </p>
          </div>
          <IconSettings size={20} className={t.mutedColor} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Option 1: Light Mode (Nền trắng chữ đen) */}
          <div
            onClick={() => toggleThemeMode('light')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
              !isDark
                ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/30'
                : 'bg-[#16181d] border-[#2c323e] hover:border-[#3e4757]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500">
                  <IconSun size={20} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${!isDark ? 'text-gray-900' : 'text-white'}`}>
                    Nền trắng chữ đen
                  </div>
                  <div className="text-[11px] text-gray-500">Light Mode</div>
                </div>
              </div>
              {!isDark && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <IconCheck size={12} />
                </span>
              )}
            </div>
            <p className={`text-xs leading-relaxed ${!isDark ? 'text-gray-600' : 'text-[#8c94a5]'}`}>
              Nền sáng tinh giản, chữ đen rõ nét, độ tương phản dịu mắt, phù hợp môi trường văn phòng và làm việc ban ngày.
            </p>
          </div>

          {/* Option 2: Dark Mode (Giao diện tối SaaS) */}
          <div
            onClick={() => toggleThemeMode('dark')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
              isDark
                ? 'bg-[#232934] border-blue-500 ring-2 ring-blue-500/40'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <IconMoon size={20} />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Giao diện tối SaaS
                  </div>
                  <div className="text-[11px] text-gray-400">Midnight Dark Mode</div>
                </div>
              </div>
              {isDark && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <IconCheck size={12} />
                </span>
              )}
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#8c94a5]' : 'text-gray-500'}`}>
              Theme than chì cao cấp bám sát mẫu SaaS, viền mảnh tinh tế, bảo vệ mắt khi làm việc ban đêm.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Quy định lưu thông & Tiền phạt (Circulation, Reservation & Fines Policies) */}
      <div className={`p-5 rounded-2xl border ${t.cardBg}`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div>
            <h3 className={`text-sm font-bold font-sans ${t.titleColor}`}>Quy định lưu thông, Đặt trước & Tiền phạt</h3>
            <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
              Cấu hình các tham số vận hành cốt lõi: thời hạn mượn, gia hạn, giữ chỗ đặt trước và các mức phí phạt vi phạm.
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
              <IconLoader2 size={16} className="animate-spin" />
              <span>Đang đồng bộ...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSavePolicies} className="space-y-6 pt-4">
          {/* Subgroup A: Mượn trả & Đặt trước */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.mutedColor}`}>
              Chính sách Lưu thông & Đặt trước
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Thời hạn mượn mặc định (Ngày)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  required
                  value={policiesForm['loan.default_days']}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      'loan.default_days': e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Khoảng thời gian độc giả mượn sách trước ngày đáo hạn (loan.default_days).
                </span>
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Số ngày gia hạn mỗi lần (Ngày)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={policiesForm['loan.standard_renewal_days']}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      'loan.standard_renewal_days': e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Số ngày cộng thêm khi thực hiện gia hạn phiếu mượn (loan.standard_renewal_days).
                </span>
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Thời gian giữ sách đặt trước (Ngày)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={policiesForm['reservation.default_hold_days']}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      'reservation.default_hold_days': e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Thời gian giữ sách tại quầy chờ độc giả đến nhận (reservation.default_hold_days).
                </span>
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Số lần gia hạn tối đa cho phép
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={policiesForm.maxRenewalsAllowed}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      maxRenewalsAllowed: e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Giới hạn lượt gia hạn tối đa trước khi độc giả bắt buộc phải trả sách.
                </span>
              </div>
            </div>
          </div>

          {/* Subgroup B: Tiền phạt & Bồi thường */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.mutedColor}`}>
              Chính sách Tiền phạt & Bồi thường
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Mức phạt trễ hạn mỗi ngày ($)
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={policiesForm['fine.daily_rate']}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      'fine.daily_rate': e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Tiền phạt tự động tích lũy cho mỗi ngày trễ hạn (fine.daily_rate).
                </span>
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Phí bồi thường mất sách ($)
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={policiesForm['fine.default_lost_fee']}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      'fine.default_lost_fee': e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Mức bồi thường mặc định khi mất sách (fine.default_lost_fee).
                </span>
              </div>

              <div>
                <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                  Phí bồi thường làm hỏng sách ($)
                </label>
                <input
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={policiesForm['fine.default_damaged_fee']}
                  onChange={(e) =>
                    setPoliciesForm({
                      ...policiesForm,
                      'fine.default_damaged_fee': e.target.value,
                    })
                  }
                  className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
                />
                <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                  Mức bồi thường mặc định khi hỏng sách (fine.default_damaged_fee).
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={fetchSettings}
              disabled={loading || saving}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn} disabled:opacity-50`}
            >
              <IconRefresh size={14} className={loading ? 'animate-spin' : ''} /> Tải lại từ CSDL
            </button>

            <button
              type="submit"
              disabled={loading || saving}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn} disabled:opacity-50`}
            >
              {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
              <span>{saving ? 'Đang lưu vào CSDL...' : 'Lưu cấu hình chính sách'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Tài khoản nhân viên & Phiên làm việc (Staff Session) */}
      {user && (
        <div className={`p-5 rounded-2xl border ${t.cardBg}`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className={`text-sm font-bold font-sans ${t.titleColor}`}>Tài khoản nhân viên đang đăng nhập</h3>
            <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
              Thông tin phiên làm việc hiện tại và quyền hạn trong hệ thống thư viện.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${t.titleColor}`}>{user.fullName || user.username}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {isAdmin ? 'ADMINISTRATOR' : isLibrarian ? 'LIBRARIAN' : user.role}
                </span>
              </div>
              <div className={`text-xs font-mono ${t.subTextColor}`}>
                Email: {user.email} · Username: @{user.username}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${t.secondaryBtn}`}
              >
                <IconExternalLink size={14} /> Xem Public Catalog
              </button>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="px-3 py-1.5 text-xs font-medium border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <IconLogout size={14} /> Đăng xuất phiên làm việc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Trạng thái lõi hệ thống (System Core Status) */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${t.cardBg}`}>
        <div>
          <span className={`font-semibold ${t.titleColor}`}>Libro Desk Core:</span>{' '}
          <span className={t.subTextColor}>v2.0-Spring · PostgreSQL & REST Services</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-500 font-semibold text-[11px]">Backend Services Connected</span>
        </div>
      </div>
    </div>
  )
}

export { SettingsPage as AdminSettingsPage }
