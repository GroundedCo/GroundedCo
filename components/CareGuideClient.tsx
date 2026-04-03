'use client'

import { useState } from 'react'
import type { FeaturedProduct } from '@/data/products'

interface CareGuideClientProps {
  product: FeaturedProduct
}

export default function CareGuideClient({ product }: CareGuideClientProps) {
  const [activeTab, setActiveTab] = useState<'care' | 'delivery'>('care')

  const tabs = [
    { key: 'care' as const, label: 'Care Guide' },
    { key: 'delivery' as const, label: 'Delivery' },
  ]

  return (
    <div className="border border-deep-obsidian/10">
      {/* Tab headers */}
      <div className="flex border-b border-deep-obsidian/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-sans text-xs tracking-[0.15em] uppercase py-3 px-6 transition-colors duration-200 border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-deep-obsidian text-deep-obsidian'
                : 'border-transparent text-deep-obsidian/40 hover:text-deep-obsidian/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6 px-6">
        {activeTab === 'care' && (
          <ul className="space-y-3">
            {product.careInstructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-3 font-sans text-deep-obsidian/70 text-sm">
                <span className="text-muted-earth mt-0.5 shrink-0 text-xs">●</span>
                {instruction}
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-5">
            <div>
              <p className="font-sans text-deep-obsidian/40 text-xs tracking-wider uppercase mb-1.5">
                Estimated Delivery
              </p>
              <p className="font-sans text-deep-obsidian text-sm">{product.delivery.estimate}</p>
            </div>
            <div>
              <p className="font-sans text-deep-obsidian/40 text-xs tracking-wider uppercase mb-1.5">
                Shipping
              </p>
              <p className="font-sans text-deep-obsidian text-sm">{product.delivery.shippingCost}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
