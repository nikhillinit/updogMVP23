// src/services/validation.service.ts
import { 
  EnhancedFundInputs, 
  ValidationError, 
  ValidationWarning,
  FundStage,
  StageStrategy 
} from '../shared/enhanced-types';

export class ValidationService {
  static validateFundInputs(inputs: EnhancedFundInputs): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Fund size validation
    if (!inputs.fundSize || inputs.fundSize <= 0) {
      errors.push({
        field: 'fundSize',
        message: 'Fund size must be positive',
        code: 'INVALID_FUND_SIZE',
        value: inputs.fundSize
      });
    } else if (inputs.fundSize < 10_000_000) {
      errors.push({
        field: 'fundSize',
        message: 'Fund size should be at least $10M for institutional viability',
        code: 'FUND_SIZE_TOO_SMALL',
        value: inputs.fundSize,
        suggestion: 'Consider increasing fund size to at least $10M'
      });
    } else if (inputs.fundSize > 10_000_000_000) {
      errors.push({
        field: 'fundSize',
        message: 'Fund size exceeds $10B maximum',
        code: 'FUND_SIZE_TOO_LARGE',
        value: inputs.fundSize
      });
    }
    
    // Stage allocation validation
    if (!inputs.stageStrategies || inputs.stageStrategies.length === 0) {
      errors.push({
        field: 'stageStrategies',
        message: 'At least one stage strategy is required',
        code: 'MISSING_STAGE_STRATEGIES'
      });
    } else {
      // Check allocation percentages
      const totalAllocation = inputs.stageStrategies.reduce(
        (sum, s) => sum + s.allocationPct, 
        0
      );
      
      if (Math.abs(totalAllocation - 1.0) > 0.001) {
        errors.push({
          field: 'stageStrategies',
          message: `Stage allocations must sum to 100% (currently ${(totalAllocation * 100).toFixed(1)}%)`,
          code: 'INVALID_ALLOCATION_SUM',
          value: totalAllocation,
          suggestion: 'Adjust allocations to sum to exactly 100%'
        });
      }
      
      // Validate individual strategies
      inputs.stageStrategies.forEach((strategy, index) => {
        const stageErrors = this.validateStageStrategy(strategy, index);
        errors.push(...stageErrors);
      });
    }
    
    // Fee validation
    const feeErrors = this.validateFeeProfile(inputs.feeProfile);
    errors.push(...feeErrors);
    
    // Graduation matrix validation
    const graduationErrors = this.validateGraduationMatrix(inputs.graduationMatrix);
    errors.push(...graduationErrors);
    
    // Timeline validation
    if (inputs.investmentPeriodQuarters > inputs.fundLifeQuarters) {
      errors.push({
        field: 'investmentPeriodQuarters',
        message: 'Investment period cannot exceed fund life',
        code: 'INVALID_TIMELINE',
        value: inputs.investmentPeriodQuarters
      });
    }
    
    if (inputs.fundLifeQuarters > 60) { // 15 years
      errors.push({
        field: 'fundLifeQuarters',
        message: 'Fund life exceeds typical 15-year maximum',
        code: 'EXCESSIVE_FUND_LIFE',
        value: inputs.fundLifeQuarters,
        suggestion: 'Consider reducing fund life to 10-12 years'
      });
    }
    
    return errors;
  }
  
  private static validateStageStrategy(
    strategy: StageStrategy, 
    index: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = `stageStrategies[${index}]`;
    
    if (strategy.allocationPct < 0 || strategy.allocationPct > 1) {
      errors.push({
        field: `${prefix}.allocationPct`,
        message: 'Allocation percentage must be between 0% and 100%',
        code: 'INVALID_ALLOCATION_PCT',
        value: strategy.allocationPct
      });
    }
    
    if (strategy.checkCount <= 0 || strategy.checkCount > 100) {
      errors.push({
        field: `${prefix}.checkCount`,
        message: 'Check count must be between 1 and 100',
        code: 'INVALID_CHECK_COUNT',
        value: strategy.checkCount
      });
    }
    
    if (strategy.avgInitialCheck <= 0) {
      errors.push({
        field: `${prefix}.avgInitialCheck`,
        message: 'Average initial check must be positive',
        code: 'INVALID_CHECK_SIZE',
        value: strategy.avgInitialCheck
      });
    }
    
    if (strategy.ownership < 0 || strategy.ownership > 0.5) {
      errors.push({
        field: `${prefix}.ownership`,
        message: 'Ownership target must be between 0% and 50%',
        code: 'INVALID_OWNERSHIP',
        value: strategy.ownership
      });
    }
    
    if (strategy.reserveRatio < 0 || strategy.reserveRatio > 3) {
      errors.push({
        field: `${prefix}.reserveRatio`,
        message: 'Reserve ratio must be between 0 and 3',
        code: 'INVALID_RESERVE_RATIO',
        value: strategy.reserveRatio
      });
    }
    
    return errors;
  }
  
  private static validateFeeProfile(feeProfile: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (feeProfile.managementFeeRate < 0 || feeProfile.managementFeeRate > 0.05) {
      errors.push({
        field: 'feeProfile.managementFeeRate',
        message: 'Management fee should be between 0% and 5%',
        code: 'INVALID_MGMT_FEE',
        value: feeProfile.managementFeeRate,
        suggestion: 'Typical management fees are 2-2.5%'
      });
    }
    
    if (feeProfile.carryRate < 0 || feeProfile.carryRate > 0.30) {
      errors.push({
        field: 'feeProfile.carryRate',
        message: 'Carry should be between 0% and 30%',
        code: 'INVALID_CARRY',
        value: feeProfile.carryRate,
        suggestion: 'Standard carry is 20%'
      });
    }
    
    if (feeProfile.hurdleRate && (feeProfile.hurdleRate < 0 || feeProfile.hurdleRate > 0.15)) {
      errors.push({
        field: 'feeProfile.hurdleRate',
        message: 'Hurdle rate should be between 0% and 15%',
        code: 'INVALID_HURDLE',
        value: feeProfile.hurdleRate,
        suggestion: 'Typical hurdle rate is 8%'
      });
    }
    
    if (feeProfile.gpCommitment < 0 || feeProfile.gpCommitment > 0.10) {
      errors.push({
        field: 'feeProfile.gpCommitment',
        message: 'GP commitment should be between 0% and 10%',
        code: 'INVALID_GP_COMMIT',
        value: feeProfile.gpCommitment,
        suggestion: 'Standard GP commitment is 1-2%'
      });
    }
    
    return errors;
  }
  
  private static validateGraduationMatrix(matrix: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    Object.entries(matrix).forEach(([fromStage, graduations]) => {
      const total = Object.values(graduations as Record<string, number>)
        .reduce((sum, rate) => sum + rate, 0);
      
      if (total > 1.0) {
        errors.push({
          field: `graduationMatrix.${fromStage}`,
          message: `Graduation rates from ${fromStage} exceed 100% (${(total * 100).toFixed(1)}%)`,
          code: 'EXCESSIVE_GRADUATION',
          value: total
        });
      }
    });
    
    return errors;
  }
  
  static getWarnings(inputs: EnhancedFundInputs): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    
    // Check for aggressive assumptions
    inputs.stageStrategies.forEach((strategy, index) => {
      if (strategy.targetReturns.high > 50) {
        warnings.push({
          field: `stageStrategies[${index}].targetReturns.high`,
          message: `Very high target return (${strategy.targetReturns.high}x) for ${strategy.stage}`,
          code: 'AGGRESSIVE_RETURNS',
          impact: 'medium'
        });
      }
    });
    
    // Check for low diversification
    if (inputs.stageStrategies.length < 2) {
      warnings.push({
        field: 'stageStrategies',
        message: 'Limited stage diversification may increase risk',
        code: 'LOW_DIVERSIFICATION',
        impact: 'high'
      });
    }
    
    // Check for high concentration
    const maxAllocation = Math.max(...inputs.stageStrategies.map(s => s.allocationPct));
    if (maxAllocation > 0.6) {
      warnings.push({
        field: 'stageStrategies',
        message: `High concentration in single stage (${(maxAllocation * 100).toFixed(0)}%)`,
        code: 'HIGH_CONCENTRATION',
        impact: 'medium'
      });
    }
    
    return warnings;
  }
}

// ===== ANALYTICS SERVICE =====
// src/services/analytics.service.ts
import { 
  ForecastResult, 
  EnhancedAnalytics,
  ReserveAnalysis,
  PacingAnalysis,
  StageExitAnalysis,
  ReserveOpportunity,
  FundStage
} from '../shared/enhanced-types';

export class AnalyticsService {
  static async calculateEnhancedAnalytics(result: ForecastResult): Promise<EnhancedAnalytics> {
    const [reserveAnalysis, pacingAnalysis, stageExitAnalysis] = await Promise.all([
      this.calculateReserveAnalysis(result),
      this.calculatePacingAnalysis(result),
      this.calculateStageExitAnalysis(result)
    ]);
    
    const concentrationAnalysis = this.calculateConcentrationAnalysis(result);
    const vintageComparison = this.calculateVintageComparison(result);
    
    return {
      reserveAnalysis,
      pacingAnalysis,
      stageExitAnalysis,
      concentrationAnalysis,
      vintageComparison,
      lastUpdated: new Date()
    };
  }
  
  private static calculateReserveAnalysis(result: ForecastResult): ReserveAnalysis {
    const activeCompanies = result.portfolio.filter(c => c.status === 'active');
    
    // Calculate reserve needs by stage
    const byStage: Record<string, any> = {};
    const stages: FundStage[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'];
    
    stages.forEach(stage => {
      const companiesInStage = activeCompanies.filter(c => c.currentStage === stage);
      const avgInvestment = companiesInStage.reduce((sum, c) => sum + c.totalInvested, 0) / 
        (companiesInStage.length || 1);
      
      byStage[stage] = {
        companiesNeedingReserves: companiesInStage.length,
        estimatedReserveNeed: avgInvestment * 0.5 * companiesInStage.length, // 50% reserve ratio
        allocatedReserves: 0, // TODO: Track actual reserves
        sufficiencyRatio: 0
      };
    });
    
    // Calculate opportunities
    const opportunities: ReserveOpportunity[] = activeCompanies
      .filter(c => c.currentStage !== 'Series D+')
      .map(company => ({
        companyId: company.id,
        companyName: company.name,
        currentStage: company.currentStage as FundStage,
        recommendedReserve: company.totalInvested * 0.5,
        expectedReturn: 3.0, // TODO: Calculate based on stage
        priority: 'medium' as const,
        rationale: `Follow-on opportunity for ${company.currentStage} company`
      }))
      .sort((a, b) => b.expectedReturn - a.expectedReturn)
      .slice(0, 10); // Top 10 opportunities
    
    const totalReservesNeeded = Object.values(byStage)
      .reduce((sum: number, stage: any) => sum + stage.estimatedReserveNeed, 0);
    
    return {
      totalReservesNeeded,
      totalReservesAllocated: 0, // TODO: Track actual
      reserveSufficiencyRatio: 0,
      byStage,
      opportunities,
      risks: []
    };
  }
  
  private static calculatePacingAnalysis(result: ForecastResult): PacingAnalysis {
    const deploymentByQuarter = new Map<number, number>();
    
    // Calculate quarterly deployment
    result.portfolio.forEach(company => {
      company.investments.forEach(inv => {
        const current = deploymentByQuarter.get(inv.quarter) || 0;
        deploymentByQuarter.set(inv.quarter, current + inv.amount);
      });
    });
    
    // Calculate pacing metrics
    const totalDeployed = result.totalInvested;
    const investmentPeriod = 20; // 5 years in quarters
    const targetQuarterlyDeployment = result.totalInvested / investmentPeriod;
    
    let cumulativeVariance = 0;
    const quarterlyDeployment = Array.from({ length: investmentPeriod }, (_, i) => {
      const actual = deploymentByQuarter.get(i) || 0;
      const planned = targetQuarterlyDeployment;
      const variance = actual - planned;
      cumulativeVariance += variance;
      
      return {
        quarter: i,
        planned,
        actual,
        variance,
        cumulativeVariance
      };
    });
    
    const deploymentRate = totalDeployed / (result.totalInvested * 1.1); // Include reserves
    const isOnTrack = Math.abs(deploymentRate - 0.5) < 0.1; // Within 10% of target
    
    return {
      deploymentRate,
      projectedDeploymentCompletion: investmentPeriod,
      pacingScore: isOnTrack ? 80 : 60,
      isOnTrack,
      quarterlyDeployment,
      recommendations: []
    };
  }
  
  private static calculateStageExitAnalysis(result: ForecastResult): StageExitAnalysis {
    const stages: FundStage[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+'];
    const byStage: Record<string, any> = {};
    
    stages.forEach(stage => {
      const companiesInStage = result.portfolio.filter(c => c.entryStage === stage);
      const exitedCompanies = companiesInStage.filter(c => c.status === 'exited');
      
      const totalInvested = companiesInStage.reduce((sum, c) => sum + c.totalInvested, 0);
      const totalExited = exitedCompanies.reduce((sum, c) => sum + (c.exitValue || 0), 0);
      
      const multiples = exitedCompanies
        .map(c => (c.exitValue || 0) / c.totalInvested)
        .filter(m => m > 0)
        .sort((a, b) => a - b);
      
      byStage[stage] = {
        totalInvested,
        totalExited,
        averageMultiple: multiples.length > 0 
          ? multiples.reduce((sum, m) => sum + m, 0) / multiples.length 
          : 0,
        medianMultiple: multiples.length > 0 
          ? multiples[Math.floor(multiples.length / 2)] 
          : 0,
        successRate: companiesInStage.length > 0 
          ? exitedCompanies.length / companiesInStage.length 
          : 0,
        averageHoldPeriod: exitedCompanies.length > 0
          ? exitedCompanies.reduce((sum, c) => sum + (c.exitQuarter || 0), 0) / exitedCompanies.length / 4
          : 0
      };
    });
    
    // Simple vintage analysis
    const currentYear = new Date().getFullYear();
    const byVintage = Array.from({ length: 5 }, (_, i) => ({
      year: currentYear - 4 + i,
      performance: {
        invested: result.totalInvested / 5, // Simplified
        realized: result.totalRealized / 5,
        unrealized: result.totalUnrealized / 5,
        multiple: result.grossMoic,
        irr: result.grossIrr
      }
    }));
    
    return { byStage, byVintage };
  }
  
  private static calculateConcentrationAnalysis(result: ForecastResult) {
    const activeCompanies = result.portfolio
      .filter(c => c.status === 'active')
      .sort((a, b) => (b.currentValuation || 0) - (a.currentValuation || 0));
    
    const totalNAV = activeCompanies.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    
    const top5NAV = activeCompanies.slice(0, 5)
      .reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    const top10NAV = activeCompanies.slice(0, 10)
      .reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    
    // Calculate Herfindahl Index
    const herfindahlIndex = activeCompanies.reduce((sum, c) => {
      const share = (c.currentValuation || 0) / totalNAV;
      return sum + Math.pow(share, 2);
    }, 0);
    
    return {
      top5ShareOfNAV: totalNAV > 0 ? top5NAV / totalNAV : 0,
      top10ShareOfNAV: totalNAV > 0 ? top10NAV / totalNAV : 0,
      herfindahlIndex,
      diversificationScore: 1 - herfindahlIndex // Higher is better
    };
  }
  
  private static calculateVintageComparison(result: ForecastResult) {
    // Simplified benchmark comparison
    const benchmarks = {
      topQuartile: { moic: 3.0, irr: 0.25 },
      median: { moic: 2.0, irr: 0.15 },
      bottomQuartile: { moic: 1.3, irr: 0.08 }
    };
    
    let benchmark: 'top-quartile' | 'median' | 'bottom-quartile';
    let percentile: number;
    
    if (result.netMoic >= benchmarks.topQuartile.moic) {
      benchmark = 'top-quartile';
      percentile = 75 + (result.netMoic - benchmarks.topQuartile.moic) / 
        (benchmarks.topQuartile.moic * 0.5) * 25;
    } else if (result.netMoic >= benchmarks.median.moic) {
      benchmark = 'median';
      percentile = 50 + (result.netMoic - benchmarks.median.moic) / 
        (benchmarks.topQuartile.moic - benchmarks.median.moic) * 25;
    } else {
      benchmark = 'bottom-quartile';
      percentile = (result.netMoic - benchmarks.bottomQuartile.moic) / 
        (benchmarks.median.moic - benchmarks.bottomQuartile.moic) * 50;
    }
    
    const versusMarket = (result.netIrr - benchmarks.median.irr) * 10000; // basis points
    
    return {
      currentFundPercentile: Math.max(0, Math.min(100, percentile)),
      benchmark,
      versusMarket
    };
  }
}

// ===== BATCH RUNNER SERVICE =====
// src/services/batch-runner.service.ts
import {
  ScenarioDefinition,
  ScenarioResult,
  EnhancedFundInputs,
  ForecastResult
} from '../shared/enhanced-types';
import { buildEnhancedFundForecast } from '../shared/enhanced-fund-model';

export class EnhancedBatchRunner {
  private scenarios: ScenarioDefinition[] = [];
  private baseInputs: EnhancedFundInputs;
  private useWebWorkers: boolean = true;
  private maxWorkers: number = navigator.hardwareConcurrency || 4;
  
  constructor(baseInputs: EnhancedFundInputs) {
    this.baseInputs = baseInputs;
  }
  
  addScenario(scenario: ScenarioDefinition): void {
    this.scenarios.push(scenario);
  }
  
  async run(onProgress?: (progress: number) => void): Promise<ScenarioResult[]> {
    const totalScenarios = this.scenarios.length;
    let completed = 0;
    
    if (this.useWebWorkers && totalScenarios > 5) {
      return this.runWithWebWorkers(onProgress);
    }
    
    // Run sequentially for small batches
    const results: ScenarioResult[] = [];
    
    for (const scenario of this.scenarios) {
      const startTime = performance.now();
      
      try {
        const modifiedInputs = this.applyScenarioOverrides(this.baseInputs, scenario);
        const result = await buildEnhancedFundForecast(modifiedInputs);
        
        results.push({
          scenarioId: scenario.id,
          definition: scenario,
          result,
          executionTime: performance.now() - startTime,
          warnings: []
        });
      } catch (error) {
        results.push({
          scenarioId: scenario.id,
          definition: scenario,
          result: this.createErrorResult(error),
          executionTime: performance.now() - startTime,
          warnings: [error instanceof Error ? error.message : 'Calculation failed']
        });
      }
      
      completed++;
      if (onProgress) {
        onProgress((completed / totalScenarios) * 100);
      }
    }
    
    // Calculate variance from baseline
    const baseline = results.find(r => r.definition.isBaseline);
    if (baseline) {
      results.forEach(result => {
        if (result.scenarioId !== baseline.scenarioId) {
          result.varianceFromBaseline = {
            netMoic: result.result.netMoic - baseline.result.netMoic,
            netIrr: result.result.netIrr - baseline.result.netIrr,
            totalValue: result.result.totalValue - baseline.result.totalValue
          };
        }
      });
    }
    
    return results;
  }
  
  private async runWithWebWorkers(onProgress?: (progress: number) => void): Promise<ScenarioResult[]> {
    // TODO: Implement web worker pool for parallel execution
    // For now, fall back to sequential
    return this.run(onProgress);
  }
  
  private applyScenarioOverrides(
    baseInputs: EnhancedFundInputs, 
    scenario: ScenarioDefinition
  ): EnhancedFundInputs {
    const modified = { ...baseInputs };
    const overrides = scenario.parameterOverrides;
    
    // Apply fund size override
    if (overrides.fundSize !== undefined) {
      modified.fundSize = overrides.fundSize;
    }
    
    // Apply stage allocation overrides
    if (overrides.stageAllocations) {
      modified.stageStrategies = modified.stageStrategies.map(strategy => {
        const override = overrides.stageAllocations?.[strategy.stage];
        if (override !== undefined) {
          return { ...strategy, allocationPct: override };
        }
        return strategy;
      });
    }
    
    // Apply exit probability overrides
    if (overrides.exitProbabilities) {
      modified.exitProbabilityMatrix = {
        ...modified.exitProbabilityMatrix,
        ...overrides.exitProbabilities
      };
    }
    
    // Apply fee adjustments
    if (overrides.feeAdjustments) {
      modified.feeProfile = {
        ...modified.feeProfile,
        ...overrides.feeAdjustments
      };
    }
    
    // Apply timing adjustments
    if (overrides.timingAdjustments) {
      const { deploymentAcceleration, exitAcceleration } = overrides.timingAdjustments;
      
      if (deploymentAcceleration) {
        // Adjust investment period based on acceleration factor
        modified.investmentPeriodQuarters = Math.round(
          modified.investmentPeriodQuarters * (1 - deploymentAcceleration * 0.2)
        );
      }
      
      if (exitAcceleration) {
        // Adjust exit timing in strategies
        // This would require deeper integration with the fund model
      }
    }
    
    return modified;
  }
  
  private createErrorResult(error: unknown): ForecastResult {
    // Return a minimal valid result for error cases
    return {
      calculationId: 'error',
      calculationDate: new Date(),
      fundName: 'Error',
      vintage: new Date().getFullYear(),
      timeline: [],
      portfolio: [],
      companyResults: [],
      waterfallSummary: {
        type: 'american',
        totalInvested: 0,
        totalProceeds: 0,
        totalProfit: 0,
        lpCapitalReturned: 0,
        lpPreferredReturn: 0,
        lpProfitDistribution: 0,
        totalLpDistribution: 0,
        gpManagementFees: 0,
        gpCarriedInterest: 0,
        gpCatchUp: 0,
        totalGpCompensation: 0,
        lpNetMultiple: 0,
        lpNetIrr: 0,
        effectiveCarryRate: 0
      },
      totalInvested: 0,
      totalRealized: 0,
      totalUnrealized: 0,
      totalValue: 0,
      totalManagementFees: 0,
      totalCarriedInterest: 0,
      totalOrganizationalExpenses: 0,
      totalFundExpenses: 0,
      grossMoic: 0,
      netMoic: 0,
      grossIrr: 0,
      netIrr: 0,
      tvpi: 0,
      dpi: 0,
      rvpi: 0,
      portfolioComposition: {
        byStage: {},
        byStatus: { active: 0, exited: 0, writtenOff: 0 }
      },
      riskMetrics: {
        jCurveDepth: 0,
        timeToBreakeven: 0,
        lossRatio: 0,
        concentrationRisk: 0,
        diversificationScore: 0
      },
      warnings: [{
        type: 'calculation',
        severity: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      assumptions: {
        version: '1.0.0',
        methodology: 'deterministic',
        marketAssumptions: {
          riskFreeRate: 0.04,
          marketPremium: 0.08,
          betaByStage: {}
        },
        operationalAssumptions: {
          defaultFollowOnReserveRatio: 0.5,
          defaultOwnershipTarget: 0.1,
          defaultBoardSeatThreshold: 0.1
        },
        calculationParameters: {
          irMaxIterations: 100,
          irTolerance: 0.000001,
          navDiscountRate: 0.1
        }
      }
    };
  }
}

// Export convenience function
export function validateFundInputs(inputs: EnhancedFundInputs): ValidationError[] {
  return ValidationService.validateFundInputs(inputs);
}

export async function calculateEnhancedAnalytics(result: ForecastResult): Promise<EnhancedAnalytics> {
  return AnalyticsService.calculateEnhancedAnalytics(result);
}