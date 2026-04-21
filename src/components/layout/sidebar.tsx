'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Store, Package, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ventas', label: 'Ventas', icon: TrendingUp },
  { href: '/tiendas', label: 'Tiendas', icon: Store },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/tendencias', label: 'Tendencias', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-sidebar min-h-screen">
      {/* Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-brand">DELIKOS</h1>
        <p className="text-xs text-muted-foreground mt-1">Business Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand/15 text-brand font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground">Sell-out Merco</p>
        <p className="text-[10px] text-muted-foreground">Ene 2025 — Mar 2026</p>
      </div>
    </aside>
  );
}
