import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Download, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const CSVImportModal = ({ isOpen, onClose, groupId, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setError('');
    setReport(null);
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        setError('Please select a valid CSV file (.csv)');
        setFile(null);
      }
    }
  };

  const downloadTemplate = () => {
    const templateContent = [
      'title,amount,currency,category,date,paid_by_email,split_type,split_details',
      'Dinner Group,1200,INR,Food,2026-06-14,member1@email.com,EQUAL,',
      'Weekend Cab,500,INR,Travel,2026-06-14,member2@email.com,EXACT,member1@email.com:200;member2@email.com:300',
      'Streaming Bill,300,INR,Bills,2026-06-14,member1@email.com,PERCENTAGE,member1@email.com:40;member2@email.com:60'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'expense_analyzer_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose a file first.');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvContent = e.target.result;
        try {
          const res = await api.importExpenses(groupId, file.name, csvContent);
          setReport(res);
          if (res.importedCount > 0) {
            onImportSuccess();
          }
        } catch (err) {
          setError(err.message || 'Failed to upload and parse CSV.');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file.');
        setLoading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import Expenses via CSV</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          
          {/* Instructions and Download Template */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">CSV Import Instructions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide a CSV file. Expense paid-by email and split details must match registered emails in this group. Split details format:
              </p>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5 mt-1 font-mono">
                <li>EQUAL: blank (splits with everyone) or email1;email2</li>
                <li>EXACT: email1:amount;email2:amount</li>
                <li>PERCENTAGE: email1:pct;email2:pct</li>
              </ul>
            </div>
            
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-xl transition-all duration-200 shrink-0"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
          </div>

          {/* File Picker */}
          {!report && (
            <div 
              onClick={() => fileInputRef.current.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 rounded-2xl p-8 cursor-pointer transition-all duration-200"
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              
              <FileText className={`w-12 h-12 mb-3 transition-colors ${file ? 'text-primary-500' : 'text-slate-300 dark:text-slate-700'}`} />
              
              {file ? (
                <div className="text-center">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB • Click to change file</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block">Choose a CSV file to upload</span>
                  <span className="text-xs text-slate-450 dark:text-slate-500">Drag & drop or browse from local files</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Result Report */}
          {report && (
            <div className="space-y-4 animate-fade-in">
              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 
                ${report.report.status === 'SUCCESS' ? 'bg-emerald-50/20 border-emerald-200/60 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' : ''}
                ${report.report.status === 'PARTIAL' ? 'bg-amber-50/20 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/40 text-amber-800 dark:text-amber-300' : ''}
                ${report.report.status === 'FAILED' ? 'bg-rose-50/20 border-rose-200/60 dark:bg-rose-950/10 dark:border-rose-900/40 text-rose-800 dark:text-rose-350' : ''}
              `}>
                {report.report.status === 'SUCCESS' && <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />}
                {report.report.status === 'PARTIAL' && <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />}
                {report.report.status === 'FAILED' && <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />}

                <div className="flex-1">
                  <h4 className="font-bold text-sm">Import Status: {report.report.status}</h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    Imported: <span className="font-semibold">{report.importedCount}</span> / Failed: <span className="font-semibold">{report.failedCount}</span> (Total rows: {report.report.totalRows})
                  </p>
                </div>
              </div>

              {/* Invalid Rows Details */}
              {report.invalidRows && report.invalidRows.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invalid Rows Details</h5>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-55 dark:bg-slate-950 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                          <th className="p-3 font-semibold w-16 text-center">Row</th>
                          <th className="p-3 font-semibold">Raw Content</th>
                          <th className="p-3 font-semibold">Validation Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
                        {report.invalidRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                            <td className="p-3 text-center text-slate-400 font-semibold">{row.rowNum}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={row.rawLine}>
                              {row.rawLine}
                            </td>
                            <td className="p-3 text-rose-600 dark:text-rose-450 font-medium">
                              <ul className="list-disc list-inside space-y-0.5">
                                {row.errors.map((err, eIdx) => <li key={eIdx}>{err}</li>)}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {report && (
              <button
                type="button"
                onClick={() => {
                  setReport(null);
                  setFile(null);
                  setError('');
                }}
                className="text-xs font-semibold text-primary-500 hover:text-primary-600 underline"
              >
                Upload another file
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {report ? 'Close' : 'Cancel'}
            </button>
            
            {!report && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !file}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:scale-100 disabled:shadow-none active:scale-95 shadow-lg shadow-primary-500/10 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                {loading ? 'Processing...' : 'Upload & Import'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CSVImportModal;
