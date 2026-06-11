import { notFound, redirect } from 'next/navigation'
import { requireAuth, canApproveReport, canViewExpenseReport } from '@/lib/permissions'
import { getExpenseReportById } from '@/lib/queries'
import { ApprovalDetailClient } from '@/components/ApprovalDetailClient'

export default async function ApprovalDetailPage({
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

  if (!canView && user.role !== 'ADMIN') {
    redirect('/approvals')
  }

  const canApprove = await canApproveReport(
    parseInt(user.id),
    user.role,
    user.departmentId,
    reportId
  )

  return (
    <ApprovalDetailClient report={report} canApprove={canApprove} />
  )
}
