/**
 * Simplified context override utilities
 * Handles command-line context overrides with minimal complexity
 */

import * as cdk from 'aws-cdk-lib';
import { ContextEnvironmentConfig } from '../stack-config';

/**
 * Applies context overrides to environment configuration
 * 
 * @param app - CDK App instance to read context from
 * @param baseConfig - Base environment configuration from cdk.json
 * @returns Configuration with applied overrides
 */
export function applyContextOverrides(
  app: cdk.App, 
  baseConfig: ContextEnvironmentConfig
): ContextEnvironmentConfig {
  // Top-level overrides
  const topLevelOverrides = {
    r53ZoneName: app.node.tryGetContext('r53ZoneName'),
    vpcCidr: app.node.tryGetContext('vpcCidr'),
    stackName: app.node.tryGetContext('stackName'),
  };

  return {
    ...baseConfig,
    ...Object.fromEntries(Object.entries(topLevelOverrides).filter(([_, v]) => v !== undefined)),
    networking: {
      ...baseConfig.networking,
      enableRedundantNatGateways: app.node.tryGetContext('enableRedundantNatGateways') ?? baseConfig.networking.enableRedundantNatGateways,
      createVpcEndpoints: app.node.tryGetContext('createVpcEndpoints') ?? baseConfig.networking.createVpcEndpoints,
    },
    certificate: {
      ...baseConfig.certificate,
      transparencyLoggingEnabled: app.node.tryGetContext('transparencyLoggingEnabled') ?? baseConfig.certificate.transparencyLoggingEnabled,
    },
    general: {
      ...baseConfig.general,
      removalPolicy: app.node.tryGetContext('removalPolicy') || baseConfig.general.removalPolicy,
    },
    kms: {
      ...baseConfig.kms,
      enableKeyRotation: app.node.tryGetContext('enableKeyRotation') ?? baseConfig.kms.enableKeyRotation,
    },
    s3: {
      ...baseConfig.s3,
      enableVersioning: app.node.tryGetContext('enableVersioning') ?? baseConfig.s3.enableVersioning,
    },
    ecr: {
      ...baseConfig.ecr,
      imageRetentionCount: app.node.tryGetContext('imageRetentionCount') ?? baseConfig.ecr.imageRetentionCount,
      scanOnPush: app.node.tryGetContext('scanOnPush') ?? baseConfig.ecr.scanOnPush,
    },
  };
}
