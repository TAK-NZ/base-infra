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
    monitoring: {
      ...baseConfig.monitoring,
      enableCostTracking: app.node.tryGetContext('enableCostTracking') ?? baseConfig.monitoring?.enableCostTracking,
      enableLayerDashboards: app.node.tryGetContext('enableLayerDashboards') ?? baseConfig.monitoring?.enableLayerDashboards,
      enableAlerting: app.node.tryGetContext('enableAlerting') ?? baseConfig.monitoring?.enableAlerting,
      enableBudgets: app.node.tryGetContext('enableBudgets') ?? baseConfig.monitoring?.enableBudgets,
    },
    alerting: {
      ...baseConfig.alerting,
      notificationEmail: app.node.tryGetContext('notificationEmail') ?? baseConfig.alerting?.notificationEmail,
      enableSmsAlerts: app.node.tryGetContext('enableSmsAlerts') ?? baseConfig.alerting?.enableSmsAlerts,
      ecsThresholds: {
        ...baseConfig.alerting?.ecsThresholds,
        cpuUtilization: app.node.tryGetContext('cpuUtilization') ?? baseConfig.alerting?.ecsThresholds?.cpuUtilization,
        memoryUtilization: app.node.tryGetContext('memoryUtilization') ?? baseConfig.alerting?.ecsThresholds?.memoryUtilization,
      },
    },
    budgets: {
      ...baseConfig.budgets,
      environmentBudget: app.node.tryGetContext('environmentBudget') ?? baseConfig.budgets?.environmentBudget,
      componentBudget: app.node.tryGetContext('componentBudget') ?? baseConfig.budgets?.componentBudget,
    },
  };
}
