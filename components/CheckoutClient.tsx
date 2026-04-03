'use client'

import type { FeaturedProduct } from '@/data/products'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface CheckoutClientProps {
  product: FeaturedProduct
}

export default function CheckoutClient({ product }: CheckoutClientProps) {
  const maxQty = product.stockCount ?? 0

  if (maxQty === 0) {
    return (
      <div className="space-y-4">
        <div className="block w-full text-center font-sans text-xs tracking-[0.2em] uppercase bg-deep-obsidian/20 text-wool-white py-4 cursor-not-allowed">
          Out of Stock
        </div>
        <p className="font-sans text-deep-obsidian/30 text-xs text-center tracking-wider">
          Secure checkout · All taxes included · EMI available
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="font-sans text-xs tracking-wider">
        <span className="text-amber-600 font-medium">Only {maxQty} left</span>
        <span className="text-deep-obsidian/40"> — Secure yours!</span>
      </p>

      <a
        href={product.price === 14399 ? 'https://rzp.io/rzp/o6tCwlDQ' : 'https://rzp.io/rzp/6bOtGS7'}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center font-sans text-xs tracking-[0.2em] uppercase bg-deep-obsidian text-wool-white py-4 hover:bg-muted-earth transition-colors duration-300"
      >
        Place Order — {formatINR(product.price)}
      </a>

      <p className="font-sans text-deep-obsidian/30 text-xs text-center tracking-wider">
        Secure checkout · All taxes included · EMI available
      </p>
    </div>
  )
}
