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
exports.createAcmCertificate = createAcmCertificate;
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
function createAcmCertificate(scope, props) {
    if (!props.zoneName) {
        throw new Error('R53 zone name is required for ACM certificate creation');
    }
    // Look up the existing public hosted zone
    const hostedZone = route53.HostedZone.fromLookup(scope, 'PublicHostedZone', {
        domainName: props.zoneName,
        privateZone: false // Ensure it's a public zone
    });
    // Create ACM certificate with multiple domain names
    const certificate = new acm.Certificate(scope, 'PublicCertificate', {
        domainName: props.zoneName, // e.g., example.com
        subjectAlternativeNames: [
            `*.${props.zoneName}`, // e.g., *.example.com
            `*.map.${props.zoneName}` // e.g., *.map.example.com
        ],
        validation: acm.CertificateValidation.fromDns(hostedZone),
    });
    return { certificate, hostedZone };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWNtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSxvREFzQkM7QUE5QkQsd0VBQTBEO0FBQzFELGlFQUFtRDtBQU9uRCxTQUFnQixvQkFBb0IsQ0FBQyxLQUFnQixFQUFFLEtBQTBCO0lBQy9FLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRCwwQ0FBMEM7SUFDMUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO1FBQzFFLFVBQVUsRUFBRSxLQUFLLENBQUMsUUFBUTtRQUMxQixXQUFXLEVBQUUsS0FBSyxDQUFDLDRCQUE0QjtLQUNoRCxDQUFDLENBQUM7SUFFSCxvREFBb0Q7SUFDcEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRTtRQUNsRSxVQUFVLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxvQkFBb0I7UUFDaEQsdUJBQXVCLEVBQUU7WUFDdkIsS0FBSyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCO1lBQzdDLFNBQVMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLDBCQUEwQjtTQUNyRDtRQUNELFVBQVUsRUFBRSxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztLQUMxRCxDQUFDLENBQUM7SUFFSCxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYWNtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xuaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBBY21DZXJ0aWZpY2F0ZVByb3BzIHtcbiAgem9uZU5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFjbUNlcnRpZmljYXRlKHNjb3BlOiBDb25zdHJ1Y3QsIHByb3BzOiBBY21DZXJ0aWZpY2F0ZVByb3BzKSB7XG4gIGlmICghcHJvcHMuem9uZU5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1I1MyB6b25lIG5hbWUgaXMgcmVxdWlyZWQgZm9yIEFDTSBjZXJ0aWZpY2F0ZSBjcmVhdGlvbicpO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUgZXhpc3RpbmcgcHVibGljIGhvc3RlZCB6b25lXG4gIGNvbnN0IGhvc3RlZFpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cChzY29wZSwgJ1B1YmxpY0hvc3RlZFpvbmUnLCB7XG4gICAgZG9tYWluTmFtZTogcHJvcHMuem9uZU5hbWUsXG4gICAgcHJpdmF0ZVpvbmU6IGZhbHNlIC8vIEVuc3VyZSBpdCdzIGEgcHVibGljIHpvbmVcbiAgfSk7XG5cbiAgLy8gQ3JlYXRlIEFDTSBjZXJ0aWZpY2F0ZSB3aXRoIG11bHRpcGxlIGRvbWFpbiBuYW1lc1xuICBjb25zdCBjZXJ0aWZpY2F0ZSA9IG5ldyBhY20uQ2VydGlmaWNhdGUoc2NvcGUsICdQdWJsaWNDZXJ0aWZpY2F0ZScsIHtcbiAgICBkb21haW5OYW1lOiBwcm9wcy56b25lTmFtZSwgLy8gZS5nLiwgZXhhbXBsZS5jb21cbiAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogW1xuICAgICAgYCouJHtwcm9wcy56b25lTmFtZX1gLCAvLyBlLmcuLCAqLmV4YW1wbGUuY29tXG4gICAgICBgKi5tYXAuJHtwcm9wcy56b25lTmFtZX1gIC8vIGUuZy4sICoubWFwLmV4YW1wbGUuY29tXG4gICAgXSxcbiAgICB2YWxpZGF0aW9uOiBhY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoaG9zdGVkWm9uZSksXG4gIH0pO1xuXG4gIHJldHVybiB7IGNlcnRpZmljYXRlLCBob3N0ZWRab25lIH07XG59XG4iXX0=