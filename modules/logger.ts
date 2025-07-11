import ErrorLog, { ErrorLogModel } from '../models/error-log.model';
import { Request } from 'express';
import * as requestIp from 'request-ip';

export async function logError(request?: Request, error?: string, statusCode?: number) {
  try {
    let req: {
      method: string;
      path: string;
      statusCode: number;
      origin: string;
      userAgent: string;
      ip: string;
    } = undefined;
    if (request) {
      req = {
        ip: requestIp.getClientIp(request) || undefined,
        method: request.method || undefined,
        path: request.originalUrl || undefined,
        statusCode: statusCode || undefined,
        origin: (request.headers && request.headers['referer']) || undefined,
        userAgent: (request.headers && request.headers['user-agent']) || undefined
      };
    }
    const logDocument = new ErrorLog(<ErrorLogModel>{
      error: error || undefined,
      request: req,
      source: process.env.APP_NAME
    });
    await logDocument.save();
  } catch (err) {
    console.error(err);
  }
}

export class CustomError {
  /**
   *Creates an instance of CustomError.
   * @param {*} client // this is the part you send to the client (frontend)
   * @param {*} server // this is the actual error object | message
   * @param {number} statusCode // this is the http status code
   * @param {string} [redirectTo] // eg: '/customers'
   * @memberof CustomError
   */
  constructor(public client: any, public server: any, public statusCode: number, public redirectTo?: string) {}
}
