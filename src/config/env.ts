/**
 * Environment variables validation
 * Crashes application startup if required settings are missing or misconfigured.
 */

const isServer = typeof window === 'undefined';

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const requiredServerEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

export function validateEnv() {
  // Bypassed if explicitly running in local Demo/Test mode
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.OPENAI_API_KEY === 'demo';
  
  if (isDemoMode) {
    if (isServer) {
      console.log('✦ Demo/Test Mode Active: Strict environment variable checks bypassed.');
    }
    return;
  }

  const missing: string[] = [];

  // 1. Validate public variables (required on both server and client)
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === 'your_supabase_project_url' || value === 'your_supabase_anon_key') {
      missing.push(key);
    }
  }

  // 2. Validate server variables (only check on the server)
  if (isServer) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      missing.push('OPENAI_API_KEY');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `🚨 Startup Error: Missing or invalid environment variable(s): ${missing.join(', ')}. Please configure them in your .env.local file.`;
    console.error(errorMsg);
    
    // Throw an error to crash Next.js compilation/boot process if variables are missing
    if (typeof process !== 'undefined' && process.exit) {
      console.error('Terminating process due to missing configuration...');
      process.exit(1);
    } else {
      throw new Error(errorMsg);
    }
  }
}

// Perform validation on module import
validateEnv();
