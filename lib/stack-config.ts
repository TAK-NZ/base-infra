/**
 * Configuration interface for BaseInfra stack template
 * This makes the stack reusable across different projects and environments
 */

/**
 * Context-based configuration interface matching cdk.context.json structure
 * This is used directly by the stack without complex transformations
 */
export interface ContextEnvironmentConfig {
  stackName: string;
  r53ZoneName: string;
  vpcCidr?: string;
  networking: {
    enableRedundantNatGateways: boolean;
    createVpcEndpoints: boolean;
  };
  certificate: {
    transparencyLoggingEnabled: boolean;
  };
  general: {
    removalPolicy: string;
  };
  kms: {
    enableKeyRotation: boolean;
  };
  s3: {
    enableVersioning: boolean;
  };
  monitoring?: {
    enableCostTracking?: boolean;
    enableLayerDashboards?: boolean;
    enableAlerting?: boolean;
    enableBudgets?: boolean;
  };
  alerting?: {
    notificationEmail?: string;
    enableSmsAlerts?: boolean;
    ecsThresholds?: {
      cpuUtilization?: number;
      memoryUtilization?: number;
    };
  };
  budgets?: {
    environmentBudget?: number;
    componentBudget?: number;
  };
}
