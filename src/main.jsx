import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// High-performance static noise texture generator to replace heavy full-screen SVG filters
const generateNoiseTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(128, 128);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 16; // opacity/strength of grain (very subtle)
  }
  
  ctx.putImageData(imgData, 0, 0);
  document.documentElement.style.setProperty('--noise-bg', `url(${canvas.toDataURL()})`);
};

try {
  generateNoiseTexture();
} catch (e) {
  console.error("Failed to generate noise texture", e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
