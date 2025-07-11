import * as mongoose from 'mongoose';
/**
 * @see https://mongoosejs.com/docs/connections.html#keepAlive
 */
const mongoDBConnection = (): void => {
  mongoose
    .connect(process.env.MONGODB_URI!)
    .then(() => {
      console.log('** MongoDB Connection Status: Connected! **');
    })
    .catch(err => {
      console.error('** MongoDB Connection Status: Failed! -> Error Message: ⇩\n', err);
    });
};

export default mongoDBConnection;
