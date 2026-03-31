import HeroSection      from '@/components/HeroSection'
import InfiniteCarousel from '@/components/InfiniteCarousel'
import TryItOutSection  from '@/components/TryItOutSection'
import SubFooter        from '@/components/SubFooter'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <InfiniteCarousel />
      <TryItOutSection />
      <SubFooter />
    </main>
  )
}
