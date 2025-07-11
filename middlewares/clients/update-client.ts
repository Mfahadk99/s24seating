import { Handler } from 'express';
import User, { UserModel } from '../../models/user.model';
import { Document } from 'mongoose';

const updateClient: Handler = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      req.flash('error', 'User not found!');
      return next();
    }
  
    const address = {
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      zipcode: req.body.zipcode,
      street: req.body.street
    };
  
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    user.email = req.body.email;
    user.website = req.body.website;
  
    const phoneNumbers = [];
    if (req.body.phoneNumber1) {
      phoneNumbers.push({ phone_number: req.body.phoneNumber1.replace(/\s/g, ''), is_active: true });
    }
    if (req.body.phoneNumber2) {
      phoneNumbers.push({ phone_number: req.body.phoneNumber2.replace(/\s/g, ''), is_active: false });
    }
    user.phone_numbers = phoneNumbers;
  
    user.address = address;
  
    await user.save();
    req.flash('success', 'Success! Changes were saved!');
  } catch (err) {
    console.error('Error:', err);
    req.flash('error', 'Something wrong happened! Try again later.');
  } finally {
    return next();
  }  
};

export default updateClient;
