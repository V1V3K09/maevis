import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import heroBg1 from '../assets/hero_bg.png';
import heroBg2 from '../assets/hero_bg2.png';

const slides = [
  {
    id: 1,
    bg: heroBg1,
    subtitle: "MAEVIS PRESENTS",
    titleLine1: "GENESIS",
    titleLine2: "4",
    techTag: "[V.04]",
    date: "DROPS 01 04 25",
    sideText: ["BE", "PART", "OF", "OUR", "GENESIS"]
  },
  {
    id: 2,
    bg: heroBg2,
    subtitle: "SYSTEM ACCESS CODES",
    titleLine1: "TERMINAL",
    titleLine2: "D9",
    techTag: "[SEC_D9]",
    date: "ONLINE 23:00 IST",
    sideText: ["BE", "PART", "OF", "THE", "GAME"]
  }
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  })
};

const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15
    }
  }
};

const textItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 }
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

export default function Hero() {
  const [[page, direction], setPage] = useState([0, 0]);

  const activeIndex = (page % slides.length + slides.length) % slides.length;
  const currentSlide = slides[activeIndex];

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  return (
    <section className="w-full bg-black py-8 px-4 md:px-8 max-w-[1280px] mx-auto select-none overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-[#BEBEBE] tracking-[0.15em] mb-4">
        <span className="text-[#4ADE80] text-[8px] animate-pulse">●</span>
        <span>[ BULLETIN . WORKSHOP NEWS ]</span>
      </div>

      {/* Hero Carousel Container */}
      <motion.div 
        initial={{ opacity: 0, scaleY: 0.96 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        className="border border-[#2C2C2C] rounded-xl relative aspect-[16/9] md:aspect-[2.1/1] w-full bg-[#0E0E0E] overflow-hidden group"
      >
        
        {/* Animated Carousel Slides */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={currentSlide.bg} 
                alt={`${currentSlide.titleLine1} slide background`} 
                className="w-full h-full object-cover object-center filter grayscale contrast-[1.15] opacity-55"
              />
              {/* Grayscale grain texture overlay */}
              <div className="absolute inset-0 opacity-12 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
              {/* Vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/65"></div>
            </div>

            {/* Middle Typography Panel (Animated stagger entrance) */}
            <motion.div 
              variants={textContainerVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-center px-8"
            >
              {/* Slide Subtitle */}
              <motion.span 
                variants={textItemVariants}
                className="font-mono text-[9px] sm:text-xs md:text-sm tracking-[0.35em] text-white/95 font-medium uppercase mb-1 sm:mb-2 md:mb-3 drop-shadow-md"
              >
                {currentSlide.subtitle}
              </motion.span>

              {/* Main Huge Title */}
              <motion.h1 
                variants={textItemVariants}
                className="font-sans font-extrabold tracking-[0.06em] text-white drop-shadow-lg flex flex-col items-center"
              >
                {/* Title Line 1 */}
                <span className="text-[7.5vw] md:text-[5.5rem] lg:text-[7rem] leading-none tracking-[0.08em] uppercase">
                  {currentSlide.titleLine1}
                </span>
                {/* Title Line 2 */}
                <span className="text-[12vw] md:text-[8rem] lg:text-[10rem] leading-[0.75] font-black font-display relative inline-block mt-1 sm:mt-2">
                  {currentSlide.titleLine2}
                  {/* Tech Tag */}
                  <span className="absolute -top-2 -right-4 font-mono text-[8px] md:text-[10px] tracking-widest text-[#4ADE80] font-normal scale-75 md:scale-100">
                    {currentSlide.techTag}
                  </span>
                </span>
              </motion.h1>

              {/* Date Info */}
              <motion.span 
                variants={textItemVariants}
                className="font-mono text-[9px] sm:text-xs md:text-sm tracking-[0.25em] text-[#4ADE80] font-bold mt-4 drop-shadow-[0_0_4px_rgba(74,222,128,0.3)]"
              >
                {currentSlide.date}
              </motion.span>
            </motion.div>

            {/* Bottom Right Vertically-Stacked Typography Block */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col text-right font-sans font-black tracking-wider leading-[1.05] uppercase pointer-events-none"
            >
              {currentSlide.sideText.map((txt, index) => {
                const isLast = index === currentSlide.sideText.length - 1;
                return (
                  <span 
                    key={index}
                    className={`${isLast ? 'text-[12px] sm:text-base md:text-lg text-white' : 'text-[10px] sm:text-xs md:text-sm text-white/50'}`}
                  >
                    {txt}
                  </span>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Decorative corner crosshairs */}
        <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-white/20 z-10 pointer-events-none"></div>
        <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-white/20 z-10 pointer-events-none"></div>
        <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-white/20 z-10 pointer-events-none"></div>
        <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-white/20 z-10 pointer-events-none"></div>

        {/* Technical Watermark (Top Left Corner of Frame) */}
        <div className="absolute top-4 left-4 font-mono text-[8px] text-white/40 tracking-wider hidden sm:block z-10 pointer-events-none">
          [ DEPLOYMENT_SYS: ACTV // SLIDE_0{activeIndex + 1} ]
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={() => paginate(-1)}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-8 h-8 md:w-11 md:h-11 rounded-full bg-black/55 border border-white/10 hover:border-[#4ADE80] hover:bg-black text-white hover:text-[#4ADE80] flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-xs z-10"
          aria-label="Previous slide"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button 
          onClick={() => paginate(1)}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-8 h-8 md:w-11 md:h-11 rounded-full bg-black/55 border border-white/10 hover:border-[#4ADE80] hover:bg-black text-white hover:text-[#4ADE80] flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-xs z-10"
          aria-label="Next slide"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Bullet Slide Indicators (Dots) */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                onClick={() => {
                  const dir = index > activeIndex ? 1 : -1;
                  setPage([index, dir]);
                }}
                className="focus:outline-none p-1 cursor-pointer"
                aria-label={`Go to slide ${index + 1}`}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.25 : 1,
                    backgroundColor: isActive ? "#4ADE80" : "rgba(255, 255, 255, 0.2)"
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                  transition={{ duration: 0.2 }}
                />
              </button>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
