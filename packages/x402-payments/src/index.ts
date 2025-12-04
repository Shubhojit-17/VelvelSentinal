/**
 * Velvet Sentinel - x402 Payments Package
 */

// Gateway exports
export {
  X402PaymentGateway,
  create402Headers,
  parsePaymentHeader,
  type X402GatewayConfig,
  type X402PaymentChallenge,
  type PaymentAccept,
  type PaymentProof,
} from './gateway.js';

// Middleware exports
export {
  x402Middleware,
  optionalPaymentMiddleware,
  createPaywall,
  getPaymentInfo,
  type X402MiddlewareConfig,
  type PricingStrategy,
} from './middleware.js';
