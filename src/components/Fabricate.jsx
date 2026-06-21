import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// ========================================================
// 1. Procedural Filament wrapping simulation component
// ========================================================
function FilamentParticles({ printProgress, isPrinting, boundingBox }) {
  const pointsRef = useRef();
  const particleCount = 180;
  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current || !isPrinting) return;
    const time = state.clock.getElapsedTime();
    const minY = boundingBox ? boundingBox.min.y : -0.6;
    const maxY = boundingBox ? boundingBox.max.y : 0.6;
    
    // Don't show particles if printing hasn't started or already finished
    if (printProgress <= minY + 0.01 || printProgress >= maxY - 0.01) {
      pointsRef.current.visible = false;
      return;
    }
    pointsRef.current.visible = true;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Spiral winding pattern
      const angle = (i / particleCount) * Math.PI * 2 * 8 + time * 6;
      const radius = (boundingBox ? (boundingBox.max.x - boundingBox.min.x) * 0.75 : 0.8) + Math.sin(time * 3 + i) * 0.08;

      positions[idx] = Math.cos(angle) * radius;
      // Position particles exactly at the current print layer height
      positions[idx + 1] = printProgress + (Math.sin(time * 15 + i) * 0.03);
      positions[idx + 2] = Math.sin(angle) * radius;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#4ADE80"
        size={0.032}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ========================================================
// 2. Custom Shader Material for Layer Clipping View
// ========================================================
const LayerShaderMaterial = {
  uniforms: {
    uPrintProgress: { value: 1.5 },
    uColor: { value: new THREE.Color('#4ADE80') },
  },
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uPrintProgress;
    uniform vec3 uColor;
    varying vec3 vPosition;

    // Simple GLSL fract / mod helper
    void main() {
      // Discard layers above the print nozzle progress height
      if (vPosition.y > uPrintProgress) {
        discard;
      }

      // Create horizontal micro-stripes (layer visual lines)
      float stripes = step(0.9, fract(vPosition.y * 35.0));
      
      // Blend base green glow with bright stripe highlights
      vec3 color = uColor * (0.2 + 0.8 * stripes);
      gl_FragColor = vec4(color, 0.9);
    }
  `
};

// ========================================================
// 3. 3D Model Mesh Renderer Component
// ========================================================
function ModelMesh({ geometry, viewMode, printProgress, boundingBox }) {
  const shaderRef = useRef();

  // Create or update shader uniforms
  useEffect(() => {
    if (viewMode === 'LAYER') {
      shaderRef.current = new THREE.ShaderMaterial({
        uniforms: {
          uPrintProgress: { value: printProgress },
          uColor: { value: new THREE.Color('#4ADE80') },
        },
        vertexShader: LayerShaderMaterial.vertexShader,
        fragmentShader: LayerShaderMaterial.fragmentShader,
        side: THREE.DoubleSide
      });
    }
  }, [viewMode]);

  // Update printing progress height in shader
  useFrame(() => {
    if (viewMode === 'LAYER' && shaderRef.current) {
      shaderRef.current.uniforms.uPrintProgress.value = printProgress;
    }
  });

  if (viewMode === 'WIREFRAME') {
    return (
      <mesh geometry={geometry}>
        <lineBasicMaterial attach="material" color="#4ADE80" opacity={0.35} transparent />
      </mesh>
    );
  }

  if (viewMode === 'LAYER') {
    return shaderRef.current ? (
      <mesh geometry={geometry}>
        <primitive object={shaderRef.current} attach="material" />
      </mesh>
    ) : null;
  }

  // viewMode === 'FINAL' (Solid metallic/textured print)
  return (
    <group>
      {/* Base printed object */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#141414"
          roughness={0.45}
          metalness={0.8}
          bumpScale={0.05}
        />
      </mesh>
      {/* Inner glowing core details */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#4ADE80"
          emissive="#4ADE80"
          emissiveIntensity={0.1}
          wireframe
          opacity={0.08}
          transparent
        />
      </mesh>
    </group>
  );
}

// ========================================================
// 4. Main FABRICATE Component
// ========================================================
export default function Fabricate() {
  const [status, setStatus] = useState('IDLE'); // IDLE, ANALYZING, PRINTING, COMPLETE
  const [viewMode, setViewMode] = useState('FINAL'); // WIREFRAME, LAYER, FINAL
  const [selectedMaterial, setSelectedMaterial] = useState('PLA');
  const [fileName, setFileName] = useState('');
  const [analysisLogs, setAnalysisLogs] = useState([]);
  
  // Diagnostic state numbers (animate individually)
  const [volume, setVolume] = useState(0);
  const [surfaceArea, setSurfaceArea] = useState(0);
  const [weight, setWeight] = useState(0);
  const [layers, setLayers] = useState(0);
  const [printTime, setPrintTime] = useState({ hours: 0, mins: 0 });
  const [estimatePrice, setEstimatePrice] = useState(0);

  // 3D Geometry States
  const [uploadedGeometry, setUploadedGeometry] = useState(null);
  const [printProgress, setPrintProgress] = useState(1.5);
  const isPrinting = useRef(false);

  // Bounding box storage to adjust particle system dynamically
  const [boundingBox, setBoundingBox] = useState(null);
  const printProgressRef = useRef(0);
  const fileInputRef = useRef();

  // Order panel arming
  const [isArmed, setIsArmed] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Default structural mechanical gear-token
  const defaultGeometry = useMemo(() => {
    const geom = new THREE.TorusKnotGeometry(0.55, 0.18, 120, 16);
    geom.computeBoundingBox();
    return geom;
  }, []);

  const activeGeometry = uploadedGeometry || defaultGeometry;

  // Track bounding box changes
  useEffect(() => {
    if (activeGeometry) {
      activeGeometry.computeBoundingBox();
      setBoundingBox(activeGeometry.boundingBox);
      // Reset progress to top if not currently printing
      if (status !== 'PRINTING') {
        setPrintProgress(activeGeometry.boundingBox.max.y + 0.1);
      }
    }
  }, [activeGeometry, status]);

  // Materials setup
  const materials = {
    PLA: { strength: '60%', detail: '85%', durability: '50%', speed: '90%', cost: 1.2 },
    PETG: { strength: '78%', detail: '75%', durability: '75%', speed: '75%', cost: 1.6 },
    ABS: { strength: '85%', detail: '70%', durability: '90%', speed: '65%', cost: 1.8 },
    RESIN: { strength: '45%', detail: '99%', durability: '40%', speed: '40%', cost: 2.8 }
  };

  // Drag and Drop files
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Parse uploaded 3D file buffer
  const processFile = (file) => {
    const name = file.name.toUpperCase();
    const extension = name.split('.').pop();
    if (!['STL', 'OBJ', '3MF'].includes(extension)) {
      alert('[ ERROR : UNSUPPORTED FORMAT. SYSTEM REQUIRES STL, OBJ, OR 3MF ]');
      return;
    }

    setFileName(file.name);
    setStatus('ANALYZING');
    setAnalysisLogs([]);
    setUploadedGeometry(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(buffer);
        geometry.center();
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();

        // Run sequential telemetry logs
        runAnalysisTelemetry(() => {
          setUploadedGeometry(geometry);
          triggerPrintingAnimation(geometry);
        });
      } catch (err) {
        setAnalysisLogs(prev => [...prev, `[ FAIL ] GEOMETRY CORRUPTION DETECTED. RETRY.`]);
        setStatus('IDLE');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Sequential terminal printing logs
  const runAnalysisTelemetry = (callback) => {
    const logs = [
      'INITIALIZING PARSING ENGINE...',
      'READING VERTEX ARRAY BUFFER...',
      'INTERPOLATING GRAPHICS INDICES...',
      'CALCULATING BOUNDING HULL & VOLUME...',
      'GENERATING PROCEDURAL TOOLPATHS...',
      'OPTIMIZING EXTRUDER MOTION VECTORS...',
      'COMPILATION COMPLETE: GEOMETRY PARSED SUCCESSFULLY.'
    ];

    let delay = 0;
    logs.forEach((log, index) => {
      setTimeout(() => {
        setAnalysisLogs(prev => [...prev, `[ OK ] ${log}`]);
        if (index === logs.length - 1) {
          setTimeout(callback, 500);
        }
      }, delay);
      delay += 350 + Math.random() * 250;
    });
  };

  // Layer-by-layer materialization simulation
  const triggerPrintingAnimation = (geom) => {
    setStatus('PRINTING');
    setViewMode('LAYER');
    isPrinting.current = true;

    geom.computeBoundingBox();
    const minY = geom.boundingBox.min.y;
    const maxY = geom.boundingBox.max.y;

    // Reset progress to bottom
    setPrintProgress(minY);
    printProgressRef.current = minY;

    // Set mock dimensions for report based on geometry scale
    const volumeVal = Math.round(15000 + Math.random() * 45000); // mm3
    const surfaceVal = Math.round(5000 + Math.random() * 15000); // mm2
    const baseWeight = Math.round((volumeVal / 1000) * 1.25); // grams (approx PLA density)
    const layerCount = Math.round((maxY - minY) * 150); // mock layers (0.2mm layer height)
    const printTimeMins = Math.round(80 + Math.random() * 220);

    // Dynamic price calculation
    const basePrice = Math.round(150 + (volumeVal / 100) * materials[selectedMaterial].cost);

    // Animate diagnostic values wrapping up
    gsap.to({ val: 0 }, {
      val: volumeVal,
      duration: 3.5,
      onUpdate: function () { setVolume(Math.round(this.targets()[0].val)); }
    });
    gsap.to({ val: 0 }, {
      val: surfaceVal,
      duration: 3.5,
      onUpdate: function () { setSurfaceArea(Math.round(this.targets()[0].val)); }
    });
    gsap.to({ val: 0 }, {
      val: baseWeight,
      duration: 3.5,
      onUpdate: function () { setWeight(Math.round(this.targets()[0].val)); }
    });
    gsap.to({ val: 0 }, {
      val: layerCount,
      duration: 3.5,
      onUpdate: function () { setLayers(Math.round(this.targets()[0].val)); }
    });
    gsap.to({ val: 0 }, {
      val: printTimeMins,
      duration: 3.5,
      onUpdate: function () {
        const t = Math.round(this.targets()[0].val);
        setPrintTime({ hours: Math.floor(t / 60), mins: t % 60 });
      }
    });

    // Animate final price ticker
    gsap.to({ val: 0 }, {
      val: basePrice,
      duration: 4.0,
      ease: "power2.out",
      onUpdate: function () {
        setEstimatePrice(Math.round(this.targets()[0].val));
      }
    });

    // Animate cutting plane rise (printing)
    gsap.to(printProgressRef, {
      current: maxY + 0.05,
      duration: 4.2,
      ease: "power1.inOut",
      onUpdate: () => {
        setPrintProgress(printProgressRef.current);
      },
      onComplete: () => {
        isPrinting.current = false;
        setStatus('COMPLETE');
        setViewMode('FINAL');
      }
    });
  };

  // Re-calculate price on material modification
  useEffect(() => {
    if (status === 'COMPLETE' || status === 'IDLE') {
      const baseVol = volume || 24500;
      const calculatedPrice = Math.round(150 + (baseVol / 100) * materials[selectedMaterial].cost);
      gsap.to({ val: estimatePrice }, {
        val: calculatedPrice,
        duration: 0.8,
        ease: "power1.out",
        onUpdate: function () {
          setEstimatePrice(Math.round(this.targets()[0].val));
        }
      });
    }
  }, [selectedMaterial]);

  const handleOrderSubmit = () => {
    if (status !== 'COMPLETE') return;
    setOrderPlaced(true);
    // Play structural mechanical sound beep/hum
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {}
    }
  };

  // Helper values for report if idle
  const displayVolume = volume || '---';
  const displaySurface = surfaceArea || '---';
  const displayWeight = weight ? `${weight}g` : '---';
  const displayLayers = layers || '---';
  const displayTime = printTime.hours || printTime.mins ? `${printTime.hours}h ${printTime.mins}m` : '---';

  return (
    <div className="flex-grow bg-black text-white font-mono select-none px-4 md:px-8 py-6 max-w-[1280px] w-full mx-auto relative">
      {/* Tactical grid background lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* 1. Header Navigation System Telemetry */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2C2C2C] pb-4 mb-8 text-[10px] text-[#6B6B6B] tracking-wider relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_4px_#4ADE80] animate-pulse"></span>
          <span className="text-[#BEBEBE] font-bold">[ DIGITAL FOUNDRY // CUSTOM FABRICATION DIVISION ]</span>
        </div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span>[ BATCH : FBR-26.09 ]</span>
          <span>[ PRINTER : D9-ARMED ]</span>
          <span className="text-[#4ADE80] font-bold">
            {status === 'IDLE' && '[ STATUS : READY ]'}
            {status === 'ANALYZING' && '[ STATUS : ANALYSIS MODE ]'}
            {status === 'PRINTING' && '[ STATUS : PRINTING LAYER ]'}
            {status === 'COMPLETE' && '[ STATUS : VALIDATED ]'}
          </span>
        </div>
      </div>

      {/* 2. Hero Section */}
      <div className="mb-10 text-left relative z-10 max-w-2xl">
        <span className="text-[10px] text-[#6B6B6B] tracking-widest font-bold block mb-1">
          [ SUB-LEVEL PORTAL // SECRET SECTOR FBR ]
        </span>
        <h1 className="font-display font-black text-6xl md:text-8xl tracking-tight text-white leading-none uppercase mb-4">
          FABRICATE<span className="text-[#4ADE80]">.</span>
        </h1>
        <div className="text-white/60 text-xs md:text-sm leading-relaxed space-y-1 max-w-md mb-4">
          <p>Upload your design.</p>
          <p>Receive a manufacturing estimate.</p>
          <p>Transform digital concepts into physical objects.</p>
        </div>
        <div className="text-[9px] text-[#6B6B6B] tracking-widest inline-block border border-[#2C2C2C] px-2 py-0.5 bg-[#080808]">
          SUPPORTED FILE NODES : [ STL • OBJ • 3MF ]
        </div>
      </div>

      {/* 3. Main Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-start">
        
        {/* ========================================================
            LEFT COLUMN : Viewer, Telemetry Console, Materials
           ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* 3D Model Viewer Chamber */}
          <div className="w-full border border-[#2C2C2C] bg-[#050505] rounded-lg overflow-hidden relative group">
            {/* HUD overlays inside the viewer */}
            <div className="absolute top-4 left-4 z-20 text-[9px] text-[#6B6B6B] flex flex-col gap-0.5">
              <span>[ VIEWPORT CAMERA: DIAGNOSTIC ]</span>
              <span>GRID RANGE: [-2.5 // +2.5]</span>
            </div>
            
            {/* View Mode controls overlay */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {['WIREFRAME', 'LAYER', 'FINAL'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  disabled={status === 'ANALYZING'}
                  className={`px-2.5 py-1 text-[9px] tracking-wider font-bold border transition-colors cursor-pointer ${
                    viewMode === mode
                      ? 'border-[#4ADE80] text-[#4ADE80] bg-[#4ADE80]/5'
                      : 'border-[#2C2C2C] text-[#6B6B6B] hover:text-white hover:border-white/50 bg-[#080808]'
                  }`}
                >
                  [{mode}]
                </button>
              ))}
            </div>

            {/* Simulated 3D printer gantry laser sweep bar during printing */}
            {status === 'PRINTING' && (
              <div 
                className="absolute left-0 w-full h-[1.5px] bg-[#4ADE80] shadow-[0_0_8px_#4ADE80] pointer-events-none z-10 transition-all duration-75"
                style={{ 
                  bottom: `${((printProgress + 0.6) / 1.2) * 100}%` 
                }}
              />
            )}

            {/* Canvas Area */}
            <div className="w-full h-[320px] md:h-[400px]">
              <Canvas camera={{ position: [0, 1.2, 2.5], fov: 40 }} gl={{ antialias: true }}>
                <color attach="background" args={['#050505']} />
                
                {/* Tactical grid lights */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[1, 3, 2]} intensity={0.8} />
                <pointLight position={[0, -2, 0]} intensity={0.2} />
                
                {/* Subtle glowing printing spotlamp */}
                <spotLight 
                  position={[0, 3, 0]} 
                  angle={0.8} 
                  penumbra={1} 
                  intensity={1.8} 
                  color="#4ADE80" 
                />

                <Center>
                  <group rotation={[0.2, -0.6, 0]}>
                    <ModelMesh 
                      geometry={activeGeometry} 
                      viewMode={viewMode}
                      printProgress={printProgress}
                      boundingBox={boundingBox}
                    />
                    
                    {/* Active filament strands particle sweep */}
                    <FilamentParticles 
                      printProgress={printProgress}
                      isPrinting={isPrinting.current}
                      boundingBox={boundingBox}
                    />
                  </group>
                </Center>

                {/* Print bed grid line helpers */}
                <gridHelper args={[4, 16, '#222', '#111']} position={[0, -0.65, 0]} />
              </Canvas>
            </div>

            {/* Scanner texture filter overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]"></div>
          </div>

          {/* Diagnostic Telemetry Log (Analysis sequence readout) */}
          <div className="border border-[#2C2C2C] bg-[#0A0A0A] p-4 rounded-lg relative overflow-hidden">
            {/* Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#4ADE80]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2C2C2C]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2C2C2C]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#2C2C2C]"></div>
            
            <div className="text-[10px] text-[#BEBEBE] border-b border-[#2C2C2C] pb-2 mb-3 tracking-widest font-bold">
              [ TERMINAL ANALYSIS TELEMETRY ]
            </div>
            
            <div className="h-[120px] overflow-y-auto font-mono text-[9px] text-[#6B6B6B] space-y-1.5 pr-2 leading-relaxed">
              {status === 'IDLE' && (
                <div className="text-white/30 italic">[ STANDBY : WAITING FOR DESIGN UPLOAD INTO INTAKE CHAMBER ]</div>
              )}
              {analysisLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={log.includes('[ FAIL ]') ? 'text-red-500' : log.includes('COMPLETE') ? 'text-[#4ADE80]' : 'text-white/70'}
                >
                  {log}
                </div>
              ))}
              {status === 'PRINTING' && (
                <div className="text-[#4ADE80] animate-pulse">
                  &gt;&gt; MANUFACTURING SEQUENCE ACTIVE... EXTRUDER HEIGHT: {printProgress.toFixed(3)}
                </div>
              )}
              {status === 'COMPLETE' && (
                <div className="text-[#4ADE80]">
                  &gt;&gt; VALIDATION COMPLETE. TOOLPATHS LOCKED. ESTIMATE VERIFIED.
                </div>
              )}
            </div>
          </div>

          {/* Classified Material Cards */}
          <div className="w-full">
            <div className="text-[10px] text-[#6B6B6B] tracking-widest font-bold mb-3 uppercase">
              [ SELECT CLASSIFIED MATERIAL STOCK ]
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.keys(materials).map((mat) => {
                const isActive = selectedMaterial === mat;
                const mInfo = materials[mat];
                return (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterial(mat)}
                    disabled={status === 'ANALYZING'}
                    className={`border text-left p-3 rounded-lg relative overflow-hidden transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'border-[#4ADE80] bg-[#4ADE80]/5 text-white' 
                        : 'border-[#2C2C2C] bg-[#050505] text-[#6B6B6B] hover:border-white/40 hover:bg-[#080808]'
                    }`}
                  >
                    {/* Corners */}
                    {isActive && (
                      <>
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#4ADE80]"></div>
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#4ADE80]"></div>
                      </>
                    )}
                    
                    <span className={`text-xs font-bold tracking-widest ${isActive ? 'text-[#4ADE80]' : 'text-white/80'}`}>
                      {mat}
                    </span>
                    
                    {/* Custom material specs list */}
                    <div className="text-[8px] mt-2.5 space-y-1 font-mono tracking-tighter">
                      <div className="flex justify-between">
                        <span>DETAIL:</span>
                        <span className={isActive ? 'text-white' : ''}>{mInfo.detail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>STRENGTH:</span>
                        <span className={isActive ? 'text-white' : ''}>{mInfo.strength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DURABILITY:</span>
                        <span className={isActive ? 'text-white' : ''}>{mInfo.durability}</span>
                      </div>
                    </div>
                    
                    <div className={`text-[7px] font-bold mt-3 tracking-widest border-t border-dashed pt-2 ${
                      isActive ? 'border-[#4ADE80]/30 text-[#4ADE80]' : 'border-[#2C2C2C] text-[#6B6B6B]'
                    }`}>
                      [ APPROVED ]
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ========================================================
            RIGHT COLUMN : Upload Chamber, Reports, Order CTA
           ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          
          {/* Custom Fabrication Intake Chamber (Upload Area) */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={status === 'ANALYZING' ? null : triggerFileInput}
            className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 bg-[#050505] relative ${
              status === 'ANALYZING' 
                ? 'border-[#2C2C2C] opacity-60 cursor-not-allowed' 
                : 'border-[#2C2C2C] hover:border-[#4ADE80] hover:bg-[#4ADE80]/5'
            }`}
          >
            {/* Custom file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".stl,.obj,.3mf" 
              className="hidden" 
            />

            {/* Corner Bracket decorations */}
            <div className="absolute top-2 left-2 text-[8px] text-[#6B6B6B] font-bold">[ INPUT NODE ]</div>
            <div className="absolute top-2 right-2 text-[8px] text-[#6B6B6B] font-bold">[ FAB-01 ]</div>

            <div className="py-6 flex flex-col items-center justify-center">
              {/* Glowing Laser Scanner Intake Icon */}
              <div className="relative mb-3">
                <svg className={`w-12 h-12 ${status === 'PRINTING' ? 'text-[#4ADE80]' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {/* Green Laser line animating down */}
                <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-[#4ADE80] shadow-[0_0_6px_#4ADE80] animate-bounce"></div>
              </div>
              
              <span className="text-sm font-bold tracking-widest text-white uppercase block mb-1">
                {fileName ? fileName : 'DROP FILE'}
              </span>
              
              <span className="text-[9px] text-[#6B6B6B] tracking-wider uppercase block">
                {fileName ? '[ DETECTED // TAP TO SWAP ]' : 'SUPPORTED FORMATS : STL, OBJ, 3MF'}
              </span>
            </div>
          </div>

          {/* Fabrication Report diagnostic panel */}
          <div className="border border-[#2C2C2C] bg-[#0A0A0A] p-5 rounded-lg relative overflow-hidden">
            {/* Diagnostic panel frame markings */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#2C2C2C]/30 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#2C2C2C]/30 pointer-events-none"></div>

            <div className="text-[10px] text-[#BEBEBE] border-b border-[#2C2C2C] pb-3 mb-4 tracking-widest font-bold flex justify-between">
              <span>[ FABRICATION SPECIFICATION REPORT ]</span>
              <span className="text-[#6B6B6B]">UNIT::FAB-01</span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[10px] font-mono">
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">MODEL NAME</span>
                <span className="text-white font-bold tracking-widest truncate max-w-[150px]">
                  {fileName ? fileName.split('.')[0] : '---'}
                </span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">TOTAL VOLUME</span>
                <span className="text-[#4ADE80] font-bold">
                  {displayVolume} {volume ? 'mm³' : ''}
                </span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">SURFACE AREA</span>
                <span className="text-white font-bold">
                  {displaySurface} {surfaceArea ? 'mm²' : ''}
                </span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">ESTIMATED WEIGHT</span>
                <span className="text-white font-bold">{displayWeight}</span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">TOTAL LAYERS</span>
                <span className="text-[#4ADE80] font-bold">{displayLayers}</span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">PRINT TIME</span>
                <span className="text-white font-bold">{displayTime}</span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">MATERIAL REQUIRED</span>
                <span className="text-white font-bold">{selectedMaterial} // RAW</span>
              </div>
              <div className="flex flex-col border-b border-[#1C1C1C] pb-2">
                <span className="text-[#6B6B6B] tracking-wider mb-1">SUPPORT MATERIAL</span>
                <span className="text-yellow-500 font-bold">
                  {fileName ? 'AUTO_GENERATED' : '---'}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-4 text-[8px] text-[#6B6B6B] font-mono leading-none">
              <span>[ BUILD: VERIFIED ]</span>
              <span>[ BINDING: DENSE ]</span>
              <span>[ FILAMENT: 1.75MM ]</span>
            </div>
          </div>

          {/* Manufacturing Estimate Price Module */}
          <div className="border border-[#2C2C2C] bg-[#050505] p-5 rounded-lg relative overflow-hidden">
            {/* Background scanner flicker line */}
            <div className="absolute inset-0 bg-[#4ADE80]/[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]"></div>
            
            <div className="text-[10px] text-[#6B6B6B] tracking-widest font-bold mb-3 uppercase">
              [ MANUFACTURING ESTIMATE Breakdown ]
            </div>

            <div className="text-[10px] space-y-2 border-b border-dashed border-[#2C2C2C] pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Material Cost</span>
                <span className="text-white/80">₹{fileName ? Math.round(estimatePrice * 0.4) : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Machine Time</span>
                <span className="text-white/80">₹{fileName ? Math.round(estimatePrice * 0.35) : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Post Processing</span>
                <span className="text-white/80">₹{fileName ? Math.round(estimatePrice * 0.15) : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Packaging &amp; Shipping</span>
                <span className="text-[#4ADE80]">FREE // SECURE BATCH</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-bold text-[#BEBEBE] tracking-widest uppercase">
                ESTIMATED PRICE
              </span>
              
              {/* Massive Brutalist animated price output */}
              <span className="font-display font-black text-5xl text-[#4ADE80] tracking-tight relative">
                ₹{estimatePrice}
                {/* Horizontal cut overlay for logo matching */}
                <span className="absolute top-[50%] left-0 w-full h-[1.5px] bg-[#050505]/40"></span>
              </span>
            </div>
          </div>

          {/* Interactive Order Panel (CTA Button) */}
          <div className="border border-[#2C2C2C] bg-[#0A0A0A] p-5 rounded-lg relative overflow-hidden">
            {orderPlaced ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4 space-y-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] mx-auto shadow-[0_0_8px_#4ADE80]"></div>
                <span className="text-xs font-bold text-[#4ADE80] tracking-[0.2em] uppercase block">
                  [ FABRICATION QUEUED ]
                </span>
                <p className="text-[10px] text-white/50 max-w-xs mx-auto leading-relaxed">
                  Intake batch locked. Assembly line D9-ARMED initialized. Manufacturing specifications transmitted.
                </p>
                <div className="text-[9px] text-[#6B6B6B]">
                  ORDER IDENTIFIER: #{Math.floor(100000 + Math.random() * 900000)}
                </div>
              </motion.div>
            ) : (
              <div>
                <span className="text-[11px] font-bold text-white tracking-[0.15em] block mb-1">
                  READY FOR PRODUCTION?
                </span>
                <p className="text-[10px] text-white/50 leading-relaxed mb-5">
                  {status === 'COMPLETE'
                    ? 'Your design has been validated and is ready for fabrication.'
                    : 'Intake node requires configuration. Please upload a model mesh to queue manufacturing.'}
                </p>
                
                <button
                  onMouseEnter={() => { if (status === 'COMPLETE') setIsArmed(true); }}
                  onMouseLeave={() => setIsArmed(false)}
                  onClick={handleOrderSubmit}
                  disabled={status !== 'COMPLETE'}
                  className={`w-full py-3.5 text-xs font-bold tracking-[0.25em] border transition-all duration-300 uppercase cursor-pointer ${
                    status === 'COMPLETE'
                      ? 'border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80] hover:bg-[#4ADE80] hover:text-black shadow-[0_0_12px_rgba(74,222,128,0.15)]'
                      : 'border-[#2C2C2C] bg-transparent text-[#6B6B6B] cursor-not-allowed'
                  }`}
                >
                  {isArmed ? '[ ARM SYSTEM // BEGIN ]' : '[ BEGIN FABRICATION ]'}
                </button>

                <div className="flex justify-between items-center mt-4 text-[8px] text-[#6B6B6B] tracking-wider uppercase">
                  <span>ARMED TRIGGER: {isArmed ? 'ARMED' : 'READY'}</span>
                  <span>STOCK: AVAILABLE</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. Telemetry Microdetails Row */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#2C2C2C] pt-6 mt-12 text-[9px] text-[#6B6B6B] tracking-widest font-mono">
        <div>[ UNIT : FAB-01 ]</div>
        <div>[ BUILD TIME : 06:42:15 ]</div>
        <div>[ MATERIAL STOCK : AVAILABLE ]</div>
        <div>[ MACHINE STATUS : ONLINE ]</div>
      </div>
    </div>
  );
}
