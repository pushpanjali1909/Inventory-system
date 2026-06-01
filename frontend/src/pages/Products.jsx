import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Trash2, RefreshCw, Package, AlertTriangle } from 'lucide-react'
import { productsApi } from '../api'

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? 'modal-box-wide' : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function ProductForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', sku: '', description: '', price: '', category: '', stock_quantity: 0, low_stock_threshold: 10 })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label className="form-label">Product Name *</label>
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. iPhone 15 Pro" />
        </div>
        <div className="form-group">
          <label className="form-label">SKU / Code *</label>
          <input className="input" required value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. IPH-15P" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <input className="input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Electronics" />
        </div>
        <div className="form-group">
          <label className="form-label">Price (₹) *</label>
          <input className="input" type="number" min="0" step="0.01" required value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">Initial Stock</label>
          <input className="input" type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label className="form-label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional product description..." style={{ resize: 'vertical' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Low Stock Alert Threshold</label>
          <input className="input" type="number" min="0" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4, justifyContent: 'center' }} disabled={loading}>
        {loading ? 'Saving...' : initial ? 'Update Product' : 'Add Product'}
      </button>
    </form>
  )
}

const stockBadge = (p) => {
  if (p.stock_quantity === 0) return { label: 'Out of Stock', bg: 'var(--accent-red-light)', color: 'var(--accent-red)' }
  if (p.stock_quantity <= p.low_stock_threshold) return { label: 'Low Stock', bg: 'var(--accent-amber-light)', color: 'var(--accent-amber)' }
  return { label: 'In Stock', bg: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)' }
}

export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [restockProduct, setRestockProduct] = useState(null)
  const [restockQty, setRestockQty] = useState(10)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search }).then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: (data) => productsApi.create({ ...data, price: parseFloat(data.price) }),
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['inventorySummary']); toast.success('Product created!'); setShowAdd(false) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error creating product')
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product updated!'); setEditProduct(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['inventorySummary']); toast.success('Product deleted') },
    onError: () => toast.error('Error deleting product')
  })
  const restockMutation = useMutation({
    mutationFn: ({ id, qty }) => productsApi.restock(id, { quantity: qty }),
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['inventorySummary']); toast.success('Stock restocked!'); setRestockProduct(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })

  const lowStock = products.filter(p => p.stock_quantity <= p.low_stock_threshold)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #7c5cfc, #f43f8e)' }} />
            <h1 className="page-title">Products</h1>
          </div>
          <p className="page-subtitle" style={{ paddingLeft: 14 }}>{products.length} products · {lowStock.length} low stock</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Product</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" style={{ paddingLeft: 40, maxWidth: 380 }} placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="td" colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td className="td" colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Package size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <div>No products found</div>
              </td></tr>
            ) : products.map(p => {
              const badge = stockBadge(p)
              return (
                <tr key={p.id} className="tr">
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--accent-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={15} color="var(--accent-purple)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.description.slice(0, 40)}{p.description.length > 40 ? '...' : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="td"><code style={{ background: '#f3f4f6', padding: '2px 7px', borderRadius: 5, fontSize: 12, fontFamily: 'monospace' }}>{p.sku}</code></td>
                  <td className="td">{p.category || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td className="td"><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</span></td>
                  <td className="td">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: p.stock_quantity === 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{p.stock_quantity}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>units</span>
                    </div>
                  </td>
                  <td className="td">
                    <span className="badge" style={{ background: badge.bg, color: badge.color }}>
                      {p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0 && <AlertTriangle size={10} />}
                      {badge.label}
                    </span>
                  </td>
                  <td className="td">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setRestockProduct(p); setRestockQty(10) }} title="Restock"
                        style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={13} />
                      </button>
                      <button onClick={() => setEditProduct(p)} title="Edit"
                        style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.id) }} title="Delete"
                        style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-red-light)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAdd && <Modal title="Add New Product" onClose={() => setShowAdd(false)} wide>
        <ProductForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>}
      {editProduct && <Modal title="Edit Product" onClose={() => setEditProduct(null)} wide>
        <ProductForm initial={editProduct} onSubmit={(data) => updateMutation.mutate({ id: editProduct.id, data })} loading={updateMutation.isPending} />
      </Modal>}
      {restockProduct && <Modal title={`Restock — ${restockProduct.name}`} onClose={() => setRestockProduct(null)}>
        <div style={{ background: 'var(--accent-blue-light)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--accent-blue)' }}>Current Stock: <strong>{restockProduct.stock_quantity} units</strong></div>
        </div>
        <div className="form-group">
          <label className="form-label">Quantity to Add *</label>
          <input className="input" type="number" min="1" value={restockQty} onChange={e => setRestockQty(parseInt(e.target.value) || 1)} />
        </div>
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          New total: <strong style={{ color: 'var(--accent-emerald)' }}>{restockProduct.stock_quantity + restockQty} units</strong>
        </div>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => restockMutation.mutate({ id: restockProduct.id, qty: restockQty })}
          disabled={restockMutation.isPending}>
          {restockMutation.isPending ? 'Restocking...' : `Add ${restockQty} Units`}
        </button>
      </Modal>}
    </div>
  )
}
