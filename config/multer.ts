import multer from "multer";
import uniqid from "uniqid";

import * as path from "path";
import * as fs from "fs";

const upload = (() => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, __dirname + "/../public/uploads/images");
    },
    filename: function (req, file, callback) {
      callback(null, uniqid("", `-${file.originalname.trim()}`));
    },
  });

  const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  };
  return multer({ storage: storage, fileFilter: imageFilter }).single("image");
})();

/** Upload txt/pdf **/

export const uploadFile = (() => {
  const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
      try {
        await fs.promises.mkdir(
          path.join(__dirname + "/../public/uploads/tmp"),
          { recursive: true },
        );
        console.log("Directory created or already exists");
      } catch (err) {
        if (err && err.code !== "EEXIST") {
          console.log("Error creating directory:", err);
          throw err;
        }
      }
      cb(null, __dirname + "/../public/uploads/tmp");
    },
    filename: function (req, file, callback) {
      callback(null, uniqid("", `-${file.originalname.trim()}`));
    },
  });

  const filter = function (req, file, cb) {
    // Accept only .txt files
    if (!file.originalname.match(/\.(txt)$/i)) {
      console.log("Rejected file:", file.originalname); // Logging rejected files
      return cb(new Error("Only .txt files are allowed!"), false);
    }
    console.log("File accepted:", file.originalname); // Logging accepted files
    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: filter,
    limits: { fileSize: 2e6 },
  }).single("file"); // maximum 2 megabytes
})();

export default upload;
