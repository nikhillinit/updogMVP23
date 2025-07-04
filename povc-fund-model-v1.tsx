import React, { useState, useEffect, createContext, useContext, useReducer, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calculator, AlertCircle, CheckCircle, Settings, TrendingUp, GitBranch, Building2, FileText, ChevronRight, Menu, X, Plus, Trash2, Copy, Play, RefreshCw, Save, Info, DollarSign, Percent, Calendar, Target, Award, AlertTriangle, Check } from 'lucide-react';

// ===== TYPES & INTERFACES =====
interface StageStrategy {
  stage: string;
  allocationPct: number;
  checkCount: number;
  avgInitialCheck: number;
  ownership: number;
  reserveRatio: number;
  targetReturns?: {
    low: number;
    target: number;
    high: number;
  };
}

interface ForecastResult {
  grossMoic: number;
  netMoic: number;
  grossIrr: number;
  netIrr: number;
  tvpi: number;
  dpi: number;
  rvpi: number;
  totalInvested: number;
  totalValue: number;
  timeline: Array<{
    quarter: number;
    nav: number;
    dpi: number;
    tvpi: number;
    deployed: number;
  }>;
}

interface EnhancedAnalytics {
  reserveAnalysis: {
    totalReserveNeeded: number;
    currentReserveAllocated: number;
    sufficiencyRatio: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  pacingAnalysis: {
    currentPace: number;
    targetPace: number;
    deviationPercent: number;
    isOnTrack: boolean;
  };
  moicAnalysis: {
    currentMOIC: number;
    expectedMOIC: number;
    initialMOIC: number;
    followOnMOIC: number;
    blendedMOIC: number;
    lpMOIC: number;
    gpMOIC: number;
  };
  concentration: {
    herfindahlIndex: number;
    top5ShareOfNAV: number;
    diversificationScore: number;
  };
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ===== FUND CONTEXT =====
const FundContext = createContext(null);

const fundReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FUND_NAME':
      return { ...state, fundName: action.payload };
    case 'SET_FUND_SIZE':
      return { ...state, fundSize: action.payload };
    case 'UPDATE_STAGE_STRATEGY':
      const newStrategies = [...state.stageStrategies];
      newStrategies[action.payload.index] = { ...newStrategies[action.payload.index], ...action.payload.updates };
      return { ...state, stageStrategies: newStrategies };
    case 'ADD_STAGE_STRATEGY':
      return { ...state, stageStrategies: [...state.stageStrategies, action.payload] };
    case 'REMOVE_STAGE_STRATEGY':
      return { ...state, stageStrategies: state.stageStrategies.filter((_, i) => i !== action.payload) };
    case 'SET_FORECAST_RESULT':
      return { ...state, forecastResult: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, enhancedAnalytics: action.payload };
    case 'SET_CALCULATING':
      return { ...state, isCalculating: action.payload };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    default:
      return state;
  }
};

const initialState = {
  fundName: 'Sample Fund I',
  fundSize: 100000000,
  managementFeeRate: 2.0,
  carryPct: 20,
  investmentPeriodYears: 5,
  fundLifeYears: 10,
  stageStrategies: [
    {
      stage: 'Pre-Seed',
      allocationPct: 0.2,
      checkCount: 20,
      avgInitialCheck: 500000,
      ownership: 0.08,
      reserveRatio: 0.5,
      targetReturns: { low: 3, target: 10, high: 30 }
    },
    {
      stage: 'Seed',
      allocationPct: 0.5,
      checkCount: 25,
      avgInitialCheck: 1500000,
      ownership: 0.10,
      reserveRatio: 0.5,
      targetReturns: { low: 2.5, target: 8, high: 25 }
    },
    {
      stage: 'Series A',
      allocationPct: 0.3,
      checkCount: 10,
      avgInitialCheck: 3000000,
      ownership: 0.12,
      reserveRatio: 0.4,
      targetReturns: { low: 2, target: 5, high: 15 }
    }
  ],
  forecastResult: null,
  enhancedAnalytics: null,
  isCalculating: false,
  validationErrors: []
};

const FundProvider = ({ children }) => {
  const [state, dispatch] = useReducer(fundReducer, initialState);

  const calculateForecast = useCallback(async () => {
    dispatch({ type: 'SET_CALCULATING', payload: true });
    
    // Simulate calculation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock forecast result
    const mockResult = {
      grossMoic: 3.2,
      netMoic: 2.5,
      grossIrr: 0.28,
      netIrr: 0.22,
      tvpi: 2.8,
      dpi: 0.9,
      rvpi: 1.9,
      totalInvested: state.fundSize * 0.85,
      totalValue: state.fundSize * 2.5,
      timeline: Array.from({ length: 40 }, (_, i) => ({
        quarter: i + 1,
        nav: Math.max(0, state.fundSize * (1 - Math.exp(-i/10) + Math.random() * 0.3)),
        dpi: Math.min(1.5, i * 0.04),
        tvpi: Math.min(3, 1 + i * 0.05),
        deployed: Math.min(state.fundSize * 0.85, state.fundSize * 0.85 * (1 - Math.exp(-i/8)))
      }))
    };
    
    dispatch({ type: 'SET_FORECAST_RESULT', payload: mockResult });
    
    // Mock analytics
    const mockAnalytics = {
      reserveAnalysis: {
        totalReserveNeeded: state.fundSize * 0.45,
        currentReserveAllocated: state.fundSize * 0.42,
        sufficiencyRatio: 0.93,
        riskLevel: 'medium'
      },
      pacingAnalysis: {
        currentPace: 0.82,
        targetPace: 0.85,
        deviationPercent: -3.5,
        isOnTrack: true
      },
      moicAnalysis: {
        currentMOIC: 1.8,
        expectedMOIC: 2.5,
        initialMOIC: 2.8,
        followOnMOIC: 2.2,
        blendedMOIC: 2.5,
        lpMOIC: 2.2,
        gpMOIC: 3.8
      },
      concentration: {
        herfindahlIndex: 0.15,
        top5ShareOfNAV: 0.45,
        diversificationScore: 0.85
      }
    };
    
    dispatch({ type: 'SET_ANALYTICS', payload: mockAnalytics });
    dispatch({ type: 'SET_CALCULATING', payload: false });
  }, [state.fundSize, state.stageStrategies]);

  const validateInputs = useCallback(() => {
    const errors = [];
    
    if (state.fundSize < 10000000) {
      errors.push({
        field: 'fundSize',
        message: 'Fund size should be at least $10M for institutional viability',
        severity: 'warning'
      });
    }
    
    const totalAllocation = state.stageStrategies.reduce((sum, s) => sum + s.allocationPct, 0);
    if (Math.abs(totalAllocation - 1.0) > 0.001) {
      errors.push({
        field: 'stageStrategies',
        message: `Stage allocations must sum to 100% (currently ${(totalAllocation * 100).toFixed(1)}%)`,
        severity: 'error'
      });
    }
    
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
    return errors;
  }, [state.fundSize, state.stageStrategies]);

  useEffect(() => {
    validateInputs();
  }, [validateInputs]);

  const value = {
    ...state,
    dispatch,
    calculateForecast,
    validateInputs
  };

  return <FundContext.Provider value={value}>{children}</FundContext.Provider>;
};

const useFundContext = () => {
  const context = useContext(FundContext);
  if (!context) throw new Error('useFundContext must be used within FundProvider');
  return context;
};

// ===== COMPONENTS =====

// Metric Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-50" />}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { fundName, fundSize, forecastResult, enhancedAnalytics, calculateForecast, isCalculating } = useFundContext();

  if (!forecastResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Forecast Available</h2>
            <p className="text-gray-600 mb-6">Run a forecast to see your fund's projected performance</p>
            <button
              onClick={calculateForecast}
              disabled={isCalculating}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Forecast
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{fundName} Dashboard</h1>
          <p className="text-gray-600 mt-1">Fund Size: {formatCurrency(fundSize)}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Net MOIC"
            value={`${forecastResult.netMoic.toFixed(2)}x`}
            subtitle="After fees & carry"
            icon={Target}
            color="blue"
          />
          <MetricCard
            title="Net IRR"
            value={formatPercent(forecastResult.netIrr)}
            subtitle="Annual return"
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="TVPI"
            value={forecastResult.tvpi.toFixed(2)}
            subtitle={`DPI: ${forecastResult.dpi.toFixed(2)}`}
            icon={Award}
            color="purple"
          />
          <MetricCard
            title="Total Value"
            value={formatCurrency(forecastResult.totalValue)}
            subtitle={`Invested: ${formatCurrency(forecastResult.totalInvested)}`}
            icon={DollarSign}
            color="amber"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* J-Curve Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">J-Curve Projection</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastResult.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" label={{ value: 'Quarter', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'NAV ($M)', angle: -90, position: 'insideLeft' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="nav" stroke="#3B82F6" fill="#93BBFC" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* TVPI/DPI Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Multiple Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecastResult.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" label={{ value: 'Quarter', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Multiple', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="tvpi" stroke="#8B5CF6" strokeWidth={2} name="TVPI" />
                <Line type="monotone" dataKey="dpi" stroke="#10B981" strokeWidth={2} name="DPI" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Cards */}
        {enhancedAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reserve Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reserve Analysis</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  enhancedAnalytics.reserveAnalysis.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  enhancedAnalytics.reserveAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {enhancedAnalytics.reserveAnalysis.riskLevel.toUpperCase()} RISK
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Sufficiency Ratio</p>
                  <p className="text-xl font-semibold">{formatPercent(enhancedAnalytics.reserveAnalysis.sufficiencyRatio)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reserve Allocated</p>
                  <p className="text-lg font-medium">{formatCurrency(enhancedAnalytics.reserveAnalysis.currentReserveAllocated)}</p>
                </div>
              </div>
            </div>

            {/* Pacing Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deployment Pacing</h3>
                {enhancedAnalytics.pacingAnalysis.isOnTrack ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Current Pace</p>
                  <p className="text-xl font-semibold">{formatPercent(enhancedAnalytics.pacingAnalysis.currentPace)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deviation</p>
                  <p className={`text-lg font-medium ${enhancedAnalytics.pacingAnalysis.deviationPercent < 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {enhancedAnalytics.pacingAnalysis.deviationPercent > 0 ? '+' : ''}{enhancedAnalytics.pacingAnalysis.deviationPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* MOIC Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MOIC Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Initial Investments</span>
                  <span className="text-sm font-medium">{enhancedAnalytics.moicAnalysis.initialMOIC.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Follow-on</span>
                  <span className="text-sm font-medium">{enhancedAnalytics.moicAnalysis.followOnMOIC.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-900">LP Net</span>
                  <span className="text-sm font-bold text-gray-900">{enhancedAnalytics.moicAnalysis.lpMOIC.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Fund Setup Component
const FundSetup = () => {
  const { 
    fundName, 
    fundSize, 
    stageStrategies, 
    dispatch, 
    calculateForecast, 
    isCalculating,
    validationErrors 
  } = useFundContext();

  const [activeTab, setActiveTab] = useState('basic');

  const totalAllocation = stageStrategies.reduce((sum, s) => sum + s.allocationPct, 0);
  const hasErrors = validationErrors.filter(e => e.severity === 'error').length > 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Fund Setup</h1>
          <p className="text-gray-600 mt-1">Configure your fund parameters and investment strategy</p>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6">
            {validationErrors.map((error, index) => (
              <div key={index} className={`flex items-start p-3 rounded-md mb-2 ${
                error.severity === 'error' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
              }`}>
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'basic', label: 'Basic Settings', icon: Settings },
              { id: 'stages', label: 'Stage Allocation', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fund Name</label>
                <input
                  type="text"
                  value={fundName}
                  onChange={(e) => dispatch({ type: 'SET_FUND_NAME', payload: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fund Size</label>
                <input
                  type="number"
                  value={fundSize}
                  onChange={(e) => dispatch({ type: 'SET_FUND_SIZE', payload: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Minimum $10M recommended for institutional viability</p>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div>
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Stage Strategies</h3>
                  <span className={`text-sm font-medium ${Math.abs(totalAllocation - 1) < 0.001 ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {(totalAllocation * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {stageStrategies.map((strategy, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{strategy.stage}</h4>
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_STAGE_STRATEGY', payload: index })}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Allocation %</label>
                        <input
                          type="number"
                          value={strategy.allocationPct * 100}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_STAGE_STRATEGY',
                            payload: { index, updates: { allocationPct: (parseFloat(e.target.value) || 0) / 100 } }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Check Count</label>
                        <input
                          type="number"
                          value={strategy.checkCount}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_STAGE_STRATEGY',
                            payload: { index, updates: { checkCount: parseInt(e.target.value) || 0 } }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Avg Check Size</label>
                        <input
                          type="number"
                          value={strategy.avgInitialCheck}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_STAGE_STRATEGY',
                            payload: { index, updates: { avgInitialCheck: parseInt(e.target.value) || 0 } }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Reserve Ratio</label>
                        <input
                          type="number"
                          value={strategy.reserveRatio}
                          onChange={(e) => dispatch({
                            type: 'UPDATE_STAGE_STRATEGY',
                            payload: { index, updates: { reserveRatio: parseFloat(e.target.value) || 0 } }
                          })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => dispatch({
                  type: 'ADD_STAGE_STRATEGY',
                  payload: {
                    stage: 'New Stage',
                    allocationPct: 0,
                    checkCount: 10,
                    avgInitialCheck: 1000000,
                    ownership: 0.08,
                    reserveRatio: 0.5,
                    targetReturns: { low: 2, target: 5, high: 15 }
                  }
                })}
                className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Stage
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={calculateForecast}
            disabled={isCalculating || hasErrors}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 mr-2" />
                Calculate Forecast
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Scenarios Component
const Scenarios = () => {
  const [scenarios, setScenarios] = useState([
    { id: '1', name: 'Base Case', description: 'Current fund parameters', metrics: { netMoic: 2.5, netIrr: 0.22 } },
    { id: '2', name: 'Aggressive Growth', description: 'Higher risk, higher return', metrics: { netMoic: 3.2, netIrr: 0.28 } },
    { id: '3', name: 'Conservative', description: 'Lower risk profile', metrics: { netMoic: 2.0, netIrr: 0.18 } }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scenario Analysis</h1>
          <p className="text-gray-600 mt-1">Compare different fund strategies and market conditions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Net MOIC</span>
                  <span className="text-sm font-medium">{scenario.metrics.netMoic.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Net IRR</span>
                  <span className="text-sm font-medium">{(scenario.metrics.netIrr * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  View Details
                </button>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net MOIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net IRR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scenarios.map((scenario) => (
                  <tr key={scenario.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scenario.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scenario.metrics.netMoic.toFixed(2)}x</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(scenario.metrics.netIrr * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        scenario.name === 'Conservative' ? 'bg-green-100 text-green-800' :
                        scenario.name === 'Base Case' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scenario.name === 'Conservative' ? 'Low' : scenario.name === 'Base Case' ? 'Medium' : 'High'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Portfolio Component
const Portfolio = () => {
  const companies = [
    { id: '1', name: 'TechCo A', stage: 'Series A', invested: 3000000, currentValue: 8500000, status: 'active' },
    { id: '2', name: 'StartupB', stage: 'Seed', invested: 1500000, currentValue: 4200000, status: 'active' },
    { id: '3', name: 'VentureC', stage: 'Series B', invested: 5000000, currentValue: 12000000, status: 'active' },
    { id: '4', name: 'ExitCo', stage: 'Series C', invested: 4000000, currentValue: 15000000, status: 'exited' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Companies</h1>
          <p className="text-gray-600 mt-1">Track and manage your portfolio investments</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Active Investments</h3>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiple</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.stage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(company.invested)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(company.currentValue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(company.currentValue / company.invested).toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        company.status === 'active' ? 'bg-green-100 text-green-800' :
                        company.status === 'exited' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
    { id: 'setup', name: 'Fund Setup', icon: Settings, component: FundSetup },
    { id: 'scenarios', name: 'Scenarios', icon: GitBranch, component: Scenarios },
    { id: 'portfolio', name: 'Portfolio', icon: Building2, component: Portfolio }
  ];

  const ActiveComponent = navigation.find(nav => nav.id === activeView)?.component || Dashboard;

  return (
    <FundProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">POVC Fund Model</h1>
                  </div>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      activeView === item.id
                        ? 'text-blue-600 border-b-2 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </button>
                ))}
              </nav>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-base font-medium ${
                      activeView === item.id
                        ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>
          <ActiveComponent />
        </main>
      </div>
    </FundProvider>
  );
};

export default App;