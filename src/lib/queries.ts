import { prisma } from './prisma'

export async function getUserExpenseReports(userId: number, includeHistory = false) {
  const where: any = {
    creatorId: userId,
  }

  if (!includeHistory) {
    where.status = { in: ['DRAFT', 'PENDING'] }
  } else {
    where.status = { in: ['APPROVED', 'REJECTED'] }
  }

  return prisma.expenseReport.findMany({
    where,
    include: {
      creator: true,
      currentApprover: true,
      items: true,
      approvals: {
        include: {
          approver: true,
        },
        orderBy: {
          stepNumber: 'asc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

export async function getPendingApprovalsForUser(
  userId: number,
  userRole: string,
  userDepartmentId: number | null
) {
  if (userRole === 'ADMIN') {
    return prisma.expenseReport.findMany({
      where: { status: 'PENDING' },
      include: {
        creator: {
          include: {
            department: true,
          },
        },
        currentApprover: true,
        items: true,
        approvals: {
          include: {
            approver: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  if (userRole === 'MANAGER' && userDepartmentId) {
    return prisma.expenseReport.findMany({
      where: {
        status: 'PENDING',
        currentApproverId: userId,
        creator: {
          departmentId: userDepartmentId,
        },
      },
      include: {
        creator: {
          include: {
            department: true,
          },
        },
        currentApprover: true,
        items: true,
        approvals: {
          include: {
            approver: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  if (userRole === 'FINANCE') {
    return prisma.expenseReport.findMany({
      where: {
        status: 'PENDING',
        currentApproverId: userId,
      },
      include: {
        creator: {
          include: {
            department: true,
          },
        },
        currentApprover: true,
        items: true,
        approvals: {
          include: {
            approver: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  return []
}

export async function getAllExpenseReports() {
  return prisma.expenseReport.findMany({
    include: {
      creator: {
        include: {
          department: true,
        },
      },
      currentApprover: true,
      items: true,
      approvals: {
        include: {
          approver: true,
        },
        orderBy: {
          stepNumber: 'asc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

export async function getExpenseReportById(id: number) {
  return prisma.expenseReport.findUnique({
    where: { id },
    include: {
      creator: {
        include: {
          department: true,
        },
      },
      currentApprover: true,
      items: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      approvals: {
        include: {
          approver: true,
        },
        orderBy: {
          stepNumber: 'asc',
        },
      },
    },
  })
}

export async function getDepartmentManager(departmentId: number) {
  return prisma.user.findFirst({
    where: {
      departmentId,
      role: 'MANAGER',
    },
  })
}

export async function getFinanceUser() {
  return prisma.user.findFirst({
    where: {
      role: 'FINANCE',
    },
  })
}
