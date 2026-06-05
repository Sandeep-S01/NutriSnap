'use client';

import Image from 'next/image';
import { NutritionData } from '@/lib/openai';

interface ResultCardProps {
  data: NutritionData;
  imageUrl?: string | null;
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
}

/** Returns a percent (0-100) of value vs daily goal */
function pct(val: number, max: number) {
  return Math.min(Math.round((val / max) * 100), 100);
}

/** Build the conic-gradient string for a progress ring */
function ringGradient(percent: number, color: string, track = '#eceef0') {
  const deg = Math.round((percent / 100) * 360);
  return `conic-gradient(${color} ${deg}deg, ${track} 0)`;
}

/** Smart nutritional pills based on AI data */
function getNutritionalPills(data: NutritionData): { label: string; type: 'primary' | 'secondary' | 'warning' }[] {
  const pills: { label: string; type: 'primary' | 'secondary' | 'warning' }[] = [];
  if (data.protein >= 25) pills.push({ label: 'High Protein', type: 'primary' });
  if (data.carbs <= 30)   pills.push({ label: 'Low Carb', type: 'secondary' });
  if (data.fat >= 15)     pills.push({ label: 'Healthy Fats', type: 'secondary' });
  if (data.fiber >= 5)    pills.push({ label: 'High Fiber', type: 'primary' });
  if (data.calories <= 300) pills.push({ label: 'Low Calorie', type: 'primary' });
  if (data.calories >= 700) pills.push({ label: 'High Calorie', type: 'warning' });
  if (data.sodium && data.sodium > 1000) pills.push({ label: 'High Sodium', type: 'warning' });
  return pills.slice(0, 3);
}

/** Format "scanned X ago" */
function timeAgo(date: Date) {
  const secs = Math.round((Date.now() - date.getTime()) / 1000);
  if (secs < 60)  return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min${Math.floor(secs / 60) > 1 ? 's' : ''} ago`;
  return 'today';
}

const MACRO_CONFIG = [
  { key: 'protein', label: 'Protein', color: '#006e2f', max: 150 },
  { key: 'carbs',   label: 'Carbs',   color: '#515f77', max: 250 },
  { key: 'fat',     label: 'Fats',    color: '#a4abc4', max: 65  },
];

const MICRO_ICONS: Record<string, { icon: string; cls: string }> = {
  'Vitamin D':   { icon: 'light_mode',   cls: 'micro-icon-secondary' },
  'Vitamin C':   { icon: 'eco',          cls: 'micro-icon-primary'   },
  'Vitamin A':   { icon: 'visibility',   cls: 'micro-icon-secondary' },
  'Vitamin B':   { icon: 'electric_bolt',cls: 'micro-icon-tertiary'  },
  'Vitamin B12': { icon: 'electric_bolt',cls: 'micro-icon-tertiary'  },
  'Omega-3':     { icon: 'water_drop',   cls: 'micro-icon-tertiary'  },
  'Calcium':     { icon: 'exercise',     cls: 'micro-icon-secondary' },
  'Iron':        { icon: 'blood_pressure',cls:'micro-icon-primary'   },
  'Potassium':   { icon: 'favorite',     cls: 'micro-icon-tertiary'  },
  'Magnesium':   { icon: 'bolt',         cls: 'micro-icon-secondary' },
  'Folate':      { icon: 'spa',          cls: 'micro-icon-primary'   },
  'Zinc':        { icon: 'shield',       cls: 'micro-icon-tertiary'  },
  'Manganese':   { icon: 'nature',       cls: 'micro-icon-secondary' },
  'Selenium':    { icon: 'star',         cls: 'micro-icon-primary'   },
};

function getMicroIcon(name: string) {
  return MICRO_ICONS[name] ?? { icon: 'nutrition', cls: 'micro-icon-primary' };
}

export default function ResultCard({ data, imageUrl, onSave, isSaving, saved }: ResultCardProps) {
  const pills = getNutritionalPills(data);
  const vitamins = data.vitamins ? Object.entries(data.vitamins).slice(0, 4) : [];
  const scannedTime = timeAgo(new Date());

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Demo notice ── */}
      {data._demo && (
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#b45309', fontSize: 20 }}>science</span>
          <p style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, lineHeight: 1.4 }}>
            Demo mode — simulated data. Add your <code style={{ background: 'rgba(245,158,11,0.1)', padding: '0 4px', borderRadius: 4 }}>OPENAI_API_KEY</code> for real analysis.
          </p>
        </div>
      )}

      {/* ── Hero image ── */}
      {imageUrl && (
        <div className="food-hero anim-in-1">
          <Image src={imageUrl} alt={data.food_name} fill className="object-cover" unoptimized />
        </div>
      )}

      {/* ── Food name + calorie row ── */}
      <div className="hero-meta anim-in-2">
        <div style={{ flex: 1 }}>
          <h2 className="food-name">{data.food_name}</h2>
          <p className="food-time">Scanned {scannedTime}</p>
        </div>
        <div className="calorie-block">
          <div className="calorie-num">{data.calories}</div>
          <div className="calorie-unit">Kcal</div>
        </div>
      </div>

      {/* ── Nutritional pills ── */}
      {pills.length > 0 && (
        <div className="pills-row anim-in-2">
          {pills.map(p => (
            <span key={p.label} className={`pill pill-${p.type}`}>{p.label}</span>
          ))}
        </div>
      )}

      {/* ── Macronutrients card ── */}
      <div className="card card-p anim-in-3">
        <h3 className="section-heading" style={{ marginBottom: '1.5rem' }}>Macronutrients</h3>
        <div className="macro-row">
          {MACRO_CONFIG.map(({ key, label, color, max }) => {
            const val = data[key as keyof NutritionData] as number ?? 0;
            const p = pct(val, max);
            return (
              <div key={key} className="macro-item">
                <div
                  className="progress-ring"
                  style={{ background: ringGradient(p, color) }}
                >
                  <div className="progress-ring-content">
                    <span className="ring-value">{Math.round(val)}g</span>
                  </div>
                </div>
                <span className="ring-label">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Fiber row */}
        {(data.fiber ?? 0) > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--surface-container)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Fiber
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                {data.fiber}g <span style={{ color: 'var(--on-surface-variant)', fontWeight: 400 }}>/ 38g goal</span>
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${pct(data.fiber ?? 0, 38)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Key Micronutrients ── */}
      {vitamins.length > 0 && (
        <div className="anim-in-4">
          <h3 className="section-heading">Key Micronutrients</h3>
          <div className="micro-grid">
            {vitamins.map(([name, amount]) => {
              const { icon, cls } = getMicroIcon(name);
              return (
                <div key={name} className="micro-card">
                  <div className={`micro-icon ${cls}`}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 20 }}>{icon}</span>
                  </div>
                  <div>
                    <div className="micro-label">{name}</div>
                    <div className="micro-value">{amount as string}</div>
                    <div className="micro-note">Daily source</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Log Meal CTA ── */}
      <button
        id="save-entry-btn"
        onClick={onSave}
        disabled={isSaving || saved}
        className="btn-cta anim-in-5"
      >
        {saved ? (
          <>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 22 }}>check_circle</span>
            Meal Logged!
          </>
        ) : isSaving ? (
          <>
            <div className="spinner" style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white',
            }} />
            Saving...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
            Log Meal
          </>
        )}
      </button>
    </div>
  );
}
