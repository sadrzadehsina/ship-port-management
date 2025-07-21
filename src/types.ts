export const ErrorStatus = {
  BAD_REQUEST: 400,
  NOT_AUTHENTICATED: 401,
  NOT_AUTHORIZED: 403,
  NOT_FOUND: 404,
  DUPLICATE_ENTITY: 409,
  SERVER_ERROR: 500,
} as const;

export const SuccessStatus = {
  ACCEPTED: 200,
  CREATED: 201,
  UPDATED: 204,
} as const;

export type ErrorStatus = typeof ErrorStatus[keyof typeof ErrorStatus];
export type SuccessStatus = typeof SuccessStatus[keyof typeof SuccessStatus];

export interface IError {
  message?: string;
  status: ErrorStatus;
}
export interface ISuccess {
  message?: string;
  status: SuccessStatus;
}

export type LayTime = {
  id: string;
  portName: string;
  cargo: string;
  f: string;
  blCode: string;
  quantity: string;
  ldRate: string;
  term: string;
  demRate: string;
  desRate: string;
  allowed: number;
  used: string;
  deduction: string;
  balance: string;
  laycanFrom: Date;
  laycanTo: Date;
};

export type PortActivity = {
  id: string;
  day: string;
  activityType: string;
  fromDateTime: Date;
  duration: number;
  percentage: number;
  toDateTime: Date;
  remarks: string;
  deductions: string;
};
