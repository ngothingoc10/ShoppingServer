const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },

  isAdmin: {
    type: Boolean,
    required: true
  },
  // name: {
  //   firstName: {
  //     type: String,
  //     required: true
  //   },
  //   lastName: {
  //     type: String,
  //     required: true
  //   }
  // },
  address: {
    city: String,
    street: String,
    number: Number,
  },
  phoneNumber: {
    type: String
  },
  isLock: {
    type: Boolean,
    required: true
  }

});

const User = mongoose.model("User", userSchema);
module.exports = mongoose.model.User || mongoose.model("User", userSchema);
