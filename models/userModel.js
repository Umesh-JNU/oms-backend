const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");

const validateEmail = (email) => {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const random_profile = () => {
  const img_urls = [
    "https://cdn2.iconfinder.com/data/icons/avatars-60/5985/2-Boy-512.png",
    "https://cdn2.iconfinder.com/data/icons/avatars-60/5985/4-Writer-1024.png",
    "https://cdn2.iconfinder.com/data/icons/avatars-60/5985/40-School_boy-512.png",
    "https://cdn2.iconfinder.com/data/icons/avatars-60/5985/12-Delivery_Man-128.png",
    "https://cdn1.iconfinder.com/data/icons/user-pictures/100/boy-512.png",
  ]

  const idx = Math.floor(Math.random() * img_urls.length);
  return img_urls[idx];
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      validate: [validateEmail, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
      minLength: [8, "Password should have more than 8 characters"],
      select: false,
    },
    firstname: {
      type: String,
      required: [true, "Please enter your firstname."],
      maxLength: [30, "Firstame cannot exceed 30 characters"],
      minLength: [4, "Firstame should have more that 4 characters"],
    },
    lastname: {
      type: String,
      required: [true, "Please enter your lastname."],
      maxLength: [30, "Lastname cannot exceed 30 characters"],
      minLength: [4, "Lastname should have more that 4 characters"],
    },
    mobile_no: {
      type: Number,
      required: [true, "Mobile number is required."],
    },
    profile_img: {
      type: String,
      default: random_profile()
    },
    dist_email: {
      type: String,
      validate: [validateEmail, "Distributor's email address is invalid. Please fill a valid email address"],
      required: [true, "Please Enter Distributor's Email"],
      select: false
    },
    dist_name: {
      type: String,
      required: [true, "Please enter distributor's name."],
      maxLength: [30, "Distributor's name cannot exceed 30 characters"],
      minLength: [4, "Distributor's name should have more that 4 characters"],
      select: false
    },
    dist_mob_no: {
      type: Number,
      required: [true, "Distributor's Mobile number is required."],
      select: false
    },
    // country: {
    //   type: String,
    //   default: "US",
    //   enum: ["US", "CA"]
    // },  
    active: {
      type: Boolean,
      default: true,
      select: false
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();

  this.password = await bcrypt.hash(this.password, 11);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRE,
  });
};

// generating password reset token
userSchema.methods.getResetPasswordToken = function () {
  // generating token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hashing and adding resetPasswordToken to userSchema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);

