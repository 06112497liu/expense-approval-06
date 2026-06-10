import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { getUserExpenseReports } from '@/lib/queries'
import { ExpenseReportCard } from '@/components/ExpenseReportCard'
import Link from 'next/link'
import { FileText, PlusCircle, Inbox } from 'lucide-react'

export default async function ExpensesPage() {
  const user = await requireAuth()

  const reports = await getUserExpenseReports(parseInt(user.id), false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的报销单</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看和管理您提交的报销单
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

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无报销单
          </h3>
          <p className="text-gray-500 mb-4">
            点击右上角"新建报销单"开始创建您的第一个报销单
          </p>
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
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ExpenseReportCard
              key={report.id}
              report={report}
              showApprover
              hrefPrefix="/expenses"
            />
          ))}
        </div>
      )}
    </div>
  )
}
