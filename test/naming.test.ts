import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';

describe('Dynamic Stack Naming', () => {
  it('all names, tags, and output export names use dynamic stack naming', () => {
    const app = new cdk.App();
    const stack = new CdkStack(app, 'TestStack', { envType: 'prod' });
    const template = Template.fromStack(stack).toJSON();
    
    // Check all Name tags
    const resources = Object.values(template.Resources || {}) as any[];
    for (const res of resources) {
      if (res.Properties && res.Properties.Tags) {
        for (const tag of res.Properties.Tags) {
          if (tag.Key === 'Name') {
            const v = tag.Value;
            const isDynamic = (typeof v === 'object' && (
              (v.Ref === 'AWS::StackName') ||
              (v['Fn::Join'] && v['Fn::Join'][1] && v['Fn::Join'][1].some((x:any) => x && x.Ref === 'AWS::StackName'))
            ));
            expect(isDynamic).toBe(true);
          }
        }
      }
    }
    
    // Check all output export names - now using Fn::Sub with StackName parameter
    const outputs = template.Outputs || {};
    for (const out of Object.values(outputs) as any[]) {
      if (out.Export && out.Export.Name) {
        const v = out.Export.Name;
        const isDynamic = (typeof v === 'object' && (
          (v.Ref === 'AWS::StackName') ||
          (v['Fn::Join'] && v['Fn::Join'][1] && v['Fn::Join'][1].some((x:any) => x && x.Ref === 'AWS::StackName')) ||
          (v['Fn::Sub'] && Array.isArray(v['Fn::Sub']) && v['Fn::Sub'].length === 2 && 
           typeof v['Fn::Sub'][0] === 'string' && v['Fn::Sub'][0].includes('${StackName}') &&
           v['Fn::Sub'][1] && v['Fn::Sub'][1].StackName && v['Fn::Sub'][1].StackName.Ref === 'StackName')
        ));
        expect(isDynamic).toBe(true);
      }
    }
  });
});
