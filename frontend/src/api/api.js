import axios from "axios";

const API_URL = 'https://kytp-backend.onrender.com/api';


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
   ADD JWT TOKEN
===================================================== */

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


/* =====================================================
   ERROR HANDLING
===================================================== */

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (error.response?.status === 401) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }

);


/* =====================================================
   AUTH API
===================================================== */

export const authAPI = {

  register: (email, password) =>
    api.post("/auth/register", {
      email,
      password,
    }),

  login: (email, password) =>
    api.post("/auth/login", {
      email,
      password,
    }),

};


/* =====================================================
   INVOICE API
===================================================== */

export const invoiceAPI = {

  list: () =>
    api.get("/invoices"),

  create: (data) =>
    api.post("/invoices", data),

  upload: (file) => {

    const formData = new FormData();

    formData.append("file", file);

    return api.post(
      "/invoices/upload",
      formData
    );
  },

  update: (id, data) =>
    api.put(`/invoices/${id}`, data),

  delete: (id) =>
    api.delete(`/invoices/${id}`),

};


/* =====================================================
   PAYMENT API
===================================================== */

export const paymentAPI = {

  initiate: (data) =>
    api.post("/payments/initiate", data),

  verify: (paymentId, data) =>
    api.post(
      `/payments/${paymentId}/verify`,
      data
    ),

  list: () =>
    api.get("/payments"),

  record: (invoiceId, data) =>
    api.post(
      "/payments/record",
      {
        invoiceId,
        ...data,
      }
    ),

};


/* =====================================================
   GST API
===================================================== */

export const gstAPI = {

  monthlySummary: (month, year) =>
    api.get(
      `/gst/monthly-summary?month=${month}&year=${year}`
    ),

  reports: () =>
    api.get("/gst/reports"),

  calculateTax: (amount, taxRate) =>
    api.post(
      "/gst/calculate",
      {
        amount,
        taxRate,
      }
    ),

};


/* =====================================================
   EXPORT
===================================================== */

export default api;