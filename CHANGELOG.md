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
- :arrow_up: Upgrade aws-cdk-lib to 2.273.0 and aws-cdk CLI to 2.1145.0 (constructs already latest at 10.8.1)
- :arrow_up: Upgrade dev dependencies jest to 30.5.2 and @types/jest to 30.0.0 to resolve `npm audit` findings
- :bug: Add `js-yaml` ^4.1.1 override to remove vulnerable `sprintf-js` from the Jest tree; remove `.npmrc` `audit-level=critical` suppression so `npm audit` reports 0 vulnerabilities

### v1.0.0

- :rocket: Initial Release using AWS CDK
