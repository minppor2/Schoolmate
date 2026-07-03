'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { NAV_ITEMS, isActivePath } from '@/lib/navItems';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((menu) => (
          <Link
            href={menu.path}
            key={menu.name}
            className={`sidebar-link ${isActivePath(menu.path, pathname) ? 'active' : ''}`}
          >
            <span className="sidebar-icon"><Icon name={menu.icon} size={20} /></span>
            {menu.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
