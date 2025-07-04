// src/services/excel-export.service.ts
import * as XLSX from 'xlsx';
import { ForecastResult, PortfolioCompany, CashFlowPoint } from '../shared/types';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

// Excel cell styling types
interface CellStyle {
  font?: { bold?: boolean; color?: { rgb?: string } };
  fill?: { fgColor?: { rgb?: string } };
  alignment?: { horizontal?: string; vertical?: string };
  numFmt?: string;
  border?: {
    top?: { style: string; color?: { rgb?: string } };
    bottom?: { style: string; color?: { rgb?: string } };
    left?: { style: string; color?: { rgb?: string } };
    right?: { style: string; color?: { rgb?: string } };
  };
}

export class ExcelExportService {
  private static readonly HEADER_STYLE: CellStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  private static readonly SUBHEADER_STYLE: CellStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'E5E7EB' } },
    alignment: { horizontal: 'left' }
  };

  private static readonly CURRENCY_FORMAT = '"$"#,##0.00';
  private static readonly PERCENT_FORMAT = '0.00%';
  private static readonly NUMBER_FORMAT = '#,##0';

  /**
   * Generate complete Excel workbook with all fund data
   */
  static async generateFundWorkbook(
    fundName: string,
    data: ForecastResult,
    includeOptions: {
      includeCashFlows: boolean;
      includeCompanyDetails: boolean;
      includeAssumptions: boolean;
      lpFriendly: boolean;
    }
  ): Promise<Blob> {
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: `${fundName} Fund Model Export`,
      Author: 'POVC Fund Model',
      CreatedDate: new Date()
    };

    // Add sheets based on options
    this.addSummarySheet(wb, fundName, data, includeOptions.lpFriendly);
    
    if (includeOptions.includeCashFlows && !includeOptions.lpFriendly) {
      this.addCashFlowsSheet(wb, data);
    }
    
    if (includeOptions.includeCompanyDetails) {
      this.addPortfolioSheet(wb, data);
    }
    
    this.addPerformanceSheet(wb, data);
    
    if (includeOptions.includeAssumptions && !includeOptions.lpFriendly) {
      this.addAssumptionsSheet(wb, data);
    }

    // Generate workbook with styles
    const wbout = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: true,
      compression: true
    });

    return new Blob([wbout], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  /**
   * Add Summary sheet with key metrics
   */
  private static addSummarySheet(
    wb: XLSX.WorkBook, 
    fundName: string,
    data: ForecastResult, 
    lpFriendly: boolean
  ): void {
    const summaryData = [];
    
    // Title row
    summaryData.push([fundName + ' - Fund Summary']);
    summaryData.push(['Generated on: ' + new Date().toLocaleDateString()]);
    summaryData.push([]); // Empty row

    // Key Metrics Section
    summaryData.push(['Key Performance Metrics']);
    summaryData.push(['Metric', 'Value']);
    
    summaryData.push(['Gross MOIC', data.grossMoic.toFixed(2) + 'x']);
    summaryData.push(['Net MOIC', data.netMoic.toFixed(2) + 'x']);
    summaryData.push(['Gross IRR', formatPercent(data.grossIrr)]);
    summaryData.push(['Net IRR', formatPercent(data.netIrr)]);
    summaryData.push(['TVPI', data.tvpi.toFixed(2) + 'x']);
    summaryData.push(['DPI', data.dpi.toFixed(2) + 'x']);
    summaryData.push(['RVPI', data.rvpi.toFixed(2) + 'x']);
    
    summaryData.push([]); // Empty row
    
    // Fund Economics Section
    summaryData.push(['Fund Economics']);
    summaryData.push(['Metric', 'Amount']);
    
    summaryData.push(['Total Invested', formatCurrency(data.totalInvested)]);
    summaryData.push(['Total Exit Value', formatCurrency(data.totalExitValue)]);
    summaryData.push(['Total Management Fees', formatCurrency(data.totalManagementFees)]);
    summaryData.push(['Total Carried Interest', formatCurrency(data.totalGpCarry)]);
    summaryData.push(['LP Profit', formatCurrency(data.totalLpProfit)]);
    
    if (!lpFriendly) {
      summaryData.push([]); // Empty row
      
      // Portfolio Statistics
      summaryData.push(['Portfolio Statistics']);
      summaryData.push(['Metric', 'Value']);
      
      const activeCompanies = data.portfolio.filter(c => c.status === 'active').length;
      const exitedCompanies = data.portfolio.filter(c => c.status === 'exited').length;
      const writtenOff = data.portfolio.filter(c => c.status === 'written-off').length;
      
      summaryData.push(['Total Companies', data.portfolio.length]);
      summaryData.push(['Active', activeCompanies]);
      summaryData.push(['Exited', exitedCompanies]);
      summaryData.push(['Written Off', writtenOff]);
      summaryData.push(['Success Rate', formatPercent(exitedCompanies / data.portfolio.length)]);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Apply styles
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
    
    // Style the title
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'left' }
      };
    }
    
    // Style section headers
    const sectionHeaders = ['A4', 'A13', 'A20'];
    sectionHeaders.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = this.SUBHEADER_STYLE;
      }
    });
    
    // Style metric headers
    ['A5', 'A14', 'A21'].forEach(cell => {
      if (ws[cell]) ws[cell].s = { font: { bold: true } };
      if (ws[cell.replace('A', 'B')]) ws[cell.replace('A', 'B')].s = { font: { bold: true } };
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  }

  /**
   * Add detailed cash flows sheet
   */
  private static addCashFlowsSheet(wb: XLSX.WorkBook, data: ForecastResult): void {
    const headers = [
      'Quarter',
      'Year',
      'Contributions',
      'Distributions', 
      'NAV',
      'Management Fees',
      'Carried Interest',
      'Cumulative Contributions',
      'Cumulative Distributions',
      'DPI',
      'TVPI',
      'Net IRR'
    ];

    const cashFlowData = data.timeline.map(cf => [
      cf.yearQuarter,
      cf.year,
      cf.contributions,
      cf.distributions,
      cf.nav,
      cf.managementFees,
      cf.carriedInterest || 0,
      cf.cumulativeContributions,
      cf.cumulativeDistributions,
      cf.dpi,
      cf.tvpi,
      cf.netIrr
    ]);

    // Add headers and data
    const wsData = [headers, ...cashFlowData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // Quarter
      { wch: 8 },  // Year
      { wch: 15 }, // Contributions
      { wch: 15 }, // Distributions
      { wch: 15 }, // NAV
      { wch: 15 }, // Mgmt Fees
      { wch: 15 }, // Carry
      { wch: 20 }, // Cum Contributions
      { wch: 20 }, // Cum Distributions
      { wch: 8 },  // DPI
      { wch: 8 },  // TVPI
      { wch: 10 }  // Net IRR
    ];

    // Apply number formats
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = 1; R <= range.e.r; ++R) {
      // Currency columns (C-I)
      for (let C = 2; C <= 8; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cell]) {
          ws[cell].z = this.CURRENCY_FORMAT;
          ws[cell].t = 'n';
        }
      }
      
      // Ratio columns (J-K)
      for (let C = 9; C <= 10; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cell]) {
          ws[cell].z = '0.00"x"';
          ws[cell].t = 'n';
        }
      }
      
      // Percentage column (L)
      const irrCell = XLSX.utils.encode_cell({ r: R, c: 11 });
      if (ws[irrCell]) {
        ws[irrCell].z = this.PERCENT_FORMAT;
        ws[irrCell].t = 'n';
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Cash Flows');
  }

  /**
   * Add portfolio companies sheet
   */
  private static addPortfolioSheet(wb: XLSX.WorkBook, data: ForecastResult): void {
    const headers = [
      'Company ID',
      'Entry Stage',
      'Current Stage',
      'Status',
      'Total Invested',
      'Exit Value',
      'Multiple',
      'IRR',
      'Exit Quarter'
    ];

    const portfolioData = data.portfolio.map(company => {
      const companyResult = data.companyResults.find(r => r.companyId === company.id);
      return [
        company.id,
        company.entryStage,
        company.currentStage,
        company.status,
        company.totalInvested,
        company.exitValue || 0,
        companyResult?.multiple || 0,
        0, // TODO: Calculate company IRR
        company.exitQuarter || ''
      ];
    });

    // Sort by status (exited first, then active, then written-off)
    portfolioData.sort((a, b) => {
      const statusOrder = { 'exited': 0, 'active': 1, 'written-off': 2 };
      return statusOrder[a[3] as keyof typeof statusOrder] - statusOrder[b[3] as keyof typeof statusOrder];
    });

    const wsData = [headers, ...portfolioData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Company ID
      { wch: 12 }, // Entry Stage
      { wch: 12 }, // Current Stage
      { wch: 12 }, // Status
      { wch: 15 }, // Total Invested
      { wch: 15 }, // Exit Value
      { wch: 10 }, // Multiple
      { wch: 10 }, // IRR
      { wch: 12 }  // Exit Quarter
    ];

    // Apply conditional formatting for status
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = 1; R <= range.e.r; ++R) {
      const statusCell = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (ws[statusCell]) {
        const status = ws[statusCell].v;
        if (status === 'exited') {
          ws[statusCell].s = {
            fill: { fgColor: { rgb: 'D1FAE5' } },
            font: { color: { rgb: '065F46' } }
          };
        } else if (status === 'written-off') {
          ws[statusCell].s = {
            fill: { fgColor: { rgb: 'FEE2E2' } },
            font: { color: { rgb: '991B1B' } }
          };
        }
      }
      
      // Format currency columns
      for (let C of [4, 5]) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cell]) {
          ws[cell].z = this.CURRENCY_FORMAT;
          ws[cell].t = 'n';
        }
      }
      
      // Format multiple column
      const multipleCell = XLSX.utils.encode_cell({ r: R, c: 6 });
      if (ws[multipleCell]) {
        ws[multipleCell].z = '0.00"x"';
        ws[multipleCell].t = 'n';
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');
  }

  /**
   * Add performance analytics sheet
   */
  private static addPerformanceSheet(wb: XLSX.WorkBook, data: ForecastResult): void {
    const performanceData = [];
    
    // J-Curve visualization data
    performanceData.push(['J-Curve Analysis']);
    performanceData.push(['Year', 'Cumulative Cash Flow', 'NAV', 'Total Value']);
    
    // Group timeline by year
    const yearlyData = new Map<number, {
      cumCF: number;
      nav: number;
      totalValue: number;
    }>();
    
    data.timeline.forEach(point => {
      const year = Math.floor(point.year);
      if (!yearlyData.has(year)) {
        yearlyData.set(year, {
          cumCF: point.cumulativeContributions - point.cumulativeDistributions,
          nav: point.nav,
          totalValue: point.nav + point.cumulativeDistributions
        });
      }
    });
    
    yearlyData.forEach((value, year) => {
      performanceData.push([
        `Year ${year}`,
        value.cumCF,
        value.nav,
        value.totalValue
      ]);
    });
    
    performanceData.push([]); // Empty row
    
    // Vintage analysis
    performanceData.push(['Vintage Analysis']);
    performanceData.push(['Stage', 'Count', 'Invested', 'Realized', 'Multiple', 'Success Rate']);
    
    const stageGroups = new Map<string, {
      count: number;
      invested: number;
      realized: number;
      exited: number;
    }>();
    
    data.portfolio.forEach(company => {
      const stage = company.entryStage;
      if (!stageGroups.has(stage)) {
        stageGroups.set(stage, { count: 0, invested: 0, realized: 0, exited: 0 });
      }
      const group = stageGroups.get(stage)!;
      group.count++;
      group.invested += company.totalInvested;
      if (company.status === 'exited') {
        group.realized += company.exitValue || 0;
        group.exited++;
      }
    });
    
    stageGroups.forEach((value, stage) => {
      performanceData.push([
        stage,
        value.count,
        value.invested,
        value.realized,
        value.realized / value.invested || 0,
        value.exited / value.count || 0
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(performanceData);
    
    // Format currency cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = 2; R <= range.e.r; ++R) {
      // J-Curve section currencies
      if (R <= yearlyData.size + 1) {
        for (let C = 1; C <= 3; ++C) {
          const cell = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[cell]) {
            ws[cell].z = this.CURRENCY_FORMAT;
            ws[cell].t = 'n';
          }
        }
      }
      
      // Vintage section
      if (R > yearlyData.size + 4) {
        // Invested and Realized columns
        for (let C of [2, 3]) {
          const cell = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[cell]) {
            ws[cell].z = this.CURRENCY_FORMAT;
            ws[cell].t = 'n';
          }
        }
        // Multiple column
        const multipleCell = XLSX.utils.encode_cell({ r: R, c: 4 });
        if (ws[multipleCell]) {
          ws[multipleCell].z = '0.00"x"';
          ws[multipleCell].t = 'n';
        }
        // Success rate column
        const rateCell = XLSX.utils.encode_cell({ r: R, c: 5 });
        if (ws[rateCell]) {
          ws[rateCell].z = this.PERCENT_FORMAT;
          ws[rateCell].t = 'n';
        }
      }
    }
    
    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Performance');
  }

  /**
   * Add assumptions sheet
   */
  private static addAssumptionsSheet(wb: XLSX.WorkBook, data: ForecastResult): void {
    const assumptions = [];
    
    assumptions.push(['Model Assumptions']);
    assumptions.push(['Generated: ' + new Date().toISOString()]);
    assumptions.push([]);
    
    assumptions.push(['Fund Parameters']);
    assumptions.push(['Parameter', 'Value']);
    assumptions.push(['Fund Life', data.fundLifeQuarters / 4 + ' years']);
    assumptions.push(['Investment Period', '5 years']); // TODO: Get from context
    assumptions.push(['Management Fee', '2.0%']); // TODO: Get from context
    assumptions.push(['Carry', '20.0%']); // TODO: Get from context
    assumptions.push(['Hurdle Rate', '8.0%']); // TODO: Get from context
    
    assumptions.push([]);
    assumptions.push(['Stage Allocation']);
    assumptions.push(['Stage', 'Allocation %', 'Check Count', 'Avg Check Size']);
    
    // TODO: Add actual stage allocation data
    
    assumptions.push([]);
    assumptions.push(['Exit Assumptions']);
    assumptions.push(['Stage', 'Fail %', 'Low %', 'Med %', 'High %', 'Mega %']);
    
    // TODO: Add actual exit probability data

    const ws = XLSX.utils.aoa_to_sheet(assumptions);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Assumptions');
  }

  /**
   * Generate CSV export as fallback
   */
  static generateCSV(data: ForecastResult): Blob {
    const csvRows = [];
    
    // Headers
    csvRows.push([
      'Quarter',
      'Year', 
      'Contributions',
      'Distributions',
      'NAV',
      'DPI',
      'TVPI',
      'Net IRR'
    ].join(','));
    
    // Data rows
    data.timeline.forEach(point => {
      csvRows.push([
        point.yearQuarter,
        point.year,
        point.contributions,
        point.distributions,
        point.nav,
        point.dpi,
        point.tvpi,
        point.netIrr
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}