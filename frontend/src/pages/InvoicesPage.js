import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { invoiceAPI } from "../api/api";

import NewInvoice from "../components/NewInvoice";
import ListInvoiceModal from "../components/ListInvoiceModal";
import ReadInvoice from "../components/ReadInvoice";
import EditInvoiceModal from "../components/EditInvoiceModal";

import "./InvoicesPage.css";

export default function InvoicesPage() {
  /* =====================================================
     STATE
  ===================================================== */

  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showNewInvoice, setShowNewInvoice] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [showReadInvoice, setShowReadInvoice] =
    useState(false);

  const [showEditInvoice, setShowEditInvoice] =
    useState(false);

  /* =====================================================
     LOAD INVOICES
  ===================================================== */

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const response = await invoiceAPI.list();

      const data = response.data;

      if (Array.isArray(data)) {
        setInvoices(data);
      } else if (Array.isArray(data?.invoices)) {
        setInvoices(data.invoices);
      } else if (Array.isArray(data?.data)) {
        setInvoices(data.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error(
        "Invoice Load Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load invoices"
      );

      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     NEW INVOICE
  ===================================================== */

  const handleNewInvoice = () => {
    setShowNewInvoice(true);
  };

  const closeNewInvoice = () => {
    setShowNewInvoice(false);
  };

  const handleInvoiceCreated = async () => {
    setShowNewInvoice(false);

    /*
      New invoice create झाल्यावर
      फक्त invoice list update करा.
    */

    try {
      const response = await invoiceAPI.list();

      const data = response.data;

      const newList = Array.isArray(data)
        ? data
        : Array.isArray(data?.invoices)
        ? data.invoices
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setInvoices(newList);
    } catch (error) {
      console.error(
        "Invoice Reload Error:",
        error
      );
    }
  };

  /* =====================================================
     VIEW / PREVIEW
  ===================================================== */

  const handleViewInvoice = (invoice) => {
    if (!invoice) return;

    setSelectedInvoice(invoice);

    setShowReadInvoice(true);

    setShowEditInvoice(false);

    /*
      Main page scroll बंद.
      Preview modal मध्ये स्वतःचा scrollbar आहे.
    */

    document.body.style.overflow = "hidden";
  };

  const closeReadInvoice = () => {
    setShowReadInvoice(false);

    setSelectedInvoice(null);

    document.body.style.overflow = "";
  };

  /* =====================================================
     EDIT
  ===================================================== */

  const handleEditInvoice = (invoice) => {
    if (!invoice) return;

    setSelectedInvoice(invoice);

    setShowEditInvoice(true);

    setShowReadInvoice(false);

    /*
      Main page scroll बंद.
      Edit modal स्वतःचा scroll वापरेल.
    */

    document.body.style.overflow = "hidden";
  };

  const closeEditInvoice = () => {
    setShowEditInvoice(false);

    setSelectedInvoice(null);

    document.body.style.overflow = "";
  };

  /* =====================================================
     ⭐ INVOICE UPDATED
     FULL PAGE REFRESH नाही
  ===================================================== */

  const handleInvoiceUpdated = async (
    updatedInvoice
  ) => {
    /*
      Edit modal बंद करा.
    */

    setShowEditInvoice(false);

    setSelectedInvoice(null);

    document.body.style.overflow = "";

    /*
      जर EditInvoiceModal ने updated invoice
      परत पाठवला असेल तर local list मध्ये
      फक्त तो invoice update करा.
    */

    if (updatedInvoice?._id) {
      setInvoices((prevInvoices) =>
        prevInvoices.map((invoice) =>
          invoice._id === updatedInvoice._id
            ? {
                ...invoice,
                ...updatedInvoice,
              }
            : invoice
        )
      );

      return;
    }

    /*
      जर updated invoice object मिळाला नाही
      तर backend मधून list आणा.

      तरीही FULL PAGE REFRESH होणार नाही.
    */

    try {
      const response =
        await invoiceAPI.list();

      const data = response.data;

      const updatedList =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.invoices)
          ? data.invoices
          : Array.isArray(data?.data)
          ? data.data
          : [];

      setInvoices(updatedList);
    } catch (error) {
      console.error(
        "Invoice Refresh Error:",
        error
      );

      toast.error(
        "Unable to refresh invoice list"
      );
    }
  };

  /* =====================================================
     ⭐ DELETE
     FULL PAGE REFRESH नाही
  ===================================================== */

  const handleDeleteInvoice = async (
    invoice
  ) => {
    if (!invoice?._id) {
      toast.error(
        "Invoice ID not found"
      );

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?"
    );

    if (!confirmed) return;

    try {
      await invoiceAPI.delete(
        invoice._id
      );

      toast.success(
        "Invoice deleted successfully"
      );

      /*
        ⭐ सर्वात महत्त्वाचे:
        Backend list पुन्हा load करण्याऐवजी
        local state मधून invoice remove करा.

        त्यामुळे Year / Month selection
        reset होणार नाही.
      */

      setInvoices((prevInvoices) =>
        prevInvoices.filter(
          (item) =>
            item._id !== invoice._id
        )
      );

      /*
        जर deleted invoice preview/edit मध्ये
        open असेल तर ते बंद करा.
      */

      if (
        selectedInvoice?._id ===
        invoice._id
      ) {
        setSelectedInvoice(null);

        setShowReadInvoice(false);

        setShowEditInvoice(false);

        document.body.style.overflow =
          "";
      }
    } catch (error) {
      console.error(
        "Invoice Delete Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to delete invoice"
      );
    }
  };

  /* =====================================================
     CLEAN BODY SCROLL
  ===================================================== */

  useEffect(() => {
    return () => {
      document.body.style.overflow =
        "";
    };
  }, []);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="invoice-loading">
        Loading invoices...
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="invoices-page">

      <div className="invoices-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="invoices-header">

          <div>
            <h1 className="invoices-title">
              Invoices
            </h1>

            <p className="invoices-subtitle">
              Manage your invoices and GST details
            </p>
          </div>

          <button
            type="button"
            className="invoice-primary-btn"
            onClick={handleNewInvoice}
          >
            + New Invoice
          </button>

        </div>


        {/* =================================================
            INVOICE LIST
        ================================================= */}

        <ListInvoiceModal
          invoices={invoices}
          onView={handleViewInvoice}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onNewInvoice={handleNewInvoice}
        />

      </div>


      {/* =====================================================
          NEW INVOICE
      ===================================================== */}

      {showNewInvoice && (
        <NewInvoice
          onClose={closeNewInvoice}
          onCreated={handleInvoiceCreated}
        />
      )}


      {/* =====================================================
          READ / PREVIEW INVOICE
      ===================================================== */}

      {showReadInvoice &&
        selectedInvoice && (
          <ReadInvoice
            invoice={selectedInvoice}
            onClose={closeReadInvoice}
          />
        )}


      {/* =====================================================
          EDIT INVOICE
      ===================================================== */}

      {showEditInvoice &&
        selectedInvoice && (
          <EditInvoiceModal
            invoice={selectedInvoice}
            onClose={closeEditInvoice}
            onUpdated={handleInvoiceUpdated}
          />
        )}

    </div>
  );
}