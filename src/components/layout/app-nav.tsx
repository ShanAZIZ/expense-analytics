import { Link } from '@tanstack/react-router'

const navItems = [
  { label: 'Import', to: '/' as const },
  { label: 'Transactions', to: '/transactions' as const },
]

export function AppNav() {
  return (
    <nav className="flex items-center gap-4 border-b px-6 py-3">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="text-sm font-medium [&.active]:text-primary"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
