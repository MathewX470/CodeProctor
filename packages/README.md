# CodeProctor_ Monorepo Shared Packages (`packages/`)

This workspace folder contains internal **shared modules, type definitions, utility functions, and universal design tokens** designed to keep code dry, maintainable, and synchronized across all CodeProctor applications and microservices.

---

## 📦 Package Inventory

### 1. `packages/ui` (Design System Components)
- **Purpose**: Holds universal, accessible React components fashioned under our custom Cyber-Brutalist design language.
- **Contents**: Button primitives, high-contrast modal dialogue wrappers, terminal form inputs, neon alert badges, and shared logo assets (`<Logo />` and `<LogoMark />`).

### 2. `packages/shared-types` (Universal TypeScript Schemas)
- **Purpose**: Guaranteed type safety across API boundaries (e.g., between Next.js frontend calls and BullMQ execution queue payloads).
- **Contents**: Shared interface definitions for Code Judge job payloads, submission status enumerations, proctoring telemetry timestamps, and WebSocket violation stream envelopes.

### 3. `packages/shared-utils` (Core Helpers & Formatting)
- **Purpose**: Common logic needed across multiple services without duplicated boilerplate.
- **Contents**: Date and duration formatters, code syntax sanitizers, cryptographic ID helpers, and telemetry statistics calculators.

---

## 🔗 How Packages are Consumed
In our npm workspace monorepo structure, these packages are linked natively into `apps/web` and `apps/worker` via package imports without requiring manual publishing to public npm registry servers!
