import { Request, Response } from "express";
import * as WalletService from "../services/wallet.service";
import * as TransactionService from "../services/transaction.service";
import { validationResult } from "express-validator";
import { Types } from "mongoose";
import { TransactionType } from "../interfaces/Transaction";
import TransactionModel from "../models/transaction.model";
import WalletModel from "../models/wallet.model";

export async function createWallet(req: Request, res: Response) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }

  try {
    const userId = req.user as Types.ObjectId;
    const { name, balance, color } = req.body;

    const newWallet = await WalletService.create({
      userId,
      name,
      color,
      balance: balance || 0,
    });

    if (balance > 0) {
      const transaction = await TransactionModel.create({
        userId,
        walletId: newWallet._id,
        description: `Pembuatan dompet ${newWallet.name}`,
        amount: balance,
        type: TransactionType.IN,
      });
      newWallet.transactions.push(transaction._id);
      await newWallet.save();
    }

    return res.status(201).json({
      message: "Wallet has been created successfully",
      data: {
        _id: newWallet._id,
        name: newWallet.name,
        color: newWallet.color,
        balance: newWallet.balance,
      },
    });
  } catch (error) {
    return res.status(500).json(error);
  }
}

export async function getAllWallets(req: Request, res: Response) {
  try {
    const userId = req.user;
    const wallets = await WalletModel.find({ userId: userId })
      .select({
        _id: 1,
        name: 1,
        balance: 1,
        color: 1,
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Wallets has been fetched successfully",
      data: wallets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function deleteWallet(req: Request, res: Response) {
  try {
    const id = req.params.id as unknown;
    const deleteTransaction = (req.query.deleteTransactions as unknown as boolean) || false;

    const deletedWallet = await WalletService.deleteById(id as Types.ObjectId, deleteTransaction);
    if (!deletedWallet) return res.status(404).json({ message: "Wallet not found" });

    res.json({
      message: "Wallet has been deleted successfully",
      data: {
        _id: deletedWallet._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateWallet(req: Request, res: Response) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }
  try {
    const id = req.params.id as unknown;
    const { name, color } = req.body;

    const updatedWallet = await WalletModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        name,
        color,
      },
      {
        new: true,
      },
    ).select({
      _id: 1,
      name: 1,
      color: 1,
    });

    if (!updatedWallet) return res.status(404).json({ message: "Wallet not found" });

    res.json({
      message: "Wallet has been updated successfully",
      data: updatedWallet,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateWalletColor(req: Request, res: Response) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }

  try {
    const id = req.params.id as unknown;
    const { color } = req.body;

    const updatedColor = await WalletModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          color,
        },
      },
      {
        new: true,
      },
    ).select({
      _id: 1,
      color: 1,
    });
    if (!updatedColor) return res.status(404).json({ message: "Wallet not found" });
    res.json({
      message: "Wallet color has been updated successfully",
      data: updatedColor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getOneWallet(req: Request, res: Response) {
  try {
    const id = req.params.id as unknown;
    const wallet = await WalletModel.findById(id).select({
      _id: 1,
      name: 1,
      color: 1,
      balance: 1,
    });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json({
      message: "Wallet has been fetched successfully",
      data: wallet,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function transferWalletBalance(req: Request, res: Response) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(400).json({ errors: error.array() });
  }
  try {
    const { sourceWallet, destinationWallet, amount, note } = req.body;

    const origin = await TransactionService.create({
      userId: req.user as Types.ObjectId,
      walletId: sourceWallet,
      description: "Transfer saldo ke dompet lain",
      amount,
      note,
      type: TransactionType.OUT,
      includeInCalculation: false,
    });

    const destination = await TransactionService.create({
      userId: req.user as Types.ObjectId,
      walletId: destinationWallet,
      description: "Transfer saldo dari dompet lain",
      amount,
      note,
      type: TransactionType.IN,
      includeInCalculation: false,
    });

    res.json({
      message: "Transfer has been completed successfully",
      data: {
        origin,
        destination,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
