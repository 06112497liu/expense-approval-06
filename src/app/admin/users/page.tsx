import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/permissions'
import { getAllUsers, getAllDepartments } from '@/actions/admin'
import { UserManagement } from '@/components/UserManagement'

export default async function AdminUsersPage() {
  await requireAdmin()

  const users = await getAllUsers()
  const departments = await getAllDepartments()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理系统用户账号和权限
        </p>
      </div>
      <UserManagement initialUsers={users as any} initialDepartments={departments as any} mode="users" />
    </div>
  )
}
