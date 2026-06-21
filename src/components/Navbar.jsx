import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AutoCroppedLogo from './AutoCroppedLogo';

export default function Navbar({ activeTab: propActiveTab, onTabChange }) {
  const [localActiveTab, setLocalActiveTab] = useState('HOME');

  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  const navItems = [
    { id: 'HOME', label: 'HOME', sub: '[ CHL::01 [RAAVH-H] ]' },
    { id: 'SHOP', label: 'SHOP', sub: '[ SEC::92 [RAAVH-S] ]' },
    { id: 'FABRICATE', label: 'FABRICATE', sub: '[ FBR::04 [RAAVH-F] ]' },
    { id: 'BLOGS', label: 'BLOGS', sub: '[ LOG::0:92 [RAAVH-B] ]' },
  ];

  return (
    <motion.header 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-black text-white font-mono border-b border-[#2C2C2C] select-none"
    >
      {/* Top Meta Bar */}
      <motion.div 
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="w-full border-b border-[#2C2C2C] py-1.5 px-4 md:px-8 flex justify-between items-center text-[10px] tracking-wider text-[#6B6B6B]"
      >
        <span>[ SYSTEM PORTAL // BBN OPERATING UNIT v.2026 [RAAVH-74] ]</span>
        <span className="hidden sm:inline">[ STATUS: ONLINE // SECURE CHANNEL ]</span>
      </motion.div>

      {/* Main Navbar Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-[240px_1fr_280px] min-h-[90px] border-b border-[#2C2C2C]">
        
        {/* Left Section: Brand Logo Identity */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 18 }}
          onClick={() => onTabChange && onTabChange('HOME')}
          className="flex items-center justify-center p-4 md:px-8 border-b md:border-b-0 md:border-r border-[#2C2C2C] relative group cursor-pointer"
        >
          {/* Logo Image */}
          <AutoCroppedLogo 
            src="/logo.png" 
            alt="MAEVIS Logo" 
            style={{ filter: 'invert(1)', height: '52px', width: 'auto' }} 
            className="select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
          />
        </motion.div>

        {/* Center Section: Main Interactive Navigation Tabs */}
        <div className="flex justify-center items-center py-6 md:py-0 border-b md:border-b-0 md:border-r border-[#2C2C2C]">
          <nav className="flex gap-6 sm:gap-12 md:gap-16">
            {navItems.map((item, idx) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + idx * 0.08, type: "spring", stiffness: 180, damping: 16 }}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  {/* Bracket Link */}
                  <span className="relative font-bold text-sm sm:text-base tracking-widest transition-colors duration-200">
                    <span className={`transition-transform duration-300 inline-block mr-1 ${isActive ? 'text-[#4ADE80] scale-110' : 'text-white/40 group-hover:text-white group-hover:translate-x-[-2px]'}`}>
                      [
                    </span>
                    <span className={`transition-colors duration-200 ${isActive ? 'text-[#4ADE80] text-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-white group-hover:text-[#4ADE80]'}`}>
                      {item.label}
                    </span>
                    <span className={`transition-transform duration-300 inline-block ml-1 ${isActive ? 'text-[#4ADE80] scale-110' : 'text-white/40 group-hover:text-white group-hover:translate-x-[2px]'}`}>
                      ]
                    </span>
                    
                    {/* Active Bullet Indicator */}
                    {isActive && (
                      <span className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 text-[6px] text-[#4ADE80] animate-pulse">
                        ●
                      </span>
                    )}
                  </span>
                  
                  {/* Metadata Tag */}
                  <span className={`text-[9px] mt-1.5 tracking-wider transition-colors duration-200 ${isActive ? 'text-[#4ADE80]/80' : 'text-[#6B6B6B] group-hover:text-white/60'}`}>
                    {item.sub}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: High-Tech Security & Status Panel */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 160, damping: 18 }}
          className="flex items-center justify-between sm:justify-end md:justify-center gap-6 p-4 md:p-0 md:px-6"
        >
          
          {/* Globe/Medallion Token Wrapper */}
          <div className="flex flex-col items-center gap-1">
            <div className="border border-[#2C2C2C] p-1.5 bg-[#0A0A0A] relative group">
              {/* Radar Globe SVG */}
              <svg className="w-10 h-10 text-white/80 group-hover:text-[#4ADE80] group-hover:rotate-45 transition-all duration-700 ease-out" viewBox="0 0 40 40" fill="none" stroke="currentColor">
                <circle cx="20" cy="20" r="18" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.3"/>
                <circle cx="20" cy="20" r="14" strokeWidth="1"/>
                <path d="M20 2v36M2 20h36" strokeWidth="0.75" opacity="0.6"/>
                <path d="M7 20c0-7.18 5.82-13 13-13s13 5.82 13 13-5.82 13-13 13-13-5.82-13-13z" strokeWidth="0.5" strokeDasharray="1 1"/>
                <circle cx="20" cy="20" r="6" strokeWidth="1" className="animate-pulse text-[#4ADE80]"/>
                <circle cx="20" cy="20" r="2" fill="currentColor"/>
              </svg>
            </div>
            
            {/* Status Icons */}
            <div className="flex gap-1.5 text-[9px] text-[#6B6B6B]">
              <span className="hover:text-[#4ADE80] cursor-pointer" title="Thermal status">☼</span>
              <span className="hover:text-[#4ADE80] cursor-pointer" title="Base terminal">☖</span>
              <span className="hover:text-[#4ADE80] cursor-pointer" title="Radiation status">☣</span>
            </div>
          </div>

          {/* Mini Dot Status light column */}
          <div className="flex flex-col gap-1 border-l border-r border-[#2C2C2C] px-3 py-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]"></span>
              <span className="text-[8px] text-[#6B6B6B] scale-90">SYS_A</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]"></span>
              <span className="text-[8px] text-[#6B6B6B] scale-90">SYS_B</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308] shadow-[0_0_6px_#EAB308] animate-pulse"></span>
              <span className="text-[8px] text-[#6B6B6B] scale-90">SYS_C</span>
            </div>
          </div>

          {/* Barcode & Mini QR Panel */}
          <div className="flex flex-col items-end gap-1 font-mono">
            {/* Barcode SVG */}
            <div className="text-white/60">
              <svg className="w-20 h-4" viewBox="0 0 100 20" fill="currentColor">
                <rect x="0" width="3" height="20" />
                <rect x="5" width="1" height="20" />
                <rect x="8" width="2" height="20" />
                <rect x="12" width="4" height="20" />
                <rect x="18" width="1" height="20" />
                <rect x="21" width="3" height="20" />
                <rect x="26" width="2" height="20" />
                <rect x="30" width="1" height="20" />
                <rect x="33" width="5" height="20" />
                <rect x="40" width="2" height="20" />
                <rect x="44" width="1" height="20" />
                <rect x="47" width="3" height="20" />
                <rect x="52" width="4" height="20" />
                <rect x="58" width="1" height="20" />
                <rect x="61" width="2" height="20" />
                <rect x="65" width="2" height="20" />
                <rect x="69" width="3" height="20" />
                <rect x="74" width="1" height="20" />
                <rect x="77" width="5" height="20" />
                <rect x="84" width="2" height="20" />
                <rect x="88" width="1" height="20" />
                <rect x="91" width="3" height="20" />
                <rect x="96" width="4" height="20" />
              </svg>
            </div>
            
            {/* QR block metadata */}
            <div className="flex gap-2 items-center">
              <span className="text-[8px] text-[#6B6B6B] leading-none">ID: 41-04-26</span>
              
              {/* QR Mini Graphic */}
              <div className="border border-[#2C2C2C] p-0.5 bg-white">
                <svg className="w-6 h-6 text-black" viewBox="0 0 25 25" fill="currentColor">
                  <rect x="0" y="0" width="7" height="7" />
                  <rect x="1" y="1" width="5" height="5" fill="white" />
                  <rect x="2" y="2" width="3" height="3" />
                  
                  <rect x="18" y="0" width="7" height="7" />
                  <rect x="19" y="1" width="5" height="5" fill="white" />
                  <rect x="20" y="2" width="3" height="3" />
                  
                  <rect x="0" y="18" width="7" height="7" />
                  <rect x="1" y="19" width="5" height="5" fill="white" />
                  <rect x="2" y="20" width="3" height="3" />
                  
                  <rect x="9" y="0" width="2" height="2" />
                  <rect x="13" y="1" width="1" height="3" />
                  <rect x="15" y="3" width="2" height="1" />
                  <rect x="10" y="5" width="3" height="2" />
                  <rect x="9" y="9" width="2" height="2" />
                  <rect x="14" y="8" width="3" height="1" />
                  <rect x="12" y="12" width="2" height="2" fill="#4ADE80" />
                  <rect x="19" y="9" width="1" height="3" />
                  <rect x="22" y="11" width="2" height="2" />
                  <rect x="8" y="14" width="2" height="3" />
                  <rect x="11" y="18" width="3" height="2" />
                  <rect x="16" y="15" width="2" height="2" />
                  <rect x="15" y="19" width="1" height="4" />
                  <rect x="20" y="18" width="3" height="1" />
                  <rect x="19" y="21" width="2" height="3" />
                </svg>
              </div>
            </div>
          </div>

        </motion.div>

      </div>
    </motion.header>
  );
}
