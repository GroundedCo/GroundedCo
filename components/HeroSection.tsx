'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const fadeInUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as unknown as any },
  },
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.18 } },
}

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <Image
        src="https://images.unsplash.com/photo-1600166898405-da9535204843?w=2000&q=90&fm=webp"
        alt="High-texture premium rug background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-deep-obsidian/50" />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={fadeInUp}
          className="font-sans text-muted-earth text-sm tracking-[0.25em] uppercase mb-6"
        >
          Premium Rugs &amp; Carpets
        </motion.p>

        <motion.h1
          variants={fadeInUp}
          className="font-serif text-wool-white text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] mb-8"
        >
          Foundation for
          <br />
          <em>Fine Living.</em>
        </motion.h1>

        <motion.div variants={fadeInUp}>
          <a
            href="#collection"
            className="inline-block border border-wool-white/70 text-wool-white font-sans text-sm tracking-[0.2em] uppercase px-10 py-4 hover:bg-wool-white hover:text-deep-obsidian transition-all duration-300"
          >
            Explore Collection
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="font-sans text-wool-white/50 text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          className="w-px h-12 bg-wool-white/40"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
