/** @type {import('next').NextConfig} */

// Environment variable validation
function validateEnvVars() {
  const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
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

if (process.env.NEXT_PUBLIC_TEMPO) {
  nextConfig["experimental"] = {
    // NextJS 13.4.8 up to 14.1.3:
    // swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
    // NextJS 14.1.3 to 14.2.11:
    swcPlugins: [[require.resolve("tempo-devtools/swc/0.90"), {}]],

    // NextJS 15+ (Not yet supported, coming soon)
  };
}

module.exports = nextConfig;
