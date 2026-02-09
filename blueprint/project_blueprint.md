# UStart Restro Project Blueprint

## 1. Project Overview

UStart Restro is a high-performance web application designed for restaurant partners to manage their onboarding, menu, and orders. The application is built with a focus on speed, reliability, and premium user experience.

## 2. Architecture & Flow

### A. Authentication & Routing

- **Public Access**: Landing page for informative content and entry point.
- **Login**: Mobile-based OTP authentication yielding a JWT.
- **Route Guards**:
  - `RequireAuth`: Ensures valid JWT.
  - `RequirePending`: Redirects incomplete onboarding to the onboarding flow.
  - `RequireOnboarding`: Directs active partners to the Dashboard.

### B. Onboarding Engine

- **Multi-Step Form**: Personal Info -> Restaurant Info -> About Restaurant -> Documents.
- **Persistence**: Zustand with `persist` middleware scales the form state across refreshes.
- **File Handling**: Direct-to-S3 uploads via presigned URLs to offload the main API server.
- **Partial Updates**: Smart diffing logic ensures only modified fields are sent during updates.

### C. Operational Dashboard

- **Order Management**: Real-time order tracking.
- **Menu Editor**: Dynamic pricing, stock toggles, and tax management.

## 3. Technology Stack

| Component        | Technology                                           |
| :--------------- | :--------------------------------------------------- |
| **Framework**    | React 18 + TypeScript + Vite                         |
| **State**        | Zustand (Global) + AuthContext (Session)             |
| **Data**         | TanStack Query (Caching/Scrolling) + Axios (Network) |
| **Forms**        | React Hook Form + Zod (Validation)                   |
| **Styling**      | Tailwind CSS + Lucide Icons                          |
| **Localization** | i18next (English / Hindi)                            |

## 4. Key Directory Structure

- `/src/features`: Grouped by business domain (Auth, Onboarding, Dashboard).
- `/src/api`: Centralized HTTP client configurations and interceptors.
- `/src/components/ui`: Atomic, reusable design components.
- `/src/types`: Centralized TypeScript interfaces for API consistency.

## 5. Implementation Workflow

1. **Develop**: Components built in isolation within `features/`.
2. **State**: Bind components to Zustand for cross-step data sharing.
3. **Validate**: Schema-based validation using Zod.
4. **Communicate**: Use Axios interceptors for automated token management.
5. **Optimize**: Build-time compression (Brotli/Gzip) for production performance.
