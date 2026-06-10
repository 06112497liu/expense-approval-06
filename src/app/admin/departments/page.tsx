import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/permissions'
import { getAllUsers, getAllDepartments } from '@/actions/admin'
import { UserManagement } from '@/components/UserManagement'

export default async function AdminDepartmentsPage() {
  await requireAdmin()

  const users = await getAllUsers()
  const departments = await getAllDepartments()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">部门管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理公司组织架构和部门信息
        </p>
      </div>
      <UserManagement initialUsers={users as any} initialDepartments={departments as any} mode="departments" />
    </div>
  )
}
