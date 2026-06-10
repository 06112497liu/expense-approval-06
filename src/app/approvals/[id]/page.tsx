import { notFound, redirect } from 'next/navigation'
import { requireAuth, canApproveReport } from '@/lib/permissions'
import { getExpenseReportById } from '@/lib/queries'
import { ApprovalDetailClient } from '@/components/ApprovalDetailClient'

export default async function ApprovalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()

  if (user.role === 'EMPLOYEE') {
    redirect('/')
  }

  const reportId = parseInt(params.id)

  const report = await getExpenseReportById(reportId)
  if (!report) {
    notFound()
  }

  const canApprove = await canApproveReport(
    parseInt(user.id),
    user.role,
    user.departmentId,
    reportId
  )

  if (!canApprove && report.status !== 'APPROVED' && report.status !== 'REJECTED') {
    if (report.creator.departmentId !== user.departmentId || user.role !== 'MANAGER') {
      if (user.role !== 'ADMIN') {
        redirect('/approvals')
      }
    }
  }

  return (
    <ApprovalDetailClient report={report} canApprove={canApprove} />
  )
}
