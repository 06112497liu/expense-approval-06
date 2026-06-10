import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import {
  getUserExpenseReports,
  getPendingApprovalsForUser,
} from '@/lib/queries'
import Link from 'next/link'
import {
  FileText,
  CheckSquare,
  History,
  PlusCircle,
  ChevronRight,
} from 'lucide-react'
import {
  formatMoney,
  getStatusText,
  getStatusColor,
  formatDate,
} from '@/lib/utils'

export default async function HomePage() {
  const user = await requireAuth()

  const myReports = await getUserExpenseReports(parseInt(user.id), false)
  const pendingApprovals = await getPendingApprovalsForUser(
    parseInt(user.id),
    user.role,
    user.departmentId
  )
  const historyReports = await getUserExpenseReports(parseInt(user.id), true)

  const stats = [
    {
      label: '我的报销单',
      value: myReports.length,
      icon: FileText,
      href: '/expenses',
      color: 'bg-blue-500',
    },
    {
      label: '待我审批',
      value: pendingApprovals.length,
      icon: CheckSquare,
      href: '/approvals',
      color: 'bg-yellow-500',
      show: user.role !== 'EMPLOYEE',
    },
    {
      label: '提交历史',
      value: historyReports.length,
      icon: History,
      href: '/history',
      color: 'bg-green-500',
    },
  ].filter((s) => s.show !== false) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            欢迎回来，{user.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.departmentName ? `所在部门：${user.departmentName}` : ''}
          </p>
        </div>
        {(user.role === 'EMPLOYEE' ||
          user.role === 'MANAGER' ||
          user.role === 'FINANCE') && (
          <Link
            href="/expenses/new"
            className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            <span>新建报销单</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
                <span>查看详情</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">我的报销单</h2>
            <Link
              href="/expenses"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {myReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无报销单</p>
              </div>
            ) : (
              myReports.slice(0, 5).map((report) => (
                <Link
                  key={report.id}
                  href={`/expenses/${report.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {report.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(report.updatedAt)}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-semibold text-gray-900">
                        {formatMoney(report.totalAmount)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusText(report.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {user.role !== 'EMPLOYEE' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">待我审批</h2>
              <Link
                href="/approvals"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无待审批的报销单</p>
                </div>
              ) : (
                pendingApprovals.slice(0, 5).map((report) => (
                  <Link
                    key={report.id}
                    href={`/approvals/${report.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {report.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          提交人：{report.creator.name}
                          {report.creator.department
                            ? ` · ${report.creator.department.name}`
                            : ''}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-semibold text-gray-900">
                          {formatMoney(report.totalAmount)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(report.submittedAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
