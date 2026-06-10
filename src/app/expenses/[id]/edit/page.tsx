import { redirect, notFound } from 'next/navigation'
import {
  requireAuth,
  canEditExpenseReport,
  canViewExpenseReport,
} from '@/lib/permissions'
import { getExpenseReportById } from '@/lib/queries'
import { ExpenseForm } from '@/components/ExpenseForm'

export default async function EditExpensePage({
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

  const canEdit = await canEditExpenseReport(
    parseInt(user.id),
    user.role,
    reportId
  )
  if (!canEdit) {
    redirect(`/expenses/${reportId}`)
  }

  return (
    <ExpenseForm
      mode="edit"
      initialData={{
        id: report.id,
        title: report.title,
        description: report.description,
        status: report.status,
        items: report.items.map((item) => ({
          id: item.id,
          category: item.category,
          amount: item.amount,
          description: item.description,
          date: item.date.toISOString().split('T')[0],
        })),
      }}
    />
  )
}
