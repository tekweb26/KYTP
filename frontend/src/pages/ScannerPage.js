import React, { useState } from 'react';
import { invoiceAPI } from '../api/api';
import toast from 'react-hot-toast';
import { Upload, Check } from 'lucide-react';

export default function ScannerPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const { data } = await invoiceAPI.upload(file);
      setResult(data);
      toast.success('Receipt scanned successfully!');
    } catch (error) {
      toast.error('Failed to scan receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Receipt Scanner</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Upload Receipt</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-80 mx-auto" />
            ) : (
              <div>
                <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Drag and drop or click to select</p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full mb-4"
          />

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full btn btn-primary"
          >
            {loading ? 'Scanning...' : 'Scan Receipt'}
          </button>
        </div>

        {result && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Check className="text-green-600" />
              Extracted Data
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Vendor Name</label>
                <div className="text-lg font-semibold">{result.vendor_name || 'N/A'}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Vendor GSTIN</label>
                <div className="text-lg font-mono">{result.vendor_gstin || 'N/A'}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Amount</label>
                <div className="text-lg font-semibold">₹{result.total_amount || 0}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Tax Amount</label>
                <div className="text-lg font-semibold">₹{result.tax_amount || 0}</div>
              </div>

              <button className="w-full btn btn-primary mt-4">
                Save as Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
