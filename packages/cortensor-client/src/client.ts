/**
 * Velvet Sentinel - Cortensor Network Client
 * 
 * Provides decentralized AI inference with PoI (Proof of Inference) 
 * and PoUW (Proof of Useful Work) validation
 * 
 * @see https://docs.cortensor.network/
 */

import type {
  CortensorInferenceRequest,
  CortensorInferenceResponse,
  CortensorSession,
  EvidenceBundle,
  POIAttestation,
} from '@velvet/shared-types';

export interface CortensorConfig {
  endpoint: string;
  apiKey: string;
  defaultModel?: string;
  timeout?: number;
  fallbackEnabled?: boolean;
}

interface InferenceOptions {
  model?: string;
  requirePoI?: boolean;
  nodeCount?: number;
  maxTokens?: number;
  temperature?: number;
  sessionId?: string;
}

interface ValidationResult {
  valid: boolean;
  score: number;
  attestations: POIAttestation[];
  issues?: string[];
}

/**
 * Cortensor Client for decentralized AI inference
 * 
 * Features:
 * - PoI (Proof of Inference) for multi-node consensus
 * - PoUW validation for quality scoring
 * - Evidence bundle generation for auditability
 * - Graceful fallback when service unavailable
 */
export class CortensorClient {
  private config: CortensorConfig;
  private sessions: Map<string, CortensorSession> = new Map();
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor(config: CortensorConfig) {
    this.config = {
      defaultModel: 'default',
      timeout: 30000,
      fallbackEnabled: true,
      ...config,
    };
    
    // Validate configuration
    if (!config.endpoint) {
      console.warn('[CortensorClient] No endpoint configured. AI inference will use fallback mode.');
    }
    if (!config.apiKey || config.apiKey === 'default-dev-token') {
      console.warn('[CortensorClient] Using default API key. Configure CORTENSOR_API_KEY for production.');
    }
  }

  /**
   * Check if Cortensor service is available
   */
  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isAvailable;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      this.isAvailable = response.ok;
      this.lastHealthCheck = now;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Create a new inference session
   */
  async createSession(options: {
    inferenceType?: 'single' | 'consensus';
    poiRequired?: boolean;
    pouwValidation?: boolean;
  } = {}): Promise<CortensorSession> {
    const response = await this.request<{ session: CortensorSession }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        inference_type: options.inferenceType ?? 'consensus',
        poi_required: options.poiRequired ?? true,
        pouw_validation: options.pouwValidation ?? true,
      }),
    });

    const session = response.session;
    this.sessions.set(session.session_id, session);
    return session;
  }

  /**
   * Perform inference request
   * 
   * @param prompt - The prompt to send
   * @param options - Inference options
   */
  async inference(
    prompt: string,
    options: InferenceOptions = {}
  ): Promise<CortensorInferenceResponse> {
    // Check service availability
    const available = await this.checkHealth();
    
    if (!available && this.config.fallbackEnabled) {
      console.warn('[CortensorClient] Service unavailable. Using fallback response.');
      return this.createFallbackResponse(prompt, options);
    }

    const request: CortensorInferenceRequest = {
      prompt,
      model: options.model ?? this.config.defaultModel,
      poi_required: options.requirePoI ?? true,
      consensus_nodes: options.nodeCount ?? 3,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    };

    const endpoint = options.sessionId 
      ? `/sessions/${options.sessionId}/inference`
      : '/inference';

    try {
      const response = await this.request<CortensorInferenceResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response;
    } catch (error) {
      if (this.config.fallbackEnabled) {
        console.warn('[CortensorClient] Request failed, using fallback:', error);
        return this.createFallbackResponse(prompt, options);
      }
      throw error;
    }
  }

  /**
   * Create a fallback response when Cortensor is unavailable
   * This allows agents to continue operating in degraded mode
   */
  private createFallbackResponse(prompt: string, options: InferenceOptions): CortensorInferenceResponse {
    const responseId = `fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    return {
      response_id: responseId,
      content: JSON.stringify({
        message: 'AI inference unavailable - fallback mode active',
        prompt_received: prompt.slice(0, 100) + '...',
        status: 'degraded',
        recommendation: 'Manual review recommended',
      }),
      model: options.model || this.config.defaultModel || 'fallback',
      poi_attestations: [],
      evidence_bundle_cid: undefined,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  /**
   * Perform market analysis with multi-node PoI consensus
   */
  async analyzeMarket(params: {
    tokenPair: string;
    timeframe: string;
    indicators?: string[];
  }): Promise<{
    analysis: CortensorInferenceResponse;
    consensus: boolean;
    confidence: number;
  }> {
    const prompt = `Analyze ${params.tokenPair} on ${params.timeframe} timeframe. 
    ${params.indicators ? `Include analysis of: ${params.indicators.join(', ')}` : ''}
    Provide: trend direction, key levels, entry/exit signals, risk assessment.
    Output as structured JSON.`;

    const response = await this.inference(prompt, {
      requirePoI: true,
      nodeCount: 5,
      temperature: 0.3, // Lower temperature for analytical tasks
    });

    const consensus = response.poi_attestations 
      ? response.poi_attestations.filter(a => a.score > 0.8).length >= 3
      : false;

    const confidence = response.poi_attestations
      ? response.poi_attestations.reduce((sum, a) => sum + a.score, 0) / response.poi_attestations.length
      : 0;

    return {
      analysis: response,
      consensus,
      confidence,
    };
  }

  /**
   * Perform sentiment analysis
   */
  async analyzeSentiment(params: {
    token: string;
    sources?: string[];
  }): Promise<{
    score: number;
    confidence: number;
    breakdown: Record<string, number>;
    response: CortensorInferenceResponse;
  }> {
    const prompt = `Analyze market sentiment for $${params.token}.
    ${params.sources ? `Focus on: ${params.sources.join(', ')}` : 'Analyze Twitter, Discord, Telegram, News.'}
    Return JSON: { score: -100 to 100, breakdown: { source: score }, reasoning: string }`;

    const response = await this.inference(prompt, {
      requirePoI: true,
      nodeCount: 3,
      temperature: 0.5,
    });

    // Parse the response content
    let parsed = { score: 0, breakdown: {} as Record<string, number> };
    try {
      parsed = JSON.parse(response.content);
    } catch {
      // Fallback if response isn't valid JSON
      console.warn('[CortensorClient] Failed to parse sentiment response as JSON');
    }

    const confidence = response.poi_attestations
      ? response.poi_attestations.reduce((sum, a) => sum + a.score, 0) / response.poi_attestations.length
      : 0;

    return {
      score: parsed.score ?? 0,
      confidence,
      breakdown: parsed.breakdown ?? {},
      response,
    };
  }

  /**
   * Assess risk for a DeFi position
   */
  async assessRisk(params: {
    protocol: string;
    position: {
      collateral: string;
      debt: string;
      healthFactor: number;
    };
    priceScenarios?: { token: string; change: number }[];
  }): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    response: CortensorInferenceResponse;
  }> {
    const prompt = `Assess liquidation risk for DeFi position on ${params.protocol}:
    - Collateral: ${params.position.collateral}
    - Debt: ${params.position.debt}
    - Health Factor: ${params.position.healthFactor}
    ${params.priceScenarios ? `Price scenarios: ${JSON.stringify(params.priceScenarios)}` : ''}
    
    Return JSON: { riskLevel: 'low'|'medium'|'high'|'critical', recommendations: string[], analysis: string }`;

    const response = await this.inference(prompt, {
      requirePoI: true,
      nodeCount: 3,
      temperature: 0.2, // Very low temperature for risk assessment
    });

    let parsed = { riskLevel: 'medium' as const, recommendations: [] as string[] };
    try {
      parsed = JSON.parse(response.content);
    } catch {
      console.warn('[CortensorClient] Failed to parse risk response as JSON');
    }

    return {
      riskLevel: parsed.riskLevel ?? 'medium',
      recommendations: parsed.recommendations ?? [],
      response,
    };
  }

  /**
   * Validate a previous inference response using PoI
   */
  async validateResponse(responseId: string): Promise<ValidationResult> {
    const response = await this.request<{
      valid: boolean;
      score: number;
      attestations: POIAttestation[];
      issues?: string[];
    }>(`/validate/${responseId}`, {
      method: 'GET',
    });

    return response;
  }

  /**
   * Get evidence bundle for an inference
   */
  async getEvidenceBundle(responseId: string): Promise<EvidenceBundle> {
    const response = await this.request<{ bundle: EvidenceBundle }>(
      `/evidence/${responseId}`,
      { method: 'GET' }
    );
    return response.bundle;
  }

  /**
   * Check strategy compliance using validator-only mode
   */
  async checkCompliance(params: {
    proposedAction: string;
    riskParameters: {
      maxTradeSize: number;
      allowedProtocols: string[];
      maxLeverage: number;
    };
  }): Promise<{
    compliant: boolean;
    violations: string[];
    response: CortensorInferenceResponse;
  }> {
    const prompt = `Check if proposed DeFi action complies with risk parameters:
    
    Action: ${params.proposedAction}
    
    Risk Parameters:
    - Max Trade Size: $${params.riskParameters.maxTradeSize}
    - Allowed Protocols: ${params.riskParameters.allowedProtocols.join(', ')}
    - Max Leverage: ${params.riskParameters.maxLeverage}x
    
    Return JSON: { compliant: boolean, violations: string[], reasoning: string }`;

    const response = await this.inference(prompt, {
      requirePoI: false, // Validator-only mode
      nodeCount: 1,
      temperature: 0.1,
    });

    let parsed = { compliant: true, violations: [] as string[] };
    try {
      parsed = JSON.parse(response.content);
    } catch {
      console.warn('[CortensorClient] Failed to parse compliance response as JSON');
    }

    return {
      compliant: parsed.compliant ?? true,
      violations: parsed.violations ?? [],
      response,
    };
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.request(`/sessions/${sessionId}`, { method: 'DELETE' });
    this.sessions.delete(sessionId);
  }

  /**
   * Internal request helper
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.endpoint}${path}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cortensor API error: ${response.status} - ${error}`);
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Re-export types for convenience
export type {
  CortensorInferenceRequest,
  CortensorInferenceResponse,
  CortensorSession,
  EvidenceBundle,
  POIAttestation,
};
