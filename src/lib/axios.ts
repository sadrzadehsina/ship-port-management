import Axios from "axios";

import type { IError } from "@/types";

import { dispatchError, dispatchSuccess } from "@/lib/utils";

const getBaseURL = () => {
  return '';
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
