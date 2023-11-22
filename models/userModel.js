const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const validateEmail = (email) => {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

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
      required: [true, "Distributor's Mobile number is required."]
    },
    // free_ship: {
    //   type: Boolean,
    //   default: false
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

module.exports = mongoose.model("User", userSchema);

