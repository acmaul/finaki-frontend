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
Object.defineProperty(exports, "__esModule", { value: true });
exports.recentTransactionByUser = exports.getTotalTransaction = exports.getTransactionById = exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getAllTransactions = void 0;
// import Transaction from "../models/Transaction";
const express_validator_1 = require("express-validator");
const Transaction = __importStar(require("../services/transaction.service"));
const UserService = __importStar(require("../services/user.service"));
async function getAllTransactions(req, res) {
    try {
        // const transactions = await Transaction.getAll();
        const userId = req.user;
        const transactions = await Transaction.getTransactionByUser(userId);
        res.json(transactions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getAllTransactions = getAllTransactions;
async function createTransaction(req, res) {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    try {
        const userId = req.user;
        const { description, amount, type, category } = req.body;
        const newTransaction = await Transaction.create({ userId, description, amount, type, category });
        await UserService.pushTransaction(userId, newTransaction._id);
        res.status(201).json({
            message: "Transaction has been created successfully",
            data: newTransaction,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}
exports.createTransaction = createTransaction;
async function updateTransaction(req, res) {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }
    try {
        const id = req.query.id;
        const { description, amount, type, category } = req.body;
        const updatedTransaction = await Transaction.update(id, { description, amount, type, category });
        if (!updatedTransaction)
            return res.status(404).json({ message: "Transaction not found" });
        res.json({
            message: "Transaction has been updated successfully",
            data: updatedTransaction,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.updateTransaction = updateTransaction;
async function deleteTransaction(req, res) {
    try {
        const userId = req.user;
        const id = req.query.id;
        const deletedTransaction = await Transaction.remove(id);
        await UserService.pullTransaction(userId, id);
        res.json({
            message: "Transaction has been deleted successfully",
            data: deletedTransaction,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.deleteTransaction = deleteTransaction;
async function getTransactionById(req, res) {
    try {
        const id = req.params.id;
        const transaction = await Transaction.getById(id);
        res.json(transaction);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
}
exports.getTransactionById = getTransactionById;
async function getTotalTransaction(req, res) {
    var _a;
    try {
        const userId = req.user;
        const interval = (_a = req.query.interval) !== null && _a !== void 0 ? _a : "week";
        const timezone = "Asia/Jakarta";
        const totalTranscation = await Transaction.getTotalTransactionByPeriods(userId, interval, timezone);
        if (!totalTranscation)
            return res.status(404).json({ message: "No data found" });
        res.json(totalTranscation);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getTotalTransaction = getTotalTransaction;
async function recentTransactionByUser(req, res) {
    var _a;
    try {
        const userId = req.user;
        const limit = (_a = parseInt(req.query.limit)) !== null && _a !== void 0 ? _a : 5;
        const transactions = await Transaction.getRecentTransactions(userId, limit);
        res.json(transactions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.recentTransactionByUser = recentTransactionByUser;
