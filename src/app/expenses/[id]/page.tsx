import { notFound, redirect } from 'next/navigation'
import {
  requireAuth,
  canViewExpenseReport,
  canEditExpenseReport,
} from '@/lib/permissions'
import { getExpenseReportById } from '@/lib/queries'
import { ExpenseDetailView } from '@/components/ExpenseDetailView'

export default async function ExpenseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()
  const reportId = parseInt(params.id)

  const report = await getExpenseReportById(reportId)
  if (!report) {
    notFound()
  }

  const canView = await canViewExpenseReport(
    parseInt(user.id),
    user.role,
    user.departmentId,
    reportId
  )
  if (!canView) {
    redirect('/')
  }

  const isCreator = report.creatorId === parseInt(user.id)
  const canEdit = await canEditExpenseReport(
    parseInt(user.id),
    user.role,
    reportId
  )

  return (
    <ExpenseDetailView
      report={report}
      isCreator={isCreator}
      canEdit={canEdit}
      backHref="/expenses"
      showEditButton={isCreator && canEdit}
    />
  )
}
