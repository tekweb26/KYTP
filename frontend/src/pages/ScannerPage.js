import React, { useState } from "react";
import { invoiceAPI } from "../api/api";
import toast from "react-hot-toast";
import {
  Upload,
  Check,
} from "lucide-react";
import "./ScannerPage.css";

export default function ScannerPage() {

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);

  const [preview, setPreview] = useState(null);


  /* =====================================================
     FILE SELECT
  ===================================================== */

  const handleFileSelect = (e) => {

    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(selectedFile);
  };


  /* =====================================================
     UPLOAD / SCAN
  ===================================================== */

  const handleUpload = async () => {

    if (!file) {

      toast.error(
        "Please select a file"
      );

      return;
    }

    setLoading(true);

    try {

      const { data } =
        await invoiceAPI.upload(file);

      setResult(data);

      toast.success(
        "Receipt scanned successfully!"
      );

    } catch (error) {

      console.error(
        "Receipt scan error:",
        error
      );

      toast.error(
        "Failed to scan receipt"
      );

    } finally {

      setLoading(false);

    }
  };


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="scanner-page">

      <div className="scanner-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="scanner-header">

          <h1>
            Receipt Scanner
          </h1>

          <p>
            Upload your receipt and extract invoice details automatically.
          </p>

        </div>



        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="scanner-content">


          {/* =================================================
              UPLOAD CARD
          ================================================= */}

          <div className="scanner-card">


            <h2>
              Upload Receipt
            </h2>


            {/* UPLOAD BOX */}

            <div className="upload-area">

              {preview ? (

                <img
                  src={preview}
                  alt="Receipt preview"
                  className="receipt-preview"
                />

              ) : (

                <div className="upload-placeholder">

                  <Upload
                    size={45}
                    className="upload-icon"
                  />

                  <h3>
                    Upload your receipt
                  </h3>

                  <p>
                    Select an image of your receipt
                  </p>

                </div>

              )}

            </div>



            {/* FILE INPUT */}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />



            {/* SCAN BUTTON */}

            <button
              onClick={handleUpload}
              disabled={
                loading ||
                !file
              }
              className="scan-button"
            >

              {loading
                ? "Scanning..."
                : "Scan Receipt"}

            </button>

          </div>



          {/* =================================================
              RESULT CARD
          ================================================= */}

          {result && (

            <div className="scanner-card result-card">


              {/* RESULT TITLE */}

              <h2 className="result-heading">

                <Check
                  size={24}
                  className="success-icon"
                />

                Extracted Data

              </h2>



              <div className="result-data">


                {/* VENDOR */}

                <div className="result-item">

                  <label>
                    Vendor Name
                  </label>

                  <div className="result-value">

                    {result.vendor_name ||
                      "N/A"}

                  </div>

                </div>



                {/* GSTIN */}

                <div className="result-item">

                  <label>
                    Vendor GSTIN
                  </label>

                  <div className="result-value gstin">

                    {result.vendor_gstin ||
                      "N/A"}

                  </div>

                </div>



                {/* AMOUNT */}

                <div className="result-item">

                  <label>
                    Amount
                  </label>

                  <div className="result-value amount">

                    ₹
                    {result.total_amount ||
                      0}

                  </div>

                </div>



                {/* TAX */}

                <div className="result-item">

                  <label>
                    Tax Amount
                  </label>

                  <div className="result-value amount">

                    ₹
                    {result.tax_amount ||
                      0}

                  </div>

                </div>



                {/* SAVE */}

                <button
                  className="save-button"
                >
                  Save as Invoice
                </button>


              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );
}