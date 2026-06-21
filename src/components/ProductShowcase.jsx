import React from 'react';
import { motion } from 'framer-motion';

const textRevealVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const titleRevealVariants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: {
    clipPath: "inset(0 0 0 0)",
    transition: { duration: 0.7, ease: [0.19, 1, 0.22, 1] }
  }
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const cardRevealVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 130, damping: 16 }
  }
};

/**
 * ProductShowcase Component
 * @param {string} sectionHeader - Monospace label above section
 * @param {string} title - Monumental condensed heading
 * @param {string} description - Monospace explanatory paragraph
 * @param {Array} products - List of products: [{ name: string, image: string }]
 */
export default function ProductShowcase({ 
  sectionHeader = "[ RACK . 02 - FEATURED ON THE TRAY ]",
  title = "SEALED. STAMPED. SHIPPED.",
  description = "Small batch 3D Prints, vacuum-sealed and hand-numbered. Pick up a packet from the workshop tray before the lot sells through.",
  products = []
}) {
  return (
    <section className="w-full bg-black py-12 px-4 md:px-8 max-w-[1280px] mx-auto select-none font-mono border-t border-[#1C1C1C]">
      {/* Section Sub-Header */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={textRevealVariants}
        className="flex items-center gap-2 text-[10px] sm:text-xs text-[#BEBEBE] tracking-[0.15em] mb-4"
      >
        <span className="text-[#4ADE80] text-[8px] animate-pulse">●</span>
        <span>{sectionHeader}</span>
      </motion.div>

      {/* Main Monumental Brutalist Title - Animated clip reveal */}
      <motion.h2 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={titleRevealVariants}
        className="font-display font-bold text-[10vw] sm:text-[6vw] md:text-[5rem] lg:text-[6.5rem] leading-[0.9] text-white tracking-[0.02em] uppercase mb-4"
      >
        {title}
      </motion.h2>

      {/* Monospace Paragraph Description */}
      <motion.p 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={textRevealVariants}
        className="text-white/60 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed tracking-wide mb-12 font-mono"
      >
        {description}
      </motion.p>

      {/* Responsive Product Grid with staggered card entrance */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={gridContainerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full"
      >
        {products.map((product, index) => (
          <motion.div 
            key={index} 
            variants={cardRevealVariants}
            className="flex flex-col items-center group cursor-pointer"
          >
            {/* Product Card Container */}
            <div className="border border-[#2C2C2C] group-hover:border-[#4ADE80] w-full aspect-square bg-[#070707] flex items-center justify-center p-6 relative overflow-hidden transition-all duration-300">
              
              {/* Technical framing lines */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-white/20 group-hover:border-[#4ADE80] transition-colors duration-300"></div>
              <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-white/20 group-hover:border-[#4ADE80] transition-colors duration-300"></div>
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-white/20 group-hover:border-[#4ADE80] transition-colors duration-300"></div>
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-white/20 group-hover:border-[#4ADE80] transition-colors duration-300"></div>

              {/* Holographic grid backing */}
              <div className="absolute inset-0 opacity-2 pointer-events-none bg-[radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]"></div>

              {/* Product Model Image */}
              <img 
                src={product.image} 
                alt={`${product.name} 3D model render`} 
                className="max-h-[82%] max-w-[82%] object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07] group-hover:rotate-[3deg]"
              />

              {/* Active neon highlight glow */}
              <div className="absolute inset-0 bg-[#4ADE80]/0 group-hover:bg-[#4ADE80]/2 transition-all duration-300 pointer-events-none"></div>
            </div>

            {/* Product Label Title */}
            <h3 className="font-bold text-sm sm:text-base md:text-lg tracking-[0.2em] text-white/90 group-hover:text-[#4ADE80] mt-6 transition-colors duration-200 uppercase">
              {product.name}
            </h3>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
