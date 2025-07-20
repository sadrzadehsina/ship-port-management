import Axios from "axios";

import type { IError } from "@/types";

import { dispatchError, dispatchSuccess } from "@/lib/utils";

// Use different base URLs for development vs production
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, use the mock API path that MSW intercepts
    return '';
  } else {
    // In production, use Vercel API routes
    return '';
  }
};

const axios = Axios.create({
  baseURL: getBaseURL()
});

axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    dispatchSuccess({
      status: response.status as any,
      message: response.statusText
    });
    return response.data;
  },
  (error: IError) => {
    dispatchError(error);
    return Promise.reject(error);
  }
);

export default axios;
