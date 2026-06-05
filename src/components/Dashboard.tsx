'use client';

import { FoodEntry } from '@/lib/supabase';

interface DashboardProps {
  entries: FoodEntry[];
  onDeleteEntry: (id: string) => void;
  weights?: any[];
  waterLogs?: any[];
  onSaveWater?: (ml: number) => void;
  goals?: any;
}

const GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65, water: 2500 };

function pct(val: number, max: number) { return Math.min(Math.round((val / max) * 100), 100); }
function ringGradient(p: number, color: string) {
  return `conic-gradient(${color} ${Math.round((p / 100) * 360)}deg, #eceef0 0)`;
}

function MacroRing({ val, max, color, label }: { val: number; max: number; color: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className="progress-ring" style={{ background: ringGradient(pct(val, max), color) }}>
        <div className="progress-ring-content">
          <span className="ring-value">{Math.round(val)}</span>
        </div>
      </div>
      <span className="ring-label">{label}</span>
    </div>
  );
}

export default function Dashboard({ entries, onDeleteEntry, waterLogs = [], onSaveWater, goals }: DashboardProps) {
  const G = { ...GOALS, ...goals };
  const totals = entries.reduce(
    (a, e) => ({
      calories: a.calories + (e.calories || 0),
      protein:  a.protein  + (e.protein  || 0),
      carbs:    a.carbs    + (e.carbs    || 0),
      fat:      a.fat      + (e.fat      || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const totalWater = waterLogs.reduce((a, w) => a + (w.amount_ml || 0), 0);
  const remaining  = Math.max(G.calories - totals.calories, 0);
  const dateLabel  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const waterPct   = pct(totalWater, G.daily_water || G.water);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Date header ── */}
      <div className="anim-in">
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 4 }}>
          Today
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--on-surface)', letterSpacing: '-0.01em', lineHeight: '32px' }}>
          {dateLabel}
        </h2>
      </div>

      {/* ── Calorie summary card ── */}
      <div className="card card-p anim-in-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Calorie ring */}
          <div className="progress-ring" style={{
            width: 96, height: 96,
            background: ringGradient(pct(totals.calories, G.calories), '#006e2f'),
          }}>
            <div className="progress-ring-content" style={{ inset: 9, position: 'absolute' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                {totals.calories}
              </span>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>kcal</span>
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 8 }}>
              {remaining > 0
                ? <><span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{remaining} kcal</span> remaining</>
                : <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Daily goal reached! 🎉</span>
              }
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Protein', val: totals.protein, max: G.protein || G.daily_protein, color: '#006e2f' },
                { label: 'Carbs',   val: totals.carbs,   max: G.carbs   || G.daily_carbs,   color: '#515f77' },
                { label: 'Fat',     val: totals.fat,     max: G.fat     || G.daily_fat,     color: '#a4abc4' },
              ].map(({ label, val, max, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', width: 42, fontWeight: 600 }}>{label}</span>
                  <div className="progress-bar-track" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct(val, max)}%`, background: color }} />
                  </div>
                  <span style={{ fontSize: 12, color, fontWeight: 700, width: 32, textAlign: 'right' }}>
                    {Math.round(val)}g
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Macro rings row ── */}
      <div className="card card-p anim-in-2">
        <h3 className="section-heading">Macronutrients</h3>
        <div className="macro-row" style={{ justifyContent: 'space-around' }}>
          <MacroRing val={totals.protein} max={G.protein || G.daily_protein || 150} color="#006e2f" label="Protein" />
          <MacroRing val={totals.carbs}   max={G.carbs   || G.daily_carbs   || 250} color="#515f77" label="Carbs"   />
          <MacroRing val={totals.fat}     max={G.fat     || G.daily_fat     || 65}  color="#a4abc4" label="Fats"    />
        </div>
      </div>

      {/* ── Water intake card ── */}
      <div className="card card-p anim-in-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: '#3b82f6', fontSize: 22 }}>water_drop</span>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--on-surface)' }}>Water</h3>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>
            {(totalWater / 1000).toFixed(1)}
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 400 }}>
              /{((G.daily_water || G.water) / 1000).toFixed(1)}L
            </span>
          </span>
        </div>
        <div className="progress-bar-track" style={{ marginBottom: 12 }}>
          <div className="progress-bar-fill" style={{ width: `${waterPct}%`, background: '#3b82f6' }} />
        </div>
        {onSaveWater && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[150, 250, 350, 500].map(ml => (
              <button
                key={ml}
                onClick={() => onSaveWater(ml)}
                style={{
                  flex: 1, minWidth: 56,
                  padding: '8px 0', borderRadius: 8,
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-inter)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
              >+{ml}ml</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Today's meals ── */}
      <div className="anim-in-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 className="section-heading" style={{ marginBottom: 0 }}>Today&apos;s Meals</h3>
          <span style={{
            padding: '4px 12px', borderRadius: 99,
            background: 'rgba(0,110,47,0.08)', color: 'var(--primary)',
            fontSize: 12, fontWeight: 600,
          }}>
            {entries.length} {entries.length === 1 ? 'meal' : 'meals'}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="card card-p" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline-variant)', marginBottom: 12, display: 'block' }}>
              restaurant
            </span>
            <p style={{ fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 4 }}>No meals logged yet</p>
            <p style={{ fontSize: 14, color: 'var(--outline)' }}>Scan a food photo to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((entry, i) => (
              <div key={entry.id || i} className="entry-row" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="entry-thumb">🍽️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.food_name}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                    {new Date(entry.scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', lineHeight: 1 }}>{entry.calories}</p>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>kcal</p>
                </div>
                {entry.id && (
                  <button
                    onClick={() => onDeleteEntry(entry.id!)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: '1px solid var(--outline-variant)',
                      background: 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--on-surface-variant)', transition: 'all 0.2s', flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--error)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--error)';
                      (e.currentTarget as HTMLElement).style.background = 'var(--error-container)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--on-surface-variant)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--outline-variant)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                    aria-label="Delete"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
