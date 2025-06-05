export interface BaseParameters {
  envType: 'prod' | 'dev-test';
  vpcLocationId: number;
}

export function getParameters(props?: Partial<BaseParameters>): BaseParameters {
  return {
    envType: props?.envType ?? 'prod',
    vpcLocationId: props?.vpcLocationId ?? 0,
  };
}
