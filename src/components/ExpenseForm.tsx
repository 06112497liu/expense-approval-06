'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, Loader2, ArrowLeft, Save, Send } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import {
  createExpenseReport,
  updateExpenseReport,
  submitExpenseReport,
  deleteExpenseReport,
} from '@/actions/expense'
import Link from 'next/link'

interface ExpenseItem {
  id?: number
  category: string
  amount: number
  description: string
  date: string
}

interface ExpenseFormProps {
  mode: 'create' | 'edit'
  initialData?: {
    id: number
    title: string
    description: string
    status: string
    items: ExpenseItem[]
  }
}

const CATEGORIES = ['差旅费', '餐饮费', '交通费', '办公费', '招待费', '其他']

export function ExpenseForm({ mode, initialData }: ExpenseFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(
    initialData?.description || ''
  )
  const [items, setItems] = useState<ExpenseItem[]>(
    initialData?.items || [
      {
        category: '差旅费',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      },
    ]
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  const addItem = () => {
    setItems([
      ...items,
      {
        category: '其他',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      },
    ])
  }

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx))
    }
  }

  const updateItem = (idx: number, field: keyof ExpenseItem, value: any) => {
    const newItems = [...items]
    if (field === 'amount') {
      value = parseFloat(value) || 0
    }
    newItems[idx] = { ...newItems[idx], [field]: value }
    setItems(newItems)
  }

  const validateForm = () => {
    if (!title.trim()) {
      setError('请输入报销单标题')
      return false
    }
    if (items.length === 0) {
      setError('请至少添加一项报销明细')
      return false
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].category) {
        setError(`请选择第 ${i + 1} 项的费用类别`)
        return false
      }
      if (!items[i].amount || items[i].amount <= 0) {
        setError(`请输入第 ${i + 1} 项的金额（大于0）`)
        return false
      }
      if (!items[i].date) {
        setError(`请选择第 ${i + 1} 项的日期`)
        return false
      }
    }
    setError('')
    return true
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return
    setSaving(true)

    try {
      if (mode === 'create') {
        await createExpenseReport({ title, description, items })
        router.push('/expenses')
      } else if (mode === 'edit' && initialData) {
        await updateExpenseReport(initialData.id, { title, description, items })
        router.push(`/expenses/${initialData.id}`)
      }
    } catch (err: any) {
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)

    try {
      if (mode === 'create') {
        const report = await createExpenseReport({ title, description, items })
        await submitExpenseReport(report.id)
      } else if (mode === 'edit' && initialData) {
        await updateExpenseReport(initialData.id, { title, description, items })
        await submitExpenseReport(initialData.id)
      }
    } catch (err: any) {
      setError(err.message || '提交失败')
      setSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!initialData) return
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!initialData) return
    setDeleting(true)
    try {
      await deleteExpenseReport(initialData.id)
    } catch (err: any) {
      setError(err.message || '删除失败')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const canEdit =
    mode === 'create' ||
    (mode === 'edit' &&
      (initialData?.status === 'DRAFT' || initialData?.status === 'REJECTED'))

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={initialData ? `/expenses/${initialData.id}` : '/expenses'}
          className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? '新建报销单' : '编辑报销单'}
          {mode === 'edit' && initialData?.status === 'REJECTED' && (
            <span className="ml-3 text-sm font-normal text-red-600 bg-red-50 px-2 py-1 rounded">
              已驳回，修改后可重新提交
            </span>
          )}
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              报销单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
              placeholder="例如：3月出差北京差旅费"
              className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              说明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              placeholder="请输入报销说明（可选）"
              rows={3}
              className="w-full max-w-2xl px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                报销明细 <span className="text-red-500">*</span>
              </label>
              {canEdit && (
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>添加一项</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">
                        费用类别
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          updateItem(idx, 'category', e.target.value)
                        }
                        disabled={!canEdit}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white disabled:bg-gray-50"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        金额 (元)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount || ''}
                        onChange={(e) =>
                          updateItem(idx, 'amount', e.target.value)
                        }
                        disabled={!canEdit}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        日期
                      </label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          updateItem(idx, 'date', e.target.value)
                        }
                        disabled={!canEdit}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">
                        说明
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, 'description', e.target.value)
                        }
                        disabled={!canEdit}
                        placeholder="费用说明"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
                      />
                    </div>

                    {canEdit && (
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="w-full inline-flex justify-center items-center px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end">
              <div className="text-right">
                <div className="text-sm text-gray-500">合计金额</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatMoney(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {canEdit && (
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? '保存中...' : '保存草稿'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || submitting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>
                  {submitting
                    ? '提交中...'
                    : mode === 'edit' && initialData?.status === 'REJECTED'
                    ? '修改后重新提交'
                    : '提交审批'}
                </span>
              </button>

              {mode === 'edit' &&
                initialData?.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{deleting ? '删除中...' : '删除草稿'}</span>
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                确认删除
              </h3>
              <p className="text-sm text-gray-600">
                确定要删除这个草稿报销单吗？此操作无法撤销。
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="animate-spin h-4 w-4" />}
                <span>{deleting ? '删除中...' : '确认删除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
