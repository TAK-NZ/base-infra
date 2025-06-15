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
exports.createKmsResources = createKmsResources;
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
function createKmsResources(scope, stackName) {
    // Create L2 KMS Key
    const kmsKey = new kms.Key(scope, 'KMS', {
        description: stackName,
        enableKeyRotation: false,
        removalPolicy: undefined, // Set as needed
    });
    // Add root account full access (explicit for clarity)
    kmsKey.addToResourcePolicy(new aws_iam_1.PolicyStatement({
        effect: aws_iam_1.Effect.ALLOW,
        principals: [new aws_iam_1.AccountRootPrincipal()],
        actions: ['kms:*'],
        resources: ['*'],
    }));
    // Create L2 Alias
    const kmsAlias = new kms.Alias(scope, 'KMSAlias', {
        aliasName: `alias/${stackName}`,
        targetKey: kmsKey,
    });
    return { kmsKey, kmsAlias };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia21zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSxnREF1QkM7QUExQkQseURBQTJDO0FBQzNDLGlEQUFvRjtBQUVwRixTQUFnQixrQkFBa0IsQ0FBQyxLQUFnQixFQUFFLFNBQWlCO0lBQ3BFLG9CQUFvQjtJQUNwQixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTtRQUN2QyxXQUFXLEVBQUUsU0FBUztRQUN0QixpQkFBaUIsRUFBRSxLQUFLO1FBQ3hCLGFBQWEsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCO0tBQzNDLENBQUMsQ0FBQztJQUVILHNEQUFzRDtJQUN0RCxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSx5QkFBZSxDQUFDO1FBQzdDLE1BQU0sRUFBRSxnQkFBTSxDQUFDLEtBQUs7UUFDcEIsVUFBVSxFQUFFLENBQUMsSUFBSSw4QkFBb0IsRUFBRSxDQUFDO1FBQ3hDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNsQixTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7S0FDakIsQ0FBQyxDQUFDLENBQUM7SUFFSixrQkFBa0I7SUFDbEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7UUFDaEQsU0FBUyxFQUFFLFNBQVMsU0FBUyxFQUFFO1FBQy9CLFNBQVMsRUFBRSxNQUFNO0tBQ2xCLENBQUMsQ0FBQztJQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7QUFDOUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0IHsgUG9saWN5U3RhdGVtZW50LCBFZmZlY3QsIEFjY291bnRSb290UHJpbmNpcGFsIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLbXNSZXNvdXJjZXMoc2NvcGU6IENvbnN0cnVjdCwgc3RhY2tOYW1lOiBzdHJpbmcpIHtcbiAgLy8gQ3JlYXRlIEwyIEtNUyBLZXlcbiAgY29uc3Qga21zS2V5ID0gbmV3IGttcy5LZXkoc2NvcGUsICdLTVMnLCB7XG4gICAgZGVzY3JpcHRpb246IHN0YWNrTmFtZSxcbiAgICBlbmFibGVLZXlSb3RhdGlvbjogZmFsc2UsXG4gICAgcmVtb3ZhbFBvbGljeTogdW5kZWZpbmVkLCAvLyBTZXQgYXMgbmVlZGVkXG4gIH0pO1xuXG4gIC8vIEFkZCByb290IGFjY291bnQgZnVsbCBhY2Nlc3MgKGV4cGxpY2l0IGZvciBjbGFyaXR5KVxuICBrbXNLZXkuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICBwcmluY2lwYWxzOiBbbmV3IEFjY291bnRSb290UHJpbmNpcGFsKCldLFxuICAgIGFjdGlvbnM6IFsna21zOionXSxcbiAgICByZXNvdXJjZXM6IFsnKiddLFxuICB9KSk7XG5cbiAgLy8gQ3JlYXRlIEwyIEFsaWFzXG4gIGNvbnN0IGttc0FsaWFzID0gbmV3IGttcy5BbGlhcyhzY29wZSwgJ0tNU0FsaWFzJywge1xuICAgIGFsaWFzTmFtZTogYGFsaWFzLyR7c3RhY2tOYW1lfWAsXG4gICAgdGFyZ2V0S2V5OiBrbXNLZXksXG4gIH0pO1xuXG4gIHJldHVybiB7IGttc0tleSwga21zQWxpYXMgfTtcbn1cbiJdfQ==