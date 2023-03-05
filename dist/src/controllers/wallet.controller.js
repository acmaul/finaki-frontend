"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletTransactions = exports.transferWalletBalance = exports.getBalanceHistory = exports.getOneWallet = exports.updateWalletColor = exports.updateWallet = exports.deleteWallet = exports.getAllWallets = exports.createWallet = void 0;
const WalletService = __importStar(require("../services/wallet.service"));
const TransactionService = __importStar(require("../services/transaction.service"));
const express_validator_1 = require("express-validator");
const Transaction_1 = require("../interfaces/Transaction");
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
async function createWallet(req, res) {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    try {
        const userId = req.user;
        const { name, balance, color } = req.body;
        const newWallet = await WalletService.create({
            userId,
            name,
            color,
            balance: balance || 0,
        });
        if (balance > 0) {
            const transaction = await transaction_model_1.default.create({
                userId,
                walletId: newWallet._id,
                description: `Pembuatan dompet ${newWallet.name}`,
                amount: balance,
                type: Transaction_1.TransactionType.IN,
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
    }
    catch (error) {
        return res.status(500).json(error);
    }
}
exports.createWallet = createWallet;
async function getAllWallets(req, res) {
    try {
        const userId = req.user;
        const wallets = await wallet_model_1.default.find({ userId: userId })
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getAllWallets = getAllWallets;
async function deleteWallet(req, res) {
    try {
        const id = req.params.id;
        const deleteTransactions = req.query.deleteTransactions;
        const deletedWallet = await WalletService.deleteById(id, deleteTransactions);
        if (!deletedWallet)
            return res.status(404).json({ message: "Wallet not found" });
        res.json({
            message: "Wallet has been deleted successfully",
            data: {
                _id: deletedWallet._id,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.deleteWallet = deleteWallet;
async function updateWallet(req, res) {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    try {
        const id = req.params.id;
        const { name, color } = req.body;
        const updatedWallet = await wallet_model_1.default.findOneAndUpdate({
            _id: id,
        }, {
            name,
            color,
        }, {
            new: true,
        }).select({
            _id: 1,
            name: 1,
            color: 1,
        });
        if (!updatedWallet)
            return res.status(404).json({ message: "Wallet not found" });
        res.json({
            message: "Wallet has been updated successfully",
            data: updatedWallet,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.updateWallet = updateWallet;
async function updateWalletColor(req, res) {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    try {
        const id = req.params.id;
        const { color } = req.body;
        const updatedColor = await wallet_model_1.default.findOneAndUpdate({
            _id: id,
        }, {
            $set: {
                color,
            },
        }, {
            new: true,
        }).select({
            _id: 1,
            color: 1,
        });
        if (!updatedColor)
            return res.status(404).json({ message: "Wallet not found" });
        res.json({
            message: "Wallet color has been updated successfully",
            data: updatedColor,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.updateWalletColor = updateWalletColor;
async function getOneWallet(req, res) {
    try {
        const id = req.params.id;
        const wallet = await wallet_model_1.default.findById(id).select({
            _id: 1,
            name: 1,
            color: 1,
            balance: 1,
        });
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found" });
        const balanceHistory = await WalletService.balanceHistory(wallet._id, "week");
        res.json({
            message: "Wallet has been fetched successfully",
            data: {
                ...wallet.toJSON(),
                balanceHistory,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getOneWallet = getOneWallet;
async function getBalanceHistory(req, res) {
    try {
        const id = req.params.id;
        const period = req.query.period || "week";
        const result = await WalletService.balanceHistory(id, period);
        res.json({
            message: "Wallet balance history has been fetched successfully",
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getBalanceHistory = getBalanceHistory;
async function transferWalletBalance(req, res) {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    try {
        const { sourceWallet, destinationWallet, amount, note } = req.body;
        if (sourceWallet === destinationWallet) {
            return res.status(400).json({ message: "Source and destination wallet cannot be the same" });
        }
        const origin = await TransactionService.create({
            userId: req.user,
            walletId: sourceWallet,
            description: "Transfer saldo ke dompet lain",
            amount,
            note,
            type: Transaction_1.TransactionType.OUT,
            includeInCalculation: false,
        });
        const destination = await TransactionService.create({
            userId: req.user,
            walletId: destinationWallet,
            description: "Terima saldo dari dompet lain",
            amount,
            note,
            type: Transaction_1.TransactionType.IN,
            includeInCalculation: false,
        });
        res.json({
            message: "Transfer has been completed successfully",
            data: {
                origin,
                destination,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.transferWalletBalance = transferWalletBalance;
async function walletTransactions(req, res) {
    try {
        const id = req.params.id;
        const transactions = await wallet_model_1.default.findById(id).populate({
            path: "transactions",
            select: {
                includeInCalculation: 0,
                userId: 0,
                walletId: 0,
                __v: 0
            },
            options: { sort: { createdAt: -1 } }
        });
        res.json({
            message: "Wallet transactions has been fetched successfully",
            data: transactions === null || transactions === void 0 ? void 0 : transactions.transactions
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.walletTransactions = walletTransactions;
