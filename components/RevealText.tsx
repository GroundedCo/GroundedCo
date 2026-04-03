'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface RevealTextProps {
  text?: string
  textColor?: string
  overlayColor?: string
  fontSize?: string
  letterDelay?: number
  overlayDelay?: number
  overlayDuration?: number
  springDuration?: number
  letterImages?: string[]
}

export function RevealText({
  text = 'GROUNDED',
  textColor = 'text-cream',
  overlayColor = 'text-sage',
  fontSize = 'text-[15vw] sm:text-[18vw] md:text-[20vw]',
  letterDelay = 0.08,
  overlayDelay = 0.05,
  overlayDuration = 0.4,
  springDuration = 600,
  letterImages = [
    // G
    '/images/wool_process/1_shearing.png',
    // R
    '/images/wool_process/2_cleaning.png',
    // O
    '/images/wool_process/3_carding.png',
    // U
    '/images/wool_process/4_rovings.png',
    // N
    '/images/wool_process/5_spinning.png',
    // D
    '/images/wool_process/6_yarn.png',
    // E
    '/images/wool_process/4_rovings.png',
    // D
    '/images/wool_process/6_yarn.png',
  ],
}: RevealTextProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [showOverlayText, setShowOverlayText] = useState(false)

  useEffect(() => {
    const lastLetterDelay = (text.length - 1) * letterDelay
    const totalDelay = lastLetterDelay * 1000 + springDuration

    const timer = setTimeout(() => {
      setShowOverlayText(true)
    }, totalDelay)

    return () => clearTimeout(timer)
  }, [text.length, letterDelay, springDuration])

  return (
    <div className="flex items-center justify-center relative">
      <div className="flex">
        {text.split('').map((letter, index) => {
          if (letter === ' ') {
            return <div key={index} className="w-[35vw] md:w-[25vw] shrink-0" />
          }
          return (
          <span
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`${fontSize} font-display font-normal tracking-tighter leading-none cursor-pointer relative uppercase animate-spring-in`}
            style={{ animationDelay: `${index * letterDelay}s` }}
          >
            {/* Base text layer */}
            <motion.span
              className={`absolute inset-0 ${textColor}`}
              animate={{
                opacity: hoveredIndex === index ? 0 : 1,
              }}
              transition={{ duration: 0.1 }}
            >
              {letter}
            </motion.span>

            {/* Image text layer with background panning */}
            <motion.span
              className="text-transparent bg-clip-text bg-cover bg-no-repeat bg-center"
              animate={{
                opacity: hoveredIndex === index ? 1 : 0,
                backgroundPosition: hoveredIndex === index ? '10% center' : '50% center',
              }}
              transition={{
                opacity: { duration: 0.1 },
                backgroundPosition: {
                  duration: 3,
                  ease: 'easeInOut',
                },
              }}
              style={{
                backgroundImage: `url('${letterImages[index % letterImages.length]}')`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {letter}
            </motion.span>

            {/* Overlay text layer that sweeps across each letter */}
            {showOverlayText && (
              <motion.span
                className={`absolute inset-0 ${overlayColor} pointer-events-none`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  delay: index * overlayDelay,
                  duration: overlayDuration,
                  times: [0, 0.1, 0.7, 1],
                  ease: 'easeInOut',
                }}
              >
                {letter}
              </motion.span>
            )}
          </span>
        )})}
      </div>
    </div>
  )
}
