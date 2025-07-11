import * as express from 'express';
const router = express.Router();
import updateGeneral from '../middlewares/profile/update-general';
import changeProfilePhoto from '../middlewares/profile/change-profile-photo';
import changePassword from '../middlewares/profile/change-password';
import getUser from '../middlewares/profile/get-user';
import upload from '../config/multer';

/* GET Profile Page */
router.get('/', (req, res, next) => {
  res.redirect('/profile/general');
});

/* GET General Page */
router.get('/general', getUser, (req, res, next) => {
  res.render('profile/general');
});

/* PUT General Page */
router.put('/general', updateGeneral, (req, res, next) => {
  const success = req.flash('success');
  const error = req.flash('error');

  const viewObj: any = {};
  viewObj.message = success.length ? success[0] : error[0];
  res.json(viewObj);
});

/* POST General/upload */
router.post('/general/upload', upload, changeProfilePhoto);

/* GET change-password page */
router.get('/change-password', (req, res, next) => {
  res.render('profile/change-password');
});

/* PUT change-password */
router.put('/change-password', changePassword, (req, res, next) => {
  const success = req.flash('success');
  const error = req.flash('error');

  const viewObj: any = {};
  viewObj.message = success.length ? success[0] : error[0];
  res.json(viewObj);
});
export default router;
