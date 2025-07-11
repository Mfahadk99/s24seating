import * as requestIp from 'request-ip';
import userAgentParser from 'ua-parser-js';
import { Handler, Request, Response, NextFunction } from 'express';
import User, { UserModel } from '../../models/user.model';

/**
 * Check for suspicious login attempt.
 *
 * This function checks if the login attempt is suspicious based on
 * changes in user agent device and IP address.
 *
 * @param {Request} req - The Express request object.
 * @param {UserModel} user - The user object.
 * @returns {Promise<boolean>} True if the login is suspicious, false otherwise.
 */
export async function isSuspiciousLogin(req: Request, user: UserModel): Promise<boolean> {
  const requestIP: string | undefined = requestIp.getClientIp(req);

  // Parse user-agent header
  const ua: userAgentParser.IResult = userAgentParser(req.headers['user-agent']);
  const userDeviceInfo: string = JSON.stringify(ua, null, 2);

  // Check if it's the first login
  if (!user.verified_devices.length) {
    // Set login details
    user.verified_devices.push({
      device_info: userDeviceInfo,
      ip_address: requestIP
    });
    await user.save();
    console.log('User details updated for the first login.');
    return false;
  } else {
    const verifiedDevices = user.verified_devices;
    let found = false;
    for (const device of verifiedDevices) {
      if (device.device_info == userDeviceInfo && device.ip_address == requestIP) {
        found = true;
        break;
      }
    }

    if (found) return false;

    // Send a code or take other suspicious action
    console.log('Suspicious login attempt. Sending a 2fa code.');
    return true;
  }
}
