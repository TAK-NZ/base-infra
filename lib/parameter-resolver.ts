import * as fs from 'fs';
import { CfnParameter, Stack } from 'aws-cdk-lib';

interface ParameterOptions {
  description?: string;
  default?: string | number;
  required?: boolean;
  type?: 'String' | 'Number';
  allowedValues?: string[];
  minValue?: number;
  maxValue?: number;
}

export class ParameterResolver {
  private configPath: string;
  private config: any = {};

  constructor(configPath?: string) {
    // Allow custom config file path via environment variable or parameter
    this.configPath = configPath || process.env.CDK_CONFIG_FILE || 'cdk-config.json';
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        console.log(`✓ Loaded configuration from ${this.configPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not load config file ${this.configPath}`);
    }
  }

  /**
   * Get a value directly from the config file
   */
  getConfigValue(key: string): any {
    return this.config[key];
  }

  /**
   * Resolves parameters with cascading priority:
   * 1. Environment variables 
   * 2. CLI context (--context)
   * 3. JSON config file
   * 4. Default values
   */
  resolveParameterSync(
    stack: Stack,
    paramName: string,
    options: ParameterOptions = {}
  ): string | number {
    // 1. Check environment variables (alternative to context)
    const envVar = process.env[paramName.toUpperCase()];
    if (envVar !== undefined) {
      console.log(`✓ Using ${paramName} from environment variable: ${envVar}`);
      return options.type === 'Number' ? Number(envVar) : envVar;
    }

    // 2. Check CDK context (--context flag)
    const contextParam = stack.node.tryGetContext(paramName);
    if (contextParam !== undefined) {
      console.log(`✓ Using ${paramName} from context: ${contextParam}`);
      return options.type === 'Number' ? Number(contextParam) : contextParam;
    }

    // 3. Check JSON config file
    if (this.config[paramName] !== undefined) {
      console.log(`✓ Using ${paramName} from config file: ${this.config[paramName]}`);
      return options.type === 'Number' ? Number(this.config[paramName]) : this.config[paramName];
    }

    // 4. Use default value
    if (options.default !== undefined) {
      console.log(`✓ Using default value for ${paramName}: ${options.default}`);
      return options.default;
    }

    // 5. Error if required
    if (options.required) {
      throw new Error(
        `❌ Required parameter '${paramName}' not provided.\n` +
        `   Use: cdk deploy --context ${paramName}=value\n` +
        `   Or add to cdk-config.json: {"${paramName}": "value"}\n` +
        `   Or set environment variable: ${paramName.toUpperCase()}=value`
      );
    }

    return options.type === 'Number' ? 0 : '';
  }

  /**
   * Creates a CDK parameter with resolved value as default
   */
  createCfnParameter(
    stack: Stack,
    paramName: string,
    cfnParamId: string,
    options: ParameterOptions = {},
    preResolvedValue?: string | number
  ): CfnParameter {
    const resolvedValue = preResolvedValue !== undefined 
      ? preResolvedValue 
      : this.resolveParameterSync(stack, paramName, options);
    
    return new CfnParameter(stack, cfnParamId, {
      type: options.type || 'String',
      description: options.description,
      default: resolvedValue,
      allowedValues: options.allowedValues,
      minValue: options.minValue,
      maxValue: options.maxValue,
    });
  }
}
