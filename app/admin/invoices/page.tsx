import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      survey_requests(customer_name, customer_email, tracking_code)
    `)
    .order('created_at', { ascending: false })

  const totalRevenue = (invoices || []).filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pendingRevenue = (invoices || []).filter(i => i.payment_status === 'pending').reduce((s, i) => s + i.amount, 0)
  const overdueRevenue = (invoices || []).filter(i => i.payment_status === 'overdue').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-500 text-sm mt-1">Track payments and invoice history</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">Collected</div>
          <div className="text-xs text-gray-400 mt-0.5">{(invoices || []).filter(i => i.payment_status === 'paid').length} invoices</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">Pending</div>
          <div className="text-xs text-gray-400 mt-0.5">{(invoices || []).filter(i => i.payment_status === 'pending').length} invoices</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-red-500">{formatCurrency(overdueRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">Overdue</div>
          <div className="text-xs text-gray-400 mt-0.5">{(invoices || []).filter(i => i.payment_status === 'overdue').length} invoices</div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Survey</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoices || []).map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-gray-900">{inv.invoice_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{inv.survey_requests?.customer_name}</div>
                    <div className="text-xs text-gray-500">{inv.survey_requests?.customer_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/surveys/${inv.survey_request_id}`}
                      className="font-mono text-xs text-blue-600 hover:underline"
                    >
                      #{inv.survey_requests?.tracking_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(inv.amount, inv.currency)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PAYMENT_COLORS[inv.payment_status]}`}>
                      {inv.payment_status.charAt(0).toUpperCase() + inv.payment_status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {inv.due_date ? formatDate(inv.due_date) : '—'}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {inv.pdf_url && (
                      <a href={inv.pdf_url} target="_blank" className="text-xs text-blue-600 hover:underline font-medium">PDF</a>
                    )}
                    {inv.payment_status === 'pending' && (
                      <MarkPaidButton invoiceId={inv.id} />
                    )}
                  </td>
                </tr>
              ))}
              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form action={async () => {
      'use server'
      const { createAdminClient } = await import('@/lib/supabase/server')
      const admin = createAdminClient()
      await admin.from('invoices').update({ payment_status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId)
    }}>
      <button type="submit" className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium transition-colors">
        Mark Paid
      </button>
    </form>
  )
}
