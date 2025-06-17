// Utility functions for CDK tests

// CloudFormation template interfaces
export interface CloudFormationResource {
  Type: string;
  Properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CloudFormationOutput {
  Value: unknown;
  Description?: string;
  Export?: { Name: string };
  [key: string]: unknown;
}

export interface CloudFormationTemplate {
  Resources?: Record<string, CloudFormationResource>;
  Outputs?: Record<string, CloudFormationOutput>;
  Parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

export function getResourceByType(template: CloudFormationTemplate, type: string): CloudFormationResource[] {
  return Object.values(template.Resources || {}).filter((r: CloudFormationResource) => r.Type === type);
}

export function getOutputByName(template: CloudFormationTemplate, name: string): CloudFormationOutput | undefined {
  return template.Outputs?.[name];
}
