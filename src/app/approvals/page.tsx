import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { getPendingApprovalsForUser, getAllExpenseReports } from '@/lib/queries'
import { ExpenseReportCard } from '@/components/ExpenseReportCard'
import { CheckSquare, Inbox, Eye } from 'lucide-react'

export default async function ApprovalsPage() {
  const user = await requireAuth()

  if (user.role === 'EMPLOYEE') {
    redirect('/')
  }

  const pendingApprovals = await getPendingApprovalsForUser(
    parseInt(user.id),
    user.role,
    user.departmentId
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">待我审批</h1>
        <p className="mt-1 text-sm text-gray-500">
          {user.role === 'ADMIN'
            ? '查看所有待审批的报销单'
            : '需要您审批的报销单列表'}
        </p>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Inbox className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无待审批报销单
          </h3>
          <p className="text-gray-500">
            目前没有需要您审批的报销单
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((report) => (
            <ExpenseReportCard
              key={report.id}
              report={report}
              showApprover
              hrefPrefix="/approvals"
            />
          ))}
        </div>
      )}
    </div>
  )
}
