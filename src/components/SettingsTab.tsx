'use client';

import { useState, useEffect } from 'react';
import { UserGoals } from '@/lib/offline/db';

interface SettingsTabProps {
  goals: UserGoals;
  onSaveGoals: (goals: UserGoals) => Promise<void>;
}

export default function SettingsTab({ goals, onSaveGoals }: SettingsTabProps) {
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize values
  useEffect(() => {
    setCalories(String(goals.daily_calories));
    setProtein(String(goals.daily_protein));
    setCarbs(String(goals.daily_carbs));
    setFat(String(goals.daily_fat));
    setFiber(String(goals.daily_fiber));
    setWeight(String(goals.target_weight));
    setWater(String(goals.daily_water || 2500));
  }, [goals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const valCalories = Number(calories);
    const valProtein = Number(protein);
    const valCarbs = Number(carbs);
    const valFat = Number(fat);
    const valFiber = Number(fiber);
    const valWeight = Number(weight);
    const valWater = Number(water);

    // Validate inputs
    if (
      isNaN(valCalories) || valCalories <= 0 ||
      isNaN(valProtein) || valProtein < 0 ||
      isNaN(valCarbs) || valCarbs < 0 ||
      isNaN(valFat) || valFat < 0 ||
      isNaN(valFiber) || valFiber < 0 ||
      isNaN(valWeight) || valWeight <= 0 ||
      isNaN(valWater) || valWater <= 0
    ) {
      setErrorMsg('All target values must be positive numbers.');
      setIsSaving(false);
      return;
    }

    try {
      await onSaveGoals({
        daily_calories: valCalories,
        daily_protein: valProtein,
        daily_carbs: valCarbs,
        daily_fat: valFat,
        daily_fiber: valFiber,
        target_weight: valWeight,
        daily_water: valWater,
        user_id: goals.user_id
      });
      setSuccessMsg('Targets updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Failed to update targets. Will sync when connection is restored.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Settings Card */}
      <div className="glass anim-up" style={{ padding: '24px 20px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(124,92,246,0.12)', border: '1px solid rgba(124,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7c5cf6'
          }}>
            ⚙️
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>Nutrition Targets</h2>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 500 }}>Customize daily tracking goals</p>
          </div>
        </div>

        {errorMsg && (
          <div className="anim-fade" style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '0.8rem', fontWeight: 500, marginBottom: 18,
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="anim-fade" style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(48,212,116,0.08)', border: '1px solid rgba(48,212,116,0.2)',
            color: '#30d474', fontSize: '0.8rem', fontWeight: 500, marginBottom: 18,
          }}>
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Main Calorie Limit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔥 Daily Calories Target (kcal)
            </label>
            <input
              type="number"
              required
              min="500"
              max="10000"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: '11px 14px',
                color: 'var(--text-1)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
            />
          </div>

          {/* Target Weight */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚖️ Target Weight Goal (kg)
            </label>
            <input
              type="number"
              step="0.1"
              required
              min="30"
              max="300"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: '11px 14px',
                color: 'var(--text-1)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
            />
          </div>

          {/* Daily Hydration Target */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              💧 Daily Hydration Target (ml)
            </label>
            <input
              type="number"
              required
              min="500"
              max="10000"
              value={water}
              onChange={e => setWater(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                padding: '11px 14px',
                color: 'var(--text-1)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
            />
          </div>

          <div style={{ height: 1, background: 'var(--card-border)', margin: '4px 0' }} />

          {/* Macronutrients Grid */}
          <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: -4 }}>
            Daily Macronutrient Limits
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Protein */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-2)' }}>
                🥩 Protein (g)
              </label>
              <input
                type="number"
                required
                value={protein}
                onChange={e => setProtein(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: 'var(--text-1)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
              />
            </div>

            {/* Carbs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-2)' }}>
                🌾 Carbohydrates (g)
              </label>
              <input
                type="number"
                required
                value={carbs}
                onChange={e => setCarbs(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: 'var(--text-1)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
              />
            </div>

            {/* Fat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-2)' }}>
                💧 Fats (g)
              </label>
              <input
                type="number"
                required
                value={fat}
                onChange={e => setFat(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: 'var(--text-1)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
              />
            </div>

            {/* Fiber */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-2)' }}>
                🌿 Dietary Fiber (g)
              </label>
              <input
                type="number"
                required
                value={fiber}
                onChange={e => setFiber(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  color: 'var(--text-1)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              fontSize: '0.875rem',
              marginTop: 10,
              background: 'linear-gradient(135deg, #7c5cf6 0%, #a855f7 100%)',
              boxShadow: '0 4px 20px rgba(124,92,246,0.3)',
            }}
          >
            {isSaving ? (
              <div className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} />
            ) : (
              'Save Targets'
            )}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
          Goals are stored locally and will synchronize with the server database.
        </p>
      </div>

    </div>
  );
}
