import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';
require('aws-sdk/lib/maintenance_mode_message').suppress = true;

export const s3Upload = async (fileName: string, filePath: string): Promise<ManagedUpload.SendData> => {
  try {
    const uploadedFile = fileName.split('.');
    const fileType = uploadedFile[uploadedFile.length - 1];
    const file = fs.readFileSync(filePath);

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${uuidv4()}.${fileType}`,
      Body: file
    };

    const uploadedObj = await s3.upload(params).promise();
    fs.unlinkSync(filePath);
    return uploadedObj;
  } catch (error) {
    console.error('error found in s3Upload: ', error);
    return null;
  }
};
