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
const stack_config_1 = require("../lib/stack-config");
const utils_1 = require("../lib/utils");
const app = new cdk.App();
// Read configuration from CDK context only (command line --context parameters)
const ProjectName = app.node.tryGetContext('project');
const customStackName = app.node.tryGetContext('stackName');
const envType = app.node.tryGetContext('envType') || 'dev-test';
const r53ZoneName = app.node.tryGetContext('r53ZoneName');
// Validate all required parameters using utils
(0, utils_1.validateCdkContextParams)({
    envType,
    stackName: customStackName,
    r53ZoneName
});
// Read optional context overrides
const overrides = {
    ...(app.node.tryGetContext('vpcMajorId') && {
        networking: { vpcMajorId: parseInt(app.node.tryGetContext('vpcMajorId'), 10) }
    }),
    ...(app.node.tryGetContext('vpcMinorId') && {
        networking: { vpcMinorId: parseInt(app.node.tryGetContext('vpcMinorId'), 10) }
    }),
    ...(app.node.tryGetContext('createNatGateways') !== undefined && {
        networking: { createNatGateways: app.node.tryGetContext('createNatGateways') === 'true' }
    }),
    ...(app.node.tryGetContext('createVpcEndpoints') !== undefined && {
        networking: { createVpcEndpoints: app.node.tryGetContext('createVpcEndpoints') === 'true' }
    }),
};
// Create the stack name using the required customStackName
const stackName = `TAK-${customStackName}-BaseInfra`; // Always use TAK prefix
// Create complete configuration
const configResult = (0, stack_config_1.createStackConfig)(envType, r53ZoneName, Object.keys(overrides).length > 0 ? overrides : undefined, 'TAK', // Always use TAK as project prefix
'BaseInfra');
// Create the stack with environment configuration
const stack = new base_infra_stack_1.BaseInfraStack(app, stackName, {
    configResult: configResult,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2',
    },
    tags: {
        Project: ProjectName || 'TAK',
        Environment: customStackName,
        Component: 'BaseInfra',
        ManagedBy: 'CDK'
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsaURBQW1DO0FBQ25DLDhEQUF5RDtBQUN6RCxzREFBd0Q7QUFDeEQsd0NBQXdEO0FBRXhELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLCtFQUErRTtBQUMvRSxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0RCxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM1RCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxVQUFVLENBQUM7QUFDaEUsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFMUQsK0NBQStDO0FBQy9DLElBQUEsZ0NBQXdCLEVBQUM7SUFDdkIsT0FBTztJQUNQLFNBQVMsRUFBRSxlQUFlO0lBQzFCLFdBQVc7Q0FDWixDQUFDLENBQUM7QUFFSCxrQ0FBa0M7QUFDbEMsTUFBTSxTQUFTLEdBQUc7SUFDaEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJO1FBQzFDLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7S0FDL0UsQ0FBQztJQUNGLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSTtRQUMxQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0tBQy9FLENBQUM7SUFDRixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsS0FBSyxTQUFTLElBQUk7UUFDL0QsVUFBVSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsS0FBSyxNQUFNLEVBQUU7S0FDMUYsQ0FBQztJQUNGLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLFNBQVMsSUFBSTtRQUNoRSxVQUFVLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLE1BQU0sRUFBRTtLQUM1RixDQUFDO0NBQ0gsQ0FBQztBQUVGLDJEQUEyRDtBQUMzRCxNQUFNLFNBQVMsR0FBRyxPQUFPLGVBQWUsWUFBWSxDQUFDLENBQUMsd0JBQXdCO0FBRTlFLGdDQUFnQztBQUNoQyxNQUFNLFlBQVksR0FBRyxJQUFBLGdDQUFpQixFQUNwQyxPQUE4QixFQUM5QixXQUFXLEVBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFDekQsS0FBSyxFQUFFLG1DQUFtQztBQUMxQyxXQUFXLENBQ1osQ0FBQztBQUVGLGtEQUFrRDtBQUNsRCxNQUFNLEtBQUssR0FBRyxJQUFJLGlDQUFjLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRTtJQUMvQyxZQUFZLEVBQUUsWUFBWTtJQUMxQixHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCO0tBQzNEO0lBQ0QsSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLFdBQVcsSUFBSSxLQUFLO1FBQzdCLFdBQVcsRUFBRSxlQUFlO1FBQzVCLFNBQVMsRUFBRSxXQUFXO1FBQ3RCLFNBQVMsRUFBRSxLQUFLO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEJhc2VJbmZyYVN0YWNrIH0gZnJvbSAnLi4vbGliL2Jhc2UtaW5mcmEtc3RhY2snO1xuaW1wb3J0IHsgY3JlYXRlU3RhY2tDb25maWcgfSBmcm9tICcuLi9saWIvc3RhY2stY29uZmlnJztcbmltcG9ydCB7IHZhbGlkYXRlQ2RrQ29udGV4dFBhcmFtcyB9IGZyb20gJy4uL2xpYi91dGlscyc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIFJlYWQgY29uZmlndXJhdGlvbiBmcm9tIENESyBjb250ZXh0IG9ubHkgKGNvbW1hbmQgbGluZSAtLWNvbnRleHQgcGFyYW1ldGVycylcbmNvbnN0IFByb2plY3ROYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgncHJvamVjdCcpO1xuY29uc3QgY3VzdG9tU3RhY2tOYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnc3RhY2tOYW1lJyk7XG5jb25zdCBlbnZUeXBlID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52VHlwZScpIHx8ICdkZXYtdGVzdCc7XG5jb25zdCByNTNab25lTmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3I1M1pvbmVOYW1lJyk7XG5cbi8vIFZhbGlkYXRlIGFsbCByZXF1aXJlZCBwYXJhbWV0ZXJzIHVzaW5nIHV0aWxzXG52YWxpZGF0ZUNka0NvbnRleHRQYXJhbXMoe1xuICBlbnZUeXBlLFxuICBzdGFja05hbWU6IGN1c3RvbVN0YWNrTmFtZSxcbiAgcjUzWm9uZU5hbWVcbn0pO1xuXG4vLyBSZWFkIG9wdGlvbmFsIGNvbnRleHQgb3ZlcnJpZGVzXG5jb25zdCBvdmVycmlkZXMgPSB7XG4gIC4uLihhcHAubm9kZS50cnlHZXRDb250ZXh0KCd2cGNNYWpvcklkJykgJiYge1xuICAgIG5ldHdvcmtpbmc6IHsgdnBjTWFqb3JJZDogcGFyc2VJbnQoYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgndnBjTWFqb3JJZCcpLCAxMCkgfVxuICB9KSxcbiAgLi4uKGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3ZwY01pbm9ySWQnKSAmJiB7XG4gICAgbmV0d29ya2luZzogeyB2cGNNaW5vcklkOiBwYXJzZUludChhcHAubm9kZS50cnlHZXRDb250ZXh0KCd2cGNNaW5vcklkJyksIDEwKSB9XG4gIH0pLFxuICAuLi4oYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnY3JlYXRlTmF0R2F0ZXdheXMnKSAhPT0gdW5kZWZpbmVkICYmIHtcbiAgICBuZXR3b3JraW5nOiB7IGNyZWF0ZU5hdEdhdGV3YXlzOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdjcmVhdGVOYXRHYXRld2F5cycpID09PSAndHJ1ZScgfVxuICB9KSxcbiAgLi4uKGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2NyZWF0ZVZwY0VuZHBvaW50cycpICE9PSB1bmRlZmluZWQgJiYge1xuICAgIG5ldHdvcmtpbmc6IHsgY3JlYXRlVnBjRW5kcG9pbnRzOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdjcmVhdGVWcGNFbmRwb2ludHMnKSA9PT0gJ3RydWUnIH1cbiAgfSksXG59O1xuXG4vLyBDcmVhdGUgdGhlIHN0YWNrIG5hbWUgdXNpbmcgdGhlIHJlcXVpcmVkIGN1c3RvbVN0YWNrTmFtZVxuY29uc3Qgc3RhY2tOYW1lID0gYFRBSy0ke2N1c3RvbVN0YWNrTmFtZX0tQmFzZUluZnJhYDsgLy8gQWx3YXlzIHVzZSBUQUsgcHJlZml4XG5cbi8vIENyZWF0ZSBjb21wbGV0ZSBjb25maWd1cmF0aW9uXG5jb25zdCBjb25maWdSZXN1bHQgPSBjcmVhdGVTdGFja0NvbmZpZyhcbiAgZW52VHlwZSBhcyAncHJvZCcgfCAnZGV2LXRlc3QnLFxuICByNTNab25lTmFtZSxcbiAgT2JqZWN0LmtleXMob3ZlcnJpZGVzKS5sZW5ndGggPiAwID8gb3ZlcnJpZGVzIDogdW5kZWZpbmVkLFxuICAnVEFLJywgLy8gQWx3YXlzIHVzZSBUQUsgYXMgcHJvamVjdCBwcmVmaXhcbiAgJ0Jhc2VJbmZyYSdcbik7XG5cbi8vIENyZWF0ZSB0aGUgc3RhY2sgd2l0aCBlbnZpcm9ubWVudCBjb25maWd1cmF0aW9uXG5jb25zdCBzdGFjayA9IG5ldyBCYXNlSW5mcmFTdGFjayhhcHAsIHN0YWNrTmFtZSwge1xuICBjb25maWdSZXN1bHQ6IGNvbmZpZ1Jlc3VsdCxcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTiB8fCAnYXAtc291dGhlYXN0LTInLFxuICB9LFxuICB0YWdzOiB7XG4gICAgUHJvamVjdDogUHJvamVjdE5hbWUgfHwgJ1RBSycsXG4gICAgRW52aXJvbm1lbnQ6IGN1c3RvbVN0YWNrTmFtZSxcbiAgICBDb21wb25lbnQ6ICdCYXNlSW5mcmEnLFxuICAgIE1hbmFnZWRCeTogJ0NESydcbiAgfVxufSk7Il19