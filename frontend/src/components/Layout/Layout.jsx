import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Users, ShoppingCart, BarChart3, Menu, X, TrendingUp } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/inventory', icon: BarChart3, label: 'Inventory' },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }} onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-sidebar)', zIndex: 30,
        position: window.innerWidth < 1024 ? 'fixed' : 'static',
        inset: window.innerWidth < 1024 ? '0 auto 0 0' : 'auto',
        transform: window.innerWidth < 1024 ? (open ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.2s',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c5cfc, #f43f8e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,92,252,0.4)'
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>InvenTrack</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>Order Management</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', padding: '4px 8px 12px' }}>Navigation</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                background: isActive ? 'rgba(124,92,252,0.2)' : 'transparent',
                color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid #7c5cfc' : '3px solid transparent',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
        <div style={{ padding: '16px 12px 20px' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ color: '#6ee7b7', fontSize: 12, fontWeight: 600 }}>All Systems Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile topbar */}
        <div style={{ display: 'none', padding: '12px 16px', background: 'white', borderBottom: '1px solid var(--border)', alignItems: 'center', justifyContent: 'space-between' }}
          className="mobile-header">
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Menu size={22} />
          </button>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>InvenTrack</span>
          <div style={{ width: 22 }} />
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
