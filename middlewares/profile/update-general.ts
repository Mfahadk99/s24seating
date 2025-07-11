import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';
import { Document } from 'mongoose';
const updateGeneral: Handler = async (req, res, next) => {
  try {
    const user = await User.findById(res.locals.currentUser._id);
    
    if (!user) {
      throw new Error('User not found');
    }
  
    const address = {
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      zipcode: req.body.zipcode,
      street: req.body.street
    };
  
    const phoneNumbers = [
      { phone_number: req.body.phoneNumber1?.replace(/\s/g, ''), is_active: true },
      { phone_number: req.body.phoneNumber2?.replace(/\s/g, ''), is_active: false }
    ].filter(phone => phone.phone_number);
  
    Object.assign(user, {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      address: address,
      phone_numbers: phoneNumbers
    });
  
    await user.save();
    req.flash('success', 'Success! Changes were saved!');
    next();
  } catch (err) {
    req.flash('error', 'Something went wrong! Please try again later.');
    next();
  } 
};

export default updateGeneral;
