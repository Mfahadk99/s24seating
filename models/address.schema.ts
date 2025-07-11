import * as mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  zipcode: {
    type: String,
    trim: true
  },
  street: {
    type: String,
    trim: true
  }
});
export interface AddressModel {
  country: any;
  state: any;
  city: any;
  zipcode: any;
  street: any;
}

export default addressSchema;
