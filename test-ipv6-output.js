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
const assertions_1 = require("aws-cdk-lib/assertions");
const base_infra_stack_1 = require("./lib/base-infra-stack");
// Create a test app
const app = new cdk.App({
    context: {
        r53ZoneName: 'example.com',
        // Mock the hosted zone lookup to avoid AWS calls
        'hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false': {
            Id: '/hostedzone/Z1PA6795UKMFR9',
            Name: 'example.com.'
        }
    }
});
// Create the stack
const stack = new base_infra_stack_1.BaseInfraStack(app, 'TestStack', {
    envType: 'prod',
    env: { account: '123456789012', region: 'us-east-1' }
});
// Get the template
const template = assertions_1.Template.fromStack(stack);
const outputs = template.toJSON().Outputs;
// Check for IPv6 output
if (outputs.VpcCidrIpv6Output) {
    console.log('✅ IPv6 CIDR output is present!');
    console.log('IPv6 Output:', JSON.stringify(outputs.VpcCidrIpv6Output, null, 2));
    console.log('Export Name:', outputs.VpcCidrIpv6Output.Export?.Name);
}
else {
    console.log('❌ IPv6 CIDR output is missing');
}
// List all outputs for reference
console.log('\nAll outputs:');
Object.keys(outputs).forEach(key => {
    console.log(`- ${key}`);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1pcHY2LW91dHB1dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QtaXB2Ni1vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBa0Q7QUFDbEQsNkRBQXdEO0FBRXhELG9CQUFvQjtBQUNwQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUM7SUFDdEIsT0FBTyxFQUFFO1FBQ1AsV0FBVyxFQUFFLGFBQWE7UUFDMUIsaURBQWlEO1FBQ2pELDRGQUE0RixFQUFFO1lBQzVGLEVBQUUsRUFBRSw0QkFBNEI7WUFDaEMsSUFBSSxFQUFFLGNBQWM7U0FDckI7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVILG1CQUFtQjtBQUNuQixNQUFNLEtBQUssR0FBRyxJQUFJLGlDQUFjLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRTtJQUNqRCxPQUFPLEVBQUUsTUFBTTtJQUNmLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtDQUN0RCxDQUFDLENBQUM7QUFFSCxtQkFBbUI7QUFDbkIsTUFBTSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0MsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQztBQUUxQyx3QkFBd0I7QUFDeEIsSUFBSSxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN0RSxDQUFDO0tBQU0sQ0FBQztJQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsaUNBQWlDO0FBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM5QixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtJQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgQmFzZUluZnJhU3RhY2sgfSBmcm9tICcuL2xpYi9iYXNlLWluZnJhLXN0YWNrJztcblxuLy8gQ3JlYXRlIGEgdGVzdCBhcHBcbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKHtcbiAgY29udGV4dDoge1xuICAgIHI1M1pvbmVOYW1lOiAnZXhhbXBsZS5jb20nLFxuICAgIC8vIE1vY2sgdGhlIGhvc3RlZCB6b25lIGxvb2t1cCB0byBhdm9pZCBBV1MgY2FsbHNcbiAgICAnaG9zdGVkLXpvbmU6YWNjb3VudD0xMjM0NTY3ODkwMTI6ZG9tYWluTmFtZT1leGFtcGxlLmNvbTpyZWdpb249dXMtZWFzdC0xOnByaXZhdGVab25lPWZhbHNlJzoge1xuICAgICAgSWQ6ICcvaG9zdGVkem9uZS9aMVBBNjc5NVVLTUZSOScsXG4gICAgICBOYW1lOiAnZXhhbXBsZS5jb20uJ1xuICAgIH1cbiAgfVxufSk7XG5cbi8vIENyZWF0ZSB0aGUgc3RhY2tcbmNvbnN0IHN0YWNrID0gbmV3IEJhc2VJbmZyYVN0YWNrKGFwcCwgJ1Rlc3RTdGFjaycsIHsgXG4gIGVudlR5cGU6ICdwcm9kJyxcbiAgZW52OiB7IGFjY291bnQ6ICcxMjM0NTY3ODkwMTInLCByZWdpb246ICd1cy1lYXN0LTEnIH1cbn0pO1xuXG4vLyBHZXQgdGhlIHRlbXBsYXRlXG5jb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG5jb25zdCBvdXRwdXRzID0gdGVtcGxhdGUudG9KU09OKCkuT3V0cHV0cztcblxuLy8gQ2hlY2sgZm9yIElQdjYgb3V0cHV0XG5pZiAob3V0cHV0cy5WcGNDaWRySXB2Nk91dHB1dCkge1xuICBjb25zb2xlLmxvZygn4pyFIElQdjYgQ0lEUiBvdXRwdXQgaXMgcHJlc2VudCEnKTtcbiAgY29uc29sZS5sb2coJ0lQdjYgT3V0cHV0OicsIEpTT04uc3RyaW5naWZ5KG91dHB1dHMuVnBjQ2lkcklwdjZPdXRwdXQsIG51bGwsIDIpKTtcbiAgY29uc29sZS5sb2coJ0V4cG9ydCBOYW1lOicsIG91dHB1dHMuVnBjQ2lkcklwdjZPdXRwdXQuRXhwb3J0Py5OYW1lKTtcbn0gZWxzZSB7XG4gIGNvbnNvbGUubG9nKCfinYwgSVB2NiBDSURSIG91dHB1dCBpcyBtaXNzaW5nJyk7XG59XG5cbi8vIExpc3QgYWxsIG91dHB1dHMgZm9yIHJlZmVyZW5jZVxuY29uc29sZS5sb2coJ1xcbkFsbCBvdXRwdXRzOicpO1xuT2JqZWN0LmtleXMob3V0cHV0cykuZm9yRWFjaChrZXkgPT4ge1xuICBjb25zb2xlLmxvZyhgLSAke2tleX1gKTtcbn0pO1xuIl19