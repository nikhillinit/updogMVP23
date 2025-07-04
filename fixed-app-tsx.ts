// src/App.tsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  GitBranch, 
  Building2,
  FileText,
  ChevronRight,
  Menu,
  X,
  Download,
  Calculator,
  AlertCircle,
  CheckCircle // FIXED: Added missing import
} from 'lucide-react';

// Import the Fund Context Provider and hook
import { FundProvider, useFundContext } from './context/fund-context-provider';

// Import main components
import Dashboard from './components/main-dashboard-v1';
import FundSetup from './components/fund-setup-component';
import Scenarios from './components/scenarios-component';
import Portfolio from './components/portfolio-component';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              An error occurred while running the fund model. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Navigation types
interface NavigationItem {
  name: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

// Reports component with improved error handling
const Reports: React.FC = () => {
  const fundContext = useFundContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Reset status after 5 seconds
  useEffect(() => {
    if (exportStatus !== 'idle') {
      const timer = setTimeout(() => {
        setExportStatus('idle');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportStatus]);
  
  const handleExcelExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');
    
    try {
      if (!fundContext.forecastResult) {
        throw new Error('No forecast data available. Please calculate forecast first.');
      }
      
      const blob = await fundContext.exportToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fundContext.fundName.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleCsvExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');
    
    try {
      if (!fundContext.forecastResult) {
        throw new Error('No forecast data available. Please calculate forecast first.');
      }
      
      const blob = await fundContext.exportToCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fundContext.fundName.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate reports and export fund data in various formats
          </p>
        </div>
        
        {exportStatus === 'success' && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Export completed successfully
                </p>
              </div>
            </div>
          </div>
        )}
        
        {exportStatus === 'error' && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage || 'Export failed. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Excel Export */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Full Model Export</h3>
            <p className="text-sm text-gray-600 mb-4">
              Export complete fund model with all calculations and projections to Excel format
            </p>
            <button
              onClick={handleExcelExport}
              disabled={isExporting || !fundContext.forecastResult}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </button>
          </div>
          
          {/* CSV Export */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Export</h3>
            <p className="text-sm text-gray-600 mb-4">
              Export raw data in CSV format for further analysis in other tools
            </p>
            <button
              onClick={handleCsvExport}
              disabled={isExporting || !fundContext.forecastResult}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </>
              )}
            </button>
          </div>
          
          {/* LP Report */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">LP Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate LP-friendly report with key metrics and visualizations
            </p>
            <button
              onClick={() => fundContext.exportLPReport()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
        
        {/* Export Settings */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Export Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Customize what data to include in your exports
          </p>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fundContext.exportSettings.includeCashFlows}
                onChange={(e) => fundContext.updateExportSettings({ includeCashFlows: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include detailed cash flows</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fundContext.exportSettings.includeCompanyDetails}
                onChange={(e) => fundContext.updateExportSettings({ includeCompanyDetails: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include company-level details</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fundContext.exportSettings.includeAssumptions}
                onChange={(e) => fundContext.updateExportSettings({ includeAssumptions: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include model assumptions</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fundContext.exportSettings.lpFriendly}
                onChange={(e) => fundContext.updateExportSettings({ lpFriendly: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">LP-friendly format (simplified)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Navigation items
const navigation: NavigationItem[] = [
  { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard, component: Dashboard },
  { name: 'Fund Setup', id: 'setup', icon: Settings, component: FundSetup },
  { name: 'Scenarios', id: 'scenarios', icon: GitBranch, component: Scenarios },
  { name: 'Portfolio', id: 'portfolio', icon: Building2, component: Portfolio },
  { name: 'Reports', id: 'reports', icon: FileText, component: Reports },
];

// Layout wrapper component
interface AppLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (viewId: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fundContext = useFundContext();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">POVC Fund Model</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </nav>
          
          {/* Fund info */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900">{fundContext.fundName}</p>
              <p className="text-gray-500">
                ${(fundContext.fundSize / 1000000).toFixed(0)}M Fund
              </p>
              {fundContext.lastCalculatedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date(fundContext.lastCalculatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
            
            {/* Quick calculate button */}
            <button
              onClick={() => fundContext.calculateForecast()}
              disabled={fundContext.isCalculating}
              className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {fundContext.isCalculating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalculate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 lg:hidden bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">POVC Fund Model</h1>
            <div className="w-6" />
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

// Main App component with proper initialization
function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [initError, setInitError] = useState<Error | null>(null);
  const fundContext = useFundContext();
  
  // Find current component
  const currentNavItem = navigation.find(item => item.id === currentView);
  const CurrentComponent = currentNavItem?.component || Dashboard;
  
  // Initialize on mount with proper error handling
  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        // Only calculate if we don't have results and aren't already calculating
        if (mounted && !fundContext.forecastResult && !fundContext.isCalculating) {
          await fundContext.calculateForecast();
        }
      } catch (error) {
        console.error('Initial forecast calculation failed:', error);
        if (mounted) {
          setInitError(error instanceof Error ? error : new Error('Unknown initialization error'));
        }
      }
    };
    
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initializeApp());
    } else {
      setTimeout(initializeApp, 0);
    }
    
    return () => {
      mounted = false;
    };
  }, []); // Empty deps - only run once on mount
  
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Initialization Error</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Failed to initialize fund model: {initError.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      <CurrentComponent />
    </AppLayout>
  );
}

// Export wrapped app with error boundary and provider
export default function AppWithProvider() {
  return (
    <ErrorBoundary>
      <FundProvider>
        <App />
      </FundProvider>
    </ErrorBoundary>
  );
}