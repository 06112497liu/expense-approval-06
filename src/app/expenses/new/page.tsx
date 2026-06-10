import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/permissions'
import { ExpenseForm } from '@/components/ExpenseForm'

export default async function NewExpensePage() {
  const user = await requireAuth()

  if (user.role === 'ADMIN') {
    redirect('/')
  }

  return <ExpenseForm mode="create" />
}
