/**
 * Centralized Configuration for AAC Backend
 * 
 * This file consolidates all environment variable access and configuration
 * to avoid duplication across services (DRY principle).
 */

// ============================================================================
// Azure OpenAI Configuration for Phrase Generation
// ============================================================================

export interface AzureOpenAIPhraseConfig {
  url: string;
  key: string;
  model: string;
  isConfigured: boolean;
}

/**
 * Gets Azure OpenAI configuration for phrase generation
 * Checks both standard and EXPO_PUBLIC prefixed environment variables
 */
export function getAzurePhraseConfig(): AzureOpenAIPhraseConfig {
  const url = process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '';
  const key = process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '';
  const model = process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-5-mini';

  return {
    url,
    key,
    model,
    isConfigured: !!(url && key)
  };
}

// ============================================================================
// Azure OpenAI Configuration for Image Generation (DALL-E)
// ============================================================================

export interface AzureOpenAIImageConfig {
  endpoint: string;
  apiKey: string;
  isConfigured: boolean;
}

/**
 * Gets Azure OpenAI configuration for image generation (DALL-E)
 */
export function getAzureImageConfig(): AzureOpenAIImageConfig {
  const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT || '';
  const apiKey = process.env.AZURE_OPENAI_IMAGE_API_KEY || '';

  return {
    endpoint,
    apiKey,
    isConfigured: !!(endpoint && apiKey)
  };
}

// ============================================================================
// Server Configuration
// ============================================================================

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
}

/**
 * Gets server configuration
 */
export function getServerConfig(): ServerConfig {
  const port = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    port,
    nodeEnv,
    isDevelopment: nodeEnv === 'development'
  };
}
