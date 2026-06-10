'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createUser(data: {
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE'
  departmentId?: number
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  })
  if (existing) {
    throw new Error('邮箱已存在')
  }

  const passwordHash = await bcrypt.hash(data.password, 10)

  await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      departmentId: data.departmentId || null,
    },
  })

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function updateUser(
  userId: number,
  data: {
    email: string
    name: string
    role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'FINANCE'
    departmentId?: number | null
    password?: string
  }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const updateData: any = {
    email: data.email,
    name: data.name,
    role: data.role,
    departmentId: data.departmentId ?? null,
  }

  if (data.password && data.password.length > 0) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10)
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function deleteUser(userId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  if (parseInt(user.id) === userId) {
    throw new Error('不能删除自己')
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      submittedExpenses: true,
      approvals: true,
      currentApprovals: true,
    },
  })

  if (!targetUser) {
    throw new Error('用户不存在')
  }

  const hasPendingExpenses = targetUser.submittedExpenses.some(
    (e) => e.status === 'PENDING'
  )
  if (hasPendingExpenses) {
    throw new Error('该用户有待审批的报销单，无法删除')
  }

  const hasPendingApprovals = targetUser.approvals.some(
    (a) => a.status === 'PENDING'
  )
  if (hasPendingApprovals) {
    throw new Error('该用户有待处理的审批任务，无法删除')
  }

  await prisma.$transaction([
    prisma.approval.deleteMany({
      where: { approverId: userId },
    }),
    prisma.expenseReport.updateMany({
      where: { currentApproverId: userId },
      data: { currentApproverId: null },
    }),
    prisma.expenseReport.deleteMany({
      where: { creatorId: userId },
    }),
  ])

  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function createDepartment(data: { name: string }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const existing = await prisma.department.findUnique({
    where: { name: data.name },
  })
  if (existing) {
    throw new Error('部门已存在')
  }

  await prisma.department.create({
    data: {
      name: data.name,
    },
  })

  revalidatePath('/admin/departments')
  redirect('/admin/departments')
}

export async function updateDepartment(
  deptId: number,
  data: { name: string }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  await prisma.department.update({
    where: { id: deptId },
    data: {
      name: data.name,
    },
  })

  revalidatePath('/admin/departments')
  redirect('/admin/departments')
}

export async function deleteDepartment(deptId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const deptWithUsers = await prisma.department.findUnique({
    where: { id: deptId },
    include: { employees: true },
  })

  if (deptWithUsers && deptWithUsers.employees.length > 0) {
    throw new Error('该部门下还有用户，无法删除')
  }

  await prisma.department.delete({
    where: { id: deptId },
  })

  revalidatePath('/admin/departments')
  redirect('/admin/departments')
}

export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      department: true,
    },
    orderBy: {
      id: 'asc',
    },
  })
}

export async function getAllDepartments() {
  return prisma.department.findMany({
    include: {
      employees: true,
    },
    orderBy: {
      id: 'asc',
    },
  })
}
