const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");

exports.s3Uploadv2 = async (file, dir) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  let key = `uploads/${Date.now().toString()}-${file.originalname}`;
  if (dir) {
    key = `${dir}/${Date.now().toString()}-${file.originalname}`
  }
  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
  };

  return await s3.upload(param).promise();
};

exports.s3UploadMulti = async (files) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${Date.now().toString()}-${file.originalname ? file.originalname : "not"
        }`,
      Body: file.buffer,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

exports.s3Delete = async (file, dir) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  let key = 'uploads' + file.split('uploads')[1];
  if (dir) {
    key = dir + file.split(dir)[1];
  }

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  console.log({ file, dir, key, param })
  return await s3.deleteObject(param).promise();
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") {
    req.video_file = false;
    cb(null, true);
  } else if (file.mimetype.split("/")[0] === "application") {
    req.video_file = false;
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

// ["image", "jpeg"]

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 11006600, files: 5 },
});
