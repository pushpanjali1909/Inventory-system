import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Eye, Trash2, ShoppingCart, X, ChevronDown } from 'lucide-react'
import { ordersApi, customersApi, productsApi } from '../api'

const STATUS_STYLES = {
  pending:   { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  shipped:   { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  delivered: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? 'modal-box-wide' : ''}`}>
        <div className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function CreateOrderModal({ onClose }) {
  const qc = useQueryClient()
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll().then(r => r.data) })
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll().then(r => r.data) })

  const mutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => { qc.invalidateQueries(['orders']); qc.invalidateQueries(['products']); qc.invalidateQueries(['inventorySummary']); toast.success('Order created!'); onClose() },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error creating order')
  })

  const setItem = (idx, k, v) => setItems(i => i.map((item, j) => j === idx ? { ...item, [k]: v } : item))
  const getTotal = () => items.reduce((sum, item) => {
    const p = products.find(p => p.id === parseInt(item.product_id))
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0)
  }, 0)

  return (
    <form onSubmit={e => {
      e.preventDefault()
      const valid = items.filter(i => i.product_id && parseInt(i.quantity) > 0)
      if (!valid.length) return toast.error('Add at least one item')
      mutation.mutate({ customer_id: parseInt(customerId), items: valid.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })), notes })
    }}>
      <div className="form-group">
        <label className="form-label">Customer *</label>
        <select className="input" required value={customerId} onChange={e => setCustomerId(e.target.value)}>
          <option value="">Select a customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label className="form-label" style={{ margin: 0 }}>Order Items *</label>
          <button type="button" style={{ fontSize: 12, color: 'var(--accent-purple)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setItems(i => [...i, { product_id: '', quantity: 1 }])}>+ Add Item</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, idx) => {
            const p = products.find(p => p.id === parseInt(item.product_id))
            return (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="input" style={{ flex: 1 }} value={item.product_id} onChange={e => setItem(idx, 'product_id', e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>)}
                </select>
                <input className="input" type="number" min="1" max={p?.stock_quantity} style={{ width: 80 }} value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                {p && <span style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{(p.price * (parseInt(item.quantity) || 0)).toLocaleString('en-IN')}</span>}
                {items.length > 1 && <button type="button" onClick={() => setItems(i => i.filter((_, j) => j !== idx))}
                  style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--accent-red-light)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} /></button>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." />
      </div>

      <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Amount</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{getTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating Order...' : 'Place Order'}
      </button>
    </form>
  )
}

export default function Orders() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.getAll(statusFilter ? { status: statusFilter } : {}).then(r => r.data)
  })
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll().then(r => r.data) })
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll().then(r => r.data) })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ordersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['orders']); qc.invalidateQueries(['products']); qc.invalidateQueries(['inventorySummary']); toast.success('Order updated') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })
  const deleteMutation = useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => { qc.invalidateQueries(['orders']); qc.invalidateQueries(['products']); toast.success('Order deleted') }
  })

  const getCustomer = (id) => customers.find(c => c.id === id)
  const getProduct = (id) => products.find(p => p.id === id)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #3b82f6, #10b981)' }} />
            <h1 className="page-title">Orders</h1>
          </div>
          <p className="page-subtitle" style={{ paddingLeft: 14 }}>{orders.length} orders total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> New Order</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => {
          const style = s ? STATUS_STYLES[s] : null
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: statusFilter === s ? (style ? style.bg : 'var(--accent-purple-light)') : '#f3f4f6',
                color: statusFilter === s ? (style ? style.color : 'var(--accent-purple)') : 'var(--text-secondary)',
              }}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Orders'}
            </button>
          )
        })}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>{['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td" colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td className="td" colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <ShoppingCart size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} /><div>No orders found</div>
              </td></tr>
            ) : orders.map(o => {
              const s = STATUS_STYLES[o.status] || STATUS_STYLES.pending
              const customer = getCustomer(o.customer_id)
              return (
                <tr key={o.id} className="tr">
                  <td className="td"><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-purple)', fontSize: 12 }}>{o.order_number}</span></td>
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent-purple)', flexShrink: 0 }}>
                        {customer?.name?.charAt(0) || '?'}
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13.5 }}>{customer?.name || `#${o.customer_id}`}</span>
                    </div>
                  </td>
                  <td className="td"><span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{o.items?.length || 0} items</span></td>
                  <td className="td"><span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></td>
                  <td className="td">
                    <select value={o.status} onChange={e => updateMutation.mutate({ id: o.id, data: { status: e.target.value } })}
                      style={{ padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, outline: 'none' }}>
                      {['pending','confirmed','shipped','delivered','cancelled'].map(st => <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="td" style={{ fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="td">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setViewOrder(o)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={13} /></button>
                      <button onClick={() => { if (confirm('Delete order?')) deleteMutation.mutate(o.id) }} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-red-light)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate && <Modal title="Create New Order" onClose={() => setShowCreate(false)} wide><CreateOrderModal onClose={() => setShowCreate(false)} /></Modal>}

      {viewOrder && (
        <Modal title={`Order Details — ${viewOrder.order_number}`} onClose={() => setViewOrder(null)} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Customer', value: getCustomer(viewOrder.customer_id)?.name },
              { label: 'Status', value: viewOrder.status.charAt(0).toUpperCase() + viewOrder.status.slice(1), badge: STATUS_STYLES[viewOrder.status] },
              { label: 'Order Date', value: new Date(viewOrder.created_at).toLocaleString('en-IN') },
              { label: 'Total Amount', value: `₹${parseFloat(viewOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, green: true },
            ].map(({ label, value, badge, green }) => (
              <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                {badge ? <span className="badge" style={{ background: badge.bg, color: badge.color }}>{value}</span>
                  : <div style={{ fontSize: 14, fontWeight: 700, color: green ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{value || '—'}</div>}
              </div>
            ))}
          </div>
          {viewOrder.notes && <div style={{ background: 'var(--accent-amber-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400e' }}>📝 {viewOrder.notes}</div>}
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Order Items</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%' }}>
              <thead><tr>
                {['Product', 'Unit Price', 'Qty', 'Subtotal'].map(h => <th key={h} className="th" style={{ padding: '9px 14px' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {viewOrder.items?.map(item => (
                  <tr key={item.id} className="tr">
                    <td className="td" style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{getProduct(item.product_id)?.name || `Product #${item.product_id}`}</td>
                    <td className="td" style={{ padding: '10px 14px' }}>₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                    <td className="td" style={{ padding: '10px 14px' }}><span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>×{item.quantity}</span></td>
                    <td className="td" style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--accent-emerald)' }}>₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}
