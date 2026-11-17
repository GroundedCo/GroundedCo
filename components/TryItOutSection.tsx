'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import type { FeaturedProduct } from '@/data/products'



function ProductCard({ product }: { product: FeaturedProduct }) {
  const allPhotos = [product.image, ...product.photos].filter(Boolean)
  const [photoIndex, setPhotoIndex] = useState(0)

  function handleImageClick() {
    setPhotoIndex((prev) => (prev + 1) % allPhotos.length)
  }

  const stockCount = typeof product.stockCount === 'number' ? product.stockCount : 0
  const isOutOfStock = stockCount === 0

  return (
    <div className="group relative bg-cream flex flex-col rounded-[2.5rem] overflow-hidden border border-forest/10 hover:border-sage transition-colors duration-300 shadow-2xl relative z-20">
      {/* Top badges */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        {product.badge ? (
          <span className="font-sans font-bold text-xs tracking-[0.2em] uppercase bg-sage text-forest px-4 py-2 rounded-full">
            {product.badge}
          </span>
        ) : (
          <div />
        )}

        {isOutOfStock && (
          <span className="font-sans font-bold text-xs tracking-[0.2em] uppercase bg-forest/80 text-cream px-4 py-2 rounded-full">
            Sold Out
          </span>
        )}
      </div>

      {/* Product image */}
      <div className="p-4 pt-12 pb-0">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] animate-float shadow-2xl cursor-pointer"
          onClick={allPhotos.length > 1 ? handleImageClick : undefined}
          title={allPhotos.length > 1 ? 'Click to see more photos' : undefined}
        >
          <Image
            src={allPhotos[photoIndex] || '/placeholder.png'}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
              isOutOfStock ? 'opacity-70' : ''
            }`}
          />
          {allPhotos.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {allPhotos.map((_, i) => (
                <span
                  key={i}
                  className={`block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    i === photoIndex ? 'bg-cream' : 'bg-cream/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-8 flex flex-col gap-4 flex-1">
        <div>
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <h3
              itemProp="name"
              className="font-display text-forest text-4xl uppercase tracking-tighter"
            >
              {product.malayalamName || product.name}
            </h3>
            {product.price && (
              <span className="font-sans font-bold text-forest text-lg">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <p className="font-sans font-bold text-forest/50 text-sm tracking-wide mb-2">
            {product.subtitle}
          </p>

          {/* Stock info */}
          {isOutOfStock ? (
            <p className="font-sans text-xs text-forest/40 tracking-wide">
              Claimed · Once placed, never woven again.
            </p>
          ) : (
            <p className="font-sans text-xs text-forest/60 tracking-wide font-medium">
              {stockCount === 1 ? 'Only 1 available' : `${stockCount} available`}
            </p>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-forest/10">
          {isOutOfStock ? (
            <button
              disabled
              className="block w-full text-center font-sans font-bold text-xs tracking-[0.2em] uppercase bg-forest/10 text-forest/30 px-8 py-4 rounded-[2.5rem] cursor-not-allowed"
            >
              Sold Out
            </button>
          ) : (
            <Link
              href={`/checkout/${product.id}`}
              className="block w-full text-center font-sans font-bold text-xs tracking-[0.2em] uppercase bg-forest text-cream px-8 py-4 rounded-[2.5rem] hover:bg-sage hover:text-forest transition-colors duration-300 relative z-30"
            >
              Bring It Home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

interface TryItOutSectionProps {
  products?: FeaturedProduct[]
}

export default function TryItOutSection({ products = [] }: TryItOutSectionProps) {
  const pillRef = useRef<HTMLDivElement>(null)
  const [fillActive, setFillActive] = useState(false)

  const safeProducts = Array.isArray(products) ? products : []

  // Always keep in-stock variants on top
  const sortedProducts = [...safeProducts].sort((a, b) => {
    const aInStock = (a.stockCount ?? 0) > 0 ? 1 : 0
    const bInStock = (b.stockCount ?? 0) > 0 ? 1 : 0
    return bInStock - aInStock
  })

  useEffect(() => {
    const el = pillRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFillActive(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-cream pb-12 sm:pb-24">
      <section data-nav-theme="dark" className="py-24 bg-forest rounded-[5rem] mx-4 shadow-2xl" id="try-it-out">
        <div className="max-w-6xl mx-auto px-6 md:px-12">

        {/* Heading */}
        <div className="mb-16 text-center">
          <p className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase mb-4">Live With It</p>
          <h2 className="font-display text-cream text-[15vw] md:text-[10vw] leading-[0.8] uppercase tracking-tighter mix-blend-overlay">
            Live With it
          </h2>
        </div>

        {/* The Invitation Section */}
        <div className="max-w-5xl mx-auto mb-20 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 text-center md:text-left mb-16">
            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase border-b border-sage/20 pb-4">
                A Singular Commission
              </h4>
              <p className="font-sans text-cream/70 text-sm leading-relaxed">
                An ongoing exploration of texture, form, and earth. We release our masterworks as completely unique, one-of-one studies in spatial design. Each piece is an absolute original—once placed, it is never woven again.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase border-b border-sage/20 pb-4">
                The Weight of One
              </h4>
              <p className="font-sans text-cream/70 text-sm leading-relaxed">
                Our looms move at the pace of heritage. Because of the profound hand-tufted density and the intensive, unhurried months required to craft every square foot, our designs are realized strictly as singular editions, reserved for one home only.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase border-b border-sage/20 pb-4">
                The Sanctuary Preview
              </h4>
              <p className="font-sans text-cream/70 text-sm leading-relaxed">
                The true measure of a masterpiece is how it holds a room. Experience the Grounded Try-Out within your own architecture. We invite you to live with a singular work, allowing its weight to anchor your space before claiming its legacy.
              </p>
            </div>
          </div>

          <div ref={pillRef} className="text-center border border-sage/30 rounded-full py-6 px-8 max-w-lg mx-auto bg-sage/5 backdrop-blur-sm relative overflow-hidden group">
            <div
              className="absolute inset-0 bg-sage/10 transition-transform duration-700 ease-out"
              style={{ transform: fillActive ? 'translateY(0%)' : 'translateY(100%)' }}
            />
            <p className="relative z-10 font-sans font-bold text-cream text-xs md:text-sm tracking-[0.2em] uppercase">
              Host the unseen. Before the five are gone.
            </p>
          </div>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-20">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-sage/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span className="font-sans font-bold text-sage/70 text-xs tracking-[0.2em] uppercase">
            Thoughtfully Shipped · Natural Materials
          </span>
        </div>
      </div>
    </section>
  </div>
  )
}
