#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const base_infra_stack_1 = require("../lib/base-infra-stack");
const app = new cdk.App();
// Get environment from context (defaults to dev-test)
const envName = app.node.tryGetContext('env') || 'dev-test';
// Get the environment configuration from context
// CDK automatically handles context overrides via --context flag
const envConfig = app.node.tryGetContext(envName);
const defaults = app.node.tryGetContext('tak-defaults');
if (!envConfig) {
    throw new Error(`
❌ Environment configuration for '${envName}' not found in cdk.json

Usage:
  npx cdk deploy --context env=dev-test
  npx cdk deploy --context env=prod

Expected cdk.json structure:
{
  "context": {
    "dev-test": { ... },
    "prod": { ... }
  }
}
  `);
}
// Create stack name
const stackName = `TAK-${envConfig.stackName}-BaseInfra`;
// Create the stack
const stack = new base_infra_stack_1.BaseInfraStack(app, stackName, {
    environment: envName,
    envConfig: envConfig,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || defaults?.region || 'ap-southeast-2',
    },
    tags: {
        Project: defaults?.project || 'TAK',
        Environment: envConfig.stackName,
        Component: defaults?.component || 'BaseInfra',
        ManagedBy: 'CDK'
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsaURBQW1DO0FBQ25DLDhEQUF5RDtBQUV6RCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixzREFBc0Q7QUFDdEQsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksVUFBVSxDQUFDO0FBRTVELGlEQUFpRDtBQUNqRCxpRUFBaUU7QUFDakUsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbEQsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFeEQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQzttQ0FDaUIsT0FBTzs7Ozs7Ozs7Ozs7OztHQWF2QyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsb0JBQW9CO0FBQ3BCLE1BQU0sU0FBUyxHQUFHLE9BQU8sU0FBUyxDQUFDLFNBQVMsWUFBWSxDQUFDO0FBRXpELG1CQUFtQjtBQUNuQixNQUFNLEtBQUssR0FBRyxJQUFJLGlDQUFjLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtJQUMvQyxXQUFXLEVBQUUsT0FBOEI7SUFDM0MsU0FBUyxFQUFFLFNBQVM7SUFDcEIsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLFFBQVEsRUFBRSxNQUFNLElBQUksZ0JBQWdCO0tBQy9FO0lBQ0QsSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLElBQUksS0FBSztRQUNuQyxXQUFXLEVBQUUsU0FBUyxDQUFDLFNBQVM7UUFDaEMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLElBQUksV0FBVztRQUM3QyxTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBCYXNlSW5mcmFTdGFjayB9IGZyb20gJy4uL2xpYi9iYXNlLWluZnJhLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gR2V0IGVudmlyb25tZW50IGZyb20gY29udGV4dCAoZGVmYXVsdHMgdG8gZGV2LXRlc3QpXG5jb25zdCBlbnZOYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52JykgfHwgJ2Rldi10ZXN0JztcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBjb25maWd1cmF0aW9uIGZyb20gY29udGV4dFxuLy8gQ0RLIGF1dG9tYXRpY2FsbHkgaGFuZGxlcyBjb250ZXh0IG92ZXJyaWRlcyB2aWEgLS1jb250ZXh0IGZsYWdcbmNvbnN0IGVudkNvbmZpZyA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoZW52TmFtZSk7XG5jb25zdCBkZWZhdWx0cyA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3Rhay1kZWZhdWx0cycpO1xuXG5pZiAoIWVudkNvbmZpZykge1xuICB0aHJvdyBuZXcgRXJyb3IoYFxu4p2MIEVudmlyb25tZW50IGNvbmZpZ3VyYXRpb24gZm9yICcke2Vudk5hbWV9JyBub3QgZm91bmQgaW4gY2RrLmpzb25cblxuVXNhZ2U6XG4gIG5weCBjZGsgZGVwbG95IC0tY29udGV4dCBlbnY9ZGV2LXRlc3RcbiAgbnB4IGNkayBkZXBsb3kgLS1jb250ZXh0IGVudj1wcm9kXG5cbkV4cGVjdGVkIGNkay5qc29uIHN0cnVjdHVyZTpcbntcbiAgXCJjb250ZXh0XCI6IHtcbiAgICBcImRldi10ZXN0XCI6IHsgLi4uIH0sXG4gICAgXCJwcm9kXCI6IHsgLi4uIH1cbiAgfVxufVxuICBgKTtcbn1cblxuLy8gQ3JlYXRlIHN0YWNrIG5hbWVcbmNvbnN0IHN0YWNrTmFtZSA9IGBUQUstJHtlbnZDb25maWcuc3RhY2tOYW1lfS1CYXNlSW5mcmFgO1xuXG4vLyBDcmVhdGUgdGhlIHN0YWNrXG5jb25zdCBzdGFjayA9IG5ldyBCYXNlSW5mcmFTdGFjayhhcHAsIHN0YWNrTmFtZSwge1xuICBlbnZpcm9ubWVudDogZW52TmFtZSBhcyAncHJvZCcgfCAnZGV2LXRlc3QnLFxuICBlbnZDb25maWc6IGVudkNvbmZpZyxcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCBkZWZhdWx0cz8ucmVnaW9uIHx8ICdhcC1zb3V0aGVhc3QtMicsXG4gIH0sXG4gIHRhZ3M6IHtcbiAgICBQcm9qZWN0OiBkZWZhdWx0cz8ucHJvamVjdCB8fCAnVEFLJyxcbiAgICBFbnZpcm9ubWVudDogZW52Q29uZmlnLnN0YWNrTmFtZSxcbiAgICBDb21wb25lbnQ6IGRlZmF1bHRzPy5jb21wb25lbnQgfHwgJ0Jhc2VJbmZyYScsXG4gICAgTWFuYWdlZEJ5OiAnQ0RLJ1xuICB9XG59KTtcbiJdfQ==