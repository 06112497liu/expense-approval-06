import Link from 'next/link'
import {
  formatMoney,
  getStatusText,
  getStatusColor,
  formatDate,
  getRoleText,
} from '@/lib/utils'
import { User, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface ExpenseReportCardProps {
  report: any
  showApprover?: boolean
  hrefPrefix?: string
}

export function ExpenseReportCard({
  report,
  showApprover = false,
  hrefPrefix = '/expenses',
}: ExpenseReportCardProps) {
  return (
    <Link
      href={`${hrefPrefix}/${report.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                report.status
              )}`}
            >
              {getStatusText(report.status)}
            </span>
            <span className="text-xs text-gray-400">
              #{report.id.toString().padStart(4, '0')}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 truncate">
            {report.title}
          </h3>
        </div>
        <div className="text-right ml-4">
          <p className="text-lg font-bold text-gray-900">
            {formatMoney(report.totalAmount)}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {report.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <FileText className="h-4 w-4" />
          <span>{report.items?.length || 0} 项明细</span>
        </div>

        <div className="flex items-center space-x-1">
          <User className="h-4 w-4" />
          <span>
            提交人：{report.creator?.name}
            {report.creator?.department
              ? `（${report.creator.department.name}）`
              : ''}
          </span>
        </div>

        {showApprover && report.currentApprover && (
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>
              当前审批：{report.currentApprover.name}（
              {getRoleText(report.currentApprover.role)}）
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center space-x-1">
          {report.status === 'APPROVED' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : report.status === 'REJECTED' ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-500" />
          )}
          <span>
            {report.status === 'APPROVED' || report.status === 'REJECTED'
              ? formatDate(report.submittedAt)
              : formatDate(report.updatedAt)}
          </span>
        </div>
      </div>

      {report.approvals && report.approvals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {report.approvals.map((approval: any, idx: number) => (
              <div key={approval.id} className="flex items-center">
                <div
                  className={`flex items-center space-x-1 text-xs ${
                    approval.status === 'APPROVED'
                      ? 'text-green-600'
                      : approval.status === 'REJECTED'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {approval.status === 'APPROVED' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : approval.status === 'REJECTED' ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {approval.approver?.name}（
                    {getRoleText(approval.role)}）
                  </span>
                </div>
                {idx < report.approvals.length - 1 && (
                  <div className="mx-2 w-6 h-px bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  )
}
