import HeroSection from '@/components/HeroSection'
import InfiniteCarousel from '@/components/InfiniteCarousel'
import TryItOutSection  from '@/components/TryItOutSection'
import SubFooter        from '@/components/SubFooter'
import {
  getCarouselProducts,
  getFeaturedProducts,
  type CarouselProduct,
  type FeaturedProduct,
} from '@/data/products'

export const revalidate = 3600 // ISR: refresh every hour

export default async function Home() {
  let carouselProducts: CarouselProduct[] = []
  let featuredProducts: FeaturedProduct[] = []

  try {
    ;[carouselProducts, featuredProducts] = await Promise.all([
      getCarouselProducts(),
      getFeaturedProducts(),
    ])
  } catch (err) {
    console.error('Home(): product fetch failed', err)
    // Continue with fallback data (functions already use fallback). On failure set empty arrays.
    carouselProducts = []
    featuredProducts = []
  }

  return (
    <main className="min-h-screen">
      <HeroSection />
      <InfiniteCarousel products={carouselProducts} />
      <TryItOutSection products={featuredProducts} />
      <SubFooter />
    </main>
  )
}
