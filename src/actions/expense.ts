'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/permissions'
import { getDepartmentManager, getFinanceUser, getExpenseReportById, getDefaultApprovalFlow, getUserByRole } from '@/lib/queries'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExpenseReport(data: {
  title: string
  description: string
  items: {
    category: string
    amount: number
    description: string
    date: string
  }[]
}) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }

  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)

  const report = await prisma.expenseReport.create({
    data: {
      title: data.title,
      description: data.description,
      totalAmount,
      status: 'DRAFT',
      creatorId: parseInt(user.id),
      items: {
        create: data.items.map((item) => ({
          category: item.category,
          amount: item.amount,
          description: item.description,
          date: new Date(item.date),
        })),
      },
    },
  })

  revalidatePath('/')
  revalidatePath('/expenses')
  return report
}

export async function updateExpenseReport(
  reportId: number,
  data: {
    title: string
    description: string
    items: {
      id?: number
      category: string
      amount: number
      description: string
      date: string
    }[]
  }
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }

  const report = await getExpenseReportById(reportId)
  if (!report) {
    throw new Error('报销单不存在')
  }

  if (report.creatorId !== parseInt(user.id)) {
    throw new Error('无权修改此报销单')
  }

  if (report.status !== 'DRAFT' && report.status !== 'REJECTED') {
    throw new Error('当前状态不能修改报销单')
  }

  const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0)

  await prisma.expenseItem.deleteMany({
    where: { reportId },
  })

  const updateData: any = {
    title: data.title,
    description: data.description,
    totalAmount,
    items: {
      create: data.items.map((item) => ({
        category: item.category,
        amount: item.amount,
        description: item.description,
        date: new Date(item.date),
      })),
    },
  }

  if (report.status === 'REJECTED') {
    updateData.status = 'DRAFT'
    updateData.submittedAt = null
    updateData.currentApproverId = null

    await prisma.approval.deleteMany({
      where: { reportId },
    })
  }

  await prisma.expenseReport.update({
    where: { id: reportId },
    data: updateData,
  })

  revalidatePath('/')
  revalidatePath(`/expenses/${reportId}`)
  revalidatePath('/expenses')
}

export async function submitExpenseReport(reportId: number) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }

  const report = await getExpenseReportById(reportId)
  if (!report) {
    throw new Error('报销单不存在')
  }

  if (report.creatorId !== parseInt(user.id)) {
    throw new Error('无权提交此报销单')
  }

  if (report.status !== 'DRAFT' && report.status !== 'REJECTED') {
    throw new Error('当前状态不能提交报销单')
  }

  const departmentId = report.creator.departmentId
  if (!departmentId) {
    throw new Error('用户没有所属部门')
  }

  const approvalFlow = await getDefaultApprovalFlow()

  if (!approvalFlow || approvalFlow.nodes.length === 0) {
    return submitExpenseReportFallback(reportId, departmentId)
  }

  const sortedNodes = [...approvalFlow.nodes].sort((a, b) => a.stepNumber - b.stepNumber)
  const nonFinanceNodes = sortedNodes.filter(n => !n.isFinanceNode)
  const financeNode = sortedNodes.find(n => n.isFinanceNode)

  const orderedNodes = [...nonFinanceNodes]
  if (financeNode) {
    orderedNodes.push(financeNode)
  }

  const hasFinanceNode = orderedNodes.some(n => n.isFinanceNode)
  if (!hasFinanceNode) {
    throw new Error('审批流中缺少财务审批节点，请先配置审批流')
  }

  await prisma.approval.deleteMany({
    where: { reportId },
  })

  const approvalsToCreate: {
    approverId: number
    stepNumber: number
    role: string
    status: string
    nodeId: number
    groupId: string | null
  }[] = []

  let stepCounter = 0
  let firstApproverId: number | null = null

  for (const node of orderedNodes) {
    if (node.conditionType === 'AMOUNT_GREATER_THAN' && node.conditionValue) {
      if (report.totalAmount <= node.conditionValue) {
        continue
      }
    }

    stepCounter++
    const groupId =
      node.approvalType !== 'SINGLE'
        ? `node-${node.id}-${Date.now()}-${stepCounter}`
        : null

    const approvers = await getNodeApprovers(node, departmentId)
    if (approvers.length === 0) {
      throw new Error(`节点"${node.nodeName}"未找到审批人`)
    }

    for (let i = 0; i < approvers.length; i++) {
      const approver = approvers[i]
      approvalsToCreate.push({
        approverId: approver.id,
        stepNumber: stepCounter,
        role: approver.role,
        status: 'PENDING',
        nodeId: node.id,
        groupId,
      })

      if (firstApproverId === null) {
        firstApproverId = approver.id
      }
    }
  }

  if (approvalsToCreate.length === 0) {
    throw new Error('没有生成审批节点，请检查审批流配置')
  }

  await prisma.expenseReport.update({
    where: { id: reportId },
    data: {
      status: 'PENDING',
      submittedAt: new Date(),
      currentApproverId: firstApproverId,
      currentStepNumber: 1,
      flowId: approvalFlow.id,
      approvals: {
        create: approvalsToCreate,
      },
    },
  })

  revalidatePath('/')
  revalidatePath(`/expenses/${reportId}`)
  revalidatePath('/expenses')
  revalidatePath('/approvals')
  redirect('/expenses')
}

async function getNodeApprovers(
  node: {
    id: number
    approverSource: string
    approverRole: string | null
    nodeUsers: { userId: number; user: { id: number; role: string } }[]
  },
  departmentId: number
) {
  if (node.approverSource === 'ROLE' && node.approverRole) {
    const user = await getUserByRole(node.approverRole)
    return user ? [user] : []
  }

  if (node.approverSource === 'DEPARTMENT_MANAGER') {
    const manager = await getDepartmentManager(departmentId)
    return manager ? [manager] : []
  }

  if (node.approverSource === 'USER') {
    return node.nodeUsers.map((nu) => nu.user)
  }

  return []
}

async function submitExpenseReportFallback(
  reportId: number,
  departmentId: number
) {
  const departmentManager = await getDepartmentManager(departmentId)
  if (!departmentManager) {
    throw new Error('部门没有主管')
  }

  await prisma.approval.deleteMany({
    where: { reportId },
  })

  const financeUser = await getFinanceUser()

  await prisma.expenseReport.update({
    where: { id: reportId },
    data: {
      status: 'PENDING',
      submittedAt: new Date(),
      currentApproverId: departmentManager.id,
      currentStepNumber: 1,
      approvals: {
        create: [
          {
            approverId: departmentManager.id,
            stepNumber: 1,
            role: 'MANAGER',
            status: 'PENDING',
          },
          ...(financeUser
            ? [
                {
                  approverId: financeUser.id,
                  stepNumber: 2,
                  role: 'FINANCE',
                  status: 'PENDING',
                },
              ]
            : []),
        ],
      },
    },
  })

  revalidatePath('/')
  revalidatePath(`/expenses/${reportId}`)
  revalidatePath('/expenses')
  revalidatePath('/approvals')
  redirect('/expenses')
}

export async function approveReport(reportId: number, comment?: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }

  const userId = parseInt(user.id)
  const report = await getExpenseReportById(reportId)
  if (!report) {
    throw new Error('报销单不存在')
  }

  if (report.status !== 'PENDING') {
    throw new Error('当前状态不能审批')
  }

  const currentApproval = report.approvals.find(
    (a) => a.approverId === userId && a.status === 'PENDING'
  )
  if (!currentApproval) {
    throw new Error('您没有待审批的任务')
  }

  const currentStep = currentApproval.stepNumber
  const groupId = currentApproval.groupId
  const nodeId = currentApproval.nodeId

  let approvalType = 'SINGLE'
  if (nodeId) {
    const node = await prisma.approvalNode.findUnique({
      where: { id: nodeId },
    })
    if (node) {
      approvalType = node.approvalType
    }
  }

  const actions: any[] = []

  actions.push(
    prisma.approval.update({
      where: { id: currentApproval.id },
      data: {
        status: 'APPROVED',
        comment,
        approvedAt: new Date(),
      },
    })
  )

  let goToNextStep = false

  if (approvalType === 'SINGLE') {
    goToNextStep = true
  } else if (approvalType === 'ANY_SIGN') {
    if (groupId) {
      const groupApprovals = report.approvals.filter(
        (a) => a.groupId === groupId
      )
      for (const a of groupApprovals) {
        if (a.id !== currentApproval.id && a.status === 'PENDING') {
          actions.push(
            prisma.approval.update({
              where: { id: a.id },
              data: {
                status: 'APPROVED',
                comment: '或签已通过',
                approvedAt: new Date(),
              },
            })
          )
        }
      }
    }
    goToNextStep = true
  } else if (approvalType === 'ALL_SIGN') {
    if (groupId) {
      const pendingInGroup = report.approvals.filter(
        (a) => a.groupId === groupId && a.status === 'PENDING'
      )
      if (pendingInGroup.length <= 1) {
        goToNextStep = true
      }
    } else {
      goToNextStep = true
    }
  }

  if (goToNextStep) {
    const nextStepApproval = report.approvals.find(
      (a) => a.stepNumber > currentStep && a.status === 'PENDING'
    )

    if (nextStepApproval) {
      actions.push(
        prisma.expenseReport.update({
          where: { id: reportId },
          data: {
            currentApproverId: nextStepApproval.approverId,
            currentStepNumber: nextStepApproval.stepNumber,
          },
        })
      )
    } else {
      const nodeIdsToCheck = report.approvals
        .filter((a) => a.nodeId)
        .map((a) => a.nodeId!)
        .filter((v, i, arr) => arr.indexOf(v) === i)

      let hasFinanceNode = false
      if (nodeIdsToCheck.length > 0) {
        const nodes = await prisma.approvalNode.findMany({
          where: { id: { in: nodeIdsToCheck } },
        })
        hasFinanceNode = nodes.some((n) => n.isFinanceNode)
      }

      const hasFinanceRole = report.approvals.some((a) => a.role === 'FINANCE')

      if (hasFinanceNode || hasFinanceRole) {
        const financeApproved = report.approvals.some(
          (a) =>
            (a.role === 'FINANCE' && a.status === 'APPROVED') ||
            (a.status === 'APPROVED' &&
              a.nodeId &&
              (() => {
                return false
              })())
        )

        if (!financeApproved) {
          const allFinished = report.approvals.every(
            (a) => a.status === 'APPROVED' || a.status === 'REJECTED'
          )
          if (allFinished) {
            throw new Error('系统检测到异常：财务审批节点未完成，不能归档。请联系管理员检查审批流配置。')
          }
        }
      }

      actions.push(
        prisma.expenseReport.update({
          where: { id: reportId },
          data: {
            status: 'APPROVED',
            currentApproverId: null,
            currentStepNumber: 0,
          },
        })
      )
    }
  }

  await prisma.$transaction(actions)

  revalidatePath('/')
  revalidatePath(`/expenses/${reportId}`)
  revalidatePath('/expenses')
  revalidatePath('/approvals')
  redirect('/approvals')
}

export async function rejectReport(reportId: number, comment?: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }

  const userId = parseInt(user.id)
  const report = await getExpenseReportById(reportId)
  if (!report) {
    throw new Error('报销单不存在')
  }

  if (report.status !== 'PENDING') {
    throw new Error('当前状态不能审批')
  }

  const currentApproval = report.approvals.find(
    (a) => a.approverId === userId && a.status === 'PENDING'
  )
  if (!currentApproval) {
    throw new Error('您没有待审批的任务')
  }

  const groupId = currentApproval.groupId
  const nodeId = currentApproval.nodeId

  let approvalType = 'SINGLE'
  if (nodeId) {
    const node = await prisma.approvalNode.findUnique({
      where: { id: nodeId },
    })
    if (node) {
      approvalType = node.approvalType
    }
  }

  const actions: any[] = []

  actions.push(
    prisma.approval.update({
      where: { id: currentApproval.id },
      data: {
        status: 'REJECTED',
        comment,
        approvedAt: new Date(),
      },
    })
  )

  if (approvalType === 'ALL_SIGN' && groupId) {
    const groupApprovals = report.approvals.filter(
      (a) => a.groupId === groupId && a.status === 'PENDING'
    )
    for (const a of groupApprovals) {
      if (a.id !== currentApproval.id) {
        actions.push(
          prisma.approval.update({
            where: { id: a.id },
            data: {
              status: 'REJECTED',
              comment: '会签已被拒绝',
              approvedAt: new Date(),
            },
          })
        )
      }
    }
  }

  if (approvalType === 'ANY_SIGN' && groupId) {
    const groupApprovals = report.approvals.filter(
      (a) => a.groupId === groupId && a.status === 'PENDING'
    )
    for (const a of groupApprovals) {
      if (a.id !== currentApproval.id) {
        actions.push(
          prisma.approval.update({
            where: { id: a.id },
            data: {
              status: 'REJECTED',
              comment: '或签已被拒绝',
              approvedAt: new Date(),
            },
          })
        )
      }
    }
  }

  actions.push(
    prisma.expenseReport.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        currentApproverId: null,
        currentStepNumber: 0,
      },
    })
  )

  await prisma.$transaction(actions)

  revalidatePath('/')
  revalidatePath(`/expenses/${reportId}`)
  revalidatePath('/expenses')
  revalidatePath('/approvals')
  redirect('/approvals')
}

export async function deleteExpenseReport(reportId: number) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }

  const report = await getExpenseReportById(reportId)
  if (!report) {
    throw new Error('报销单不存在')
  }

  if (report.creatorId !== parseInt(user.id)) {
    throw new Error('无权删除此报销单')
  }

  if (report.status !== 'DRAFT') {
    throw new Error('只能删除草稿状态的报销单')
  }

  await prisma.expenseReport.delete({
    where: { id: reportId },
  })

  revalidatePath('/')
  revalidatePath('/expenses')
  redirect('/expenses')
}
