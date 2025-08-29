'use client';

import { useState } from 'react';
import exportService from '../../utils/exportService';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  data = [], 
  dataType = 'invoices', // 'invoices', 'customers', 'payments'
  title = 'Export Data' 
}) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const exportFormats = [
    { value: 'csv', label: 'CSV (Excel Compatible)', icon: '📊' },
    { value: 'json', label: 'JSON (Developer Friendly)', icon: '{ }' },
    { value: 'detailed', label: 'Detailed JSON Report', icon: '📋' },
    { value: 'backup', label: 'Full System Backup', icon: '💾' }
  ];

  const handleExport = async () => {
    if (!data || data.length === 0) {
      setExportStatus({ type: 'error', message: 'No data to export' });
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      let result;
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (exportFormat) {
        case 'csv':
          if (dataType === 'invoices') {
            exportService.exportInvoicesCSV(data, `invoices_${timestamp}`);
          } else if (dataType === 'customers') {
            exportService.exportCustomersCSV(data, `customers_${timestamp}`);
          } else if (dataType === 'payments') {
            exportService.exportPaymentsCSV(data, `payments_${timestamp}`);
          }
          result = { success: true, message: `${dataType} exported to CSV successfully!` };
          break;

        case 'json':
          exportService.exportJSON(data, `${dataType}_${timestamp}`);
          result = { success: true, message: `${dataType} exported to JSON successfully!` };
          break;

        case 'detailed':
          if (dataType === 'invoices') {
            exportService.exportDetailedInvoicesJSON(data, `invoices_detailed_${timestamp}`);
          } else {
            exportService.exportJSON(data, `${dataType}_detailed_${timestamp}`);
          }
          result = { success: true, message: `Detailed ${dataType} report exported successfully!` };
          break;

        case 'backup':
          result = await exportService.exportFullBackup();
          break;

        default:
          throw new Error('Invalid export format');
      }

      if (result.success) {
        setExportStatus({ type: 'success', message: result.message });
        // Close modal after successful export
        setTimeout(() => {
          onClose();
          setExportStatus(null);
        }, 2000);
      } else {
        setExportStatus({ type: 'error', message: result.message });
      }

    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: 'Export failed. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const getDataPreview = () => {
    if (!data || data.length === 0) return 'No data available';
    
    const count = data.length;
    const dataTypeName = dataType.charAt(0).toUpperCase() + dataType.slice(1);
    
    let summary = `${count} ${dataTypeName}`;
    
    if (dataType === 'invoices') {
      const totalAmount = data.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      summary += ` • Total Value: $${totalAmount.toFixed(2)}`;
    }
    
    return summary;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              📤 {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl"
              disabled={isExporting}
            >
              ×
            </button>
          </div>

          {/* Data Preview */}
          <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Data to Export:</p>
            <p className="font-semibold text-gray-900 dark:text-slate-100">
              {getDataPreview()}
            </p>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3 mb-6">
            <label className="form-label">
              Export Format
            </label>
            {exportFormats.map((format) => (
              <label key={format.value} className="flex items-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-3"
                  disabled={isExporting}
                />
                <span className="text-xl mr-3">{format.icon}</span>
                <div>
                  <div className="font-medium text-gray-900 dark:text-slate-100">
                    {format.label}
                  </div>
                  {format.value === 'csv' && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Opens in Excel, Google Sheets, etc.
                    </div>
                  )}
                  {format.value === 'json' && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Structured data for developers
                    </div>
                  )}
                  {format.value === 'detailed' && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Includes analytics and summaries
                    </div>
                  )}
                  {format.value === 'backup' && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Complete system backup (all data)
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Status Messages */}
          {exportStatus && (
            <div className={`p-4 rounded-lg mb-6 ${
              exportStatus.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {exportStatus.type === 'success' ? '✅' : '❌'}
                </span>
                {exportStatus.message}
              </div>
            </div>
          )}

          {/* Export Info */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
            <div className="text-blue-800 dark:text-blue-200 text-sm">
              <p className="font-medium mb-2">📝 Export Information:</p>
              <ul className="space-y-1 text-xs">
                <li>• Files are downloaded to your device</li>
                <li>• Exported data includes current date/time</li>
                <li>• CSV files work with Excel and Google Sheets</li>
                <li>• JSON files are perfect for data analysis</li>
                <li>• Backup includes all system data</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="btn-primary flex-1 flex items-center justify-center"
              disabled={isExporting || !data || data.length === 0}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  📤 Export Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}