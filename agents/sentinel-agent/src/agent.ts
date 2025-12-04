/**
 * Velvet Sentinel - Security Monitoring Agent
 *
 * Performs security analysis, threat detection, and smart contract auditing
 * using AI inference within TEE for tamper-proof security assessments
 */

import type { Context } from 'hono';
import { BaseAgent, type AgentConfig } from '@velvet/agent-core';
import type { Address, Hex } from 'viem';

// Security analysis types
export interface SecurityScanRequest {
  type: 'contract' | 'transaction' | 'wallet' | 'protocol';
  target: Address | Hex;
  depth?: 'quick' | 'standard' | 'deep';
  options?: {
    includeHistorical?: boolean;
    checkDependencies?: boolean;
    simulateAttacks?: boolean;
  };
}

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  location?: string;
  recommendation?: string;
  references?: string[];
}

export interface SecurityReport {
  id: string;
  timestamp: Date;
  target: string;
  scanType: SecurityScanRequest['type'];
  depth: SecurityScanRequest['depth'];
  findings: SecurityFinding[];
  riskScore: number; // 0-100
  summary: string;
  attestation: string; // TEE attestation for the report
  evidenceId: string; // Cortensor proof
}

export interface ThreatAlert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  affectedAddress?: Address;
  transactionHash?: Hex;
  recommendedAction: string;
}

/**
 * SentinelAgent - Security monitoring and analysis
 */
export class SentinelAgent extends BaseAgent {
  private activeMonitors: Map<string, ReturnType<typeof setInterval>> = new Map();
  private alerts: ThreatAlert[] = [];
  private reports: Map<string, SecurityReport> = new Map();

  constructor(config: Omit<AgentConfig, 'type' | 'capabilities'>) {
    super({
      ...config,
      type: 'security',
      capabilities: ['security-analysis', 'threat-detection', 'monitoring'] as string[],
    });
  }

  protected async onInitialize(): Promise<void> {
    console.log('Sentinel Agent: Loading security analysis models...');
    // In production, would initialize ML models, load vulnerability databases, etc.
  }

  protected async setupRoutes(): Promise<void> {
    // Security scan endpoint (paid)
    this.paidRoute(
      'post',
      '/scan',
      { type: 'dynamic', getPrice: this.calculateScanPrice.bind(this) },
      this.handleSecurityScan.bind(this)
    );

    // Quick check endpoint (lower price)
    this.paidRoute(
      'post',
      '/quick-check',
      { type: 'fixed', amount: 50000n }, // 0.05 USDC
      this.handleQuickCheck.bind(this)
    );

    // Get report by ID
    this.app.get('/report/:id', this.handleGetReport.bind(this));

    // List recent alerts
    this.app.get('/alerts', this.handleGetAlerts.bind(this));

    // Start monitoring an address (paid subscription)
    this.paidRoute(
      'post',
      '/monitor/start',
      { type: 'fixed', amount: 500000n }, // 0.50 USDC per monitoring session
      this.handleStartMonitor.bind(this)
    );

    // Stop monitoring
    this.app.post('/monitor/stop', this.handleStopMonitor.bind(this));
  }

  /**
   * Calculate price based on scan depth and type
   */
  private async calculateScanPrice(ctx: Context): Promise<bigint> {
    try {
      const body = await ctx.req.json<SecurityScanRequest>();
      let basePrice = 100000n; // 0.10 USDC

      // Adjust by depth
      switch (body.depth) {
        case 'quick':
          basePrice = 50000n;
          break;
        case 'deep':
          basePrice = 500000n;
          break;
        default:
          basePrice = 100000n;
      }

      // Adjust by type
      if (body.type === 'protocol') {
        basePrice *= 3n;
      } else if (body.type === 'contract') {
        basePrice *= 2n;
      }

      // Options multipliers
      if (body.options?.simulateAttacks) {
        basePrice *= 2n;
      }

      return basePrice;
    } catch {
      return 100000n; // Default price
    }
  }

  /**
   * Handle full security scan
   */
  private async handleSecurityScan(ctx: Context): Promise<Response> {
    try {
      const request = await ctx.req.json<SecurityScanRequest>();
      const report = await this.performSecurityScan(request);

      this.recordTask(100000n);
      return ctx.json(report);
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Scan failed' },
        500
      );
    }
  }

  /**
   * Handle quick security check
   */
  private async handleQuickCheck(ctx: Context): Promise<Response> {
    try {
      const { target, type } = await ctx.req.json<{ target: string; type: SecurityScanRequest['type'] }>();

      const report = await this.performSecurityScan({
        type,
        target: target as Address,
        depth: 'quick',
      });

      this.recordTask(50000n);
      return ctx.json({
        riskScore: report.riskScore,
        criticalFindings: report.findings.filter((f) => f.severity === 'critical').length,
        summary: report.summary,
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Check failed' },
        500
      );
    }
  }

  /**
   * Get report by ID
   */
  private handleGetReport(ctx: Context): Response {
    const id = ctx.req.param('id');
    const report = this.reports.get(id);

    if (!report) {
      return ctx.json({ error: 'Report not found' }, 404);
    }

    return ctx.json(report);
  }

  /**
   * Get recent alerts
   */
  private handleGetAlerts(ctx: Context): Response {
    const limit = Number(ctx.req.query('limit')) || 10;
    const severity = ctx.req.query('severity');

    let filtered = this.alerts;
    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }

    return ctx.json(filtered.slice(-limit));
  }

  /**
   * Start monitoring an address
   */
  private async handleStartMonitor(ctx: Context): Promise<Response> {
    try {
      const { address, interval } = await ctx.req.json<{
        address: Address;
        interval?: number;
      }>();

      const monitorId = `mon_${Date.now()}`;
      const checkInterval = interval || 60000; // Default 1 minute

      const timer = setInterval(async () => {
        await this.checkAddress(address, monitorId);
      }, checkInterval);

      this.activeMonitors.set(monitorId, timer);

      return ctx.json({
        monitorId,
        address,
        interval: checkInterval,
        status: 'active',
      });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : 'Failed to start monitor' },
        500
      );
    }
  }

  /**
   * Stop monitoring
   */
  private async handleStopMonitor(ctx: Context): Promise<Response> {
    const { monitorId } = await ctx.req.json<{ monitorId: string }>();

    const timer = this.activeMonitors.get(monitorId);
    if (timer) {
      clearInterval(timer);
      this.activeMonitors.delete(monitorId);
      return ctx.json({ status: 'stopped', monitorId });
    }

    return ctx.json({ error: 'Monitor not found' }, 404);
  }

  /**
   * Perform security scan using AI
   */
  private async performSecurityScan(request: SecurityScanRequest): Promise<SecurityReport> {
    this.updateState({ status: 'busy' });

    try {
      // Build analysis prompt
      const prompt = this.buildAnalysisPrompt(request);

      // Get AI analysis from Cortensor (with TEE attestation)
      const aiResponse = await this.requestAI(prompt, {
        model: 'llama-3.1-70b', // Use larger model for security analysis
        maxTokens: 4096,
        temperature: 0.3, // Lower temperature for more deterministic analysis
      });

      // Parse AI response into structured findings
      const findings = this.parseFindings(aiResponse.content);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(findings);

      // Get TEE attestation for the report
      const attestation = await this.tee.getAttestation();

      // Sign the report
      const reportId = `rpt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const report: SecurityReport = {
        id: reportId,
        timestamp: new Date(),
        target: request.target,
        scanType: request.type,
        depth: request.depth || 'standard',
        findings,
        riskScore,
        summary: this.generateSummary(findings, riskScore),
        attestation: JSON.stringify(attestation),
        evidenceId: aiResponse.evidenceId,
      };

      // Store report
      this.reports.set(reportId, report);

      this.updateState({ status: 'ready' });
      return report;
    } catch (error) {
      this.updateState({ status: 'ready' });
      throw error;
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(request: SecurityScanRequest): string {
    const prompts: Record<SecurityScanRequest['type'], string> = {
      contract: `Analyze the following smart contract address for security vulnerabilities.
Address: ${request.target}
Depth: ${request.depth || 'standard'}

Provide a detailed security analysis including:
1. Potential reentrancy vulnerabilities
2. Access control issues
3. Integer overflow/underflow risks
4. Unchecked external calls
5. Gas optimization issues
6. Logic errors

Format each finding as:
[SEVERITY: critical/high/medium/low/info]
Title: <issue title>
Category: <vulnerability category>
Description: <detailed description>
Recommendation: <how to fix>`,

      transaction: `Analyze the following transaction for security concerns.
Transaction: ${request.target}

Check for:
1. Suspicious value transfers
2. Known malicious addresses
3. Flash loan attacks
4. Front-running indicators
5. Unusual gas patterns`,

      wallet: `Analyze the following wallet address for security risks.
Address: ${request.target}

Evaluate:
1. Transaction history patterns
2. Interactions with known malicious contracts
3. Token approval risks
4. Potential compromises`,

      protocol: `Perform a comprehensive security analysis of the protocol.
Entry point: ${request.target}

Analyze:
1. Smart contract architecture
2. Economic attack vectors
3. Governance risks
4. Oracle dependencies
5. Upgrade mechanisms
6. Access control patterns`,
    };

    return prompts[request.type];
  }

  /**
   * Parse AI response into structured findings
   */
  private parseFindings(content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const sections = content.split(/\[SEVERITY:\s*/i).filter(Boolean);

    for (const section of sections) {
      try {
        const severityMatch = section.match(/^(critical|high|medium|low|info)\]/i);
        if (!severityMatch) continue;

        const severity = severityMatch[1].toLowerCase() as SecurityFinding['severity'];
        const rest = section.slice(severityMatch[0].length);

        const titleMatch = rest.match(/Title:\s*(.+?)(?:\n|Category:)/i);
        const categoryMatch = rest.match(/Category:\s*(.+?)(?:\n|Description:)/i);
        const descMatch = rest.match(/Description:\s*(.+?)(?:\n|Recommendation:|$)/is);
        const recMatch = rest.match(/Recommendation:\s*(.+?)(?:\n\n|$)/is);

        findings.push({
          id: `find_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          severity,
          title: titleMatch?.[1]?.trim() || 'Unknown Issue',
          category: categoryMatch?.[1]?.trim() || 'General',
          description: descMatch?.[1]?.trim() || 'No description',
          recommendation: recMatch?.[1]?.trim(),
        });
      } catch {
        // Skip malformed sections
      }
    }

    return findings;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(findings: SecurityFinding[]): number {
    const weights = { critical: 40, high: 25, medium: 10, low: 3, info: 1 };

    let score = 0;
    for (const finding of findings) {
      score += weights[finding.severity];
    }

    return Math.min(100, score);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(findings: SecurityFinding[], riskScore: number): string {
    const critical = findings.filter((f) => f.severity === 'critical').length;
    const high = findings.filter((f) => f.severity === 'high').length;

    if (riskScore >= 80) {
      return `CRITICAL RISK: Found ${critical} critical and ${high} high severity issues. Immediate action required.`;
    } else if (riskScore >= 50) {
      return `HIGH RISK: Found ${findings.length} security issues including ${high} high severity. Review recommended.`;
    } else if (riskScore >= 20) {
      return `MODERATE RISK: Found ${findings.length} potential issues. Standard security review advised.`;
    } else {
      return `LOW RISK: ${findings.length} minor issues found. Overall security posture is acceptable.`;
    }
  }

  /**
   * Check address for monitoring alerts
   */
  private async checkAddress(address: Address, monitorId: string): Promise<void> {
    try {
      const quickScan = await this.performSecurityScan({
        type: 'wallet',
        target: address,
        depth: 'quick',
      });

      // Generate alerts for new findings
      for (const finding of quickScan.findings.filter(
        (f) => f.severity === 'critical' || f.severity === 'high'
      )) {
        const alert: ThreatAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: new Date(),
          severity: finding.severity as 'critical' | 'high',
          type: finding.category,
          description: finding.description,
          affectedAddress: address,
          recommendedAction: finding.recommendation || 'Review immediately',
        };

        this.alerts.push(alert);
        console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.description}`);
      }
    } catch (error) {
      console.error(`Monitor ${monitorId} check failed:`, error);
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    // Stop all monitors
    for (const [id, timer] of this.activeMonitors) {
      clearInterval(timer);
    }
    this.activeMonitors.clear();

    await super.shutdown();
  }
}

export default SentinelAgent;
