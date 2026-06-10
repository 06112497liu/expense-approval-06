import { requireAdmin } from '@/lib/permissions'
import { getApprovalFlowById, getAvailableUsers } from '@/actions/approvalFlow'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ApprovalFlowDetailClient from './ApprovalFlowDetailClient'

export default async function ApprovalFlowDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdmin()
  const flowId = parseInt(params.id)
  const flow = await getApprovalFlowById(flowId)
  const users = await getAvailableUsers()

  if (!flow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>审批流不存在</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/approval-flows"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{flow.name} - 审批流配置</h1>
      </div>

      <ApprovalFlowDetailClient initialFlow={flow} users={users} />
    </div>
  )
}
