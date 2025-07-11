import { Request, Response } from 'express';

interface ResponseData {
  success?: boolean;
  message?: string;
  data?: any;
  error?: any;
  [key: string]: any;
}

export const handleResponse = (
  req: Request,
  res: Response,
  statusCode: number,
  data: ResponseData,
) => {
  return res.status(statusCode).json(data);
};

export const handleError = (
  req: Request,
  res: Response,
  statusCode: number,
  message: string,
  error?: any,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error?.message || error
  });

};

export const handleRedirect = (
  req: Request,
  res: Response,
  url: string,
) => {
  return res.status(200).json({
    success: true,
    message: "Redirect",
    redirectUrl: url
  });
};