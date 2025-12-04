/**
 * Real DEX Price Fetcher for Arbitrage Agent
 * 
 * Fetches live prices from multiple DEX APIs (no simulation)
 */

import type { Address } from 'viem';

export interface TokenInfo {
  address: Address;
  symbol: string;
  decimals: number;
}

export interface PriceQuote {
  dex: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: bigint;
  amountOut: bigint;
  pricePerToken: number; // tokenOut per tokenIn
  priceImpact: number; // percentage
  liquidity: bigint;
  timestamp: Date;
  route?: string[];
}

export interface DEXConfig {
  name: string;
  apiUrl: string;
  chainId: number;
}

// API Response types
interface CoinGeckoResponse {
  [tokenId: string]: {
    usd?: number;
  };
}

interface OneInchQuoteResponse {
  dstAmount?: string;
}

interface ParaswapPriceRoute {
  destAmount?: string;
  priceImpact?: number;
  bestRoute?: Array<{
    swaps?: Array<{
      swapExchanges?: Array<{
        exchange?: string;
      }>;
    }>;
  }>;
}

interface ParaswapResponse {
  priceRoute?: ParaswapPriceRoute;
}

interface KyberswapRouteSummary {
  amountOut?: string;
  priceImpact?: number;
}

interface KyberswapResponse {
  data?: {
    routeSummary?: KyberswapRouteSummary;
  };
}

interface OdosResponse {
  outAmounts?: string[];
  priceImpact?: number;
}

// Supported DEX configurations
const DEX_CONFIGS: Record<string, DEXConfig> = {
  uniswap: {
    name: 'Uniswap V3',
    apiUrl: 'https://api.uniswap.org',
    chainId: 42161, // Arbitrum
  },
  sushiswap: {
    name: 'SushiSwap',
    apiUrl: 'https://api.sushi.com',
    chainId: 42161,
  },
  '1inch': {
    name: '1inch',
    apiUrl: 'https://api.1inch.dev/swap/v6.0/42161',
    chainId: 42161,
  },
};

// Well-known token addresses on Arbitrum
export const ARBITRUM_TOKENS: Record<string, TokenInfo> = {
  WETH: {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address,
    symbol: 'WETH',
    decimals: 18,
  },
  USDC: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address,
    symbol: 'USDC',
    decimals: 6,
  },
  USDT: {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address,
    symbol: 'USDT',
    decimals: 6,
  },
  DAI: {
    address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as Address,
    symbol: 'DAI',
    decimals: 18,
  },
  ARB: {
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548' as Address,
    symbol: 'ARB',
    decimals: 18,
  },
  WBTC: {
    address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f' as Address,
    symbol: 'WBTC',
    decimals: 8,
  },
};

// Arbitrum Sepolia tokens (testnet)
export const ARBITRUM_SEPOLIA_TOKENS: Record<string, TokenInfo> = {
  WETH: {
    address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as Address,
    symbol: 'WETH',
    decimals: 18,
  },
  USDC: {
    address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as Address,
    symbol: 'USDC',
    decimals: 6,
  },
};

/**
 * Fetch price quote from CoinGecko API (free, no API key required)
 */
async function fetchCoinGeckoPrice(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json() as CoinGeckoResponse;
    return data[tokenId]?.usd || null;
  } catch (error) {
    console.error(`CoinGecko price fetch failed for ${tokenId}:`, error);
    return null;
  }
}

// CoinGecko token ID mapping
const COINGECKO_IDS: Record<string, string> = {
  WETH: 'weth',
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  ARB: 'arbitrum',
  WBTC: 'wrapped-bitcoin',
};

/**
 * Fetch real prices from CoinGecko for multiple tokens
 */
export async function fetchRealPrices(): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (response.ok) {
      const data = await response.json() as CoinGeckoResponse;
      
      for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
        if (data[id]?.usd) {
          prices.set(symbol, data[id].usd);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch prices from CoinGecko:', error);
  }
  
  return prices;
}

/**
 * Fetch quote from 1inch API
 */
async function fetch1inchQuote(
  tokenIn: TokenInfo,
  tokenOut: TokenInfo,
  amount: bigint,
  apiKey?: string
): Promise<PriceQuote | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const url = `https://api.1inch.dev/swap/v6.0/42161/quote?src=${tokenIn.address}&dst=${tokenOut.address}&amount=${amount.toString()}`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.log(`1inch API returned ${response.status}`);
      return null;
    }
    
    const data = await response.json() as OneInchQuoteResponse;
    
    const amountOut = BigInt(data.dstAmount || '0');
    const pricePerToken = Number(amountOut) / Number(amount) * 
      Math.pow(10, tokenIn.decimals) / Math.pow(10, tokenOut.decimals);
    
    return {
      dex: '1inch',
      tokenIn,
      tokenOut,
      amountIn: amount,
      amountOut,
      pricePerToken,
      priceImpact: 0,
      liquidity: 0n,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('1inch quote failed:', error);
    return null;
  }
}

/**
 * Fetch quote from Paraswap API (no API key required)
 */
async function fetchParaswapQuote(
  tokenIn: TokenInfo,
  tokenOut: TokenInfo,
  amount: bigint,
  chainId: number = 42161
): Promise<PriceQuote | null> {
  try {
    const url = `https://apiv5.paraswap.io/prices?srcToken=${tokenIn.address}&destToken=${tokenOut.address}&amount=${amount.toString()}&srcDecimals=${tokenIn.decimals}&destDecimals=${tokenOut.decimals}&side=SELL&network=${chainId}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as ParaswapResponse;
    
    if (!data.priceRoute) return null;
    
    const amountOut = BigInt(data.priceRoute.destAmount || '0');
    const pricePerToken = Number(amountOut) / Number(amount) * 
      Math.pow(10, tokenIn.decimals) / Math.pow(10, tokenOut.decimals);
    
    return {
      dex: 'Paraswap',
      tokenIn,
      tokenOut,
      amountIn: amount,
      amountOut,
      pricePerToken,
      priceImpact: Number(data.priceRoute.priceImpact || 0),
      liquidity: 0n,
      timestamp: new Date(),
      route: data.priceRoute.bestRoute?.map((r) => r.swaps?.[0]?.swapExchanges?.[0]?.exchange || '') || [],
    };
  } catch (error) {
    console.error('Paraswap quote failed:', error);
    return null;
  }
}

/**
 * Fetch quote from Kyberswap API (no API key required)
 */
async function fetchKyberswapQuote(
  tokenIn: TokenInfo,
  tokenOut: TokenInfo,
  amount: bigint,
  chainId: number = 42161
): Promise<PriceQuote | null> {
  try {
    const chainName = chainId === 42161 ? 'arbitrum' : 'ethereum';
    const url = `https://aggregator-api.kyberswap.com/${chainName}/api/v1/routes?tokenIn=${tokenIn.address}&tokenOut=${tokenOut.address}&amountIn=${amount.toString()}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as KyberswapResponse;
    
    if (!data.data?.routeSummary) return null;
    
    const routeSummary = data.data.routeSummary;
    const amountOut = BigInt(routeSummary.amountOut || '0');
    const pricePerToken = Number(amountOut) / Number(amount) * 
      Math.pow(10, tokenIn.decimals) / Math.pow(10, tokenOut.decimals);
    
    return {
      dex: 'Kyberswap',
      tokenIn,
      tokenOut,
      amountIn: amount,
      amountOut,
      pricePerToken,
      priceImpact: Number(routeSummary.priceImpact || 0),
      liquidity: 0n,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Kyberswap quote failed:', error);
    return null;
  }
}

/**
 * Fetch quote from ODOS API (no API key required)
 */
async function fetchOdosQuote(
  tokenIn: TokenInfo,
  tokenOut: TokenInfo,
  amount: bigint,
  chainId: number = 42161
): Promise<PriceQuote | null> {
  try {
    const response = await fetch('https://api.odos.xyz/sor/quote/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chainId,
        inputTokens: [{
          tokenAddress: tokenIn.address,
          amount: amount.toString(),
        }],
        outputTokens: [{
          tokenAddress: tokenOut.address,
          proportion: 1,
        }],
        slippageLimitPercent: 0.5,
        userAddr: '0x0000000000000000000000000000000000000000',
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as OdosResponse;
    
    if (!data.outAmounts?.[0]) return null;
    
    const amountOut = BigInt(data.outAmounts[0]);
    const pricePerToken = Number(amountOut) / Number(amount) * 
      Math.pow(10, tokenIn.decimals) / Math.pow(10, tokenOut.decimals);
    
    return {
      dex: 'ODOS',
      tokenIn,
      tokenOut,
      amountIn: amount,
      amountOut,
      pricePerToken,
      priceImpact: Number(data.priceImpact || 0),
      liquidity: 0n,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('ODOS quote failed:', error);
    return null;
  }
}

/**
 * Fetch quotes from all available DEX aggregators
 */
export async function fetchAllQuotes(
  tokenIn: TokenInfo,
  tokenOut: TokenInfo,
  amount: bigint,
  chainId: number = 42161
): Promise<PriceQuote[]> {
  const quotes: PriceQuote[] = [];
  
  // Fetch from multiple sources in parallel
  const results = await Promise.allSettled([
    fetchParaswapQuote(tokenIn, tokenOut, amount, chainId),
    fetchKyberswapQuote(tokenIn, tokenOut, amount, chainId),
    fetchOdosQuote(tokenIn, tokenOut, amount, chainId),
  ]);
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      quotes.push(result.value);
    }
  }
  
  return quotes;
}

/**
 * Find arbitrage opportunities between quotes
 */
export interface ArbitrageOpp {
  id: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  buyFrom: PriceQuote;
  sellTo: PriceQuote;
  profitBps: number;
  estimatedProfitUsd: number;
  confidence: number;
  expiresAt: Date;
}

export async function findArbitrageOpportunities(
  tokenPairs: Array<{ tokenIn: TokenInfo; tokenOut: TokenInfo }>,
  amountUsd: number = 1000,
  minProfitBps: number = 30
): Promise<ArbitrageOpp[]> {
  const opportunities: ArbitrageOpp[] = [];
  
  // Get current ETH price for amount calculation
  const prices = await fetchRealPrices();
  const ethPrice = prices.get('WETH') || prices.get('ETH') || 3500;
  
  for (const { tokenIn, tokenOut } of tokenPairs) {
    // Calculate amount based on token
    let amount: bigint;
    if (tokenIn.symbol === 'WETH' || tokenIn.symbol === 'ETH') {
      amount = BigInt(Math.floor((amountUsd / ethPrice) * 10 ** tokenIn.decimals));
    } else if (tokenIn.symbol === 'USDC' || tokenIn.symbol === 'USDT') {
      amount = BigInt(amountUsd * 10 ** tokenIn.decimals);
    } else {
      amount = BigInt(10 ** tokenIn.decimals); // 1 token
    }
    
    // Fetch quotes from all DEXs
    const quotes = await fetchAllQuotes(tokenIn, tokenOut, amount);
    
    if (quotes.length < 2) continue;
    
    // Sort by price (best to worst for buying)
    quotes.sort((a, b) => b.pricePerToken - a.pricePerToken);
    
    // Compare best and worst prices
    const bestBuy = quotes[quotes.length - 1]; // Lowest price to buy
    const bestSell = quotes[0]; // Highest price to sell
    
    if (bestBuy.pricePerToken >= bestSell.pricePerToken) continue;
    
    const profitBps = Math.floor(
      ((bestSell.pricePerToken - bestBuy.pricePerToken) / bestBuy.pricePerToken) * 10000
    );
    
    if (profitBps >= minProfitBps) {
      const estimatedProfitUsd = amountUsd * (profitBps / 10000);
      
      opportunities.push({
        id: `arb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        tokenIn,
        tokenOut,
        buyFrom: bestBuy,
        sellTo: bestSell,
        profitBps,
        estimatedProfitUsd,
        confidence: calculateConfidence(profitBps, quotes.length),
        expiresAt: new Date(Date.now() + 30000), // 30 seconds
      });
    }
  }
  
  return opportunities;
}

function calculateConfidence(profitBps: number, quoteCount: number): number {
  let confidence = 50;
  
  // More profit = higher confidence
  if (profitBps > 100) confidence += 25;
  else if (profitBps > 50) confidence += 15;
  else confidence += 5;
  
  // More quotes = higher confidence
  if (quoteCount >= 3) confidence += 15;
  else if (quoteCount >= 2) confidence += 5;
  
  return Math.min(confidence, 95);
}

/**
 * DEX Price Service - manages continuous price updates
 */
export class DexPriceService {
  private prices: Map<string, number> = new Map();
  private quotes: Map<string, PriceQuote[]> = new Map();
  private lastUpdate: Date = new Date(0);
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  
  async start(intervalMs: number = 10000): Promise<void> {
    await this.update();
    this.updateInterval = setInterval(() => this.update(), intervalMs);
  }
  
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  async update(): Promise<void> {
    try {
      this.prices = await fetchRealPrices();
      this.lastUpdate = new Date();
      console.log(`[DexPriceService] Updated prices: ${this.prices.size} tokens`);
    } catch (error) {
      console.error('[DexPriceService] Update failed:', error);
    }
  }
  
  getPrice(symbol: string): number | undefined {
    return this.prices.get(symbol);
  }
  
  getAllPrices(): Map<string, number> {
    return new Map(this.prices);
  }
  
  getLastUpdate(): Date {
    return this.lastUpdate;
  }
}

export interface PriceResult {
  price: number;
  liquidity?: number;
  source: string;
  confidence: number;
}

/**
 * DEX Price Fetcher - Used by ArbitrageAgent to fetch real prices
 */
export class DEXPriceFetcher {
  private priceCache: Map<string, { result: PriceResult; timestamp: number }> = new Map();
  private cacheTtlMs: number = 5000; // 5 second cache

  /**
   * Fetch price for a token pair
   */
  async fetchPrice(
    tokenA: string,
    tokenB: string,
    symbolA: string,
    symbolB: string
  ): Promise<PriceResult | null> {
    const cacheKey = `${symbolA}/${symbolB}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.result;
    }

    try {
      // First try to get prices from CoinGecko (most reliable)
      const prices = await fetchRealPrices();
      
      const priceA = prices.get(symbolA.toUpperCase());
      const priceB = prices.get(symbolB.toUpperCase());
      
      if (priceA && priceB) {
        const result: PriceResult = {
          price: priceA / priceB,
          source: 'coingecko',
          confidence: 95,
        };
        
        this.priceCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }
      
      // Try fetching from DEX aggregators
      const tokenIn = ARBITRUM_TOKENS[symbolA.toUpperCase()];
      const tokenOut = ARBITRUM_TOKENS[symbolB.toUpperCase()];
      
      if (tokenIn && tokenOut) {
        const amount = BigInt(10 ** tokenIn.decimals); // 1 token
        const quotes = await fetchAllQuotes(tokenIn, tokenOut, amount);
        
        if (quotes.length > 0) {
          // Use the average price from all quotes
          const avgPrice = quotes.reduce((sum, q) => sum + q.pricePerToken, 0) / quotes.length;
          const result: PriceResult = {
            price: avgPrice,
            source: quotes.length > 1 ? 'dex-aggregate' : quotes[0].dex,
            confidence: quotes.length >= 3 ? 90 : quotes.length >= 2 ? 80 : 70,
          };
          
          this.priceCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbolA}/${symbolB}:`, error);
      return null;
    }
  }

  /**
   * Clear the price cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }
}
