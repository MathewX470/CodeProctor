# CodeProctor_ Web Application (`apps/web`)

This microservice houses the primary **CodeProctor Web Portal, Serverless Authentication Engine, Problem Banking System, and Interactive Assessment UI**. It is built on modern Next.js 16 App Router architecture and styled using our custom Cyber-Brutalist Design System.

---

## ⚡ Technologies & Libraries

- **Framework**: Next.js 16 (App Router & Serverless API Handlers)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Variables (`globals.css`)
- **Animations & UX**: Framer Motion kinetic choreography, Lenis smooth scrolling, Sonner high-contrast notifications, and Lucide React iconography.
- **Database Driver**: `@neondatabase/serverless` connection pool paired with `@prisma/adapter-neon` for lightning-fast serverless query performance.
- **ORM & Schema**: Prisma v7 (`prisma/schema.prisma`) featuring comprehensive 10-domain relational data modeling.
- **Authentication**: Better Auth (`better-auth/react` and `better-auth/next-js`) handling RBAC, sessions, and encrypted cookies.

---

## 🔐 Authentication & Session Architecture

Our authentication infrastructure avoids traditional managed user pool SaaS lock-in by executing directly against your cloud database:
1. **Server Configuration**: [src/lib/auth.ts](file:///d:/Slides/S9/CodeProctor/apps/web/src/lib/auth.ts) instantiates Better Auth using our serverless Prisma driver adapter.
2. **REST Endpoints**: [src/app/api/auth/[...all]/route.ts](file:///d:/Slides/S9/CodeProctor/apps/web/src/app/api/auth/[...all]/route.ts) exposes over 20 dynamic endpoints for account creation, credential verification, and session state retrieval.
3. **Frontend Client**: [src/lib/auth-client.ts](file:///d:/Slides/S9/CodeProctor/apps/web/src/lib/auth-client.ts) exports typed React hooks (`useSession`, `signIn`, `signUp`, and `signOut`).
4. **Auth Portals**: Interactive forms at `/login` and `/signup` feature passphrase mismatch guards, real-time loading state animations (`INITIALIZING... [ ■■■□□ ]`), and password visibility eye toggles.

---

## 🛠️ Development & Database Workflow

### Environment Configuration (`.env`)
Before spinning up the server, populate `.env` in this folder:
```env
DATABASE_URL="postgresql://<user>:<password>@<neon-hostname>/neondb?sslmode=require"
BETTER_AUTH_SECRET="a_random_32_character_hex_secret_key"
BETTER_AUTH_URL="http://localhost:3000"
```

### Essential CLI Commands

| Command | Action & Purpose |
| :--- | :--- |
| `npm run dev` | Boots Next.js live development server on `http://localhost:3000` with Turbopack fast refreshes. |
| `npm run build` | Compiles an optimized production build of all routes, styles, and API server endpoints. |
| `npm run lint` | Runs automated ESLint static typing checks across all React pages and utility modules. |
| `npx prisma db push` | Pushes schema alterations from `schema.prisma` directly to your Neon PostgreSQL instance without generating migration files. |
| `npx prisma generate` | Regenerates local TypeScript `@prisma/client` types with updated table signatures and relations. |

---

## 📂 Key Directory Structure

```text
src/
├── app/
│   ├── (auth)/        # Cyber-terminal /login and /signup candidate authentication routes
│   ├── api/auth/      # Catch-all Better Auth API REST route handlers
│   ├── globals.css    # Global brutalist theme tokens, grain textures, and grid backgrounds
│   └── page.tsx       # Landing experience homepage
├── components/
│   └── landing/       # Edge-to-edge marketing sections (Hero, Nav, Marquee, Sandbox, Proctor, Footer)
└── lib/
    ├── auth.ts        # Backend Better Auth engine connection
    ├── auth-client.ts # Frontend Better Auth React hooks SDK
    └── prisma.ts      # Singleton Prisma v7 client configured with Neon serverless adapter
```
