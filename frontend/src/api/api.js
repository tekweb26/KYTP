
import axios from "axios";


/* =====================================================
   API BASE URL
===================================================== */

const API_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://kytp-backend.onrender.com/api";


/* =====================================================
   AXIOS INSTANCE
===================================================== */

const api = axios.create({

  baseURL: API_URL,

  headers: {
    "Content-Type": "application/json",
  },

});


/* =====================================================
   REQUEST INTERCEPTOR
===================================================== */

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem("token");

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);


/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

api.interceptors.response.use(

  (response) => {

    return response;

  },

  (error) => {

    if (
      error.response?.status === 401
    ) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

    }

    return Promise.reject(error);

  }

);


/* =====================================================
   AUTH API
===================================================== */

export const authAPI = {


  /* ===================================================
     REGISTER / SIGNUP
  =================================================== */

  register: (data) => {

    return api.post(
      "/auth/register",
      data
    );

  },


  /* ===================================================
     LOGIN
  =================================================== */

  login: (
    email,
    password
  ) => {

    return api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

  },


  /* ===================================================
     PROFILE
  =================================================== */

  profile: () => {

    return api.get(
      "/auth/profile"
    );

  },

};


/* =====================================================
   INVOICE API
===================================================== */

export const invoiceAPI = {


  /* ---------------------------------------------------
     LIST INVOICES
  --------------------------------------------------- */

  list: () => {

    return api.get(
      "/invoices"
    );

  },


  /* ---------------------------------------------------
     CREATE INVOICE
  --------------------------------------------------- */

  create: (data) => {

    return api.post(
      "/invoices",
      data
    );

  },

  /* ---------------------------------------------------

   CREATE INVOICE - ALIAS

    --------------------------------------------------- */

  createInvoice: (data) => { return api.post("/invoices", data); 

  },

  /* ---------------------------------------------------

     DELETE INVOICE

  --------------------------------------------------- */

  delete: (id) => {

    return api.delete(
      `/invoices/${id}`
    );

  },


  /* ---------------------------------------------------
     GET SINGLE INVOICE
  --------------------------------------------------- */

  get: (id) => {

    return api.get(
      `/invoices/${id}`
    );

  },


  /* ---------------------------------------------------
     UPDATE INVOICE
  --------------------------------------------------- */

  update: (
    id,
    data
  ) => {

    return api.put(
      `/invoices/${id}`,
      data
    );

  },


  /* ---------------------------------------------------
     SCAN INVOICE
     
     Sends invoice image as multipart/form-data
     to backend OCR + AI + GST pipeline.
  --------------------------------------------------- */

  scanInvoice: (formData) => {

    return api.post(
      "/invoices/scan",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

  },


  /* ---------------------------------------------------
     CHECK GST STATUS
     
     Sends GSTIN to backend Sandbox GST API.
  --------------------------------------------------- */

  checkGSTStatus: (gstin) => {

    return api.post(
      "/invoices/gst-status",
      {
        gstin,
      }
    );

  },

};


/* =====================================================
   PAYMENT API
===================================================== */

export const paymentAPI = {


  /* ---------------------------------------------------
     LIST PAYMENTS
  --------------------------------------------------- */

  list: () => {

    return api.get(
      "/payments"
    );

  },


  /* ---------------------------------------------------
     CREATE PAYMENT
  --------------------------------------------------- */

  create: (data) => {

    return api.post(
      "/payments",
      data
    );

  },

};


/* =====================================================
   GST API
===================================================== */

export const gstAPI = {


  /* ---------------------------------------------------
     VALIDATE GST
  --------------------------------------------------- */

  validate: (gstin) => {

    return api.get(
      `/gst/validate/${gstin}`
    );

  },

};


/* =====================================================
   DEFAULT EXPORT
===================================================== */

export default api;

