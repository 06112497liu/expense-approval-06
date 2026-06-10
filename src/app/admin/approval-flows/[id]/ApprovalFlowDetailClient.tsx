'use client'

import { useState } from 'react'
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  X,
  DollarSign,
  Users,
  UserCheck,
  Building2,
} from 'lucide-react'
import {
  addApprovalNode,
  updateApprovalNode,
  deleteApprovalNode,
  saveNodeOrder,
  updateApprovalFlow,
} from '@/actions/approvalFlow'

type NodeUser = {
  id: number
  nodeId: number
  userId: number
  orderIndex: number
  user: { id: number; name: string; email: string; role: string }
}

type ApprovalNode = {
  id: number
  flowId: number
  stepNumber: number
  nodeName: string
  approvalType: string
  approverSource: string
  approverRole: string | null
  conditionType: string
  conditionValue: number | null
  isFinanceNode: boolean
  nodeUsers: NodeUser[]
}

type ApprovalFlow = {
  id: number
  name: string
  description: string | null
  isDefault: boolean
  nodes: ApprovalNode[]
}

type User = {
  id: number
  name: string
  email: string
  role: string
  department: { id: number; name: string } | null
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'MANAGER', label: '部门主管' },
  { value: 'FINANCE', label: '财务' },
  { value: 'GENERAL_MANAGER', label: '总经理' },
  { value: 'EMPLOYEE', label: '普通员工' },
]

const APPROVAL_TYPE_OPTIONS = [
  { value: 'SINGLE', label: '单人审批' },
  { value: 'ALL_SIGN', label: '会签（全部通过）' },
  { value: 'ANY_SIGN', label: '或签（任一通过）' },
]

const APPROVER_SOURCE_OPTIONS = [
  { value: 'ROLE', label: '指定角色' },
  { value: 'USER', label: '指定人员' },
  { value: 'DEPARTMENT_MANAGER', label: '申请人部门主管' },
]

export default function ApprovalFlowDetailClient({
  initialFlow,
  users,
}: {
  initialFlow: ApprovalFlow
  users: User[]
}) {
  const [flow, setFlow] = useState<ApprovalFlow>(initialFlow)
  const [nodes, setNodes] = useState<ApprovalNode[]>(initialFlow.nodes)
  const [draggedNode, setDraggedNode] = useState<ApprovalNode | null>(null)
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [editingNode, setEditingNode] = useState<ApprovalNode | null>(null)
  const [error, setError] = useState('')
  const [showEditFlowModal, setShowEditFlowModal] = useState(false)
  const [editFlowName, setEditFlowName] = useState(flow.name)
  const [editFlowDesc, setEditFlowDesc] = useState(flow.description || '')
  const [editIsDefault, setEditIsDefault] = useState(flow.isDefault)

  const [formData, setFormData] = useState({
    nodeName: '',
    approvalType: 'SINGLE' as 'SINGLE' | 'ALL_SIGN' | 'ANY_SIGN',
    approverSource: 'ROLE' as 'ROLE' | 'USER' | 'DEPARTMENT_MANAGER',
    approverRole: 'MANAGER',
    conditionType: 'NONE' as 'NONE' | 'AMOUNT_GREATER_THAN',
    conditionValue: 500,
    userIds: [] as number[],
  })

  const handleDragStart = (node: ApprovalNode) => {
    if (node.isFinanceNode) {
      setError('财务审批节点不能拖动')
      setTimeout(() => setError(''), 3000)
      return
    }
    setDraggedNode(node)
  }

  const handleDragOver = (e: React.DragEvent, targetNode: ApprovalNode) => {
    e.preventDefault()
    if (!draggedNode || draggedNode.id === targetNode.id) return
    if (targetNode.isFinanceNode) return
  }

  const handleDrop = (e: React.DragEvent, targetNode: ApprovalNode) => {
    e.preventDefault()
    if (!draggedNode || draggedNode.id === targetNode.id) return
    if (targetNode.isFinanceNode) return

    const newNodes = [...nodes]
    const draggedIndex = newNodes.findIndex((n) => n.id === draggedNode.id)
    const targetIndex = newNodes.findIndex((n) => n.id === targetNode.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    const [removed] = newNodes.splice(draggedIndex, 1)
    newNodes.splice(targetIndex, 0, removed)

    const reordered = newNodes.map((node, index) => ({
      ...node,
      stepNumber: index + 1,
    }))

    setNodes(reordered)
    setDraggedNode(null)

    saveNodeOrder(
      flow.id,
      reordered.map((n) => ({ nodeId: n.id, stepNumber: n.stepNumber }))
    ).catch((e) => {
      setError(e.message)
      setTimeout(() => setError(''), 3000)
      setNodes(nodes)
    })
  }

  const handleDragEnd = () => {
    setDraggedNode(null)
  }

  const openAddModal = () => {
    setEditingNode(null)
    setFormData({
      nodeName: '',
      approvalType: 'SINGLE',
      approverSource: 'ROLE',
      approverRole: 'MANAGER',
      conditionType: 'NONE',
      conditionValue: 500,
      userIds: [],
    })
    setShowNodeModal(true)
  }

  const openEditModal = (node: ApprovalNode) => {
    setEditingNode(node)
    setFormData({
      nodeName: node.nodeName,
      approvalType: node.approvalType as 'SINGLE' | 'ALL_SIGN' | 'ANY_SIGN',
      approverSource: node.approverSource as 'ROLE' | 'USER' | 'DEPARTMENT_MANAGER',
      approverRole: node.approverRole || 'MANAGER',
      conditionType: node.conditionType as 'NONE' | 'AMOUNT_GREATER_THAN',
      conditionValue: node.conditionValue || 500,
      userIds: node.nodeUsers.map((nu) => nu.userId),
    })
    setShowNodeModal(true)
  }

  const handleSubmitNode = async () => {
    if (!formData.nodeName.trim()) {
      setError('请输入节点名称')
      return
    }

    if (formData.approverSource === 'USER' && formData.userIds.length === 0) {
      setError('请选择至少一个审批人')
      return
    }

    if (
      formData.approvalType !== 'SINGLE' &&
      formData.approverSource === 'ROLE'
    ) {
      setError('会签或或签模式下，请选择指定人员')
      return
    }

    try {
      if (editingNode) {
        await updateApprovalNode(editingNode.id, formData)
      } else {
        await addApprovalNode(flow.id, formData)
      }

      setShowNodeModal(false)
      setError('')

      window.location.reload()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDeleteNode = async (node: ApprovalNode) => {
    if (node.isFinanceNode) {
      setError('财务审批节点不能删除')
      return
    }

    if (!confirm(`确定要删除 "${node.nodeName}" 节点吗？`)) return

    try {
      await deleteApprovalNode(node.id)
      setNodes(nodes.filter((n) => n.id !== node.id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleUpdateFlow = async () => {
    if (!editFlowName.trim()) {
      setError('请输入审批流名称')
      return
    }

    try {
      await updateApprovalFlow(flow.id, {
        name: editFlowName.trim(),
        description: editFlowDesc.trim(),
        isDefault: editIsDefault,
      })
      setFlow({ ...flow, name: editFlowName, description: editFlowDesc, isDefault: editIsDefault })
      setShowEditFlowModal(false)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const toggleUserSelection = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }))
  }

  const getApprovalTypeLabel = (type: string) => {
    const opt = APPROVAL_TYPE_OPTIONS.find((o) => o.value === type)
    return opt?.label || type
  }

  const getApproverLabel = (node: ApprovalNode) => {
    if (node.approverSource === 'DEPARTMENT_MANAGER') {
      return '申请人部门主管'
    }
    if (node.approverSource === 'ROLE') {
      const role = ROLE_OPTIONS.find((r) => r.value === node.approverRole)
      return role?.label || node.approverRole
    }
    if (node.approverSource === 'USER') {
      const names = node.nodeUsers.map((nu) => nu.user.name)
      return names.join('、') || '未指定'
    }
    return '未配置'
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-600">
            {flow.description || '拖拽节点调整顺序，点击编辑修改节点配置'}
          </p>
          {flow.isDefault && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
              默认审批流
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditFlowName(flow.name)
              setEditFlowDesc(flow.description || '')
              setEditIsDefault(flow.isDefault)
              setShowEditFlowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            编辑基本信息
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加节点
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-4">审批节点</h3>

        {nodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无审批节点，点击上方"添加节点"按钮开始配置
          </div>
        ) : (
          <div className="space-y-3">
            {nodes.map((node) => (
              <div
                key={node.id}
                draggable={!node.isFinanceNode}
                onDragStart={() => handleDragStart(node)}
                onDragOver={(e) => handleDragOver(e, node)}
                onDrop={(e) => handleDrop(e, node)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                  node.isFinanceNode
                    ? 'bg-green-50 border-green-200'
                    : draggedNode?.id === node.id
                    ? 'opacity-50 bg-blue-50 border-blue-300'
                    : 'bg-white hover:bg-gray-50 border-gray-200 cursor-move'
                }`}
              >
                <div className="text-gray-400">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                  {node.stepNumber}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{node.nodeName}</h4>
                    {node.isFinanceNode && (
                      <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded">
                        财务终审
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      {getApprovalTypeLabel(node.approvalType)}
                    </span>
                    <span className="flex items-center gap-1">
                      {node.approverSource === 'DEPARTMENT_MANAGER' ? (
                        <Building2 className="w-3 h-3" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      {getApproverLabel(node)}
                    </span>
                    {node.conditionType !== 'NONE' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        <DollarSign className="w-3 h-3" />
                        {node.conditionType === 'AMOUNT_GREATER_THAN'
                          ? `金额 > ${node.conditionValue}`
                          : node.conditionType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(node)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!node.isFinanceNode && (
                    <button
                      onClick={() => handleDeleteNode(node)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingNode ? '编辑审批节点' : '添加审批节点'}
              </h3>
              <button
                onClick={() => setShowNodeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  节点名称
                </label>
                <input
                  type="text"
                  value={formData.nodeName}
                  onChange={(e) =>
                    setFormData({ ...formData, nodeName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入节点名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  审批方式
                </label>
                <select
                  value={formData.approvalType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      approvalType: e.target.value as 'SINGLE' | 'ALL_SIGN' | 'ANY_SIGN',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {APPROVAL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  审批人来源
                </label>
                <select
                  value={formData.approverSource}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      approverSource: e.target.value as 'ROLE' | 'USER' | 'DEPARTMENT_MANAGER',
                      userIds: [],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {APPROVER_SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.approverSource === 'ROLE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    指定角色
                  </label>
                  <select
                    value={formData.approverRole}
                    onChange={(e) =>
                      setFormData({ ...formData, approverRole: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.approverSource === 'USER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择审批人
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.userIds.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                            {user.department && ` · ${user.department.name}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生效条件
                </label>
                <select
                  value={formData.conditionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditionType: e.target.value as 'NONE' | 'AMOUNT_GREATER_THAN',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NONE">无条件（始终生效）</option>
                  <option value="AMOUNT_GREATER_THAN">金额大于（条件生效）</option>
                </select>
              </div>

              {formData.conditionType === 'AMOUNT_GREATER_THAN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    金额阈值（元）
                  </label>
                  <input
                    type="number"
                    value={formData.conditionValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditionValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowNodeModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitNode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingNode ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditFlowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">编辑审批流基本信息</h3>
              <button
                onClick={() => setShowEditFlowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  审批流名称
                </label>
                <input
                  type="text"
                  value={editFlowName}
                  onChange={(e) => setEditFlowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={editFlowDesc}
                  onChange={(e) => setEditFlowDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  设为默认审批流
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowEditFlowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateFlow}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
