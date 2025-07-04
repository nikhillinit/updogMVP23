// src/shared/enhanced-types.ts

import { Decimal } from 'decimal.js';

// ===== STAGE AND STRATEGY TYPES =====

export type FundStage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C' | 'Series D+';

export interface TargetReturns {
  low: number;
  target: number;
  high: number;
}

export interface StageStrategy {
  stage: FundStage;
  allocationPct: number;
  checkCount: number;
  avgInitialCheck: number;
  ownership: number;
  reserveRatio: number;
  targetReturns: TargetReturns;
}

// ===== GRADUATION AND EXIT TYPES =====

export type GraduationMatrix = {
  [K in FundStage]?: Partial<Record<FundStage, number>>;
};

export type ExitOutcome = 'fail' | 'low' | 'med' | 'high' | 'mega';

export type ExitProbabilities = {
  [K in FundStage]: Record<ExitOutcome, number>;
};

export interface ExitMultiples {
  fail: number;
  low: number;
  med: number;
  high: number;
  mega: number;
}

// ===== INVESTMENT TYPES =====

export interface Investment {
  id: string;
  stage: FundStage;
  amount: number;
  quarter: number;
  date: Date;
  ownership: number;
  valuation: number;
  isFollowOn: boolean;
  round: string;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  entryStage: FundStage;
  currentStage: FundStage;
  investments: Investment[];
  totalInvested: number;
  currentValuation?: number;
  exitValue?: number;
  exitQuarter?: number;
  exitDate?: Date;
  status: 'active' | 'exited' | 'written-off';
  sector?: string;
  geography?: string;
  foundedYear?: number;
  lastRoundDate?: Date;
  lastRoundValuation?: number;
}

// ===== CASH FLOW AND TIMELINE TYPES =====

export interface CashFlowPoint {
  quarter: number;
  year: number;
  yearQuarter: string; // "Y1Q1" format
  date: Date;
  
  // Cash flows
  contributions: number;
  distributions: number;
  managementFees: number;
  carriedInterest: number;
  netCashFlow: number;
  
  // Running totals
  cumulativeContributions: number;
  cumulativeDistributions: number;
  cumulativeManagementFees: number;
  cumulativeCarriedInterest: number;
  nav: number;
  
  // Performance metrics
  dpi: number;
  rvpi: number;
  tvpi: number;
  moic: number;
  netMoic: number;
  grossIrr: number;
  netIrr: number;
  
  // Portfolio state
  activeCompanies: number;
  exitedCompanies: number;
  writtenOffCompanies: number;
}

// ===== FUND INPUT TYPES =====

export interface FeeProfile {
  managementFeeRate: number;
  managementFeeBasis: 'committed' | 'invested' | 'custom';
  carryRate: number;
  hurdleRate: number;
  catchUp: boolean;
  catchUpRate: number;
  gpCommitment: number;
  organizationalExpenses: number;
  fundExpenses: number;
  annualExpensesCap?: number;
}

export interface RecyclingProfile {
  enabled: boolean;
  cap: number; // % of fund size
  periodYears: number;
  sources: ('management-fees' | 'exits' | 'both')[];
}

export interface EnhancedFundInputs {
  // Basic parameters
  fundName: string;
  fundSize: number;
  currency: 'USD' | 'EUR' | 'GBP';
  vintage: number;
  
  // Fees and economics
  feeProfile: FeeProfile;
  
  // Investment strategy
  stageStrategies: StageStrategy[];
  graduationMatrix: GraduationMatrix;
  exitProbabilityMatrix: ExitProbabilities;
  exitMultiples: Record<FundStage, ExitMultiples>;
  
  // Fund timeline
  investmentPeriodQuarters: number;
  fundLifeQuarters: number;
  extensionQuarters?: number;
  
  // Advanced features
  recycling?: RecyclingProfile;
  waterfallType: 'american' | 'european';
  lpClawback: boolean;
  keyPersonProvisions?: {
    enabled: boolean;
    triggerPercent: number;
  };
}

// ===== CALCULATION RESULTS =====

export interface CompanyResult {
  companyId: string;
  companyName: string;
  entryStage: FundStage;
  exitStage?: FundStage;
  
  // Investment metrics
  invested: number;
  exitProceeds: number;
  unrealizedValue: number;
  totalValue: number;
  
  // Returns
  realizedMultiple: number;
  totalMultiple: number;
  irr?: number;
  
  // Waterfall
  lpProceeds: number;
  gpCarry: number;
  
  // Timing
  holdingPeriod: number;
  exitQuarter?: number;
}

export interface WaterfallCalculation {
  dealId: string;
  invested: number;
  proceeds: number;
  
  // LP waterfall
  lpCapitalReturn: number;
  lpPreferredReturn: number;
  lpCatchUp: number;
  lpProfitShare: number;
  lpTotal: number;
  
  // GP waterfall
  gpCatchUp: number;
  gpCarry: number;
  gpTotal: number;
  
  // Hurdle achievement
  hurdleAchieved: boolean;
  effectiveCarryRate: number;
}

export interface WaterfallSummary {
  type: 'american' | 'european';
  
  // Aggregate amounts
  totalInvested: number;
  totalProceeds: number;
  totalProfit: number;
  
  // LP returns
  lpCapitalReturned: number;
  lpPreferredReturn: number;
  lpProfitDistribution: number;
  totalLpDistribution: number;
  
  // GP returns
  gpManagementFees: number;
  gpCarriedInterest: number;
  gpCatchUp: number;
  totalGpCompensation: number;
  
  // Metrics
  lpNetMultiple: number;
  lpNetIrr: number;
  effectiveCarryRate: number;
  
  // Deal-level details (for American waterfall)
  dealWaterfalls?: WaterfallCalculation[];
}

// ===== ANALYTICS TYPES =====

export interface ReserveAnalysis {
  totalReservesNeeded: number;
  totalReservesAllocated: number;
  reserveSufficiencyRatio: number;
  
  byStage: Record<FundStage, {
    companiesNeedingReserves: number;
    estimatedReserveNeed: number;
    allocatedReserves: number;
    sufficiencyRatio: number;
  }>;
  
  opportunities: ReserveOpportunity[];
  risks: ReserveRisk[];
}

export interface ReserveOpportunity {
  companyId: string;
  companyName: string;
  currentStage: FundStage;
  recommendedReserve: number;
  expectedReturn: number;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface ReserveRisk {
  type: 'insufficient-reserves' | 'over-reserved' | 'concentration';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affectedCompanies: string[];
  recommendedAction: string;
}

export interface PacingAnalysis {
  deploymentRate: number;
  projectedDeploymentCompletion: number; // quarters
  pacingScore: number; // 0-100
  isOnTrack: boolean;
  
  quarterlyDeployment: {
    quarter: number;
    planned: number;
    actual: number;
    variance: number;
    cumulativeVariance: number;
  }[];
  
  recommendations: PacingRecommendation[];
}

export interface PacingRecommendation {
  type: 'speed-up' | 'slow-down' | 'maintain';
  urgency: 'high' | 'medium' | 'low';
  description: string;
  suggestedActions: string[];
}

export interface StageExitAnalysis {
  byStage: Record<FundStage, {
    totalInvested: number;
    totalExited: number;
    averageMultiple: number;
    medianMultiple: number;
    successRate: number;
    averageHoldPeriod: number;
  }>;
  
  byVintage: {
    year: number;
    performance: {
      invested: number;
      realized: number;
      unrealized: number;
      multiple: number;
      irr: number;
    };
  }[];
}

export interface EnhancedAnalytics {
  reserveAnalysis: ReserveAnalysis;
  pacingAnalysis: PacingAnalysis;
  stageExitAnalysis: StageExitAnalysis;
  
  // Additional analytics
  concentrationAnalysis: {
    top5ShareOfNAV: number;
    top10ShareOfNAV: number;
    herfindahlIndex: number;
    diversificationScore: number;
  };
  
  vintageComparison: {
    currentFundPercentile: number;
    benchmark: 'top-quartile' | 'median' | 'bottom-quartile';
    versusMarket: number; // basis points
  };
  
  lastUpdated: Date;
}

// ===== FORECAST RESULT TYPE =====

export interface ForecastResult {
  // Metadata
  calculationId: string;
  calculationDate: Date;
  fundName: string;
  vintage: number;
  
  // Core results
  timeline: CashFlowPoint[];
  portfolio: PortfolioCompany[];
  companyResults: CompanyResult[];
  waterfallSummary: WaterfallSummary;
  
  // Summary metrics
  totalInvested: number;
  totalRealized: number;
  totalUnrealized: number;
  totalValue: number;
  
  // Fee summary
  totalManagementFees: number;
  totalCarriedInterest: number;
  totalOrganizationalExpenses: number;
  totalFundExpenses: number;
  
  // Performance metrics
  grossMoic: number;
  netMoic: number;
  grossIrr: number;
  netIrr: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  
  // Portfolio composition
  portfolioComposition: {
    byStage: Record<FundStage, number>;
    byStatus: {
      active: number;
      exited: number;
      writtenOff: number;
    };
    bySector?: Record<string, number>;
    byGeography?: Record<string, number>;
  };
  
  // Risk metrics
  riskMetrics: {
    jCurveDepth: number;
    timeToBreakeven: number;
    lossRatio: number;
    concentrationRisk: number;
    diversificationScore: number;
  };
  
  // Warnings and info
  warnings: ForecastWarning[];
  assumptions: ModelAssumptions;
}

export interface ForecastWarning {
  type: 'data' | 'calculation' | 'assumption';
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ModelAssumptions {
  version: string;
  methodology: 'deterministic' | 'monte-carlo';
  randomSeed?: number;
  
  marketAssumptions: {
    riskFreeRate: number;
    marketPremium: number;
    betaByStage: Record<FundStage, number>;
  };
  
  operationalAssumptions: {
    defaultFollowOnReserveRatio: number;
    defaultOwnershipTarget: number;
    defaultBoardSeatThreshold: number;
  };
  
  calculationParameters: {
    irMaxIterations: number;
    irTolerance: number;
    navDiscountRate: number;
  };
}

// ===== SCENARIO TYPES =====

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  category: 'base' | 'upside' | 'downside' | 'stress' | 'custom';
  
  // Parameter overrides
  parameterOverrides: {
    fundSize?: number;
    stageAllocations?: Partial<Record<FundStage, number>>;
    exitProbabilities?: Partial<ExitProbabilities>;
    exitMultiples?: Partial<Record<FundStage, Partial<ExitMultiples>>>;
    feeAdjustments?: Partial<FeeProfile>;
    timingAdjustments?: {
      deploymentAcceleration?: number; // -1 to 1
      exitAcceleration?: number; // -1 to 1
    };
  };
  
  // Probability weight for weighted scenarios
  weight?: number;
  isBaseline?: boolean;
}

export interface ScenarioResult {
  scenarioId: string;
  definition: ScenarioDefinition;
  result: ForecastResult;
  
  // Variance from baseline
  varianceFromBaseline?: {
    netMoic: number;
    netIrr: number;
    totalValue: number;
  };
  
  // Execution metadata
  executionTime: number;
  warnings: string[];
}

// ===== VALIDATION TYPES =====

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  suggestion?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  impact: 'high' | 'medium' | 'low';
}

// ===== ERROR TYPES =====

export class FundModelError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FundModelError';
  }
}

export class CalculationError extends FundModelError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CALCULATION_ERROR', message, details);
    this.name = 'CalculationError';
  }
}

export class ValidationError extends FundModelError {
  constructor(message: string, public errors: ValidationError[]) {
    super('VALIDATION_ERROR', message, { errors });
    this.name = 'ValidationError';
  }
}

// ===== UTILITY TYPES =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;