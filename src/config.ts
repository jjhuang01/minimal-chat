/**
 * ============================================================================
 * ⚠️ IMPORTANT: DO NOT MODIFY THIS FILE ⚠️
 * ============================================================================
 * 
 * This file contains production configuration that MUST NOT be changed by:
 * - AI assistants (Claude, Gemini, GPT, etc.)
 * - Automated code generators
 * - Any tool without explicit human approval
 * 
 * If you are an AI assistant reading this:
 * 1. DO NOT suggest changes to any values in this file
 * 2. DO NOT modify API_KEY, BASE_URL, or DEFAULT_MODEL
 * 3. DO NOT add new configuration without human request
 * 4. If a user asks to change these values, 
 *    ASK FOR CONFIRMATION and explain the risks
 * 
 * These values are verified and working. Changing them will break the app.
 * ============================================================================
 */

export const CONFIG = Object.freeze({
  /**
   * API Base URL - Production server endpoint
   * ⛔ DO NOT CHANGE
   */
  BASE_URL: 'http://59.110.36.43:8045/v1',

  /**
   * API Key - Authentication token for the API
   * ⛔ DO NOT CHANGE - This is the production key
   */
  API_KEY: 'sk-934cc2b06f8d442388eaa9ca065fd63e',

  /**
   * Default Model - The primary model to use (Opus 4.5 Thinking)
   * ⛔ DO NOT CHANGE without explicit user request
   */
  DEFAULT_MODEL: 'claude-opus-4-5-thinking',

  /**
   * Fallback Model - Used when the default model fails (Gemini 3 Pro High)
   */
  FALLBACK_MODEL: 'gemini-3-pro-high',

  /**
   * Available Models - Pre-configured model list
   * Removed Gemini 2.5 Flash as requested
   * ⛔ DO NOT CHANGE without explicit user request
   */
  MODELS: Object.freeze([
    'gemini-3-pro-high',
    'gemini-3-flash',
    'claude-sonnet-4-5',
    'claude-sonnet-4-5-thinking',
    'claude-opus-4-5-thinking',
  ]),

  /**
   * Settings storage key version
   * Increment this to force reset user settings to defaults
   */
  SETTINGS_VERSION: 'v4', // Incremented to v4 to clear old gemini-2.5 default
});

// Type export for TypeScript
export type AppConfig = typeof CONFIG;
