import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconSettings,
  IconSun,
  IconMoon,
  IconLogout,
  IconExternalLink,
  IconCheck,
  IconDeviceFloppy,
} from '@tabler/icons-react'
import { useAuth } from '@/context/AuthContext'
import { useAdmin } from '@/components/admin/AdminContext'

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

  const [policiesForm, setPoliciesForm] = useState(circulationSettings)

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault()
    setCirculationSettings(policiesForm)
    showFeedback('success', 'Circulation lending policies updated successfully!')
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

      {/* 2. Quy định mượn trả (Circulation Policies) */}
      <div className={`p-5 rounded-2xl border ${t.cardBg}`}>
        <div className="pb-3 border-b border-inherit">
          <h3 className={`text-sm font-bold font-sans ${t.titleColor}`}>Quy định lưu thông & Mượn trả</h3>
          <p className={`text-xs mt-0.5 ${t.subTextColor}`}>
            Cấu hình thời hạn mượn mặc định, giới hạn lượt gia hạn và mức phí phạt trễ hạn mỗi ngày.
          </p>
        </div>

        <form onSubmit={handleSavePolicies} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                Thời hạn mượn mặc định (Ngày)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={policiesForm.defaultLoanDays}
                onChange={(e) =>
                  setPoliciesForm({
                    ...policiesForm,
                    defaultLoanDays: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
              <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                Khoảng thời gian tối đa độc giả được giữ sách trước ngày đáo hạn.
              </span>
            </div>

            <div>
              <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                Số ngày gia hạn mỗi lần (Ngày)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={policiesForm.defaultRenewDays}
                onChange={(e) =>
                  setPoliciesForm({
                    ...policiesForm,
                    defaultRenewDays: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
              <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                Số ngày được cộng thêm khi thủ thư phê duyệt gia hạn phiếu mượn.
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
                    maxRenewalsAllowed: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
              <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                Giới hạn lượt gia hạn tối đa trước khi độc giả bắt buộc phải trả sách.
              </span>
            </div>

            <div>
              <label className={`text-xs font-medium block mb-1.5 ${t.subTextColor}`}>
                Mức phạt trễ hạn mỗi ngày (VND)
              </label>
              <input
                type="number"
                step={1000}
                value={policiesForm.finePerDayOverdue}
                onChange={(e) =>
                  setPoliciesForm({
                    ...policiesForm,
                    finePerDayOverdue: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none transition ${t.inputBg}`}
              />
              <span className={`text-[11px] mt-1 block ${t.mutedColor}`}>
                Mức tiền phạt tự động tích lũy cho mỗi ngày quá hạn trả sách.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${t.primaryBtn}`}
            >
              <IconDeviceFloppy size={16} /> Lưu cấu hình mượn trả
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
