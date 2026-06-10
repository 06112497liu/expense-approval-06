'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Settings, Trash2, Star } from 'lucide-react'
import { createApprovalFlow, deleteApprovalFlow } from '@/actions/approvalFlow'

type ApprovalFlow = {
  id: number
  name: string
  description: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  nodes: { id: number; stepNumber: number; nodeName: string }[]
}

export default function ApprovalFlowClient({
  initialFlows,
}: {
  initialFlows: ApprovalFlow[]
}) {
  const [flows, setFlows] = useState<ApprovalFlow[]>(initialFlows)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDesc, setNewFlowDesc] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!newFlowName.trim()) {
      setError('请输入审批流名称')
      return
    }

    try {
      const flow = await createApprovalFlow({
        name: newFlowName.trim(),
        description: newFlowDesc.trim(),
      })
      setFlows([...flows, { ...flow, nodes: [] } as ApprovalFlow])
      setNewFlowName('')
      setNewFlowDesc('')
      setShowCreateForm(false)
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDelete = async (flowId: number) => {
    if (!confirm('确定要删除这个审批流吗？')) return

    try {
      await deleteApprovalFlow(flowId)
      setFlows(flows.filter((f) => f.id !== flowId))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">管理报销审批流程配置</p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建审批流
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">新建审批流</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                审批流名称
              </label>
              <input
                type="text"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入审批流名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={newFlowDesc}
                onChange={(e) => setNewFlowDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入描述（可选）"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setError('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="bg-white rounded-lg shadow border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {flow.name}
                </h3>
                {flow.isDefault && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    <Star className="w-3 h-3" />
                    默认
                  </span>
                )}
              </div>
            </div>

            {flow.description && (
              <p className="text-gray-600 text-sm mb-3">{flow.description}</p>
            )}

            <div className="text-sm text-gray-500 mb-4">
              共 {flow.nodes.length} 个审批节点
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/approval-flows/${flow.id}`}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                配置
              </Link>
              {!flow.isDefault && (
                <button
                  onClick={() => handleDelete(flow.id)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
