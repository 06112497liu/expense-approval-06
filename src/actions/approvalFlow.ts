'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getAllApprovalFlows() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  return prisma.approvalFlow.findMany({
    include: {
      nodes: {
        orderBy: { stepNumber: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  })
}

export async function getApprovalFlowById(flowId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  return prisma.approvalFlow.findUnique({
    where: { id: flowId },
    include: {
      nodes: {
        orderBy: { stepNumber: 'asc' },
        include: {
          nodeUsers: {
            include: { user: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  })
}

export async function getDefaultApprovalFlow() {
  return prisma.approvalFlow.findFirst({
    where: { isDefault: true },
    include: {
      nodes: {
        orderBy: { stepNumber: 'asc' },
        include: {
          nodeUsers: {
            include: { user: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  })
}

export async function createApprovalFlow(data: {
  name: string
  description?: string
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const existing = await prisma.approvalFlow.findFirst({
    where: { name: data.name },
  })
  if (existing) {
    throw new Error('审批流名称已存在')
  }

  const flow = await prisma.approvalFlow.create({
    data: {
      name: data.name,
      description: data.description || '',
    },
  })

  revalidatePath('/admin/approval-flows')
  return flow
}

export async function updateApprovalFlow(
  flowId: number,
  data: {
    name: string
    description?: string
    isDefault?: boolean
  }
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const existing = await prisma.approvalFlow.findFirst({
    where: { name: data.name, NOT: { id: flowId } },
  })
  if (existing) {
    throw new Error('审批流名称已存在')
  }

  if (data.isDefault) {
    await prisma.approvalFlow.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  await prisma.approvalFlow.update({
    where: { id: flowId },
    data: {
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
    },
  })

  revalidatePath('/admin/approval-flows')
  revalidatePath(`/admin/approval-flows/${flowId}`)
}

export async function deleteApprovalFlow(flowId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const flow = await prisma.approvalFlow.findUnique({
    where: { id: flowId },
    include: { expenseReports: true },
  })

  if (!flow) {
    throw new Error('审批流不存在')
  }

  if (flow.isDefault) {
    throw new Error('不能删除默认审批流')
  }

  if (flow.expenseReports.length > 0) {
    throw new Error('该审批流已被报销单使用，无法删除')
  }

  await prisma.approvalFlow.delete({
    where: { id: flowId },
  })

  revalidatePath('/admin/approval-flows')
  redirect('/admin/approval-flows')
}

export async function addApprovalNode(flowId: number, data: {
  nodeName: string
  approvalType: 'SINGLE' | 'ALL_SIGN' | 'ANY_SIGN'
  approverSource: 'ROLE' | 'USER' | 'DEPARTMENT_MANAGER'
  approverRole?: string
  conditionType: 'NONE' | 'AMOUNT_GREATER_THAN'
  conditionValue?: number
  userIds?: number[]
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const flow = await prisma.approvalFlow.findUnique({
    where: { id: flowId },
    include: { nodes: true },
  })

  if (!flow) {
    throw new Error('审批流不存在')
  }

  const isFinanceNode = data.approverRole === 'FINANCE'

  if (isFinanceNode) {
    const hasFinanceNode = flow.nodes.some(n => n.isFinanceNode)
    if (hasFinanceNode) {
      throw new Error('只能有一个财务审批节点')
    }
  }

  const sortedNodes = [...flow.nodes].sort((a, b) => a.stepNumber - b.stepNumber)
  const nonFinanceNodes = sortedNodes.filter(n => !n.isFinanceNode)
  const hasExistingFinanceNode = sortedNodes.some(n => n.isFinanceNode)

  let stepNumber: number
  if (isFinanceNode) {
    stepNumber = nonFinanceNodes.length + 1
  } else {
    stepNumber = nonFinanceNodes.length + 1
    if (hasExistingFinanceNode) {
      stepNumber = stepNumber
    } else {
      stepNumber = sortedNodes.length + 1
    }
  }

  const actions: any[] = []

  const node = await prisma.approvalNode.create({
    data: {
      flowId,
      stepNumber,
      nodeName: data.nodeName,
      approvalType: data.approvalType,
      approverSource: data.approverSource,
      approverRole: data.approverRole || null,
      conditionType: data.conditionType,
      conditionValue: data.conditionValue || null,
      isFinanceNode,
    },
  })

  if (isFinanceNode) {
    const reordered = [...nonFinanceNodes.map(n => ({ id: n.id })), { id: node.id }]
    for (let i = 0; i < reordered.length; i++) {
      actions.push(
        prisma.approvalNode.update({
          where: { id: reordered[i].id },
          data: { stepNumber: i + 1 },
        })
      )
    }
  }

  if (actions.length > 0) {
    await prisma.$transaction(actions)
  }

  if (data.userIds && data.userIds.length > 0) {
    await prisma.approvalNodeUser.createMany({
      data: data.userIds.map((userId, index) => ({
        nodeId: node.id,
        userId,
        orderIndex: index,
      })),
    })
  }

  revalidatePath(`/admin/approval-flows/${flowId}`)
  return node
}

export async function updateApprovalNode(nodeId: number, data: {
  nodeName: string
  approvalType: 'SINGLE' | 'ALL_SIGN' | 'ANY_SIGN'
  approverSource: 'ROLE' | 'USER' | 'DEPARTMENT_MANAGER'
  approverRole?: string
  conditionType: 'NONE' | 'AMOUNT_GREATER_THAN'
  conditionValue?: number
  userIds?: number[]
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const node = await prisma.approvalNode.findUnique({
    where: { id: nodeId },
    include: { flow: true },
  })

  if (!node) {
    throw new Error('审批节点不存在')
  }

  const isFinanceNode = data.approverRole === 'FINANCE'
  const becomingFinanceNode = isFinanceNode && !node.isFinanceNode

  if (becomingFinanceNode) {
    const hasFinanceNode = await prisma.approvalNode.findFirst({
      where: { flowId: node.flowId, isFinanceNode: true, NOT: { id: nodeId } },
    })
    if (hasFinanceNode) {
      throw new Error('只能有一个财务审批节点')
    }
  }

  const actions: any[] = []

  actions.push(
    prisma.approvalNode.update({
      where: { id: nodeId },
      data: {
        nodeName: data.nodeName,
        approvalType: data.approvalType,
        approverSource: data.approverSource,
        approverRole: data.approverRole || null,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue || null,
        isFinanceNode,
      },
    })
  )

  if (becomingFinanceNode) {
    const allNodes = await prisma.approvalNode.findMany({
      where: { flowId: node.flowId },
      orderBy: { stepNumber: 'asc' },
    })
    const nonFinanceNodes = allNodes.filter(n => n.id !== nodeId && !n.isFinanceNode)
    const reordered = [...nonFinanceNodes, { id: nodeId, isFinanceNode: true } as any]
    for (let i = 0; i < reordered.length; i++) {
      actions.push(
        prisma.approvalNode.update({
          where: { id: reordered[i].id },
          data: { stepNumber: i + 1 },
        })
      )
    }
  }

  await prisma.$transaction(actions)

  await prisma.approvalNodeUser.deleteMany({
    where: { nodeId },
  })

  if (data.userIds && data.userIds.length > 0) {
    await prisma.approvalNodeUser.createMany({
      data: data.userIds.map((userId, index) => ({
        nodeId,
        userId,
        orderIndex: index,
      })),
    })
  }

  revalidatePath(`/admin/approval-flows/${node.flowId}`)
}

export async function deleteApprovalNode(nodeId: number) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const node = await prisma.approvalNode.findUnique({
    where: { id: nodeId },
    include: { flow: true },
  })

  if (!node) {
    throw new Error('审批节点不存在')
  }

  if (node.isFinanceNode) {
    throw new Error('财务审批节点不能删除')
  }

  const flowId = node.flowId
  const deletedStep = node.stepNumber

  await prisma.approvalNode.delete({
    where: { id: nodeId },
  })

  await prisma.approvalNode.updateMany({
    where: { flowId, stepNumber: { gt: deletedStep } },
    data: { stepNumber: { decrement: 1 } },
  })

  revalidatePath(`/admin/approval-flows/${flowId}`)
}

export async function saveNodeOrder(flowId: number, nodeOrders: { nodeId: number; stepNumber: number }[]) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  const flow = await prisma.approvalFlow.findUnique({
    where: { id: flowId },
    include: { nodes: true },
  })

  if (!flow) {
    throw new Error('审批流不存在')
  }

  const financeNode = flow.nodes.find(n => n.isFinanceNode)
  const financeOrder = nodeOrders.find(o => o.nodeId === financeNode?.id)
  const maxStep = Math.max(...nodeOrders.map(o => o.stepNumber))

  if (financeNode && financeOrder && financeOrder.stepNumber !== maxStep) {
    throw new Error('财务审批节点必须是最后一个')
  }

  await prisma.$transaction(
    nodeOrders.map(order =>
      prisma.approvalNode.update({
        where: { id: order.nodeId },
        data: { stepNumber: order.stepNumber },
      })
    )
  )

  revalidatePath(`/admin/approval-flows/${flowId}`)
}

export async function getAvailableUsers() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无权限')
  }

  return prisma.user.findMany({
    include: { department: true },
    orderBy: { id: 'asc' },
  })
}
