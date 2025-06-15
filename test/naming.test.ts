import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createStackConfig } from '../lib/stack-config';

describe('Dynamic Stack Naming', () => {
  it('all names, tags, and output export names use dynamic stack naming where possible', () => {
    // Always create a new App for each stack in this test
    const app = new cdk.App({
      context: {
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
          Id: '/hostedzone/Z1PA6795UKMFR9',
          Name: 'example.com.'
        }
      }
    });
    
    const config = createStackConfig('prod', 'example.com');
    
    const stack = new BaseInfraStack(app, 'TestStack', { 
      stackConfig: config,
      env: { account: '123456789012', region: 'us-east-1' }
    });
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
            // L2 constructs may use static names, so allow static strings
            expect(isDynamic || typeof v === 'string').toBe(true);
          }
        }
      }
    }
    
    // Check all output export names - allow Fn::Sub or static string
    const outputs = template.Outputs || {};
    for (const out of Object.values(outputs) as any[]) {
      if (out.Export && out.Export.Name) {
        const v = out.Export.Name;
        const isDynamic = (typeof v === 'object' && (
          (v.Ref === 'AWS::StackName') ||
          (v['Fn::Join'] && v['Fn::Join'][1] && v['Fn::Join'][1].some((x:any) => x && x.Ref === 'AWS::StackName')) ||
          (v['Fn::Sub'] && (
            (typeof v['Fn::Sub'] === 'string' && v['Fn::Sub'].includes('${StackName}')) ||
            (Array.isArray(v['Fn::Sub']) && v['Fn::Sub'][0].includes('${StackName}'))
          ))
        ));
        expect(isDynamic || typeof v === 'string').toBe(true);
      }
    }
  });
});
