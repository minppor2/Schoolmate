'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { NAV_ITEMS, isActivePath } from '@/lib/navItems';

// 모바일 전용 하단 탭바 (데스크톱에서는 CSS로 숨김)
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(item.path, pathname);
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={22} filled={active} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
