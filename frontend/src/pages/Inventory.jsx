import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inventoryApi, productsApi } from '../api'
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

const LOG_STYLES = {
  restock: { bg: '#d1fae5', color: '#065f46', label: '↑ Restock' },
  sale: { bg: '#dbeafe', color: '#1d4ed8', label: '↓ Sale' },
  adjustment: { bg: '#fef3c7', color: '#92400e', label: '⟳ Adjust' },
  return: { bg: '#ede9fe', color: '#4c1d95', label: '↩ Return' },
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const qc = useQueryClient()
  const [showAdjust, setShowAdjust] = useState(false)
  const [form, setForm] = useState({ product_id: '', quantity_change: '', log_type: 'adjustment', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const { data: summary } = useQuery({ queryKey: ['inventorySummary'], queryFn: () => inventoryApi.getSummary().then(r => r.data) })
  const { data: logs = [], isLoading } = useQuery({ queryKey: ['inventoryLogs'], queryFn: () => inventoryApi.getLogs({ limit: 100 }).then(r => r.data) })
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll().then(r => r.data) })

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryApi.adjust(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['inventoryLogs']); qc.invalidateQueries(['products']); qc.invalidateQueries(['inventorySummary'])
      toast.success('Inventory adjusted!'); setShowAdjust(false)
      setForm({ product_id: '', quantity_change: '', log_type: 'adjustment', notes: '' })
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })

  const getProduct = (id) => products.find(p => p.id === id)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #10b981, #3b82f6)' }} />
            <h1 className="page-title">Inventory</h1>
          </div>
          <p className="page-subtitle" style={{ paddingLeft: 14 }}>Stock levels & transaction history</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdjust(true)}><RefreshCw size={15} /> Adjust Stock</button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Products', value: summary.total_products, color: '#7c5cfc', bg: 'var(--accent-purple-light)', icon: BarChart3 },
            { label: 'Total Units', value: summary.total_stock_units.toLocaleString(), color: '#3b82f6', bg: 'var(--accent-blue-light)', icon: TrendingUp },
            { label: 'Low Stock', value: summary.low_stock_count, color: summary.low_stock_count > 0 ? '#ef4444' : '#10b981', bg: summary.low_stock_count > 0 ? 'var(--accent-red-light)' : 'var(--accent-emerald-light)', icon: AlertTriangle },
            { label: 'Inventory Value', value: `₹${summary.total_inventory_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#10b981', bg: 'var(--accent-emerald-light)', icon: TrendingDown },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="stat-card" style={{ padding: '18px 20px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={17} color={color} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.3px' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Low stock alert */}
      {summary?.low_stock_products?.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>Low Stock Warning</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {summary.low_stock_products.map(p => (
              <div key={p.id} style={{ background: 'white', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: '#92400e' }}>{p.name}</span>
                <span style={{ color: '#b45309', marginLeft: 6 }}>({p.stock === 0 ? 'OUT' : `${p.stock} left`})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs table */}
      <div className="table-container">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} color="var(--accent-purple)" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Transaction History</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{logs.length} records</span>
        </div>
        <table>
          <thead>
            <tr>{['Date & Time', 'Product', 'Type', 'Change', 'Before', 'After', 'Reference', 'Notes'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td" colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td className="td" colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
            ) : logs.map(log => {
              const ls = LOG_STYLES[log.log_type] || LOG_STYLES.adjustment
              const product = getProduct(log.product_id)
              return (
                <tr key={log.id} className="tr">
                  <td className="td" style={{ fontSize: 12 }}>{new Date(log.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="td">
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{product?.name || `#${log.product_id}`}</div>
                    {product && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{product.sku}</div>}
                  </td>
                  <td className="td"><span className="badge" style={{ background: ls.bg, color: ls.color }}>{ls.label}</span></td>
                  <td className="td">
                    <span style={{ fontWeight: 800, fontSize: 14, color: log.quantity_change > 0 ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                      {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                    </span>
                  </td>
                  <td className="td" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{log.quantity_before}</td>
                  <td className="td"><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.quantity_after}</span></td>
                  <td className="td"><code style={{ background: '#f3f4f6', padding: '2px 7px', borderRadius: 5, fontSize: 11 }}>{log.reference || '—'}</code></td>
                  <td className="td" style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160 }}>{log.notes || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdjust && (
        <Modal title="Adjust Stock" onClose={() => setShowAdjust(false)}>
          <div className="form-group">
            <label className="form-label">Product *</label>
            <select className="input" value={form.product_id} onChange={e => set('product_id', e.target.value)}>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — Current: {p.stock_quantity} units</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Adjustment Type *</label>
            <select className="input" value={form.log_type} onChange={e => set('log_type', e.target.value)}>
              <option value="restock">Restock (add stock)</option>
              <option value="adjustment">Manual Adjustment</option>
              <option value="return">Customer Return</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity Change *</label>
            <input className="input" type="number" value={form.quantity_change} onChange={e => set('quantity_change', e.target.value)} placeholder="Use + to add, - to reduce (e.g. -5 or 10)" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>Positive = add stock, Negative = reduce stock</div>
          </div>
          {form.product_id && form.quantity_change && (
            <div style={{ background: parseInt(form.quantity_change) > 0 ? 'var(--accent-emerald-light)' : 'var(--accent-red-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
              <span style={{ color: parseInt(form.quantity_change) > 0 ? '#065f46' : '#b91c1c', fontWeight: 600 }}>
                New stock: {(products.find(p => p.id === parseInt(form.product_id))?.stock_quantity || 0) + parseInt(form.quantity_change)} units
              </span>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Reason for adjustment..." />
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            disabled={!form.product_id || !form.quantity_change || adjustMutation.isPending}
            onClick={() => adjustMutation.mutate({ id: parseInt(form.product_id), data: { quantity_change: parseInt(form.quantity_change), log_type: form.log_type, notes: form.notes } })}>
            {adjustMutation.isPending ? 'Applying...' : 'Apply Adjustment'}
          </button>
        </Modal>
      )}
    </div>
  )
}
