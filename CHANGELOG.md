# CHANGELOG

## Emoji Cheatsheet
- :pencil2: doc updates
- :bug: when fixing a bug
- :rocket: when making general improvements
- :white_check_mark: when adding tests
- :arrow_up: when upgrading dependencies
- :tada: when adding new features

## Version History

### Pending Release
- :bug: Fix ELB logs bucket policy failing with `Invalid principal in policy` in opt-in regions such as `ap-southeast-6` (#97). Grant only the deployment region's legacy ELB account (none for regions launched after August 2022) and scope log writes to `AWSLogs/<account-id>/*`
- :white_check_mark: Update ELB bucket policy tests to cover legacy, GovCloud and `ap-southeast-6` regions
- :arrow_up: Upgrade aws-cdk-lib to 2.273.0 and aws-cdk CLI to 2.1145.0 (constructs already latest at 10.8.1)
- :arrow_up: Upgrade dev dependencies jest to 30.5.2 and @types/jest to 30.0.0 to resolve `npm audit` findings
- :bug: Add `js-yaml` ^4.1.1 override to remove vulnerable `sprintf-js` from the Jest tree; remove `.npmrc` `audit-level=critical` suppression so `npm audit` reports 0 vulnerabilities

### v1.0.0

- :rocket: Initial Release using AWS CDK
