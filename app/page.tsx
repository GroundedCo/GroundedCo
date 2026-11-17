import HeroSection from '@/components/HeroSection'
import InfiniteCarousel from '@/components/InfiniteCarousel'
import TryItOutSection  from '@/components/TryItOutSection'
import SubFooter        from '@/components/SubFooter'
import {
  getCarouselProducts,
  getFeaturedProducts,
  FALLBACK_CAROUSEL,
  FALLBACK_FEATURED,
  type CarouselProduct,
  type FeaturedProduct,
} from '@/data/products'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // Always fetch fresh stock from Supabase

export default async function Home() {
  let carouselProducts: CarouselProduct[] = FALLBACK_CAROUSEL
  let featuredProducts: FeaturedProduct[] = FALLBACK_FEATURED

  try {
    const [carousel, featured] = await Promise.all([
      getCarouselProducts(),
      getFeaturedProducts(),
    ])
    if (Array.isArray(carousel) && carousel.length > 0) {
      carouselProducts = carousel
    }
    if (Array.isArray(featured) && featured.length > 0) {
      featuredProducts = featured
    }
  } catch (err) {
    console.error('Home(): product fetch failed', err)
  }

  return (
    <main className="min-h-screen bg-cream">
      <HeroSection />
      <InfiniteCarousel products={carouselProducts} />
      <TryItOutSection products={featuredProducts} />
      <SubFooter />
    </main>
  )
}
