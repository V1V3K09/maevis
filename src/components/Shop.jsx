import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Shop({ products = [] }) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [materials, setMaterials] = useState({}); // productId -> selectedMaterial
  const [colorsState, setColorsState] = useState({}); // productId -> selectedColor
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS
  const [checkoutLogs, setCheckoutLogs] = useState([]);
  const [successOrderId, setSuccessOrderId] = useState('');

  const materialSpecs = {
    PLA: { costMultiplier: 1.0, label: 'PLA (Standard)' },
    PETG: { costMultiplier: 1.2, label: 'PETG (Durable)' },
    TPU: { costMultiplier: 1.5, label: 'TPU (Flexible)' }
  };

  const colors = {
    'MATTE BLACK': { hex: '#111111', label: 'MATTE BLACK' },
    'STEEL GRAY': { hex: '#555555', label: 'STEEL GRAY' },
    'SIGNAL WHITE': { hex: '#EEEEEE', label: 'SIGNAL WHITE' },
    'NEON GREEN': { hex: '#4ADE80', label: 'NEON GREEN' },
    'CYBER ORANGE': { hex: '#F97316', label: 'CYBER ORANGE' },
    'COBALT BLUE': { hex: '#2563EB', label: 'COBALT BLUE' }
  };

  // Build full product list with mock metadata
  const shopProducts = useMemo(() => {
    return products.map((prod) => {
      const isSkibidi = prod.name.includes("SKIBIDI");
      return {
        id: isSkibidi ? "skibidi-toilet" : "butterfly-knife",
        name: prod.name,
        image: prod.image,
        basePrice: isSkibidi ? 599 : 899,
        category: isSkibidi ? "EXCLUSIVES" : "TOYS & UTILITIES",
        description: isSkibidi 
          ? "Brutalist meme art piece, fully detailed with interior sewage pipeline simulation. Hand-finished matte surface."
          : "Functional replica with smooth print-in-place linkages. Fully balanced for trick simulation. No sharp edges.",
        specifications: isSkibidi ? {
          dimensions: "85mm x 90mm x 110mm",
          weight: "145g",
          printTime: "4h 20m",
          resolution: "0.12mm (Ultra Detail)"
        } : {
          dimensions: "120mm x 25mm x 12mm (Folded)",
          weight: "65g",
          printTime: "2h 45m",
          resolution: "0.20mm (Standard)"
        },
        stock: isSkibidi ? 4 : 7
      };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return shopProducts;
    return shopProducts.filter(p => p.category === selectedCategory);
  }, [shopProducts, selectedCategory]);

  const getProductPrice = (product, material) => {
    const selectedMat = material || 'PLA';
    const multiplier = materialSpecs[selectedMat]?.costMultiplier || 1.0;
    return Math.round(product.basePrice * multiplier);
  };

  const handleMaterialChange = (productId, material) => {
    setMaterials(prev => ({
      ...prev,
      [productId]: material
    }));
  };

  const handleColorChange = (productId, color) => {
    setColorsState(prev => ({
      ...prev,
      [productId]: color
    }));
  };

  const addToCart = (product) => {
    const material = materials[product.id] || 'PLA';
    const color = colorsState[product.id] || 'MATTE BLACK';
    const price = getProductPrice(product, material);
    
    setCart(prev => {
      // Check if item with same material and color already in cart
      const existingIdx = prev.findIndex(item => item.id === product.id && item.material === material && item.color === color);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1
        };
        return next;
      }
      return [...prev, { ...product, material, color, price, quantity: 1 }];
    });
    
    setIsCartOpen(true);
    
    // Play confirmation beep
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}
    }
  };

  const updateQuantity = (itemId, material, color, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId && item.material === material && item.color === color) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStatus('PROCESSING');
    setCheckoutLogs([]);
    
    const logs = [
      'ESTABLISHING LINK TO MANUFACTURING CORE...',
      'ALLOCATING FILAMENT STOCK...',
      'VERIFYING PRINTER ARRAY STATUS [D9-ARMED: ONLINE]...',
      'TRANSMITTING G-CODE METADATA...',
      'BATCH FABRICATION QUEUED SUCCESSFULLY.'
    ];

    let delay = 0;
    logs.forEach((log, index) => {
      setTimeout(() => {
        setCheckoutLogs(prev => [...prev, `>> ${log}`]);
        if (index === logs.length - 1) {
          setTimeout(() => {
            const orderId = `MVC-${Math.floor(100000 + Math.random() * 900000)}`;
            setSuccessOrderId(orderId);
            setCheckoutStatus('SUCCESS');
            setCart([]);
          }, 600);
        }
      }, delay);
      delay += 400 + Math.random() * 200;
    });
  };

  return (
    <div className="flex-grow bg-black text-white font-mono select-none px-4 md:px-8 py-6 max-w-[1280px] w-full mx-auto relative">
      {/* Background grid markings */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Header telemetry info */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2C2C2C] pb-4 mb-8 text-[10px] text-[#6B6B6B] tracking-wider relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_4px_#4ADE80] animate-pulse"></span>
          <span className="text-[#BEBEBE] font-bold">[ MAEVIS SUPPLIES // INDUSTRIAL DISPATCH ]</span>
        </div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span>[ DEPOT : NOIDA-MAIN ]</span>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="text-[#4ADE80] font-bold hover:underline cursor-pointer"
          >
            [ QUEUE DRAWER: {cart.reduce((s, i) => s + i.quantity, 0)} ITEMS ]
          </button>
        </div>
      </div>

      {/* Monumental header */}
      <div className="mb-10 text-left relative z-10 max-w-2xl">
        <span className="text-[10px] text-[#6B6B6B] tracking-widest font-bold block mb-1">
          [ DEPT-92 // PHYSICAL ARTIFACT DISTRIBUTION ]
        </span>
        <h1 className="font-display font-black text-5xl sm:text-6xl md:text-8xl tracking-tight text-white leading-none uppercase mb-4">
          WORKSHOP<span className="text-[#4ADE80]">.</span>
        </h1>
        <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-md">
          Small batch physical prints. Fabricated on-demand in dense polymers or high-resolution resin cores. Hand-finished, vacuum-sealed, and shipped.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 relative z-10 border-b border-[#2C2C2C] pb-4">
        {['ALL', 'EXCLUSIVES', 'TOYS & UTILITIES'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-[10px] tracking-widest font-bold border transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'border-[#4ADE80] text-[#4ADE80] bg-[#4ADE80]/5'
                : 'border-[#2C2C2C] text-[#6B6B6B] hover:text-white hover:border-white/50 bg-[#080808]'
            }`}
          >
            [{cat}]
          </button>
        ))}
      </div>

      {/* Product List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 mb-16">
        {filteredProducts.map((product) => {
          const currentMat = materials[product.id] || 'PLA';
          const price = getProductPrice(product, currentMat);
          
          return (
            <div 
              key={product.id}
              className="border border-[#2C2C2C] bg-[#050505] p-5 rounded-lg flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-[#4ADE80] transition-colors duration-300"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#2C2C2C] group-hover:border-[#4ADE80] transition-colors duration-300"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2C2C2C] group-hover:border-[#4ADE80] transition-colors duration-300"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2C2C2C] group-hover:border-[#4ADE80] transition-colors duration-300"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#2C2C2C] group-hover:border-[#4ADE80] transition-colors duration-300"></div>

              {/* Product Visual */}
              <div className="w-full md:w-[220px] aspect-square bg-[#0a0a0a] border border-[#1C1C1C] rounded flex items-center justify-center p-4 relative group-hover:border-[#4ADE80]/20 transition-colors duration-300">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="max-h-[85%] max-w-[85%] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 text-[8px] text-[#6B6B6B]">[ CAT-NUM // {product.id.slice(0,4).toUpperCase()} ]</div>
              </div>

              {/* Product Info details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold text-sm tracking-wider uppercase group-hover:text-[#4ADE80] transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-[9px] text-[#6B6B6B] border border-[#2C2C2C] px-1.5 py-0.5 rounded">
                      STOCK: {product.stock}
                    </span>
                  </div>

                  <p className="text-white/60 text-[10px] leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Specifications table */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] text-[#6B6B6B] border-t border-[#1C1C1C] pt-3 mb-4 font-mono">
                    <div>DIMENSIONS: <span className="text-white/80">{product.specifications.dimensions}</span></div>
                    <div>WEIGHT: <span className="text-white/80">{product.specifications.weight}</span></div>
                    <div>BUILD TIME: <span className="text-white/80">{product.specifications.printTime}</span></div>
                    <div>RESOLUTION: <span className="text-white/80">{product.specifications.resolution}</span></div>
                  </div>
                </div>

                {/* Material select and Add to Cart */}
                <div className="border-t border-[#1C1C1C] pt-4 mt-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-[#6B6B6B] tracking-widest font-bold">MATERIAL COMPILE:</span>
                    <select
                      value={currentMat}
                      onChange={(e) => handleMaterialChange(product.id, e.target.value)}
                      className="bg-[#0A0A0A] text-white border border-[#2C2C2C] text-[9px] px-2 py-1 outline-none cursor-pointer hover:border-white focus:border-[#4ADE80]"
                    >
                      {Object.keys(materialSpecs).map((mat) => (
                        <option key={mat} value={mat}>
                          {materialSpecs[mat].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] text-[#6B6B6B] tracking-widest font-bold">COLOR SCHEME:</span>
                    <select
                      value={colorsState[product.id] || 'MATTE BLACK'}
                      onChange={(e) => handleColorChange(product.id, e.target.value)}
                      className="bg-[#0A0A0A] text-white border border-[#2C2C2C] text-[9px] px-2 py-1 outline-none cursor-pointer hover:border-white focus:border-[#4ADE80]"
                    >
                      {Object.keys(colors).map((colorKey) => (
                        <option key={colorKey} value={colorKey}>
                          {colors[colorKey].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-2xl font-bold text-[#4ADE80] font-display">
                      ₹{price}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="border border-[#4ADE80] bg-[#4ADE80]/5 text-[#4ADE80] hover:bg-[#4ADE80] hover:text-black transition-all px-4 py-2 text-[10px] tracking-widest font-bold uppercase cursor-pointer"
                    >
                      [ QUEUE PRINT ]
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Order Drawer (Right Sidebar Panel) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-[200]"
            />
            {/* Sidebar Panel Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#050505] border-l border-[#2C2C2C] z-[201] p-4 sm:p-6 flex flex-col justify-between font-mono text-white shadow-2xl"
            >
              {/* Corner decor */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#2C2C2C]"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2C2C2C]"></div>

              <div>
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#2C2C2C] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></span>
                    <span className="text-xs font-bold tracking-widest">[ DISPATCH QUEUE CHAMBER ]</span>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-[#6B6B6B] hover:text-white text-[10px] tracking-wider font-bold cursor-pointer"
                  >
                    [ CLOSE ]
                  </button>
                </div>

                {/* Cart Items list */}
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-[#6B6B6B] text-xs">
                    [ DISPATCH CHAMBER IS EMPTY ]
                    <p className="mt-2 text-[10px] opacity-60">Add items to queue fabrication.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {cart.map((item, idx) => (
                      <div 
                        key={`${item.id}-${item.material}-${item.color}`}
                        className="border border-[#1C1C1C] bg-[#0A0A0A] p-3 rounded flex justify-between relative"
                      >
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-white block mb-0.5 tracking-wider uppercase">
                            {item.name}
                          </span>
                          <span className="text-[8px] text-[#4ADE80] tracking-widest font-bold uppercase block mb-1">
                            [{item.material} // {item.color}]
                          </span>
                          <span className="text-xs font-bold text-white/80">
                            ₹{item.price}
                          </span>
                        </div>

                        <div className="flex flex-col justify-between items-end">
                          <button
                            onClick={() => updateQuantity(item.id, item.material, item.color, -item.quantity)}
                            className="text-red-500 hover:text-red-400 text-[8px] tracking-widest uppercase cursor-pointer"
                          >
                            [ REMOVE ]
                          </button>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.material, item.color, -1)}
                              className="w-5 h-5 border border-[#2C2C2C] hover:border-white flex items-center justify-center text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-[10px] w-4 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.material, item.color, 1)}
                              className="w-5 h-5 border border-[#2C2C2C] hover:border-white flex items-center justify-center text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals and Checkout CTA */}
              {cart.length > 0 && (
                <div className="border-t border-[#2C2C2C] pt-4 mt-6 bg-[#050505]">
                  <div className="flex justify-between items-center mb-4 text-[10px] tracking-widest text-[#6B6B6B] font-bold">
                    <span>QUEUE TOTAL</span>
                    <span className="text-white text-lg font-display font-black">₹{cartTotal}</span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full border border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80] hover:bg-[#4ADE80] hover:text-black transition-all py-3.5 text-xs font-bold tracking-[0.2em] uppercase cursor-pointer"
                  >
                    [ INITIATE BATCH FABRICATION ]
                  </button>
                  <p className="text-[8px] text-[#6B6B6B] text-center mt-2 uppercase tracking-wide">
                    Transmits specs straight to D9 printer matrix.
                  </p>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Interactive Checkout Modal (Simulating order processing) */}
      <AnimatePresence>
        {checkoutStatus !== 'IDLE' && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4 font-mono text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border border-[#2C2C2C] bg-[#0A0A0A] p-6 rounded-lg max-w-md w-full relative overflow-hidden"
            >
              {/* Corners */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#4ADE80]"></div>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#2C2C2C]"></div>
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#2C2C2C]"></div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#2C2C2C]"></div>

              {checkoutStatus === 'PROCESSING' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#2C2C2C] pb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">[ COMPILING TOOLPATHS ]</span>
                  </div>
                  
                  <div className="h-[150px] overflow-y-auto text-[10px] text-[#6B6B6B] space-y-1.5 font-mono leading-relaxed">
                    {checkoutLogs.map((log, idx) => (
                      <div key={idx} className={idx === checkoutLogs.length - 1 ? 'text-[#4ADE80] font-bold' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>

                  <div className="text-[8px] text-[#6B6B6B] text-center pt-2">
                    COMMUNICATION ENCRYPTED // DEPOT-D9
                  </div>
                </div>
              )}

              {checkoutStatus === 'SUCCESS' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] mx-auto shadow-[0_0_8px_#4ADE80]"></div>
                  <h3 className="text-xs font-bold text-[#4ADE80] tracking-[0.25em] uppercase">
                    [ BATCH TRANSMISSION COMPLETE ]
                  </h3>
                  
                  <p className="text-[10px] text-white/60 leading-relaxed max-w-xs mx-auto">
                    Toolpaths successfully compiled and locked. Batch manufacturing is now active at assembly depot D9-ARMED.
                  </p>

                  <div className="border border-dashed border-[#2C2C2C] p-3 rounded bg-black inline-block text-[10px] tracking-widest text-[#4ADE80] font-bold">
                    ORDER KEY: {successOrderId}
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutStatus('IDLE');
                      setIsCartOpen(false);
                    }}
                    className="mt-6 border border-[#4ADE80] bg-[#4ADE80]/5 hover:bg-[#4ADE80] hover:text-black text-[#4ADE80] transition-all px-6 py-2 text-[10px] tracking-widest font-bold uppercase cursor-pointer"
                  >
                    [ RETURN TO RACK ]
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
