import Link from 'next/link';

export default function Sidebar() {
  const menus = [
    { name: '홈', path: '/', active: true, icon: '🏠' },
    { name: '업무함', path: '/inbox', active: false, icon: '📥' },
    { name: '일정', path: '/schedule', active: false, icon: '📅' },
    { name: '특별실', path: '/reservation', active: false, icon: '🏫' },
    { name: '학생기록', path: '/records', active: false, icon: '📝' },
    { name: '설정', path: '/settings', active: false, icon: '⚙️' }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menus.map((menu) => (
          <Link href={menu.path} key={menu.name} className={`sidebar-link ${menu.active ? 'active' : ''}`}>
            <span className="sidebar-icon">{menu.icon}</span>
            {menu.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
