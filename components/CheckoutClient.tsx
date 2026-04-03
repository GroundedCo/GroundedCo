'use client'

import { useState } from 'react'
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
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="space-y-4">
      {/* Quantity + Place Order */}
      <div className="flex items-center gap-4">
        <p className="font-sans text-deep-obsidian/40 text-xs tracking-wider uppercase">Qty</p>
        <div className="flex items-center border border-deep-obsidian/20">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center font-sans text-deep-obsidian/60 hover:bg-deep-obsidian/5 transition-colors"
          >
            −
          </button>
          <span className="w-12 h-10 flex items-center justify-center font-sans text-deep-obsidian text-sm border-x border-deep-obsidian/20">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 flex items-center justify-center font-sans text-deep-obsidian/60 hover:bg-deep-obsidian/5 transition-colors"
          >
            +
          </button>
        </div>
        <span className="ml-auto font-sans text-deep-obsidian text-xl font-medium">
          {formatINR(product.price * quantity)}
        </span>
      </div>

      <a
        href={product.price === 14399 ? 'https://rzp.io/rzp/o6tCwlDQ' : 'https://rzp.io/rzp/6bOtGS7'}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center font-sans text-xs tracking-[0.2em] uppercase bg-deep-obsidian text-wool-white py-4 hover:bg-muted-earth transition-colors duration-300"
      >
        Place Order — {formatINR(product.price * quantity)}
      </a>

      <p className="font-sans text-deep-obsidian/30 text-xs text-center tracking-wider">
        Secure checkout · All taxes included · EMI available
      </p>
    </div>
  )
}
