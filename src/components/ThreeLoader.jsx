import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import gsap from 'gsap';

// ==========================================
// Web Audio API Synthesizer (Zero Assets)
// ==========================================
class WebAudioSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneOsc = null;
    this.droneGain = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this.playDrone();
  }

  playDrone() {
    if (!this.ctx || this.droneOsc) return;
    
    // Low industrial background drone
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sawtooth';
    this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 frequency
    
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    
    const lpFilter = this.ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
    
    // Low frequency LFO to modulate filter
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(30, this.ctx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(lpFilter.frequency);
    
    this.droneOsc.connect(lpFilter);
    lpFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    
    lfo.start();
    this.droneOsc.start();
  }

  playServo(freq, duration) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + duration);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 0.9, now);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  playLaser(duration) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + duration);
    
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  playVacuum(duration = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Generate white noise for vacuum suction sound
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(5.0, now);
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noiseNode.start(now);
    noiseNode.stop(now + duration);
  }

  playChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // 3-note cyber chime
    const notes = [440, 554, 659]; // A major triad
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.5);
    });
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  cleanup() {
    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
      } catch (e) {}
      this.droneOsc = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

const synth = new WebAudioSynth();

// ==========================================
// Custom Shader Material for 3D Printing
// ==========================================
const PrintingShaderMaterial = {
  uniforms: {
    uPrintProgress: { value: -1.8 },
    uLaserProgress: { value: -2.0 },
    uBaseColor: { value: new THREE.Color('#1F1F1F') },
    uGlowColor: { value: new THREE.Color('#4ADE80') },
  },
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uPrintProgress;
    uniform float uLaserProgress;
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      float y = vPosition.y;
      
      // Discard anything above current print head Y limit
      if (y > uPrintProgress) {
        discard;
      }
      
      // Glowing green layer boundary
      float edgeThickness = 0.08;
      float distToEdge = uPrintProgress - y;
      float edgeGlow = 0.0;
      if (distToEdge < edgeThickness && distToEdge > 0.0) {
        edgeGlow = pow(1.0 - (distToEdge / edgeThickness), 2.0);
      }
      
      // Laser scan sweep line glow
      float laserThickness = 0.06;
      float distToLaser = abs(y - uLaserProgress);
      float laserGlow = 0.0;
      if (distToLaser < laserThickness) {
        laserGlow = pow(1.0 - (distToLaser / laserThickness), 3.0) * 2.0;
      }
      
      // Standard directional diffuse lighting
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.7));
      float diff = max(dot(vNormal, lightDir), 0.2);
      
      // Base color with ambient shading
      vec3 color = uBaseColor * (diff + 0.15);
      
      // Layer print edge glow
      color += uGlowColor * edgeGlow * 1.8;
      
      // Laser scan line overlay glow
      color += vec3(0.4, 1.0, 0.6) * laserGlow;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// ==========================================
// R3F Cinematic Camera Controller
// ==========================================
function CameraController({ cameraRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (cameraRef) {
      cameraRef.current = camera;
    }
  }, [camera, cameraRef]);
  return null;
}

// ==========================================
// R3F Nozzle Jigging Controller
// ==========================================
function NozzleController({ nozzleRef, gantryRef, isPrinting }) {
  useFrame((state) => {
    if (!nozzleRef.current || !gantryRef.current) return;
    
    if (isPrinting.current) {
      const t = state.clock.getElapsedTime() * 45;
      // High-frequency jigging in X and Z axes to simulate printing paths
      nozzleRef.current.position.x = Math.sin(t) * 0.45 + Math.cos(t * 0.6) * 0.25;
      nozzleRef.current.position.z = Math.cos(t * 1.2) * 0.45 + Math.sin(t * 0.8) * 0.25;
    } else {
      // Return smoothly to center when not active
      nozzleRef.current.position.x = THREE.MathUtils.lerp(nozzleRef.current.position.x, 0, 0.1);
      nozzleRef.current.position.z = THREE.MathUtils.lerp(nozzleRef.current.position.z, 0, 0.1);
    }
  });
  return null;
}

// ==========================================
// Volumetric Spotlight Cone Material
// ==========================================
function VolumetricLightBeam() {
  const meshRef = useRef();
  
  // Custom transparent shader to simulate a volumetric light cone
  const coneMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color('#4ADE80') },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        // Fade out light cone at vertical limits and sides
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        float verticalFade = smoothstep(-4.0, 1.0, vPosition.y) * (1.0 - smoothstep(0.0, 4.0, vPosition.y));
        gl_FragColor = vec4(uColor, intensity * 0.22 * verticalFade);
      }
    `
  });

  return (
    <mesh ref={meshRef} position={[0, 1.0, 0]} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[0.05, 1.8, 4.0, 32, 1, true]} />
      <primitive object={coneMaterial} attach="material" />
    </mesh>
  );
}

// ==========================================
// Core Loader Component
// ==========================================
export default function ThreeLoader({ onComplete }) {
  const [gateActive, setGateActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const camera = useRef();
  const gantry = useRef();
  const nozzle = useRef();
  const collectible = useRef();
  const packageBox = useRef();
  const packageMaterial = useRef();
  const floorGrid = useRef();
  const loaderContainer = useRef();
  const logoOverlay = useRef();
  const logoText = useRef();
  
  const shaderMaterialRef = useRef();
  const isPrintingRef = useRef(false);

  // Set up uniforms for Torus Knot custom material
  useEffect(() => {
    shaderMaterialRef.current = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(PrintingShaderMaterial.uniforms),
      vertexShader: PrintingShaderMaterial.vertexShader,
      fragmentShader: PrintingShaderMaterial.fragmentShader,
      side: THREE.DoubleSide
    });
  }, []);

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    synth.setMute(nextMuted);
  };

  useEffect(() => {
    // Attempt system audio initialization
    synth.init();
    
    // Autoplay unlock helper
    const handleUnlockAudio = () => {
      if (synth.ctx && synth.ctx.state === 'suspended') {
        synth.ctx.resume().then(() => {
          synth.playDrone();
        });
      }
      setMuted(false);
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('touchstart', handleUnlockAudio);
    };
    window.addEventListener('click', handleUnlockAudio);
    window.addEventListener('touchstart', handleUnlockAudio);

    // Auto-start printing timeline sequence
    const timer = setTimeout(() => {
      startLoadingTimeline();
    }, 500);

    return () => {
      clearTimeout(timer);
      synth.cleanup();
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('touchstart', handleUnlockAudio);
    };
  }, []);

  const startLoadingTimeline = () => {
    const timeline = gsap.timeline({
      onUpdate: () => {
        // Track overall progress percentage for visual text feedback
        setProgress(Math.round(timeline.progress() * 100));
      },
      onComplete: () => {
        // Final completion chime, then callback
        synth.playChime();
        if (onComplete) onComplete();
      }
    });

    // Reset default properties
    gsap.set(camera.current.position, { x: 5, y: 3.5, z: 6.5 });
    camera.current.lookAt(0, 0, 0);

    // ----------------------------------------------------
    // STAGE 1: Dark workshop camera pivot & printer slide-in
    // ----------------------------------------------------
    // Gantry lowers into frame
    timeline.to(gantry.current.position, {
      y: 1.5,
      duration: 1.2,
      ease: "power2.out",
      onStart: () => {
        synth.playServo(220, 1.0);
      }
    }, 0);

    // Nozzle moves down
    timeline.to(nozzle.current.position, {
      y: 0.1,
      duration: 1.0,
      ease: "power2.out"
    }, 0.2);

    // Camera pans closer to print bed
    timeline.to(camera.current.position, {
      x: 3.5,
      y: 1.2,
      z: 4.8,
      duration: 1.4,
      ease: "power2.inOut"
    }, 0);

    // ----------------------------------------------------
    // STAGE 2: Layer-by-layer 3D printing execution
    // ----------------------------------------------------
    timeline.add(() => {
      isPrintingRef.current = true;
      // Play continuous servo sound
      const playContinuousServo = (ticks = 0) => {
        if (!isPrintingRef.current) return;
        synth.playServo(280 + Math.sin(ticks) * 40, 0.1);
        setTimeout(() => playContinuousServo(ticks + 1), 100);
      };
      playContinuousServo();
    }, 1.2);

    // Animate nozzle gantry height tracking print progress
    timeline.to(gantry.current.position, {
      y: 3.2,
      duration: 2.2,
      ease: "linear"
    }, 1.2);

    // Animate Custom Shader printing reveal uniform (rise)
    timeline.to(shaderMaterialRef.current.uniforms.uPrintProgress, {
      value: 1.5,
      duration: 2.2,
      ease: "linear"
    }, 1.2);

    // Camera orbits slowly during print
    timeline.to(camera.current.position, {
      x: -2.8,
      z: 5.2,
      duration: 2.2,
      ease: "linear"
    }, 1.2);

    // ----------------------------------------------------
    // STAGE 3: Retraction & scan quality sweep
    // ----------------------------------------------------
    timeline.add(() => {
      isPrintingRef.current = false; // Stop nozzle jigging sound
      synth.playServo(350, 0.4);     // Retract servo whir
    }, 3.4);

    // Retract gantry upward
    timeline.to(gantry.current.position, {
      y: 5.0,
      duration: 0.8,
      ease: "power2.in"
    }, 3.4);

    // Trigger Laser Scan Sweep (uniform moves top-to-bottom)
    timeline.to(shaderMaterialRef.current.uniforms.uLaserProgress, {
      value: -1.6,
      duration: 1.2,
      ease: "power1.inOut",
      onStart: () => {
        synth.playLaser(1.1);
      }
    }, 3.8);

    // Camera moves to clean diagnostic side-angle
    timeline.to(camera.current.position, {
      x: 0,
      y: 1.6,
      z: 5.8,
      duration: 1.2,
      ease: "power2.inOut"
    }, 3.6);

    // ----------------------------------------------------
    // STAGE 4: Vacuum Sealing packaging
    // ----------------------------------------------------
    // Fade in glassy reflective box
    timeline.to(packageMaterial.current, {
      opacity: 0.9,
      duration: 0.3,
      ease: "power1.out"
    }, 4.9);

    // Shrink package box to tightly wrap collectible (Vacuum seal)
    timeline.to(packageBox.current.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.6,
      ease: "back.out(2.0)",
      onStart: () => {
        synth.playVacuum(0.7);
      }
    }, 5.0);

    // Hide floor grid dynamically
    timeline.to(floorGrid.current.position, {
      y: -2.0,
      duration: 0.5,
      ease: "power2.in"
    }, 5.2);

    // ----------------------------------------------------
    // STAGE 5: Rotation morph & camera zoom transition
    // ----------------------------------------------------
    // Rapid spin of packaged collectible
    timeline.to(collectible.current.rotation, {
      y: Math.PI * 4,
      z: Math.PI * 2,
      duration: 1.2,
      ease: "power3.inOut"
    }, 5.3);

    timeline.to(packageBox.current.rotation, {
      y: Math.PI * 4,
      z: Math.PI * 2,
      duration: 1.2,
      ease: "power3.inOut"
    }, 5.3);

    // Camera zooms straight through the packaging box
    timeline.to(camera.current.position, {
      x: 0,
      y: 0,
      z: 1.2,
      duration: 1.2,
      ease: "power3.in"
    }, 5.3);

    // Fade in the logo overlay (morphing from packaging box)
    timeline.to(logoOverlay.current, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, 5.5);

    // Expand (scale up) the logo text and fade it out
    timeline.to(logoText.current, {
      scale: 3.5,
      opacity: 0,
      duration: 1.2,
      ease: "power3.in"
    }, 5.9);

    // Fade out the entire loader container to reveal the site underneath
    timeline.to(loaderContainer.current, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut"
    }, 6.5);
  };

  return (
    <motion.div 
      ref={loaderContainer}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(12px)", scale: 1.06 }}
      transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
      className="fixed inset-0 w-full h-full bg-[#000000] z-[99999] flex flex-col items-center justify-center font-mono overflow-hidden select-none"
    >
      
      {/* Intro Gate Overlay (Autoplay Bypass) */}
      <AnimatePresence>
        {gateActive && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center px-6 text-center">
            {/* Corner Bracket decorations */}
            <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/20"></div>
            <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white/20"></div>
            <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/20"></div>

            {/* Industrial details */}
            <span className="text-[10px] text-[#4ADE80] tracking-[0.25em] font-bold mb-2 uppercase">
              // MAEVIS GBL SYSTEM INITIALIZATION //
            </span>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-widest uppercase mb-8 leading-none">
              PRODUCTION SECTOR D9
            </h1>

            <p className="text-white/40 text-xs max-w-sm mb-12 leading-relaxed">
              Initiate the high-fidelity render-loader engine. Autoplay audio node synthesis is ready for activation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
              <button
                onClick={() => handleStart(true)}
                className="w-full border-2 border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80] py-3 text-xs tracking-[0.2em] font-bold hover:bg-[#4ADE80] hover:text-black transition-colors duration-250 cursor-pointer"
              >
                [ CONNECT WITH SOUND ]
              </button>
              <button
                onClick={() => handleStart(false)}
                className="w-full border border-white/30 text-white/70 py-3 text-xs tracking-[0.2em] font-bold hover:bg-white/10 transition-colors duration-250 cursor-pointer"
              >
                [ SILENT INITIALIZE ]
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main R3F Canvas Container */}
      {!gateActive && (
        <div className="absolute inset-0 w-full h-full">
          <Canvas gl={{ antialias: true }}>
            <color attach="background" args={['#000000']} />
            
            {/* Cinematic Camera Controller */}
            <CameraController cameraRef={camera} />

            {/* Ambient Base Shadow Lighting */}
            <ambientLight intensity={0.15} />
            <directionalLight position={[2, 5, 2]} intensity={0.3} color="#ffffff" />
            
            {/* Main Green Volumetric Spotlight */}
            <spotLight 
              position={[0, 4.0, 0]} 
              angle={0.45} 
              penumbra={0.5} 
              intensity={4.5} 
              color="#4ADE80" 
              castShadow
            />
            
            {/* Volumetric spotlight cone mesh */}
            <VolumetricLightBeam />

            {/* Three.js Scene Contents */}
            <Center>
              {/* 3D printed Butterfly Knife (Balisong) */}
              <group ref={collectible} position={[0, -0.15, 0]}>
                {shaderMaterialRef.current && (
                  <group>
                    {/* Central Blade */}
                    <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
                      <boxGeometry args={[0.08, 1.0, 0.02]} />
                      <primitive object={shaderMaterialRef.current} attach="material" />
                    </mesh>
                    {/* Blade Tip */}
                    <mesh castShadow receiveShadow position={[0, 1.03, 0]} rotation={[0, 0, Math.PI / 4]}>
                      <boxGeometry args={[0.056, 0.056, 0.02]} />
                      <primitive object={shaderMaterialRef.current} attach="material" />
                    </mesh>
                    {/* Left Handle */}
                    <mesh castShadow receiveShadow position={[-0.12, -0.3, 0]}>
                      <boxGeometry args={[0.08, 0.75, 0.05]} />
                      <primitive object={shaderMaterialRef.current} attach="material" />
                    </mesh>
                    {/* Right Handle */}
                    <mesh castShadow receiveShadow position={[0.12, -0.3, 0]}>
                      <boxGeometry args={[0.08, 0.75, 0.05]} />
                      <primitive object={shaderMaterialRef.current} attach="material" />
                    </mesh>
                    {/* Crossguard / Pivot Area */}
                    <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                      <boxGeometry args={[0.28, 0.08, 0.06]} />
                      <primitive object={shaderMaterialRef.current} attach="material" />
                    </mesh>
                  </group>
                )}
              </group>

              {/* Vacuum Glossy Package Box */}
              <mesh ref={packageBox} position={[0, 0.45, 0]} scale={[1.8, 1.8, 1.8]}>
                <boxGeometry args={[1.7, 1.7, 1.7]} />
                <meshPhysicalMaterial 
                  ref={packageMaterial}
                  color="#ffffff"
                  roughness={0.08}
                  metalness={0.05}
                  transparent={true}
                  opacity={0} // Fades in during vacuum seal stage
                  transmission={0.88}
                  thickness={1.2}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* 3D Printer Gantry & Nozzle Assembly */}
              <group ref={gantry} position={[0, 5.0, 0]}>
                {/* Horizontal Guide Rail (X bar) */}
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[4.2, 0.12, 0.12]} />
                  <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.8} />
                </mesh>
                {/* Horizontal Carriage Block */}
                <group ref={nozzle}>
                  <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[0.5, 0.3, 0.5]} />
                    <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.9} />
                  </mesh>
                  {/* Extruder nozzle cone */}
                  <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.08, 0.25, 8]} />
                    <meshStandardMaterial color="#666666" roughness={0.3} metalness={0.9} />
                  </mesh>
                  {/* Glowing print head laser indicator pointlight */}
                  <pointLight position={[0, -0.28, 0]} intensity={1.8} distance={1.2} color="#4ADE80" />
                </group>
              </group>

              {/* Bottom Print Bed */}
              <group ref={floorGrid} position={[0, -0.4, 0]}>
                {/* Plate */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[5, 5]} />
                  <meshStandardMaterial color="#0A0A0A" roughness={0.9} />
                </mesh>
                {/* Hexagonal grid lines */}
                <gridHelper args={[6, 24, '#333333', '#1F1F1F']} position={[0, 0.01, 0]} />
              </group>
            </Center>

            {/* Custom Nozzle Jittering Loop */}
            <NozzleController nozzleRef={nozzle} gantryRef={gantry} isPrinting={isPrintingRef} />
          </Canvas>
        </div>
      )}

      {/* UI Hud & Mute controls */}
      {!gateActive && (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-40 flex flex-col justify-between p-6">
          {/* Top HUD Row */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1 text-[10px] text-[#4ADE80] tracking-widest font-bold">
              <span>[ SECTOR: D9_PRINTER ]</span>
              <span className="text-white/40 font-normal">SYS_STATUS: ONLINE</span>
            </div>
            
            {/* Industrial Mute Toggle */}
            <div className="flex items-center gap-3 pointer-events-auto">
              {synth.ctx && synth.ctx.state === 'suspended' && (
                <span className="text-yellow-500/80 text-[8px] animate-pulse">
                  [ CLICK ANYWHERE TO UNMUTE AUDIO ]
                </span>
              )}
              <button
                onClick={toggleMute}
                className="border border-[#2C2C2C] hover:border-[#4ADE80] px-3 py-1.5 text-[9px] text-white hover:text-[#4ADE80] bg-black/60 backdrop-blur-xs transition-colors duration-250 cursor-pointer flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${muted ? 'bg-red-500 shadow-[0_0_4px_#EF4444]' : 'bg-[#4ADE80] shadow-[0_0_4px_#4ADE80]'}`}></span>
                <span>{muted ? '[ SOUND: OFF ]' : '[ SOUND: ON ]'}</span>
              </button>
            </div>
          </div>

          {/* Bottom HUD Loading Progress */}
          <div className="w-full max-w-md mx-auto flex flex-col gap-2 items-center text-center">
            {/* Visual Progress percentage */}
            <div className="flex justify-between w-full text-[10px] text-[#BEBEBE] tracking-[0.2em]">
              <span>[ ENGINE_COMPILATION ]</span>
              <span className="text-[#4ADE80] font-bold">{progress}%</span>
            </div>

            {/* Clean industrial loading progress bar */}
            <div className="w-full h-[2px] bg-white/10 relative overflow-hidden">
              <div 
                className="h-full bg-[#4ADE80] transition-all duration-100 ease-out shadow-[0_0_8px_#4ADE80]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <span className="text-[8px] text-white/30 tracking-widest">
              PLEASE WAIT // VACUUM PACKAGING SEQUENCE IN OPERATION
            </span>
          </div>
        </div>
      )}

      {/* Brand Logo Reveal Overlay */}
      <div 
        ref={logoOverlay}
        className="absolute inset-0 z-50 bg-black flex items-center justify-center pointer-events-none opacity-0"
      >
        <div ref={logoText} className="flex flex-col items-center">
          <div className="border border-white/40 p-2 bg-black/60 relative scale-150">
            <div className="border-2 border-white px-8 py-3 flex items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#4ADE80]"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#4ADE80]"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#4ADE80]"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#4ADE80]"></div>
              <span className="font-sans font-black italic text-3xl tracking-[0.2em] text-white skew-x-[-8deg] relative select-none">
                MAEVIS
                <div className="absolute top-[55%] left-0 w-full h-[2px] bg-black/80"></div>
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[#4ADE80] mt-6 tracking-[0.3em] font-bold">[ INITIALIZATION COMPLETE ]</span>
        </div>
      </div>
    </motion.div>
  );
}
