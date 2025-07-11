import S3, { ManagedUpload } from 'aws-sdk/clients/s3';
import * as AWS from 'aws-sdk';

export const s3Delete = async (imageURL: string): Promise<S3.DeleteObjectOutput | { error: string }> => {
  try {
    const baseURL = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/`;

    if (!imageURL || !imageURL.includes(baseURL)) {
      return { error: 'NOT An S3 Object!' };
    }

    const key = imageURL.split(baseURL)[1];

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };

    const deleteObj = await s3.deleteObject(params).promise();
    return deleteObj;
  } catch (error) {
    console.error('error found in s3Delete: ', error);
    return { error: 'Error Found in s3Delete' };
  }
};
