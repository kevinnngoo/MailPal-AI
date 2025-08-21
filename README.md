# 📬 MailPal AI

An intelligent inbox decluttering assistant that helps you unsubscribe from newsletters, clean up promotional emails, and manage inbox chaos automatically.

Built with **Next.js**, **Supabase**, and **Stripe** for a modern, scalable email management experience.

---

## ✨ Features

- 🔑 **Secure Authentication** - Supabase-powered login with row-level security
- 📨 **Smart Cleanup Dashboard** - Categorize and manage emails (subscriptions, promotions, spam)
- ⏰ **Automated Scheduling** - Set up recurring cleanups with custom rules
- 💳 **Premium Subscriptions** - Stripe integration for paid plans
- 📊 **Analytics & Insights** - Track cleanup history and inbox statistics
- ⚡ **Robust Error Handling** - Form validation and improved user experience

---

## 🛠 Tech Stack

- **Frontend**: Next.js 13+ (App Router), TypeScript
- **Database & Auth**: Supabase (PostgreSQL, RLS)
- **Payments**: Stripe (Subscriptions & Webhooks)
- **Tooling**: ESLint, Prettier, GitHub Actions

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/kevinnngoo/MailPal-AI.git
cd MailPal-AI
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and add your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID=your_price_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📂 Project Structure

```
MailPal-AI/
├── app/                # Next.js App Router pages
├── components/         # Reusable React components  
├── supabase/           # Database migrations & schema
├── public/             # Static assets
└── .env.example        # Environment variables template
```

---

## 🗺️ Roadmap

- [x] Supabase authentication setup
- [x] Stripe subscription integration
- [x] Dashboard with cleanup workflow
- [ ] Gmail API integration
- [ ] Chrome Extension (Manifest V3)
- [ ] Production deployment

---

## 🚀 Deployment

Deploy to Vercel in 3 steps:
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables and deploy

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built by [Kevin Ngo](https://github.com/kevinnngoo)**
