/* eslint-disable @typescript-eslint/no-explicit-any */
import { Markup, Telegraf, session } from "telegraf";
import dotenv from "dotenv";
import UserModel from "../models/user.model";
import * as TransactionService from "./transaction.service";
import { ICreateTransactionInput, TransactionType } from "../interfaces/Transaction";
import { transactionStage } from "./bot/transaction.scene";
import { message } from "telegraf/filters";

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(Telegraf.log());
const currentUser = async (messageId: number) => {
  const user = await UserModel.findOne({ "telegramAccount.id": messageId });
  if (!user) {
    throw new Error("Akun telegram ini belum terhubung, paste token kamu untuk menghubungkan");
  }
  return user;
};

bot.start((ctx) => {
  ctx.reply("Selamat datang di bot Finaki - Money Manager \nBot ini akan membantu kamu dalam mengelola keuangan kamu");
  ctx.reply("Silahkan ketik /help untuk melihat daftar perintah");
  ctx.reply("Masukan token kamu untuk memulai");
});

bot.help((ctx) => {
  ctx.reply("Daftar perintah yang tersedia: \n /help \n /start \n /token \n /in \n /out \n /balance");
});

bot.command("/user", async (ctx) => {
  try {
    const user = await UserModel.findOne({
      "telegramAccount.id": ctx.message.from.id,
    });
    if (!user) {
      ctx.reply("Akun telegram ini belum terhubung, ketik /token untuk menghubungkan");
      return;
    }
    ctx.reply(`Akun telegram ini terhubung dengan token ${user.token}`);
  } catch (error) {
    ctx.reply("Ada yang salah", error.message);
  }
});

bot.command("/in", async (ctx) => {
  try {
    // console.log(ctx.message)
    const description = ctx.message?.text.split("#")[0].replace("/in ", "");
    const amount = ctx.message?.text.split("#")[1] as unknown as number;
    const walletName = ctx.message?.text.split("#")[2];
    if (!description || !amount) {
      ctx.reply(
        "Perintah tidak lengkap \nFormat: /in <deskripsi>#<nominal>#<nama_dompet> \nContoh: /in Gaji#1000000#Dompet Utama",
      );
      return;
    }
    const user = await UserModel.findOne({
      "telegramAccount.id": ctx.message.from.id,
    }).populate("wallets");

    if (!user) {
      ctx.reply("Akun telegram ini belum terhubung, ketik /token untuk menghubungkan");
      return;
    }

    const wallet = user.wallets.find((wallet: any) => wallet.name === walletName);
    if (!wallet && walletName) {
      ctx.reply("Dompet tidak ditemukan");
      return;
    }

    const transaction: ICreateTransactionInput = {
      userId: user._id,
      description,
      amount,
      note: "Created in Telegram Bot",
      type: TransactionType.IN,
      includeInCalculation: true,
      walletId: walletName ? (wallet as any)._id : undefined,
    };

    const createdTransaction = await TransactionService.create(transaction);
    ctx.reply(
      `Transaksi berhasil dibuat \nDeskripsi: ${createdTransaction.description} \nNominal: Rp ${
        createdTransaction.amount
      } \nTipe Transaksi: Masuk \nDompet: ${walletName ? walletName : ""}`,
    );
  } catch (error) {
    ctx.reply(error);
  }
});

bot.command("/out", async (ctx) => {
  try {
    // console.log(ctx.message)
    const description = ctx.message?.text.split("#")[0].replace("/out ", "");
    const amount = ctx.message?.text.split("#")[1] as unknown as number;
    const walletName = ctx.message?.text.split("#")[2];
    if (!description || !amount) {
      ctx.reply(
        "Perintah tidak lengkap \nFormat: /out <deskripsi>#<nominal>#<nama_dompet> \nContoh: /in Gaji#1000000#Dompet Utama",
      );
      return;
    }
    const user = await UserModel.findOne({
      "telegramAccount.id": ctx.message.from.id,
    }).populate("wallets");

    if (!user) {
      ctx.reply("Akun telegram ini belum terhubung, ketik /token untuk menghubungkan");
      return;
    }

    const wallet = user.wallets.find((wallet: any) => wallet.name === walletName) as any;
    if (!wallet && walletName) {
      ctx.reply("Dompet tidak ditemukan");
      return;
    }

    if (wallet.balance < amount) {
      ctx.reply("Saldo dompet tidak mencukupi");
      return;
    }

    const transaction: ICreateTransactionInput = {
      userId: user._id,
      description,
      amount,
      type: TransactionType.OUT,
      note: "",
      includeInCalculation: true,
      walletId: walletName ? (wallet as any)._id : undefined,
    };

    const createdTransaction = await TransactionService.create(transaction);
    ctx.reply(
      `Transaksi berhasil dibuat \nDeskripsi: ${createdTransaction.description} \nNominal: Rp ${
        createdTransaction.amount
      } \nTipe Transaksi: Keluar \nDompet: ${walletName ? walletName : ""}`,
    );
  } catch (error) {
    ctx.reply("Ada Yang salah ", error.message);
  }
});

bot.command("/balance", async (ctx) => {
  try {
    const walletName = ctx.message?.text.split("#")[1];
    if (!walletName) {
      ctx.reply("Perintah tidak lengkap \nFormat: /balance#<nama_dompet> \nContoh: /balance Dompet Utama");
      return;
    }
    const user = await UserModel.findOne({
      "telegramAccount.id": ctx.message.from.id,
    }).populate("wallets");

    if (!user) {
      ctx.reply("Akun telegram ini belum terhubung, ketik /token untuk menghubungkan");
      return;
    }

    const wallet = user.wallets.find((wallet: any) => wallet.name === walletName) as any;
    if (!wallet) {
      ctx.reply("Dompet tidak ditemukan");
      return;
    }

    ctx.reply(`Saldo dompet ${wallet.name} adalah Rp ${wallet.balance}`);
  } catch (error) {
    ctx.reply("Ada Yang salah ", error.message);
  }
});

// middleware: authenticate user

bot.use(async (ctx, next) => {
  if (!ctx.message) {
    return;
  }
  try {
    ctx.state.user = await currentUser(ctx.message.from.id);
    return next();
  } catch (error) {
    ctx.reply(error.message);
  }
});

bot.use(session());
bot.use(transactionStage.middleware());
bot.command("add", (ctx: any) => {
  ctx.scene.enter("new-transaction");
});

// connect telegram account to user
bot.on(message("text"), async (ctx) => {
  const message = ctx.message.text;
  if (message.length !== 20) {
    ctx.reply("Harap masukan sesuai format periintah");
    return;
  }
  try {
    const user = await UserModel.findOneAndUpdate(
      { token: message },
      {
        telegramAccount: {
          id: ctx.message.from.id,
          username: ctx.message.from.username,
          first_name: ctx.message.from.first_name,
        },
      },
    );
    if (!user) {
      ctx.reply("Token belum terdaftar");
      return;
    }
    ctx.reply("Akun telegram berhasil terhubung, ketik /menu untuk melihat daftar perintah");
  } catch (error) {
    ctx.reply(
      "Gagal menghubungkan \nAkun telegram ini sudah terhubung dengan token lain, putuskan terlebih dahulu di akun web kamu",
    );
  }
});

bot.catch((err, ctx) => {
  ctx.reply("Ooops, terjadi kesalahan");
  console.log(err);
});

export default bot;
