import { requireAdmin } from '@/lib/permissions'
import { getAllApprovalFlows } from '@/actions/approvalFlow'
import Link from 'next/link'
import { Plus, ArrowLeft, Settings, Trash2 } from 'lucide-react'
import ApprovalFlowClient from './ApprovalFlowClient'

export default async function ApprovalFlowsPage() {
  await requireAdmin()
  const flows = await getAllApprovalFlows()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">审批流管理</h1>
      </div>

      <ApprovalFlowClient initialFlows={flows} />
    </div>
  )
}
