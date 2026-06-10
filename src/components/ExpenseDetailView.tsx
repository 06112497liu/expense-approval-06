import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Send,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react'
import {
  formatMoney,
  getStatusText,
  getStatusColor,
  formatDate,
  getRoleText,
} from '@/lib/utils'

interface ExpenseDetailProps {
  report: any
  isCreator: boolean
  canEdit: boolean
  canApprove?: boolean
  showApproveActions?: boolean
  backHref?: string
  showEditButton?: boolean
}

export function ExpenseDetailView({
  report,
  isCreator,
  canEdit,
  canApprove = false,
  showApproveActions = false,
  backHref = '/expenses',
  showEditButton = true,
}: ExpenseDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </Link>

        {showEditButton && canEdit && (
          <Link
            href={`/expenses/${report.id}/edit`}
            className="inline-flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Pencil className="h-4 w-4" />
            <span>
              {report.status === 'REJECTED' ? '修改后重新提交' : '编辑'}
            </span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm text-gray-400">
                  #{report.id.toString().padStart(4, '0')}
                </span>
                <span
                  className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    report.status
                  )}`}
                >
                  {getStatusText(report.status)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {report.title}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">合计金额</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {formatMoney(report.totalAmount)}
              </div>
            </div>
          </div>

          {report.description && (
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
              {report.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-5">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <User className="h-4 w-4" />
              <span>提交人</span>
            </div>
            <div className="font-medium text-gray-900">
              {report.creator?.name}
            </div>
            <div className="text-sm text-gray-500">
              {report.creator?.department?.name || '未分配部门'}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span>提交时间</span>
            </div>
            <div className="font-medium text-gray-900">
              {formatDate(report.submittedAt || report.createdAt)}
            </div>
            <div className="text-sm text-gray-500">
              更新于 {formatDate(report.updatedAt)}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <FileText className="h-4 w-4" />
              <span>费用明细</span>
            </div>
            <div className="font-medium text-gray-900">
              {report.items?.length || 0} 项
            </div>
            {report.currentApprover &&
              report.status === 'PENDING' && (
                <div className="text-sm text-blue-600">
                  当前审批：{report.currentApprover.name}
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">费用明细</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类别
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  说明
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金额
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(item.date).split(' ')[0]}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {item.description || '-'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-900 font-medium text-right whitespace-nowrap">
                    {formatMoney(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-4 text-sm font-medium text-gray-900 text-right"
                >
                  合计
                </td>
                <td className="px-5 py-4 text-sm font-bold text-gray-900 text-right">
                  {formatMoney(report.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {report.approvals && report.approvals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">审批流程</h2>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {report.approvals.map((approval: any, idx: number) => (
                <div key={approval.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        approval.status === 'APPROVED'
                          ? 'bg-green-100'
                          : approval.status === 'REJECTED'
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      {approval.status === 'APPROVED' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : approval.status === 'REJECTED' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {approval.approver?.name}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {getRoleText(approval.role)}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          approval.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : approval.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {approval.status === 'APPROVED'
                          ? '已通过'
                          : approval.status === 'REJECTED'
                          ? '已驳回'
                          : '待审批'}
                      </span>
                    </div>
                    {approval.approvedAt && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(approval.approvedAt)}
                      </div>
                    )}
                    {approval.comment && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg flex items-start space-x-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span>{approval.comment}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
