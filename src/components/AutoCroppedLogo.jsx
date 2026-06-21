import React, { useState, useEffect } from 'react';

export default function AutoCroppedLogo({ src, alt, style, className }) {
  const [croppedSrc, setCroppedSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        let hasNonWhite = false;
        
        // Find bounding box for non-white pixels
        // (threshold 245 handles slight compression/resampling noise in whites)
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            
            // If pixel is not fully transparent AND not pure white/near-white
            if (a > 10 && (r < 245 || g < 245 || b < 245)) {
              hasNonWhite = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        
        if (hasNonWhite) {
          // Add small padding (e.g. 6px) to avoid clipping text edges
          const padding = 6;
          minX = Math.max(0, minX - padding);
          minY = Math.max(0, minY - padding);
          maxX = Math.min(canvas.width, maxX + padding);
          maxY = Math.min(canvas.height, maxY + padding);
          
          const cropW = maxX - minX;
          const cropH = maxY - minY;
          
          if (cropW > 0 && cropH > 0) {
            const cropCanvas = document.createElement('canvas');
            const cropCtx = cropCanvas.getContext('2d');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            
            cropCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
            setCroppedSrc(cropCanvas.toDataURL());
            return;
          }
        }
        
        // Fallback to original if image is blank or error
        setCroppedSrc(src);
      } catch (e) {
        console.error("Error cropping image", e);
        setCroppedSrc(src);
      }
    };
    
    img.onerror = () => {
      setCroppedSrc(src);
    };
  }, [src]);

  if (!croppedSrc) {
    return <img src={src} alt={alt} style={{ ...style, opacity: 0 }} className={className} />;
  }

  return <img src={croppedSrc} alt={alt} style={style} className={className} />;
}
