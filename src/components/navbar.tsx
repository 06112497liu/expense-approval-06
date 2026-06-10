'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  FileText,
  CheckSquare,
  History,
  Users,
  Building2,
  LogOut,
  User,
  PlusCircle,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavbarUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE'
  departmentId: number | null
  departmentName: string | null
}

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const user = (session?.user as NavbarUser) || null
  const isLoading = status === 'loading'

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    window.location.href = '/login'
  }

  if (!user && !isLoading) {
    return null
  }

  const navItems = user
    ? [
        {
          href: '/',
          label: '首页',
          icon: LayoutDashboard,
          show: true,
        },
        {
          href: '/expenses',
          label: '我的报销单',
          icon: FileText,
          show: true,
        },
        {
          href: '/expenses/new',
          label: '新建报销',
          icon: PlusCircle,
          show:
            user.role === 'EMPLOYEE' ||
            user.role === 'MANAGER' ||
            user.role === 'FINANCE',
        },
        {
          href: '/approvals',
          label: '待我审批',
          icon: CheckSquare,
          show:
            user.role === 'MANAGER' ||
            user.role === 'FINANCE' ||
            user.role === 'ADMIN',
        },
        {
          href: '/history',
          label: '提交历史',
          icon: History,
          show: true,
        },
        {
          href: '/admin/users',
          label: '用户管理',
          icon: Users,
          show: user.role === 'ADMIN',
        },
        {
          href: '/admin/departments',
          label: '部门管理',
          icon: Building2,
          show: user.role === 'ADMIN',
        },
      ]
    : []

  const roleLabel: Record<string, string> = {
    ADMIN: '管理员',
    EMPLOYEE: '普通员工',
    MANAGER: '部门主管',
    FINANCE: '财务',
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">财务报销系统</span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="hidden sm:block text-sm">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {roleLabel[user.role]}
                    {user.departmentName ? ` · ${user.departmentName}` : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          )}
        </div>

        <div className="md:hidden flex overflow-x-auto pb-2 space-x-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
        </div>
      </div>
    </nav>
  )
}
