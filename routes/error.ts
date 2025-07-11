import * as express from 'express';
const router = express.Router();

/* GET Form page. */
router.get('/', (req, res) => {
  res.render('error/index');
});

router.get('/404', (req, res) => {
  res.render('error/404');
});
export default router;
