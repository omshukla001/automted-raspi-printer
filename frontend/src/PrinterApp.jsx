import { useState, useRef, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || '/';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];

function PrinterApp() {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [tunnelUrl, setTunnelUrl] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: 'Ready to upload' });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const pdfjsLibRef = useRef(null);

  const loadPdfJs = useCallback(() => {
    if (pdfjsLibRef.current) return Promise.resolve(pdfjsLibRef.current);
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
          pdfjsLibRef.current = window.pdfjsLib;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  }, []);

  const countPdfPages = useCallback(async (file) => {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (error) {
      console.error('Error counting PDF pages:', error);
      return null;
    }
  }, [loadPdfJs]);

  const validateFile = useCallback((file) => {
    const isValidType = ALLOWED_TYPES.includes(file.type);
    const isValidExtension = ALLOWED_EXTENSIONS.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!isValidType && !isValidExtension) {
      setStatus({ type: 'error', message: 'Invalid file type. Please upload PDF, PNG, JPG, or DOCX.' });
      return false;
    }
    
    return true;
  }, []);

  const processFile = useCallback(async (selectedFile) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    setIsLoading(true);
    setStatus({ type: 'idle', message: 'Processing file...' });

    const sizeKB = (selectedFile.size / 1024).toFixed(2);
    let pages = null;

    if (selectedFile.type === 'application/pdf') {
      try {
        pages = await countPdfPages(selectedFile);
      } catch (error) {
        console.error('Failed to count PDF pages:', error);
      }
    }

    setFileInfo({
      name: selectedFile.name,
      type: selectedFile.type || 'Unknown',
      size: sizeKB,
      pages
    });

    setIsLoading(false);
    setStatus({ type: 'idle', message: 'File ready. Click "Print File" to send to printer.' });
  }, [countPdfPages, validateFile]);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleGetTunnelUrl = async () => {
    setIsLoading(true);
    setStatus({ type: 'idle', message: 'Fetching tunnel URL...' });

    try {
      const response = await fetch(`${API_BASE}tunnel`);
      if (!response.ok) throw new Error('Failed to fetch tunnel URL');
      
      const data = await response.json();
      setTunnelUrl(data.url);
      setStatus({ 
        type: data.url ? 'success' : 'error', 
        message: data.url ? `Tunnel URL: ${data.url}` : 'No tunnel URL available' 
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to get tunnel URL' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'idle', message: 'Uploading and printing...' });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Content = e.target.result.split(',')[1];
          
          const response = await fetch(`${API_BASE}print`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileContent: base64Content
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to print file');
          }

          const data = await response.json();
          setStatus({ type: 'success', message: data.message || 'File sent to printer successfully!' });
        } catch (error) {
          setStatus({ type: 'error', message: error.message || 'Failed to print file' });
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setStatus({ type: 'error', message: 'Failed to read file' });
        setIsLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to process file' });
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileInfo(null);
    setStatus({ type: 'idle', message: 'Ready to upload' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Printer Business</h1>
          <p className="text-sm text-gray-600 mt-1">Raspberry Pi Printer Service</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="File input"
            />
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Click to upload
                </button>
                {' or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG, or DOCX (max 10MB)</p>
            </div>
          </div>

          {fileInfo && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Name</p>
                  <p className="text-gray-900 truncate" title={fileInfo.name}>{fileInfo.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Size</p>
                  <p className="text-gray-900">{fileInfo.size} KB</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Type</p>
                  <p className="text-gray-900 truncate">{fileInfo.type}</p>
                </div>
                {fileInfo.pages !== null && (
                  <div>
                    <p className="text-gray-600 font-medium">Pages</p>
                    <p className="text-gray-900">{fileInfo.pages}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGetTunnelUrl}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Get tunnel URL"
            >
              Get Tunnel URL
            </button>
            <button
              onClick={handlePrint}
              disabled={!file || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Print file"
            >
              Print File
            </button>
            <button
              onClick={handleClear}
              disabled={!file || isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label="Clear file"
            >
              Clear
            </button>
          </div>

          <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
            <p className="text-sm font-medium">{status.message}</p>
            {tunnelUrl && status.type === 'success' && (
              <p className="text-xs mt-1 break-all">{tunnelUrl}</p>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-xs text-gray-600 space-y-1">
          <p>Note: This service requires CORS to be enabled on the backend.</p>
          <p>The Raspberry Pi printer is accessed via Cloudflare Tunnel.</p>
        </div>
      </footer>
    </div>
  );
}

export default PrinterApp;

