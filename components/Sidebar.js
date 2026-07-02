import Link from 'next/link';
import Icon from './Icon';

export default function Sidebar() {
  const menus = [
    { name: '홈', path: '/', active: true, icon: 'home' },
    { name: '업무함', path: '/inbox', active: false, icon: 'inbox' },
    { name: '일정', path: '/schedule', active: false, icon: 'calendar_month' },
    { name: '특별실', path: '/reservation', active: false, icon: 'school' },
    { name: '학생기록', path: '/records', active: false, icon: 'edit_note' },
    { name: '설정', path: '/settings', active: false, icon: 'settings' }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menus.map((menu) => (
          <Link href={menu.path} key={menu.name} className={`sidebar-link ${menu.active ? 'active' : ''}`}>
            <span className="sidebar-icon"><Icon name={menu.icon} size={20} /></span>
            {menu.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
