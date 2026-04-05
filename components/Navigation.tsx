"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Home, Leaf, Menu as MenuIcon } from 'lucide-react'
import { MenuContainer, MenuItem } from '@/components/ui/floating-menu'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed top-8 right-8 z-50">
      <MenuContainer>
        <MenuItem>
          <MenuIcon className="h-6 w-6" />
        </MenuItem>
        <MenuItem 
          onClick={() => router.push('/')}
          isActive={pathname === '/'}
          icon={<Home />}
        />
        <MenuItem 
          onClick={() => router.push('/enter-the-quiet')}
          isActive={pathname === '/enter-the-quiet'}
          icon={<Leaf />}
        />
      </MenuContainer>
    </div>
  )
}