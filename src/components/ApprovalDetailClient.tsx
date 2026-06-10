'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { approveReport, rejectReport } from '@/actions/expense'
import { ExpenseDetailView } from './ExpenseDetailView'

interface ApprovalDetailClientProps {
  report: any
  canApprove: boolean
}

export function ApprovalDetailClient({
  report,
  canApprove,
}: ApprovalDetailClientProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleApprove = async () => {
    setLoading('approve')
    setError('')
    try {
      await approveReport(report.id, comment || undefined)
    } catch (err: any) {
      setError(err.message || '操作失败')
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!comment.trim()) {
      setError('请填写驳回原因')
      return
    }
    setLoading('reject')
    setError('')
    try {
      await rejectReport(report.id, comment)
    } catch (err: any) {
      setError(err.message || '操作失败')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <ExpenseDetailView
        report={report}
        isCreator={false}
        canEdit={false}
        backHref="/approvals"
        showEditButton={false}
      />

      {canApprove && report.status === 'PENDING' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">审批操作</h2>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                审批意见{showRejectForm && (
                  <span className="text-red-500"> *</span>
                )}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  showRejectForm
                    ? '请填写驳回原因'
                    : '请输入审批意见（可选）'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {!showRejectForm ? (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading !== null}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'approve' ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>通过</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading !== null}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  <span>驳回</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading !== null}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'reject' ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>确认驳回</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  disabled={loading !== null}
                  className="px-6 py-2.5 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
