import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Users } from 'lucide-react'
import { customersApi } from '../api'

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

function CustomerForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || { name: '', email: '', phone: '', address: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      <div className="form-group"><label className="form-label">Full Name *</label>
        <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rakshit Kumar" /></div>
      <div className="form-group"><label className="form-label">Email Address *</label>
        <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. rakshit@example.com" /></div>
      <div className="form-group"><label className="form-label">Phone Number</label>
        <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. +91 98765 43210" /></div>
      <div className="form-group"><label className="form-label">Address</label>
        <textarea className="input" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address..." style={{ resize: 'vertical' }} /></div>
      <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
        {loading ? 'Saving...' : initial ? 'Update Customer' : 'Add Customer'}</button>
    </form>
  )
}

const COLORS = ['#7c5cfc', '#f43f8e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Customers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll({ search }).then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer added!'); setShowAdd(false) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer updated!'); setEditCustomer(null) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Error')
  })
  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer deleted') }
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #f43f8e, #7c5cfc)' }} />
            <h1 className="page-title">Customers</h1>
          </div>
          <p className="page-subtitle" style={{ paddingLeft: 14 }}>{customers.length} registered customers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Customer</button>
      </div>

      <div style={{ marginBottom: 20, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" style={{ paddingLeft: 40, maxWidth: 380 }} placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <div style={{ fontWeight: 600 }}>No customers yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Add your first customer to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {customers.map((c, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <div key={c.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color, flexShrink: 0 }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Customer #{c.id}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setEditCustomer(c)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-emerald-light)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteMutation.mutate(c.id) }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--accent-red-light)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Mail size={13} color={color} style={{ flexShrink: 0 }} /> {c.email}
                  </div>
                  {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Phone size={13} color={color} style={{ flexShrink: 0 }} /> {c.phone}
                  </div>}
                  {c.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    <MapPin size={12} color={color} style={{ flexShrink: 0, marginTop: 1 }} /> {c.address}
                  </div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <Modal title="Add New Customer" onClose={() => setShowAdd(false)}>
        <CustomerForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>}
      {editCustomer && <Modal title="Edit Customer" onClose={() => setEditCustomer(null)}>
        <CustomerForm initial={editCustomer} onSubmit={(data) => updateMutation.mutate({ id: editCustomer.id, data })} loading={updateMutation.isPending} />
      </Modal>}
    </div>
  )
}
