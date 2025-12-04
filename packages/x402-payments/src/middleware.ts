/**
 * Velvet Sentinel - x402 Hono Middleware
 *
 * Integrates x402 payment protocol with Hono HTTP framework
 */

import type { Context, MiddlewareHandler, Next } from 'hono';
import type { Address } from 'viem';
import {
  X402PaymentGateway,
  create402Headers,
  parsePaymentHeader,
  type X402PaymentChallenge,
  type PaymentProof,
} from './gateway.js';

export interface X402MiddlewareConfig {
  gateway: X402PaymentGateway;
  payTo: Address;
  pricing: PricingStrategy;
  onPaymentReceived?: (proof: PaymentProof, ctx: Context) => Promise<void>;
  onPaymentFailed?: (error: string, ctx: Context) => Promise<void>;
}

export type PricingStrategy =
  | { type: 'fixed'; amount: bigint }
  | { type: 'per-request'; baseAmount: bigint; multiplier?: number }
  | { type: 'dynamic'; getPrice: (ctx: Context) => Promise<bigint> };

/**
 * Create x402 middleware for Hono
 */
export function x402Middleware(config: X402MiddlewareConfig): MiddlewareHandler {
  return async (ctx: Context, next: Next) => {
    // Check for payment header
    const paymentHeader = ctx.req.header('X-PAYMENT');

    if (!paymentHeader) {
      // No payment provided, return 402
      return handle402Response(ctx, config);
    }

    // Parse and verify payment proof
    const proof = parsePaymentHeader(paymentHeader);

    if (!proof) {
      return ctx.json(
        { error: 'Invalid payment proof format' },
        { status: 400 }
      );
    }

    // Verify the payment
    const resource = ctx.req.url;
    const result = await config.gateway.verifyPaymentProof(proof, resource);

    if (!result.valid) {
      if (config.onPaymentFailed) {
        await config.onPaymentFailed(result.error || 'Unknown error', ctx);
      }
      return handle402Response(ctx, config, result.error);
    }

    // Payment valid, call callback if provided
    if (config.onPaymentReceived) {
      await config.onPaymentReceived(proof, ctx);
    }

    // Add payment info to context
    ctx.set('x402Payment', {
      proof,
      receipt: result.receipt,
    });

    // Continue to handler
    await next();
  };
}

/**
 * Handle 402 Payment Required response
 */
async function handle402Response(
  ctx: Context,
  config: X402MiddlewareConfig,
  error?: string
): Promise<Response> {
  // Calculate price based on strategy
  let amount: bigint;

  switch (config.pricing.type) {
    case 'fixed':
      amount = config.pricing.amount;
      break;
    case 'per-request':
      amount = config.pricing.baseAmount * BigInt(config.pricing.multiplier || 1);
      break;
    case 'dynamic':
      amount = await config.pricing.getPrice(ctx);
      break;
  }

  // Create payment challenge
  const challenge = config.gateway.createPaymentChallenge({
    resource: ctx.req.url,
    amount,
    payTo: config.payTo,
    description: `Payment for ${ctx.req.method} ${ctx.req.path}`,
  });

  if (error) {
    challenge.error = error;
  }

  const headers = create402Headers(challenge);

  return ctx.json(challenge, {
    status: 402,
    headers: Object.fromEntries(headers.entries()),
  });
}

/**
 * Optional payment middleware - doesn't require payment but accepts it
 */
export function optionalPaymentMiddleware(
  gateway: X402PaymentGateway
): MiddlewareHandler {
  return async (ctx: Context, next: Next) => {
    const paymentHeader = ctx.req.header('X-PAYMENT');

    if (paymentHeader) {
      const proof = parsePaymentHeader(paymentHeader);

      if (proof) {
        const result = await gateway.verifyPaymentProof(proof, ctx.req.url);

        if (result.valid) {
          ctx.set('x402Payment', {
            proof,
            receipt: result.receipt,
            paid: true,
          });
        }
      }
    } else {
      ctx.set('x402Payment', { paid: false });
    }

    await next();
  };
}

/**
 * Create a paywall for specific routes
 */
export function createPaywall(config: {
  gateway: X402PaymentGateway;
  payTo: Address;
  routes: Map<string, bigint>; // path pattern -> price
}): MiddlewareHandler {
  return async (ctx: Context, next: Next) => {
    const path = ctx.req.path;
    let matchedPrice: bigint | undefined;

    // Check if path matches any paywall route
    for (const [pattern, price] of config.routes) {
      if (pathMatches(path, pattern)) {
        matchedPrice = price;
        break;
      }
    }

    if (matchedPrice === undefined) {
      // Not a paywalled route
      await next();
      return;
    }

    // Apply payment middleware
    const middleware = x402Middleware({
      gateway: config.gateway,
      payTo: config.payTo,
      pricing: { type: 'fixed', amount: matchedPrice },
    });

    return middleware(ctx, next);
  };
}

/**
 * Simple path matching (supports wildcards)
 */
function pathMatches(path: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return path.startsWith(prefix);
  }
  return path === pattern;
}

/**
 * Get payment info from context
 */
export function getPaymentInfo(ctx: Context): {
  proof?: PaymentProof;
  receipt?: { id: string; transactionHash: string };
  paid: boolean;
} {
  return ctx.get('x402Payment') || { paid: false };
}
