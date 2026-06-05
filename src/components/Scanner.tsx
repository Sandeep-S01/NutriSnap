'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ScannerProps {
  onAnalyze: (base64: string, imageUrl: string) => void;
  isAnalyzing: boolean;
}

export default function Scanner({ onAnalyze, isAnalyzing }: ScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onAnalyze(dataUrl.split(',')[1], dataUrl);
    };
    reader.readAsDataURL(file);
  }, [onAnalyze]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && processFile(files[0]),
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.heic'] },
    maxFiles: 1,
    disabled: isAnalyzing,
  });

  const handleCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) processFile(f);
    };
    input.click();
  };

  /* ── Preview with scan overlay ── */
  if (preview) {
    return (
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 240 }}>
        <Image src={preview} alt="Food" fill className="object-cover" unoptimized />

        {/* Scan animation */}
        {isAnalyzing && (
          <div className="scan-overlay">
            <div className="scan-brackets">
              <div className="scan-corner sc-tl" />
              <div className="scan-corner sc-tr" />
              <div className="scan-corner sc-bl" />
              <div className="scan-corner sc-br" />
              <div className="scan-line" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.06em' }}>
                ANALYZING FOOD
              </p>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                Detecting nutrition data...
              </p>
            </div>
          </div>
        )}

        {/* Clear button */}
        {!isAnalyzing && (
          <button
            onClick={() => setPreview(null)}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--on-surface)', fontSize: 18,
            }}
            aria-label="Remove photo"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>
    );
  }

  /* ── Drop zone ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        {...getRootProps()}
        id="drop-zone"
        className={`drop-zone${isDragActive ? ' active' : ''}`}
      >
        <input {...getInputProps()} id="file-input" />

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(0,110,47,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--primary)' }}>
            photo_camera
          </span>
        </div>

        <div>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--on-surface)', marginBottom: 4 }}>
            {isDragActive ? 'Drop your food photo here' : 'Take or upload a photo'}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
            JPG, PNG, WEBP supported
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label id="upload-label" className="btn-outline" style={{ cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>upload</span>
          Upload Photo
          <input
            id="upload-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
        </label>

        <button id="camera-btn" className="btn-outline" onClick={handleCamera}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>photo_camera</span>
          Camera
        </button>
      </div>
    </div>
  );
}
