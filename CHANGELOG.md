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

- :tada: **BREAKING CHANGE**: Modernized configuration system to use AWS CDK context best practices
- :rocket: Simplified deployment to just `npx cdk deploy --context env=dev-test|prod`
- :pencil2: Updated all documentation to reflect new context-based configuration system
- :white_check_mark: All tests updated and passing with new configuration interface
- :rocket: Eliminated 90% of command-line parameters through centralized `cdk.json` configuration
- :rocket: Added built-in support for runtime configuration overrides using CDK's `--context` flag

### v1.0.0

- :rocket: Initial Release

