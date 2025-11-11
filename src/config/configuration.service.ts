export const ENV_VARIABLES = {
  C8Y_BASEURL: 'C8Y_BASEURL',
  APPLICATION_KEY: 'APPLICATION_KEY',
  C8Y_BOOTSTRAP_TENANT: 'C8Y_BOOTSTRAP_TENANT',
  C8Y_BOOTSTRAP_USER: 'C8Y_BOOTSTRAP_USER',
  C8Y_BOOTSTRAP_PASSWORD: 'C8Y_BOOTSTRAP_PASSWORD',
  SUBSCRIPTION_NAME: 'SUBSCRIPTION_NAME',
  NODE_ENV: 'NODE_ENV',
  SERVER_PORT: 'SERVER_PORT',
} as const;

export class ConfigurationService {
  static getBaseUrl(): string {
    return ConfigurationService.getValueFromEnv('C8Y_BASEURL');
  }

  static getBaseServiceUrl(): string {
    if (ConfigurationService.isDev()) {
      return `http://localhost:${ConfigurationService.getValueFromEnv('SERVER_PORT', '80')}`;
    }
    return (
      ConfigurationService.getBaseUrl() + ConfigurationService.getBasePath()
    );
  }

  static getBasePath() {
    if (ConfigurationService.isDev()) {
      // In development mode, we use a local service path
      return '' as const;
    }
    // FIXME: Should not be hard coded!!!
    return '/service/mcp-example' as const;
  }

  static getApplicationKey(): string {
    return ConfigurationService.getValueFromEnv('APPLICATION_KEY');
  }

  static getBootstrapTenant(): string {
    return ConfigurationService.getValueFromEnv('C8Y_BOOTSTRAP_TENANT');
  }

  static getBootstrapUser(): string {
    return ConfigurationService.getValueFromEnv('C8Y_BOOTSTRAP_USER');
  }
  static getBootstrapPassword(): string {
    return ConfigurationService.getValueFromEnv('C8Y_BOOTSTRAP_PASSWORD');
  }

  static isDev(): boolean {
    return (
      ConfigurationService.getValueFromEnv('NODE_ENV', 'development') ===
      'development'
    );
  }

  private static getValueFromEnv(
    key: keyof typeof ENV_VARIABLES,
    fallback?: string,
  ): string {
    const value = process.env[key];
    if (!value || typeof value !== 'string') {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`${key} is not defined`);
    }
    return value;
  }
}
