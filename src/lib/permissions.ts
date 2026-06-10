import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    redirect('/')
  }
  return user
}

export async function canViewExpenseReport(
  userId: number,
  userRole: string,
  userDepartmentId: number | null,
  reportId: number
): Promise<boolean> {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    include: {
      creator: true,
      approvals: true,
    },
  })

  if (!report) return false

  if (userRole === 'ADMIN') return true

  if (report.creatorId === userId) return true

  if (report.status === 'APPROVED' || report.status === 'REJECTED') {
    return report.creatorId === userId
  }

  if (userRole === 'MANAGER' && userDepartmentId) {
    if (report.creator.departmentId === userDepartmentId) {
      if (report.status === 'PENDING' && report.currentApproverId === userId) {
        return true
      }
    }
  }

  if (userRole === 'FINANCE') {
    if (report.status === 'PENDING' && report.currentApproverId === userId) {
      return true
    }
  }

  return false
}

export async function canEditExpenseReport(
  userId: number,
  userRole: string,
  reportId: number
): Promise<boolean> {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  })

  if (!report) return false

  if (report.status !== 'DRAFT' && report.status !== 'REJECTED') {
    return false
  }

  return report.creatorId === userId
}

export async function canApproveReport(
  userId: number,
  userRole: string,
  userDepartmentId: number | null,
  reportId: number
): Promise<boolean> {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    include: {
      creator: true,
      approvals: true,
    },
  })

  if (!report) return false
  if (report.status !== 'PENDING') return false
  if (report.currentApproverId !== userId) return false

  if (userRole === 'ADMIN') return true

  const alreadyApproved = report.approvals.some(
    (a) => a.approverId === userId && a.status !== 'PENDING'
  )
  if (alreadyApproved) return false

  if (userRole === 'MANAGER') {
    return report.creator.departmentId === userDepartmentId
  }

  if (userRole === 'FINANCE') {
    return true
  }

  return false
}
