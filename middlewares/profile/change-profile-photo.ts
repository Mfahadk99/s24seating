import * as fs from 'fs';
import { Handler } from 'express';
import { Document } from 'mongoose';
import User, { UserModel } from '../../models/user.model';
import { s3Upload } from '../../modules/s3/s3-upload';
import _ from 'lodash';
import { s3Delete } from '../../modules/s3/s3-delete';

/**
 * @param {String} imageName - name of the image input
 * @param {String} userId - _id of the target user
 */

const changeProfilePhoto: Handler = async (req, res, next) => {
  try {
    const targetUserId = res.locals.targetUserId ? res.locals.targetUserId : res.locals.currentUser._id;
    // handle error
    if (!req.file) {
      return res.end('Error in uploading file.');
    }
    const uploadedObj = await s3Upload(req.file.originalname, req.file.path);
    if (_.isEmpty(uploadedObj)) {
      return res.end('Error in uploading file');
    }
    const imageURL = uploadedObj.Location;

    // update the image_url
    const user = <Document & UserModel>await User.findById(targetUserId);
    if (_.isEmpty(user)) {
      res.end('Something wrong happened! Try again later.');
      await s3Delete(imageURL);
    }

    // remove the previous image
    await s3Delete(user.image_url);
    user.image_url = imageURL;
    await user.save();
    res.end('Success! Image was updated!');
  } catch (error) {
    console.error('error found in changeProfilePhoto: ', error);
  }
};

export default changeProfilePhoto;
