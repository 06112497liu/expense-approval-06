import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { getUserExpenseReports } from '@/lib/queries'
import { ExpenseReportCard } from '@/components/ExpenseReportCard'
import { History, Inbox } from 'lucide-react'

export default async function HistoryPage() {
  const user = await requireAuth()

  const reports = await getUserExpenseReports(parseInt(user.id), true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">提交历史</h1>
        <p className="mt-1 text-sm text-gray-500">
          已通过或已驳回的报销单历史记录
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无历史记录
          </h3>
          <p className="text-gray-500">
            您还没有已完成审批的报销单
          </p>
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
