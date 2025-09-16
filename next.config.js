/** @type {import('next').NextConfig} */

// Environment variable validation
function validateEnvVars() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("⚠️  Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.warn(`   - ${varName}`);
    });
    console.warn("   Please check your .env.local file");
  }

  // Check for default/exposed secrets in development
  if (process.env.NODE_ENV === "development") {
    const defaultSecrets = [
      { name: "STRIPE_SECRET_KEY", value: process.env.STRIPE_SECRET_KEY, pattern: /^sk_test_/ },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        value: process.env.STRIPE_WEBHOOK_SECRET,
        pattern: /^whsec_/,
      },
    ];

    defaultSecrets.forEach(({ name, value, pattern }) => {
      if (value && !pattern.test(value)) {
        console.warn(`⚠️  ${name} may not be properly configured`);
      }
    });
  }
}

// Run validation
validateEnvVars();

const nextConfig = {};



module.exports = nextConfig;
