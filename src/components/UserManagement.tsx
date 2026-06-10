'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
  UserPlus,
  Building2,
} from 'lucide-react'
import { getRoleText, formatDate } from '@/lib/utils'
import {
  createUser,
  updateUser,
  deleteUser,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/actions/admin'

interface User {
  id: number
  email: string
  name: string
  role: string
  departmentId: number | null
  department: { id: number; name: string } | null
  createdAt: Date
}

interface Department {
  id: number
  name: string
  employees: { id: number }[]
}

interface UserManagementProps {
  initialUsers: User[]
  initialDepartments: Department[]
  mode?: 'users' | 'departments' | 'both'
}

const ROLES = [
  { value: 'EMPLOYEE', label: '普通员工' },
  { value: 'MANAGER', label: '部门主管' },
  { value: 'FINANCE', label: '财务' },
  { value: 'ADMIN', label: '管理员' },
]

export function UserManagement({
  initialUsers,
  initialDepartments,
  mode = 'both',
}: UserManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [departments] = useState<Department[]>(initialDepartments)

  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)

  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [showDeleteDeptConfirm, setShowDeleteDeptConfirm] = useState(false)
  const [deletingDept, setDeletingDept] = useState<Department | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE',
    departmentId: '' as string,
  })
  const [deptForm, setDeptForm] = useState({ name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const showUsers = mode === 'users' || mode === 'both'
  const showDepartments = mode === 'departments' || mode === 'both'

  const openCreateUser = () => {
    setEditingUser(null)
    setUserForm({
      email: '',
      name: '',
      password: '',
      role: 'EMPLOYEE',
      departmentId: '',
    })
    setError('')
    setShowUserModal(true)
  }

  const openEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role as any,
      departmentId: user.departmentId?.toString() || '',
    })
    setError('')
    setShowUserModal(true)
  }

  const openCreateDept = () => {
    setEditingDept(null)
    setDeptForm({ name: '' })
    setError('')
    setShowDeptModal(true)
  }

  const openEditDept = (dept: Department) => {
    setEditingDept(dept)
    setDeptForm({ name: dept.name })
    setError('')
    setShowDeptModal(true)
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...userForm,
        departmentId: userForm.departmentId
          ? parseInt(userForm.departmentId)
          : undefined,
      }

      if (editingUser) {
        await updateUser(editingUser.id, data)
      } else {
        if (!userForm.password) {
          setError('请输入密码')
          setLoading(false)
          return
        }
        await createUser(data)
      }
      setShowUserModal(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
    setShowDeleteUserConfirm(true)
  }

  const confirmDeleteUser = async () => {
    if (!deletingUser) return
    setDeleteLoading(true)
    try {
      await deleteUser(deletingUser.id)
      setShowDeleteUserConfirm(false)
      setDeletingUser(null)
      router.refresh()
    } catch (err: any) {
      alert(err.message || '删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, deptForm)
      } else {
        await createDepartment(deptForm)
      }
      setShowDeptModal(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDept = (dept: Department) => {
    setDeletingDept(dept)
    setShowDeleteDeptConfirm(true)
  }

  const confirmDeleteDept = async () => {
    if (!deletingDept) return
    setDeleteLoading(true)
    try {
      await deleteDepartment(deletingDept.id)
      setShowDeleteDeptConfirm(false)
      setDeletingDept(null)
      router.refresh()
    } catch (err: any) {
      alert(err.message || '删除失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {showUsers && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">用户管理</h2>
            </div>
            <button
              onClick={openCreateUser}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircle className="h-4 w-4" />
              <span>添加用户</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    姓名
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    邮箱
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    角色
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    部门
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    创建时间
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {user.department?.name || '-'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditUser(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDepartments && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">部门管理</h2>
            </div>
            <button
              onClick={openCreateDept}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircle className="h-4 w-4" />
              <span>添加部门</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    部门名称
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    成员数
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      {dept.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {dept.employees.length} 人
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditDept(dept)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept)}
                          disabled={dept.employees.length > 0}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {editingUser ? '编辑用户' : '添加用户'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                  {!editingUser && (
                    <span className="text-red-500"> *</span>
                  )}
                  {editingUser && (
                    <span className="text-gray-400 text-xs ml-2">
                      不修改请留空
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色 <span className="text-red-500">*</span>
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部门
                </label>
                <select
                  value={userForm.departmentId}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      departmentId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">不分配部门</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin h-4 w-4" />}
                  <span>{loading ? '保存中...' : '保存'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {editingDept ? '编辑部门' : '添加部门'}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部门名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin h-4 w-4" />}
                  <span>{loading ? '保存中...' : '保存'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteUserConfirm && deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                确认删除
              </h3>
              <p className="text-sm text-gray-600">
                确定要删除用户 <span className="font-medium">{deletingUser.name}</span> 吗？此操作无法撤销。
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteUserConfirm(false)
                  setDeletingUser(null)
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="animate-spin h-4 w-4" />}
                <span>{deleteLoading ? '删除中...' : '确认删除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDeptConfirm && deletingDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                确认删除
              </h3>
              <p className="text-sm text-gray-600">
                确定要删除部门 <span className="font-medium">{deletingDept.name}</span> 吗？此操作无法撤销。
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDeptConfirm(false)
                  setDeletingDept(null)
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteDept}
                disabled={deleteLoading}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="animate-spin h-4 w-4" />}
                <span>{deleteLoading ? '删除中...' : '确认删除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
