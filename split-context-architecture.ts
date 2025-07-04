// src/context/fund-data.context.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  EnhancedFundInputs, 
  StageStrategy, 
  GraduationMatrix,
  FundStage,
  ExitProbabilities,
  FeeProfile
} from '../shared/enhanced-types';

// ===== STATE TYPE =====
interface FundDataState {
  // Basic fund info
  fundName: string;
  fundSize: number;
  vintage: number;
  currency: 'USD' | 'EUR' | 'GBP';
  
  // Strategy
  stageStrategies: StageStrategy[];
  graduationMatrix: GraduationMatrix;
  exitProbabilityMatrix: ExitProbabilities;
  
  // Economics
  feeProfile: FeeProfile;
  
  // Timeline
  investmentPeriodQuarters: number;
  fundLifeQuarters: number;
  
  // Settings
  waterfallType: 'american' | 'european';
  recyclingEnabled: boolean;
  recyclingCap: number;
  
  // UI State
  isDirty: boolean;
  lastSavedAt?: Date;
}

// ===== ACTIONS =====
type FundDataAction = 
  | { type: 'SET_FUND_NAME'; payload: string }
  | { type: 'SET_FUND_SIZE'; payload: number }
  | { type: 'SET_VINTAGE'; payload: number }
  | { type: 'UPDATE_STAGE_STRATEGY'; payload: { index: number; strategy: Partial<StageStrategy> } }
  | { type: 'ADD_STAGE_STRATEGY'; payload: StageStrategy }
  | { type: 'REMOVE_STAGE_STRATEGY'; payload: number }
  | { type: 'UPDATE_GRADUATION_RATE'; payload: { from: FundStage; to: FundStage; rate: number } }
  | { type: 'UPDATE_FEE_PROFILE'; payload: Partial<FeeProfile> }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'LOAD_STATE'; payload: FundDataState };

// ===== REDUCER =====
function fundDataReducer(state: FundDataState, action: FundDataAction): FundDataState {
  switch (action.type) {
    case 'SET_FUND_NAME':
      return { ...state, fundName: action.payload, isDirty: true };
      
    case 'SET_FUND_SIZE':
      return { ...state, fundSize: action.payload, isDirty: true };
      
    case 'SET_VINTAGE':
      return { ...state, vintage: action.payload, isDirty: true };
      
    case 'UPDATE_STAGE_STRATEGY': {
      const newStrategies = [...state.stageStrategies];
      newStrategies[action.payload.index] = {
        ...newStrategies[action.payload.index],
        ...action.payload.strategy
      };
      return { ...state, stageStrategies: newStrategies, isDirty: true };
    }
    
    case 'ADD_STAGE_STRATEGY':
      return { 
        ...state, 
        stageStrategies: [...state.stageStrategies, action.payload],
        isDirty: true 
      };
      
    case 'REMOVE_STAGE_STRATEGY':
      return {
        ...state,
        stageStrategies: state.stageStrategies.filter((_, i) => i !== action.payload),
        isDirty: true
      };
      
    case 'UPDATE_GRADUATION_RATE': {
      const { from, to, rate } = action.payload;
      return {
        ...state,
        graduationMatrix: {
          ...state.graduationMatrix,
          [from]: {
            ...state.graduationMatrix[from],
            [to]: rate
          }
        },
        isDirty: true
      };
    }
    
    case 'UPDATE_FEE_PROFILE':
      return {
        ...state,
        feeProfile: { ...state.feeProfile, ...action.payload },
        isDirty: true
      };
      
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };
      
    case 'RESET_TO_DEFAULTS':
      return { ...getDefaultState(), isDirty: false };
      
    case 'LOAD_STATE':
      return { ...action.payload, isDirty: false };
      
    default:
      return state;
  }
}

// ===== DEFAULT STATE =====
function getDefaultState(): FundDataState {
  return {
    fundName: 'New Fund',
    fundSize: 100_000_000,
    vintage: new Date().getFullYear(),
    currency: 'USD',
    
    stageStrategies: [
      {
        stage: 'Pre-Seed',
        allocationPct: 0.15,
        checkCount: 20,
        avgInitialCheck: 500_000,
        ownership: 0.07,
        reserveRatio: 1.0,
        targetReturns: { low: 3, target: 10, high: 50 }
      },
      {
        stage: 'Seed',
        allocationPct: 0.35,
        checkCount: 25,
        avgInitialCheck: 1_500_000,
        ownership: 0.10,
        reserveRatio: 0.8,
        targetReturns: { low: 2.5, target: 8, high: 30 }
      },
      {
        stage: 'Series A',
        allocationPct: 0.50,
        checkCount: 15,
        avgInitialCheck: 3_000_000,
        ownership: 0.08,
        reserveRatio: 0.5,
        targetReturns: { low: 2, target: 5, high: 15 }
      }
    ],
    
    graduationMatrix: {
      'Pre-Seed': { 'Seed': 0.65 },
      'Seed': { 'Series A': 0.60 },
      'Series A': { 'Series B': 0.55 },
      'Series B': { 'Series C': 0.50 },
      'Series C': { 'Series D+': 0.45 }
    },
    
    exitProbabilityMatrix: {
      'Pre-Seed': { fail: 0.90, low: 0.06, med: 0.02, high: 0.01, mega: 0.01 },
      'Seed': { fail: 0.80, low: 0.10, med: 0.05, high: 0.03, mega: 0.02 },
      'Series A': { fail: 0.65, low: 0.15, med: 0.10, high: 0.07, mega: 0.03 },
      'Series B': { fail: 0.50, low: 0.20, med: 0.15, high: 0.10, mega: 0.05 },
      'Series C': { fail: 0.35, low: 0.25, med: 0.20, high: 0.15, mega: 0.05 },
      'Series D+': { fail: 0.10, low: 0.20, med: 0.30, high: 0.25, mega: 0.15 }
    },
    
    feeProfile: {
      managementFeeRate: 0.02,
      managementFeeBasis: 'committed',
      carryRate: 0.20,
      hurdleRate: 0.08,
      catchUp: true,
      catchUpRate: 1.0,
      gpCommitment: 0.02,
      organizationalExpenses: 500_000,
      fundExpenses: 200_000,
      annualExpensesCap: 100_000
    },
    
    investmentPeriodQuarters: 20, // 5 years
    fundLifeQuarters: 40, // 10 years
    
    waterfallType: 'american',
    recyclingEnabled: false,
    recyclingCap: 0.15,
    
    isDirty: false
  };
}

// ===== CONTEXT =====
interface FundDataContextValue {
  state: FundDataState;
  dispatch: React.Dispatch<FundDataAction>;
  
  // Convenience methods
  setFundName: (name: string) => void;
  setFundSize: (size: number) => void;
  setVintage: (year: number) => void;
  updateStageStrategy: (index: number, updates: Partial<StageStrategy>) => void;
  addStageStrategy: (strategy: StageStrategy) => void;
  removeStageStrategy: (index: number) => void;
  updateGraduationRate: (from: FundStage, to: FundStage, rate: number) => void;
  updateFeeProfile: (updates: Partial<FeeProfile>) => void;
  resetToDefaults: () => void;
  
  // Computed values
  getInputs: () => EnhancedFundInputs;
}

const FundDataContext = createContext<FundDataContextValue | null>(null);

export function FundDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(fundDataReducer, getDefaultState());
  
  // Convenience methods
  const setFundName = (name: string) => dispatch({ type: 'SET_FUND_NAME', payload: name });
  const setFundSize = (size: number) => dispatch({ type: 'SET_FUND_SIZE', payload: size });
  const setVintage = (year: number) => dispatch({ type: 'SET_VINTAGE', payload: year });
  
  const updateStageStrategy = (index: number, updates: Partial<StageStrategy>) => {
    dispatch({ type: 'UPDATE_STAGE_STRATEGY', payload: { index, strategy: updates } });
  };
  
  const addStageStrategy = (strategy: StageStrategy) => {
    dispatch({ type: 'ADD_STAGE_STRATEGY', payload: strategy });
  };
  
  const removeStageStrategy = (index: number) => {
    dispatch({ type: 'REMOVE_STAGE_STRATEGY', payload: index });
  };
  
  const updateGraduationRate = (from: FundStage, to: FundStage, rate: number) => {
    dispatch({ type: 'UPDATE_GRADUATION_RATE', payload: { from, to, rate } });
  };
  
  const updateFeeProfile = (updates: Partial<FeeProfile>) => {
    dispatch({ type: 'UPDATE_FEE_PROFILE', payload: updates });
  };
  
  const resetToDefaults = () => dispatch({ type: 'RESET_TO_DEFAULTS' });
  
  // Get inputs for calculation
  const getInputs = (): EnhancedFundInputs => ({
    fundName: state.fundName,
    fundSize: state.fundSize,
    currency: state.currency,
    vintage: state.vintage,
    feeProfile: state.feeProfile,
    stageStrategies: state.stageStrategies,
    graduationMatrix: state.graduationMatrix,
    exitProbabilityMatrix: state.exitProbabilityMatrix,
    exitMultiples: {
      'Pre-Seed': { fail: 0, low: 3, med: 10, high: 50, mega: 100 },
      'Seed': { fail: 0, low: 2.5, med: 8, high: 30, mega: 75 },
      'Series A': { fail: 0, low: 2, med: 5, high: 15, mega: 50 },
      'Series B': { fail: 0, low: 1.5, med: 3, high: 10, mega: 30 },
      'Series C': { fail: 0, low: 1.25, med: 2.5, high: 7, mega: 20 },
      'Series D+': { fail: 0, low: 1, med: 2, high: 5, mega: 15 }
    },
    investmentPeriodQuarters: state.investmentPeriodQuarters,
    fundLifeQuarters: state.fundLifeQuarters,
    waterfallType: state.waterfallType,
    lpClawback: true,
    recycling: state.recyclingEnabled ? {
      enabled: true,
      cap: state.recyclingCap,
      periodYears: 5,
      sources: ['exits', 'management-fees']
    } : undefined
  });
  
  const value: FundDataContextValue = {
    state,
    dispatch,
    setFundName,
    setFundSize,
    setVintage,
    updateStageStrategy,
    addStageStrategy,
    removeStageStrategy,
    updateGraduationRate,
    updateFeeProfile,
    resetToDefaults,
    getInputs
  };
  
  return (
    <FundDataContext.Provider value={value}>
      {children}
    </FundDataContext.Provider>
  );
}

export function useFundData() {
  const context = useContext(FundDataContext);
  if (!context) {
    throw new Error('useFundData must be used within FundDataProvider');
  }
  return context;
}

// ===== CALCULATION CONTEXT =====
// src/context/fund-calculation.context.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ForecastResult, EnhancedAnalytics, ValidationError } from '../shared/enhanced-types';
import { buildEnhancedFundForecast } from '../shared/enhanced-fund-model';
import { calculateEnhancedAnalytics } from '../services/analytics.service';
import { validateFundInputs } from '../services/validation.service';

interface CalculationState {
  forecastResult: ForecastResult | null;
  enhancedAnalytics: EnhancedAnalytics | null;
  isCalculating: boolean;
  lastCalculatedAt: Date | null;
  calculationProgress: number;
  validationErrors: ValidationError[];
}

interface FundCalculationContextValue extends CalculationState {
  calculateForecast: (inputs: EnhancedFundInputs) => Promise<ForecastResult>;
  calculateAnalytics: (result: ForecastResult) => Promise<EnhancedAnalytics>;
  validateInputs: (inputs: EnhancedFundInputs) => ValidationError[];
  clearResults: () => void;
}

const FundCalculationContext = createContext<FundCalculationContextValue | null>(null);

export function FundCalculationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CalculationState>({
    forecastResult: null,
    enhancedAnalytics: null,
    isCalculating: false,
    lastCalculatedAt: null,
    calculationProgress: 0,
    validationErrors: []
  });
  
  const calculateForecast = useCallback(async (inputs: EnhancedFundInputs): Promise<ForecastResult> => {
    // Validate first
    const errors = validateFundInputs(inputs);
    if (errors.length > 0) {
      setState(prev => ({ ...prev, validationErrors: errors }));
      throw new ValidationError('Validation failed', errors);
    }
    
    setState(prev => ({ 
      ...prev, 
      isCalculating: true, 
      calculationProgress: 0,
      validationErrors: []
    }));
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          calculationProgress: Math.min(prev.calculationProgress + 10, 90) 
        }));
      }, 100);
      
      const result = await buildEnhancedFundForecast(inputs);
      
      clearInterval(progressInterval);
      
      setState(prev => ({
        ...prev,
        forecastResult: result,
        isCalculating: false,
        lastCalculatedAt: new Date(),
        calculationProgress: 100
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isCalculating: false,
        calculationProgress: 0
      }));
      throw error;
    }
  }, []);
  
  const calculateAnalytics = useCallback(async (result: ForecastResult): Promise<EnhancedAnalytics> => {
    const analytics = await calculateEnhancedAnalytics(result);
    setState(prev => ({ ...prev, enhancedAnalytics: analytics }));
    return analytics;
  }, []);
  
  const validateInputs = useCallback((inputs: EnhancedFundInputs): ValidationError[] => {
    const errors = validateFundInputs(inputs);
    setState(prev => ({ ...prev, validationErrors: errors }));
    return errors;
  }, []);
  
  const clearResults = useCallback(() => {
    setState({
      forecastResult: null,
      enhancedAnalytics: null,
      isCalculating: false,
      lastCalculatedAt: null,
      calculationProgress: 0,
      validationErrors: []
    });
  }, []);
  
  const value: FundCalculationContextValue = {
    ...state,
    calculateForecast,
    calculateAnalytics,
    validateInputs,
    clearResults
  };
  
  return (
    <FundCalculationContext.Provider value={value}>
      {children}
    </FundCalculationContext.Provider>
  );
}

export function useFundCalculation() {
  const context = useContext(FundCalculationContext);
  if (!context) {
    throw new Error('useFundCalculation must be used within FundCalculationProvider');
  }
  return context;
}

// ===== SCENARIO CONTEXT =====
// src/context/fund-scenario.context.tsx
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { 
  ScenarioDefinition, 
  ScenarioResult,
  EnhancedFundInputs
} from '../shared/enhanced-types';
import { EnhancedBatchRunner } from '../services/batch-runner.service';
import { v4 as uuidv4 } from 'uuid';

interface ScenarioState {
  scenarios: ScenarioDefinition[];
  activeScenarioId: string | null;
  results: Map<string, ScenarioResult>;
  isRunning: boolean;
  runProgress: number;
}

type ScenarioAction =
  | { type: 'ADD_SCENARIO'; payload: ScenarioDefinition }
  | { type: 'UPDATE_SCENARIO'; payload: { id: string; updates: Partial<ScenarioDefinition> } }
  | { type: 'DELETE_SCENARIO'; payload: string }
  | { type: 'SET_ACTIVE_SCENARIO'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: ScenarioResult[] }
  | { type: 'SET_IS_RUNNING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number };

function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case 'ADD_SCENARIO':
      return { ...state, scenarios: [...state.scenarios, action.payload] };
      
    case 'UPDATE_SCENARIO': {
      const { id, updates } = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      };
    }
    
    case 'DELETE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.filter(s => s.id !== action.payload),
        results: new Map(Array.from(state.results).filter(([id]) => id !== action.payload))
      };
      
    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.payload };
      
    case 'SET_RESULTS': {
      const newResults = new Map(state.results);
      action.payload.forEach(result => {
        newResults.set(result.scenarioId, result);
      });
      return { ...state, results: newResults };
    }
    
    case 'SET_IS_RUNNING':
      return { ...state, isRunning: action.payload };
      
    case 'SET_PROGRESS':
      return { ...state, runProgress: action.payload };
      
    default:
      return state;
  }
}

interface FundScenarioContextValue {
  scenarios: ScenarioDefinition[];
  activeScenario: ScenarioDefinition | null;
  results: Map<string, ScenarioResult>;
  isRunning: boolean;
  runProgress: number;
  
  createScenario: (name: string, description?: string) => string;
  updateScenario: (id: string, updates: Partial<ScenarioDefinition>) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string, newName: string) => string;
  setActiveScenario: (id: string | null) => void;
  runScenarios: (baseInputs: EnhancedFundInputs, scenarioIds?: string[]) => Promise<ScenarioResult[]>;
  clearResults: () => void;
}

const FundScenarioContext = createContext<FundScenarioContextValue | null>(null);

export function FundScenarioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scenarioReducer, {
    scenarios: [],
    activeScenarioId: null,
    results: new Map(),
    isRunning: false,
    runProgress: 0
  });
  
  const activeScenario = state.scenarios.find(s => s.id === state.activeScenarioId) || null;
  
  const createScenario = useCallback((name: string, description?: string): string => {
    const id = uuidv4();
    const scenario: ScenarioDefinition = {
      id,
      name,
      description: description || '',
      category: 'custom',
      parameterOverrides: {}
    };
    dispatch({ type: 'ADD_SCENARIO', payload: scenario });
    return id;
  }, []);
  
  const updateScenario = useCallback((id: string, updates: Partial<ScenarioDefinition>) => {
    dispatch({ type: 'UPDATE_SCENARIO', payload: { id, updates } });
  }, []);
  
  const deleteScenario = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SCENARIO', payload: id });
  }, []);
  
  const duplicateScenario = useCallback((id: string, newName: string): string => {
    const original = state.scenarios.find(s => s.id === id);
    if (!original) throw new Error('Scenario not found');
    
    const newId = uuidv4();
    const duplicate: ScenarioDefinition = {
      ...original,
      id: newId,
      name: newName
    };
    dispatch({ type: 'ADD_SCENARIO', payload: duplicate });
    return newId;
  }, [state.scenarios]);
  
  const setActiveScenario = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SCENARIO', payload: id });
  }, []);
  
  const runScenarios = useCallback(async (
    baseInputs: EnhancedFundInputs, 
    scenarioIds?: string[]
  ): Promise<ScenarioResult[]> => {
    dispatch({ type: 'SET_IS_RUNNING', payload: true });
    dispatch({ type: 'SET_PROGRESS', payload: 0 });
    
    try {
      const runner = new EnhancedBatchRunner(baseInputs);
      const scenariosToRun = scenarioIds 
        ? state.scenarios.filter(s => scenarioIds.includes(s.id))
        : state.scenarios;
      
      scenariosToRun.forEach(scenario => {
        runner.addScenario(scenario);
      });
      
      const results = await runner.run((progress) => {
        dispatch({ type: 'SET_PROGRESS', payload: progress });
      });
      
      dispatch({ type: 'SET_RESULTS', payload: results });
      return results;
    } finally {
      dispatch({ type: 'SET_IS_RUNNING', payload: false });
      dispatch({ type: 'SET_PROGRESS', payload: 100 });
    }
  }, [state.scenarios]);
  
  const clearResults = useCallback(() => {
    dispatch({ type: 'SET_RESULTS', payload: [] });
  }, []);
  
  const value: FundScenarioContextValue = {
    scenarios: state.scenarios,
    activeScenario,
    results: state.results,
    isRunning: state.isRunning,
    runProgress: state.runProgress,
    createScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    setActiveScenario,
    runScenarios,
    clearResults
  };
  
  return (
    <FundScenarioContext.Provider value={value}>
      {children}
    </FundScenarioContext.Provider>
  );
}

export function useFundScenarios() {
  const context = useContext(FundScenarioContext);
  if (!context) {
    throw new Error('useFundScenarios must be used within FundScenarioProvider');
  }
  return context;
}

// ===== COMPOSED PROVIDER =====
// src/context/fund-provider.tsx
export function FundProvider({ children }: { children: ReactNode }) {
  return (
    <FundDataProvider>
      <FundCalculationProvider>
        <FundScenarioProvider>
          {children}
        </FundScenarioProvider>
      </FundCalculationProvider>
    </FundDataProvider>
  );
}

// ===== UNIFIED HOOK =====
// src/context/use-fund.hook.ts
export function useFund() {
  const data = useFundData();
  const calculation = useFundCalculation();
  const scenarios = useFundScenarios();
  
  // Convenience method to calculate with current data
  const calculate = useCallback(async () => {
    const inputs = data.getInputs();
    return calculation.calculateForecast(inputs);
  }, [data, calculation]);
  
  // Export methods that need access to multiple contexts
  const exportToExcel = useCallback(async () => {
    if (!calculation.forecastResult) {
      throw new Error('No forecast result to export');
    }
    
    const { ExcelExportService } = await import('../services/excel-export.service');
    return ExcelExportService.generateFundWorkbook(
      data.state.fundName,
      calculation.forecastResult,
      {
        includeCashFlows: true,
        includeCompanyDetails: true,
        includeAssumptions: true,
        lpFriendly: false
      }
    );
  }, [data.state.fundName, calculation.forecastResult]);
  
  return {
    // Data
    ...data,
    
    // Calculation
    ...calculation,
    calculate,
    
    // Scenarios
    ...scenarios,
    
    // Export
    exportToExcel
  };
}