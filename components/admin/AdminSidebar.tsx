"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  Users, 
  Settings, 
  BarChart2, 
  FileText, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { MotionDiv, MotionSpan } from '../motion/ClientMotion'
import { useAdmin } from '@/hooks/useAdmin'

const menuItems = [
  { name: 'داشبورد', href: '/admin/dashboard', icon: BarChart2 },
  { name: 'کتاب‌ها', href: '/admin/books', icon: BookOpen },
  { name: 'کاربران', href: '/admin/users', icon: Users },
  { name: 'محتوا', href: '/admin/content', icon: FileText },
  { name: 'تنظیمات', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { logout } = useAdmin()

  return (
    <MotionDiv
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="bg-white dark:bg-gray-800 shadow-lg h-full flex flex-col"
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <MotionSpan
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-gray-800 dark:text-white"
          >
            پنل مدیریت
          </MotionSpan>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center p-3 rounded-lg mb-2 transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && (
                <MotionSpan
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mr-3"
                >
                  {item.name}
                </MotionSpan>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className="flex items-center p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (
            <MotionSpan
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mr-3"
            >
              خروج
            </MotionSpan>
          )}
        </button>
      </div>
    </MotionDiv>
  )
} 