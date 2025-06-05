// Utility functions for CDK tests
export function getResourceByType(template: any, type: string) {
  return Object.values(template.Resources).filter((r: any) => r.Type === type);
}

export function getOutputByName(template: any, name: string) {
  return template.Outputs[name];
}
