'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { FeaturedProduct } from '@/data/products'
import OneOfOneInquiryModal, { type OneOfOnePiece } from './OneOfOneInquiryModal'

function pieceName(product: FeaturedProduct) {
  return product.malayalamName ? `${product.name} (${product.malayalamName})` : product.name
}

function ProductCard({
  product,
  onInquire,
}: {
  product: FeaturedProduct
  onInquire: (piece: OneOfOnePiece) => void
}) {
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
            Anchored
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
            {product.price > 0 && product.showPrice && (
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
          ) : product.showStock !== false ? (
            <p className="font-sans text-xs text-forest/60 tracking-wide font-medium">
              {stockCount === 1 ? 'Only 1 available' : `${stockCount} available`}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-6 border-t border-forest/10">
          {isOutOfStock ? (
            <button
              disabled
              className="block w-full text-center font-sans font-bold text-xs tracking-[0.2em] uppercase bg-forest/10 text-forest/30 px-8 py-4 rounded-[2.5rem] cursor-not-allowed"
            >
              Found its home
            </button>
          ) : product.isOneOfOne ? (
            <button
              type="button"
              data-piece-name={pieceName(product)}
              aria-haspopup="dialog"
              aria-controls="one-of-one-inquiry-modal"
              onClick={() => onInquire({ id: product.id, name: pieceName(product) })}
              className="block w-full text-center font-sans font-bold text-xs tracking-[0.2em] uppercase bg-forest text-cream px-8 py-4 rounded-[2.5rem] hover:bg-sage hover:text-forest transition-colors duration-300 relative z-30"
            >
              Inquire to Acquire
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

const PROVENANCE = [
  'Full ownership of the design',
  'Grounded Loyal Aesthete certification',
  'Share in respect of original art',
]

/** Large showcase card for "One of 1" pieces. */
function SpotlightCard({
  product,
  onInquire,
}: {
  product: FeaturedProduct
  onInquire: (piece: OneOfOnePiece) => void
}) {
  const allPhotos = [product.image, ...product.photos].filter(Boolean)
  const [photoIndex, setPhotoIndex] = useState(0)
  const stockCount = typeof product.stockCount === 'number' ? product.stockCount : 0
  const isPlaced = stockCount === 0
  const showPrice = product.price > 0 && product.showPrice

  return (
    <div className="group relative z-20 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] bg-cream rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-sage/40 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] ring-1 ring-sage/20">
      {/* Image */}
      <div className="relative p-4 lg:p-5">
        <div
          className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[480px] w-full overflow-hidden rounded-[2rem] md:rounded-[2.5rem] cursor-pointer"
          onClick={allPhotos.length > 1 ? () => setPhotoIndex((i) => (i + 1) % allPhotos.length) : undefined}
          title={allPhotos.length > 1 ? 'Click to see more photos' : undefined}
        >
          <Image
            src={allPhotos[photoIndex] || '/placeholder.png'}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${isPlaced ? 'opacity-70' : ''}`}
          />
          <span className="absolute top-5 left-5 font-sans font-bold text-[11px] tracking-[0.25em] uppercase bg-forest text-cream px-4 py-2 rounded-full">
            One of 1
          </span>
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {allPhotos.map((_, i) => (
                <span key={i} className={`block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === photoIndex ? 'bg-cream' : 'bg-cream/40'}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="@container flex min-w-0 flex-col px-6 sm:px-8 pb-10 pt-4 lg:p-12">
        {product.badge && (
          <p className="font-sans font-bold text-forest/50 text-xs tracking-[0.2em] uppercase mb-4">{product.badge}</p>
        )}
        <h3
          itemProp="name"
          className="font-display text-forest text-[clamp(1.25rem,12cqi,4.5rem)] uppercase tracking-tighter leading-[1.1] [overflow-wrap:anywhere]"
        >
          {product.malayalamName || product.name}
        </h3>
        {product.malayalamName && (
          <p className="font-sans font-bold text-forest/60 text-sm tracking-[0.2em] uppercase mt-3">{product.name}</p>
        )}
        <p className="font-sans font-bold text-forest/50 text-sm tracking-wide mt-4">{product.subtitle}</p>

        <ul className="mt-8 space-y-3 border-t border-forest/10 pt-6">
          {PROVENANCE.map((line) => (
            <li key={line} className="flex items-center gap-3 font-sans text-sm text-forest/75">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <p className="font-sans text-xs text-forest/50 tracking-[0.15em] uppercase font-bold">
              {isPlaced ? 'Placed · Never woven again' : 'Offered by private placement'}
            </p>
            {showPrice && (
              <span className="font-sans font-bold text-forest text-lg">₹{product.price.toLocaleString('en-IN')}</span>
            )}
          </div>
          {isPlaced ? (
            <button
              disabled
              className="block w-full text-center font-sans font-bold text-xs tracking-[0.2em] uppercase bg-forest/10 text-forest/30 px-8 py-5 rounded-[2.5rem] cursor-not-allowed"
            >
              Placed
            </button>
          ) : (
            <button
              type="button"
              data-piece-name={pieceName(product)}
              aria-haspopup="dialog"
              aria-controls="one-of-one-inquiry-modal"
              onClick={() => onInquire({ id: product.id, name: pieceName(product) })}
              className="block w-full text-center font-sans font-bold text-xs md:text-sm tracking-[0.25em] uppercase bg-forest text-cream px-8 py-5 rounded-[2.5rem] hover:bg-sage hover:text-forest transition-colors duration-300 relative z-30"
            >
              Inquire to Acquire
            </button>
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
  const [inquiryPiece, setInquiryPiece] = useState<OneOfOnePiece | null>(null)
  const closeInquiry = useCallback(() => setInquiryPiece(null), [])

  const safeProducts = Array.isArray(products) ? products : []

  // Always keep in-stock variants on top
  const sortedProducts = [...safeProducts].sort((a, b) => {
    const aInStock = (a.stockCount ?? 0) > 0 ? 1 : 0
    const bInStock = (b.stockCount ?? 0) > 0 ? 1 : 0
    return bInStock - aInStock
  })
  const regularProducts = sortedProducts.filter((p) => !p.isOneOfOne)
  const oneOfOneProducts = sortedProducts.filter((p) => p.isOneOfOne)

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
                By Selection Only
              </h4>
              <p className="font-sans text-cream/70 text-sm leading-relaxed">
                To celebrate our bespoke journey, we are releasing our own special Zero Latex &ldquo;5 Homes&rdquo; collection.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase border-b border-sage/20 pb-4">
                Handtuft &amp; One of 1
              </h4>
              <p className="font-sans text-cream/70 text-sm leading-relaxed">
                Crafted at an extraordinary 4000 GSM heavyweight density using 100% NZ (New Zealand) wool, each hand-tufted &ldquo;One of 1&rdquo; masterpiece offers unparalleled thickness, luxury, and heritage-level weight, complete with certification of design ownership and value for the discerning aesthete.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase border-b border-sage/20 pb-4">
                Zero Latex &amp; Wet Backing
              </h4>
              <p className="font-sans text-cream/70 text-sm leading-relaxed">
                For our handwoven creations, every technique is done with Zero Latex, utilizing natural wet backing to ensure a completely chemical-free, organic, and truly grounded foundation.
              </p>
            </div>
          </div>

          <div ref={pillRef} className="text-center border border-sage/30 rounded-full py-6 px-8 max-w-lg mx-auto bg-sage/5 backdrop-blur-sm relative overflow-hidden group">
            <div
              className="absolute inset-0 bg-sage/10 transition-transform duration-700 ease-out"
              style={{ transform: fillActive ? 'translateY(0%)' : 'translateY(100%)' }}
            />
            <p className="relative z-10 font-sans font-bold text-cream text-xs md:text-sm tracking-[0.2em] uppercase">
              Just the earth, underfoot
            </p>
          </div>
        </div>

        {/* "One of 1" — the star of the section */}
        {oneOfOneProducts.length > 0 && (
          <div id="one-of-one">
            <div className="mb-14 text-center">
              <p className="font-sans font-bold text-sage text-xs tracking-[0.25em] uppercase mb-5">
                By Private Placement
              </p>
              <h3 className="font-display text-cream text-[18vw] md:text-[9rem] uppercase tracking-tighter leading-[0.8]">
                <span className="text-shine">One of 1</span>
              </h3>
              <p className="font-sans text-cream/65 text-sm md:text-base leading-relaxed max-w-lg mx-auto mt-6">
                Singular hand-tufted works, never woven again. Each placement is offered by inquiry and reviewed privately by our studio.
              </p>
            </div>
            <div className="space-y-12">
              {oneOfOneProducts.map((product) => (
                <SpotlightCard key={product.id} product={product} onInquire={setInquiryPiece} />
              ))}
            </div>
          </div>
        )}

        {/* Regular product cards */}
        {regularProducts.length > 0 && (
          <div className={oneOfOneProducts.length > 0 ? 'mt-28' : ''}>
            {oneOfOneProducts.length > 0 && (
              <div className="mb-12 text-center">
                <p className="font-sans font-bold text-sage text-xs tracking-[0.2em] uppercase mb-4">Grounded Living</p>
                <h3 className="font-display text-cream text-5xl md:text-6xl uppercase tracking-tighter leading-[0.9]">
                  Quiet by Nature
                </h3>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-20">
              {regularProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onInquire={setInquiryPiece}
                />
              ))}
            </div>
          </div>
        )}

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
    <OneOfOneInquiryModal piece={inquiryPiece} onClose={closeInquiry} />
  </div>
  )
}
