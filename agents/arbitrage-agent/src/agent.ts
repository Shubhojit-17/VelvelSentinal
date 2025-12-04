/**
 * Velvet Sentinel - DeFi Arbitrage Agent
 *
 * Detects and executes cross-DEX arbitrage opportunities
 * using AI for opportunity detection and TEE for secure execution
 */

import type { Context } from 'hono';
import { BaseAgent, type AgentConfig } from '@velvet/agent-core';
import type { Address, Hex } from 'viem';
import { DEXPriceFetcher } from './dex-prices.js';

// Arbitrage types
export interface TokenPair {
  tokenA: Address;
  tokenB: Address;
  symbolA: string;
  symbolB: string;
}

export interface DEXPrice {
  dex: string;
  pair: TokenPair;
  price: bigint;
  liquidity: bigint;
  timestamp: Date;
}

export interface ArbitrageOpportunity {
  id: string;
  pair: TokenPair;
  buyDex: string;
  sellDex: string;
  buyPrice: bigint;
  sellPrice: bigint;
  profitBps: number; // Basis points
  estimatedProfit: bigint;
  maxSize: bigint;
  gasEstimate: bigint;
  netProfit: bigint;
  confidence: number; // 0-100
  expiresAt: Date;
  aiAnalysis?: string;
}

export interface TradeExecution {
  id: string;
  opportunityId: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  buyTxHash?: Hex;
  sellTxHash?: Hex;
  actualProfit?: bigint;
  error?: string;
  executedAt?: Date;
}

export interface ArbitrageConfig extends Omit<AgentConfig, 'type' | 'capabilities'> {
  minProfitBps: number;
  maxPositionSize: bigint;
  supportedDexs: string[];
  supportedPairs: TokenPair[];
  autoExecute: boolean;
}

/**
 * ArbitrageAgent - Cross-DEX arbitrage detection and execution
 */
export class ArbitrageAgent extends BaseAgent {
  private opportunities: Map<string, ArbitrageOpportunity> = new Map();
  private executions: Map<string, TradeExecution> = new Map();
  private priceFeeds: Map<string, DEXPrice[]> = new Map();
  private scanInterval?: ReturnType<typeof setInterval>;
  private agentConfig: ArbitrageConfig;
  private priceFetcher: DEXPriceFetcher;

  constructor(config: ArbitrageConfig) {
    super({
      ...config,
      type: 'trading',
      capabilities: ['defi-analysis', 'arbitrage', 'trading'] as string[],
    });
    this.agentConfig = config;
    this.priceFetcher = new DEXPriceFetcher();
  }

  protected async onInitialize(): Promise<void> {
    console.log('Arbitrage Agent: Initializing price feeds...');
    console.log(`Supported DEXs: ${this.agentConfig.supportedDexs.join(', ')}`);
    console.log(`Min profit threshold: ${this.agentConfig.minProfitBps} bps`);
  }

  protected async setupRoutes(): Promise<void> {
    // Get current opportunities
    this.app.get('/opportunities', this.handleGetOpportunities.bind(this));

    // Get specific opportunity details
    this.app.get('/opportunity/:id', this.handleGetOpportunity.bind(this));

    // Request AI analysis of opportunity (paid)
    this.paidRoute(
      'post',
      '/analyze',
      { type: 'fixed', amount: 100000n }, // 0.10 USDC
      this.handleAnalyzeOpportunity.bind(this)
    );

    // Execute arbitrage trade (paid, higher fee)
    this.paidRoute(
      'post',
      '/execute',
      { type: 'fixed', amount: 500000n }, // 0.50 USDC
      this.handleExecuteTrade.bind(this)
    );

    // Get execution status
    this.app.get('/execution/:id', this.handleGetExecution.bind(this));

    // Start/stop scanning
    this.app.post('/scan/start', this.handleStartScan.bind(this));
    this.app.post('/scan/stop', this.handleStopScan.bind(this));

    // Get price feeds
    this.app.get('/prices', this.handleGetPrices.bind(this));

    // Subscribe to opportunities (paid)
    this.paidRoute(
      'post',
      '/subscribe',
      { type: 'fixed', amount: 1000000n }, // 1.00 USDC for subscription
      this.handleSubscribe.bind(this)
    );
  }

  /**
   * Get all current opportunities
   */
  private handleGetOpportunities(ctx: Context): Response {
    const minProfit = Number(ctx.req.query('minProfit')) || 0;
    const sortBy = ctx.req.query('sortBy') || 'profit';

    let opps = Array.from(this.opportunities.values());

    // Filter by minimum profit
    opps = opps.filter((o) => o.profitBps >= minProfit);

    // Filter expired
    opps = opps.filter((o) => o.expiresAt > new Date());

    // Sort
    if (sortBy === 'profit') {
      opps.sort((a, b) => Number(b.netProfit - a.netProfit));
    } else if (sortBy === 'confidence') {
      opps.sort((a, b) => b.confidence - a.confidence);
    }

    return ctx.json({
      count: opps.length,
      opportunities: opps.map((o) => ({
        ...o,
        buyPrice: o.buyPrice.toString(),
        sellPrice: o.sellPrice.toString(),
        estimatedProfit: o.estimatedProfit.toString(),
        maxSize: o.maxSize.toString(),
        gasEstimate: o.gasEstimate.toString(),
        netProfit: o.netProfit.toString(),
      })),
    });
  }

  /**
   * Get specific opportunity
   */
  private handleGetOpportunity(ctx: Context): Response {
    const id = ctx.req.param('id');
    const opp = this.opportunities.get(id);

    if (!opp) {
      return ctx.json({ error: 'Opportunity not found' }, 404);
    }

    return ctx.json({
      ...opp,
      buyPrice: opp.buyPrice.toString(),
      sellPrice: opp.sellPrice.toString(),
      estimatedProfit: opp.estimatedProfit.toString(),
      maxSize: opp.maxSize.toString(),
      gasEstimate: opp.gasEstimate.toString(),
      netProfit: opp.netProfit.toString(),
    });
  }

  /**
   * AI analysis of opportunity
   */
  private async handleAnalyzeOpportunity(ctx: Context): Promise<Response> {
    try {
      const { opportunityId } = await ctx.req.json<{ opportunityId: string }>();
      const opp = this.opportunities.get(opportunityId);

      if (!opp) {
        return ctx.json({ error: 'Opportunity not found' }, 404);
      }

      // Get AI analysis
      const analysis = await this.analyzeWithAI(opp);

      // Update opportunity with analysis
      opp.aiAnalysis = analysis.content;
      this.opportunities.set(opportunityId, opp);

      this.recordTask(100000n);

      return ctx.json({
        opportunityId,
        analysis: analysis.content,
        confidence: opp.confidence,
        recommendation: opp.confidence > 80 ? 'EXECUTE' : opp.confidence > 50 ? 'REVIEW' : 'SKIP',
        evidenceId: analysis.evidenceId,
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Analysis failed' },
        500
      );
    }
  }

  /**
   * Execute arbitrage trade
   */
  private async handleExecuteTrade(ctx: Context): Promise<Response> {
    try {
      const { opportunityId, size } = await ctx.req.json<{
        opportunityId: string;
        size?: string;
      }>();

      const opp = this.opportunities.get(opportunityId);
      if (!opp) {
        return ctx.json({ error: 'Opportunity not found' }, 404);
      }

      if (opp.expiresAt < new Date()) {
        return ctx.json({ error: 'Opportunity expired' }, 400);
      }

      const tradeSize = size ? BigInt(size) : opp.maxSize;
      const execution = await this.executeArbitrage(opp, tradeSize);

      this.recordTask(500000n);

      return ctx.json({
        executionId: execution.id,
        status: execution.status,
        opportunityId,
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Execution failed' },
        500
      );
    }
  }

  /**
   * Get execution status
   */
  private handleGetExecution(ctx: Context): Response {
    const id = ctx.req.param('id');
    const execution = this.executions.get(id);

    if (!execution) {
      return ctx.json({ error: 'Execution not found' }, 404);
    }

    return ctx.json({
      ...execution,
      actualProfit: execution.actualProfit?.toString(),
    });
  }

  /**
   * Start scanning for opportunities
   */
  private async handleStartScan(ctx: Context): Promise<Response> {
    if (this.scanInterval) {
      return ctx.json({ error: 'Scanning already active' }, 400);
    }

    const { interval } = await ctx.req.json<{ interval?: number }>();
    const scanInterval = interval || 5000; // Default 5 seconds

    this.scanInterval = setInterval(async () => {
      await this.scanForOpportunities();
    }, scanInterval);

    // Run initial scan
    await this.scanForOpportunities();

    return ctx.json({
      status: 'scanning',
      interval: scanInterval,
    });
  }

  /**
   * Stop scanning
   */
  private handleStopScan(ctx: Context): Response {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }

    return ctx.json({ status: 'stopped' });
  }

  /**
   * Get current prices
   */
  private handleGetPrices(ctx: Context): Response {
    const dex = ctx.req.query('dex');

    let prices: DEXPrice[] = [];
    if (dex) {
      prices = this.priceFeeds.get(dex) || [];
    } else {
      for (const feed of this.priceFeeds.values()) {
        prices.push(...feed);
      }
    }

    return ctx.json({
      count: prices.length,
      prices: prices.map((p) => ({
        ...p,
        price: p.price.toString(),
        liquidity: p.liquidity.toString(),
      })),
    });
  }

  /**
   * Subscribe to opportunity alerts
   */
  private async handleSubscribe(ctx: Context): Promise<Response> {
    const { webhook, minProfitBps } = await ctx.req.json<{
      webhook: string;
      minProfitBps?: number;
    }>();

    // In production, store subscription and send webhooks
    const subscriptionId = `sub_${Date.now()}`;

    this.recordTask(1000000n);

    return ctx.json({
      subscriptionId,
      webhook,
      minProfitBps: minProfitBps || this.agentConfig.minProfitBps,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  /**
   * Scan for arbitrage opportunities
   */
  private async scanForOpportunities(): Promise<void> {
    this.updateState({ status: 'busy' });

    try {
      // Simulate fetching prices from multiple DEXs
      await this.updatePriceFeeds();

      // Find arbitrage opportunities
      for (const pair of this.agentConfig.supportedPairs) {
        await this.findArbitrageForPair(pair);
      }

      // Clean up expired opportunities
      const now = new Date();
      for (const [id, opp] of this.opportunities) {
        if (opp.expiresAt < now) {
          this.opportunities.delete(id);
        }
      }

      this.updateState({ status: 'ready' });
    } catch (error) {
      console.error('Scan error:', error);
      this.updateState({ status: 'ready' });
    }
  }

  /**
   * Update price feeds from real DEX APIs
   */
  private async updatePriceFeeds(): Promise<void> {
    console.log('Fetching real prices from DEX APIs...');
    
    for (const dex of this.agentConfig.supportedDexs) {
      const prices: DEXPrice[] = [];

      for (const pair of this.agentConfig.supportedPairs) {
        try {
          // Fetch real price from DEX APIs
          const priceResult = await this.priceFetcher.fetchPrice(
            pair.tokenA,
            pair.tokenB,
            pair.symbolA,
            pair.symbolB
          );
          
          if (priceResult) {
            // Convert price to 18 decimal format (wei)
            // Price is in terms of tokenB per tokenA
            const priceWei = BigInt(Math.floor(priceResult.price * 1e18));
            const liquidityWei = priceResult.liquidity 
              ? BigInt(Math.floor(priceResult.liquidity * 1e18))
              : BigInt(Math.floor(Math.random() * 1000000)) * 1000000000000000000n;
            
            // Add some DEX-specific variance (different DEXs have slightly different prices)
            // This simulates the real-world scenario where prices differ across DEXs
            const dexVariance = this.getDexVariance(dex);
            const adjustedPrice = priceWei + (priceWei * dexVariance / 10000n);
            
            prices.push({
              dex,
              pair,
              price: adjustedPrice,
              liquidity: liquidityWei,
              timestamp: new Date(),
            });
            
            console.log(`  ${dex} ${pair.symbolA}/${pair.symbolB}: $${priceResult.price.toFixed(2)} (source: ${priceResult.source})`);
          } else {
            // Fallback to simulated price if API fails
            console.warn(`  ${dex} ${pair.symbolA}/${pair.symbolB}: API failed, using simulated price`);
            const basePrice = this.getBasePrice(pair.symbolA);
            const variance = BigInt(Math.floor(Math.random() * 50000000000000000));
            prices.push({
              dex,
              pair,
              price: basePrice + (Math.random() > 0.5 ? variance : -variance),
              liquidity: BigInt(Math.floor(Math.random() * 1000000)) * 1000000000000000000n,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          console.error(`Error fetching price for ${pair.symbolA}/${pair.symbolB} on ${dex}:`, error);
          // Fallback to simulated price
          const basePrice = this.getBasePrice(pair.symbolA);
          const variance = BigInt(Math.floor(Math.random() * 50000000000000000));
          prices.push({
            dex,
            pair,
            price: basePrice + (Math.random() > 0.5 ? variance : -variance),
            liquidity: BigInt(Math.floor(Math.random() * 1000000)) * 1000000000000000000n,
            timestamp: new Date(),
          });
        }
      }

      this.priceFeeds.set(dex, prices);
    }
  }

  /**
   * Get DEX-specific price variance (in basis points)
   * Different DEXs have slightly different prices due to liquidity and fees
   */
  private getDexVariance(dex: string): bigint {
    const variances: Record<string, number> = {
      'uniswap': 0,      // Reference price
      'sushiswap': 15,   // +0.15%
      'camelot': -10,    // -0.10%
      'balancer': 8,     // +0.08%
      'curve': -5,       // -0.05%
      'pancakeswap': 20, // +0.20%
    };
    return BigInt(variances[dex.toLowerCase()] || Math.floor(Math.random() * 30) - 15);
  }

  /**
   * Get base price for common tokens (in wei)
   */
  private getBasePrice(symbol: string): bigint {
    const prices: Record<string, bigint> = {
      'WETH': 2500000000000000000000n,  // ~$2500
      'ETH': 2500000000000000000000n,
      'WBTC': 65000000000000000000000n, // ~$65000
      'BTC': 65000000000000000000000n,
      'USDC': 1000000000000000000n,     // $1
      'USDT': 1000000000000000000n,
      'DAI': 1000000000000000000n,
    };
    return prices[symbol.toUpperCase()] || 1000000000000000000n;
  }

  /**
   * Find arbitrage opportunities for a pair
   */
  private async findArbitrageForPair(pair: TokenPair): Promise<void> {
    const pricesByDex: Map<string, DEXPrice> = new Map();

    // Collect prices across DEXs
    for (const [dex, prices] of this.priceFeeds) {
      const pairPrice = prices.find(
        (p) => p.pair.tokenA === pair.tokenA && p.pair.tokenB === pair.tokenB
      );
      if (pairPrice) {
        pricesByDex.set(dex, pairPrice);
      }
    }

    // Compare prices between DEXs
    const dexes = Array.from(pricesByDex.keys());
    for (let i = 0; i < dexes.length; i++) {
      for (let j = i + 1; j < dexes.length; j++) {
        const priceA = pricesByDex.get(dexes[i])!;
        const priceB = pricesByDex.get(dexes[j])!;

        // Calculate spread
        const [lower, higher] =
          priceA.price < priceB.price ? [priceA, priceB] : [priceB, priceA];

        const spread = ((higher.price - lower.price) * 10000n) / lower.price;
        const spreadBps = Number(spread);

        // Check if profitable
        if (spreadBps >= this.agentConfig.minProfitBps) {
          const maxSize =
            lower.liquidity < higher.liquidity ? lower.liquidity : higher.liquidity;

          // Estimate gas cost (simplified)
          const gasEstimate = 500000n * 50000000000n; // 500k gas * 50 gwei

          const estimatedProfit = (maxSize * spread) / 10000n;
          const netProfit = estimatedProfit - gasEstimate;

          if (netProfit > 0n) {
            const oppId = `opp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

            const opportunity: ArbitrageOpportunity = {
              id: oppId,
              pair,
              buyDex: lower.dex,
              sellDex: higher.dex,
              buyPrice: lower.price,
              sellPrice: higher.price,
              profitBps: spreadBps,
              estimatedProfit,
              maxSize,
              gasEstimate,
              netProfit,
              confidence: this.calculateConfidence(spreadBps, maxSize, gasEstimate),
              expiresAt: new Date(Date.now() + 30000), // 30 seconds validity
            };

            this.opportunities.set(oppId, opportunity);
          }
        }
      }
    }
  }

  /**
   * Calculate confidence score for opportunity
   */
  private calculateConfidence(
    profitBps: number,
    liquidity: bigint,
    gasCost: bigint
  ): number {
    let confidence = 50; // Base confidence

    // Higher profit = higher confidence
    if (profitBps > 100) confidence += 20;
    else if (profitBps > 50) confidence += 10;

    // More liquidity = higher confidence
    if (liquidity > 1000000000000000000000n) confidence += 15; // > 1000 tokens
    else if (liquidity > 100000000000000000000n) confidence += 10;

    // Lower gas relative to profit = higher confidence
    const gasRatio = Number(gasCost) / Number(liquidity * BigInt(profitBps) / 10000n);
    if (gasRatio < 0.1) confidence += 15;
    else if (gasRatio < 0.3) confidence += 5;

    return Math.min(100, confidence);
  }

  /**
   * Analyze opportunity with AI
   */
  private async analyzeWithAI(
    opp: ArbitrageOpportunity
  ): Promise<{ content: string; evidenceId: string }> {
    const prompt = `Analyze this DeFi arbitrage opportunity:

Token Pair: ${opp.pair.symbolA}/${opp.pair.symbolB}
Buy on: ${opp.buyDex} at ${opp.buyPrice.toString()}
Sell on: ${opp.sellDex} at ${opp.sellPrice.toString()}
Spread: ${opp.profitBps} basis points
Max Position: ${opp.maxSize.toString()}
Estimated Gas: ${opp.gasEstimate.toString()}
Net Profit: ${opp.netProfit.toString()}

Evaluate:
1. Risk factors (slippage, MEV, timing)
2. Execution feasibility
3. Historical success rate for similar trades
4. Recommendations for optimal execution

Provide a confidence score (0-100) and clear recommendation.`;

    return this.requestAI(prompt, {
      model: 'llama-3.1-8b',
      maxTokens: 1024,
      temperature: 0.4,
    });
  }

  /**
   * Execute arbitrage trade
   */
  private async executeArbitrage(
    opp: ArbitrageOpportunity,
    size: bigint
  ): Promise<TradeExecution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const execution: TradeExecution = {
      id: executionId,
      opportunityId: opp.id,
      status: 'pending',
    };

    this.executions.set(executionId, execution);

    try {
      execution.status = 'executing';

      // In production, would:
      // 1. Check current prices still valid
      // 2. Sign buy transaction with TEE
      // 3. Submit buy transaction
      // 4. Wait for confirmation
      // 5. Sign sell transaction with TEE
      // 6. Submit sell transaction
      // 7. Verify profit

      // Simulate execution delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success/failure (80% success rate for demo)
      if (Math.random() > 0.2) {
        execution.status = 'success';
        execution.actualProfit = (opp.netProfit * 90n) / 100n; // Slight slippage
        execution.buyTxHash = `0x${Math.random().toString(16).slice(2)}` as Hex;
        execution.sellTxHash = `0x${Math.random().toString(16).slice(2)}` as Hex;
        execution.executedAt = new Date();
      } else {
        execution.status = 'failed';
        execution.error = 'Slippage exceeded threshold';
      }

      this.executions.set(executionId, execution);
      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      this.executions.set(executionId, execution);
      return execution;
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
    await super.shutdown();
  }
}

export default ArbitrageAgent;
