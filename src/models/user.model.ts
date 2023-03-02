import mongoose from "mongoose";
import bcrypt from "bcrypt";

export const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    telegramAccount: {
      // type: String,
      // index: true,
      // unique: true,
      // sparse: true
      id: {
        type: String,
        required: false,
        unique: true,
        index: true,
        sparse: true,
      },
      username: {
        type: String,
        required: false,
      },
      first_name: {
        type: String,
        required: false,
      },
    },
    refreshTokens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RefreshToken",
      },
    ],
    wallets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet",
      },
    ],
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
  },
  { timestamps: true },
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

// UserSchema.methods.isValidPassword = async function (password: string) {
//   const compare = await bcrypt.compare(password, this.password);
//   return compare;
// };

export default mongoose.model("User", UserSchema);
