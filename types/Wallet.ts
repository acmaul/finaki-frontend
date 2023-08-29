export interface WalletData {
  _id: string;
  name: string;
  balance: number;
  color: string;
  creadtedAt?: string;
  updatedAt?: Date;
}

export interface BalanceHistory {
  timestamp: string;
  value: number;
}
