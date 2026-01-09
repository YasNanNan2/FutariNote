# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ふたりノート** (Futari Note) - A couple's task management and gratitude-sharing application with two versions:
- `app/` - Basic localStorage-based version (Vercel deployed)
- `app-aws/` - AWS-integrated version with real-time sync and Google OAuth
- `infra/` - AWS CDK infrastructure code (TypeScript)

## Common Commands

### Frontend (app/ and app-aws/)
```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Infrastructure (infra/)
```bash
npm run build              # Compile TypeScript
npm run test               # Run Jest tests
npx cdk synth              # Synthesize CloudFormation
npx cdk diff -c env=dev    # Show changes vs deployed
npx cdk deploy -c env=dev  # Deploy to dev environment
npx cdk deploy -c env=prod # Deploy to prod environment
```

## Architecture

### 3-Stack CDK Architecture
1. **AuthStack** - Cognito User Pool with Google OAuth 2.0
   - Custom attributes: `partnerId`, `color`
2. **ApiStack** (depends on AuthStack) - AppSync GraphQL API + DynamoDB
   - VTL resolvers for CRUD operations
   - Lambda resolvers for `createInviteCode`, `joinCouple`
3. **HostingStack** - S3 + CloudFront for static hosting

### Environment Management
- Two environments: `dev` and `prod`
- Controlled via CDK context: `-c env=dev` or `-c env=prod`
- Region: `ap-northeast-1` (Tokyo)

### Coupling Mechanism
- 6-digit invite code with 24-hour TTL
- Both users share the same `partnerId` (UUID)
- All data is partitioned by `partnerId`

## Key Directories

```
app-aws/src/
├── components/auth/     # LoginScreen (Cognito)
├── components/tabs/     # HomeTab, CalendarTab, TimelineTab, etc.
├── graphql/             # queries.js, mutations.js, subscriptions.js
├── hooks/               # useAuth (Cognito integration)
└── aws-config.js        # Amplify configuration

infra/lib/
├── auth-stack.ts        # Cognito setup
├── api-stack.ts         # AppSync + DynamoDB
├── hosting-stack.ts     # S3 + CloudFront
├── graphql/             # Schema definitions
├── resolvers/           # VTL resolvers by entity
└── lambda/              # Lambda function source
```

## Documentation

- `docs/aws-basic-design.md` - AWS architecture, data models, security
- `docs/implementation-plan.md` - Phase-by-phase implementation guide
- `docs/setup-guide.md` - Environment setup instructions

## Technology Stack

**Frontend**: React 19, Vite 7, AWS Amplify 6, ESLint 9
**Infrastructure**: AWS CDK 2, TypeScript 5, Jest 30
**AWS Services**: Cognito, AppSync, DynamoDB, Lambda, S3, CloudFront
