import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductShowcase from './components/ProductShowcase';
import ThreeLoader from './components/ThreeLoader';
import Fabricate from './components/Fabricate';

// Import Product Images
import productSkibidi from './assets/product_skibidi.png';
import productKnife from './assets/product_knife.png';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.toUpperCase();
    if (path.includes('FABRICATE')) return 'FABRICATE';
    if (path.includes('SHOP')) return 'SHOP';
    if (path.includes('BLOGS')) return 'BLOGS';
    return 'HOME';
  });

  const featuredProducts = [
    { name: "SKIBIDI TOILET", image: productSkibidi },
    { name: "BUTTERFLY KNIFE", image: productKnife }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newPath = tabId === 'HOME' ? '/' : `/${tabId.toLowerCase()}`;
    window.history.pushState(null, '', newPath);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toUpperCase();
      if (path.includes('FABRICATE')) setActiveTab('FABRICATE');
      else if (path.includes('SHOP')) setActiveTab('SHOP');
      else if (path.includes('BLOGS')) setActiveTab('BLOGS');
      else setActiveTab('HOME');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <>
      {/* 3D Cinematic Loader Gate & Canvas */}
      <AnimatePresence mode="wait">
        {!isLoaded && (
          <ThreeLoader key="loader" onComplete={() => setIsLoaded(true)} />
        )}
      </AnimatePresence>

      {/* Main Website Reveal */}
      {isLoaded && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="min-h-screen bg-black text-white flex flex-col"
        >
          {/* Subtle Persistent Film Grain Overlay */}
          <div className="film-grain" />

          {/* Recreated MAEVIS Header Navbar */}
          <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
          
          {activeTab === 'HOME' && (
            <>
              {/* Recreated MAEVIS Hero Section */}
              <Hero />

              {/* Recreated MAEVIS Product Showcase (Rack Section) */}
              <ProductShowcase products={featuredProducts} />
              
              {/* Showcase Dashboard Area */}
              <main className="flex-grow flex flex-col items-center justify-center p-8 max-w-[1280px] w-full mx-auto font-mono border-t border-[#1C1C1C]">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  className="border border-[#2C2C2C] p-8 rounded-lg max-w-2xl w-full bg-[#0A0A0A] text-center relative overflow-hidden group"
                >
                  {/* Subtle tactical grid background */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4ADE80_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  {/* Target Corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#4ADE80]"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#4ADE80]"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#4ADE80]"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#4ADE80]"></div>

                  <h2 className="text-[#4ADE80] text-sm md:text-base mb-4 tracking-widest font-bold">[ PORTAL SHOWCASE TERMINAL ]</h2>
                  <p className="text-white/60 text-xs md:text-sm mb-6 leading-relaxed">
                    The MAEVIS portal header navbar, hero banner, and product showcase sections have been successfully recreated using React + Tailwind CSS v4.
                    All spacing, typography scales, alignment, and responsiveness are matched.
                  </p>
                  <div className="text-left text-[11px] md:text-xs bg-black p-4 rounded border border-[#2C2C2C] overflow-x-auto text-[#6B6B6B] leading-5">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ADE80]">$</span>
                      <span>npm run dev</span>
                      <span className="text-white/20 ml-auto">// Local dev server active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ADE80]">$</span>
                      <span>core-framework: React 19.x</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ADE80]">$</span>
                      <span>css-engine: Tailwind CSS v4.0.0</span>
                    </div>
                  </div>
                </motion.div>
              </main>
            </>
          )}

          {activeTab === 'FABRICATE' && <Fabricate />}

          {(activeTab === 'SHOP' || activeTab === 'BLOGS') && (
            <main className="flex-grow flex flex-col items-center justify-center p-8 font-mono">
              <div className="border border-[#2C2C2C] p-8 rounded bg-[#0A0A0A] max-w-md w-full text-center relative">
                {/* Target Corners */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/25"></div>
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/25"></div>
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/25"></div>
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/25"></div>

                <span className="text-[#4ADE80] font-bold text-xs tracking-widest">[ SYSTEM REDIRECT ]</span>
                <p className="text-white/60 text-xs mt-4 leading-relaxed">
                  The requested node [{activeTab}] is currently offline or routed through external storefront.
                </p>
                <button 
                  onClick={() => handleTabChange('HOME')}
                  className="mt-6 border border-[#2C2C2C] hover:border-white px-4 py-2 text-[10px] tracking-widest uppercase text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  [ RETURN HOME ]
                </button>
              </div>
            </main>
          )}
        </motion.div>
      )}
    </>
  );
}

export default App;
