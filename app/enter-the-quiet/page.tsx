"use client"

import { useRouter } from 'next/navigation'
import LiquidMetalHero from '@/components/ui/liquid-metal-hero'

export default function EnterTheQuietPage() {
  const router = useRouter()

  return (
    <LiquidMetalHero
      badge="✨ Next Generation UI"
      title="Fluid Design Excellence"
      subtitle="Experience the future of web interfaces with liquid metal aesthetics that adapt, flow, and captivate. Built for modern applications that demand both beauty and performance."
      primaryCtaLabel="Start Building"
      secondaryCtaLabel="View Examples"
      onPrimaryCtaClick={() => router.push('/')}
      onSecondaryCtaClick={() => router.push('/#collection')}
      features={[
        'Seamless Animations',
        'Responsive Excellence',
        'Modern Architecture',
      ]}
    />
  )
}
