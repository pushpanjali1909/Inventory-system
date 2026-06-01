import { useQuery } from '@tanstack/react-query'
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react'
import { ordersApi, inventoryApi, customersApi, productsApi } from '../api'

function StatCard({ title, value, icon: Icon, color, lightColor, iconColor, sub, trend }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div className="icon-box" style={{ background: lightColor }}>
          <Icon size={20} color={iconColor} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: 'var(--accent-emerald)', background: 'var(--accent-emerald-light)', padding: '3px 8px', borderRadius: 20 }}>
            <ArrowUpRight size={12} /> {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: iconColor, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  )
}

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  confirmed: { color: '#3b82f6', bg: '#dbeafe', label: 'Confirmed' },
  shipped: { color: '#8b5cf6', bg: '#ede9fe', label: 'Shipped' },
  delivered: { color: '#10b981', bg: '#d1fae5', label: 'Delivered' },
  cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' },
}

export default function Dashboard() {
  const { data: orderStats } = useQuery({ queryKey: ['orderStats'], queryFn: () => ordersApi.getStats().then(r => r.data) })
  const { data: inventorySummary } = useQuery({ queryKey: ['inventorySummary'], queryFn: () => inventoryApi.getSummary().then(r => r.data) })
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => customersApi.getAll().then(r => r.data) })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll().then(r => r.data) })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #7c5cfc, #f43f8e)' }} />
          <h1 className="page-title">Dashboard</h1>
        </div>
        <p className="page-subtitle" style={{ paddingLeft: 14 }}>Welcome back! Here's what's happening with your inventory.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard title="Total Products" value={products?.length ?? '—'} icon={Package}
          lightColor="var(--accent-purple-light)" iconColor="var(--accent-purple)" trend="+12%" />
        <StatCard title="Total Customers" value={customers?.length ?? '—'} icon={Users}
          lightColor="var(--accent-pink-light)" iconColor="var(--accent-pink)" trend="+8%" />
        <StatCard title="Total Orders" value={orderStats?.total ?? '—'} icon={ShoppingCart}
          lightColor="var(--accent-blue-light)" iconColor="var(--accent-blue)"
          sub={orderStats ? `${orderStats.pending} pending` : null} />
        <StatCard title="Total Revenue" value={orderStats ? `₹${(orderStats.total_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'} icon={DollarSign}
          lightColor="var(--accent-emerald-light)" iconColor="var(--accent-emerald)" trend="+24%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Order Status */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Order Status</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>This month</span>
          </div>
          {orderStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const val = orderStats[key] || 0
                const pct = orderStats.total > 0 ? Math.round((val / orderStats.total) * 100) : 0
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{cfg.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 10, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>}
        </div>

        {/* Low Stock */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color="var(--accent-amber)" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Low Stock Alerts</h2>
            {inventorySummary?.low_stock_count > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--accent-red-light)', color: 'var(--accent-red)', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {inventorySummary.low_stock_count} items
              </span>
            )}
          </div>
          {inventorySummary?.low_stock_products?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inventorySummary.low_stock_products.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>SKU: {p.sku}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.stock === 0 ? 'var(--accent-red-light)' : 'var(--accent-amber-light)', color: p.stock === 0 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                    {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>All products are well stocked</div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} color="var(--accent-purple)" />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Inventory Overview</h2>
        </div>
        {inventorySummary ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Products', value: inventorySummary.total_products, color: 'var(--accent-purple)', bg: 'var(--accent-purple-light)' },
              { label: 'Total Stock Units', value: inventorySummary.total_stock_units.toLocaleString(), color: 'var(--accent-blue)', bg: 'var(--accent-blue-light)' },
              { label: 'Low Stock Items', value: inventorySummary.low_stock_count, color: inventorySummary.low_stock_count > 0 ? 'var(--accent-red)' : 'var(--accent-emerald)', bg: inventorySummary.low_stock_count > 0 ? 'var(--accent-red-light)' : 'var(--accent-emerald-light)' },
              { label: 'Inventory Value', value: `₹${inventorySummary.total_inventory_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-light)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
                <div style={{ fontSize: 12, color, opacity: 0.7, marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>}
      </div>
    </div>
  )
}
