// models/User.js
const mongoose = require("mongoose")
const bcrypt   = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, default: "" },
    email:    { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone:    { type: String, unique: true, sparse: true, trim: true },
    password: { type: String },
    avatar:   { type: String, default: "" },
    role:     { type: String, enum: ["user","admin"], default: "user" },
    status:   { type: String, enum: ["active","banned"], default: "active" },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    tokenVersion:    { type: Number, default: 0 },
  },
  { timestamps: true }
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model("User", userSchema)
