'use client'

import { useState } from 'react'
import type { FeaturedProduct } from '@/data/products'

const CARE_ITEMS = [
  { title: 'Professional Care', body: 'For deep cleaning, professional dry cleaning is recommended to maintain the integrity of the natural fibers.' },
  { title: 'Routine Maintenance', body: 'Vacuum your rug regularly. Use a suction-only setting and avoid the beater bar, which can stress the delicate weave.' },
  { title: 'Spill Response', body: 'Act quickly. Blot (do not rub) immediately with a clean, dry cloth.' },
  { title: 'Balanced Living', body: 'Rotate your rug every 6 months to ensure even wear and prevent specific areas from bearing more traffic than others.' },
  { title: 'Light Sensitivity', body: 'To preserve the rich, natural dyes, avoid placing your rug in direct, harsh sunlight.' },
  { title: 'The Nature of Yarn', body: 'Shedding is a natural characteristic of high-quality yarn — a sign of its organic origin, not a defect. Regular vacuuming will manage this over time.' },
]

interface CareGuideClientProps {
  product: FeaturedProduct
}

export default function CareGuideClient({ product }: CareGuideClientProps) {
  const [activeTab, setActiveTab] = useState<'care' | 'delivery'>('care')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
      <div className="py-3 px-6">
        {activeTab === 'care' && (
          <div>
            <p className="font-sans text-deep-obsidian/50 text-xs leading-relaxed italic py-3 border-b border-deep-obsidian/10">
              To preserve the life and soul of your handcrafted piece, we recommend the following rituals:
            </p>
            {CARE_ITEMS.map(({ title, body }, i) => (
              <div key={title} className="border-b border-deep-obsidian/10 last:border-0">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between py-3 text-left gap-4"
                >
                  <span className="font-sans text-xs font-semibold tracking-[0.1em] uppercase text-deep-obsidian">
                    {title}
                  </span>
                  <span className={`text-deep-obsidian/40 text-xs shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {openIndex === i && (
                  <p className="font-sans text-deep-obsidian/60 text-xs leading-relaxed pb-3 -mt-1">
                    {body}
                  </p>
                )}
              </div>
            ))}
          </div>
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
