import { useState } from "react";
import Link from "next/link";
import { deleteTransaction, editTransaction } from "@/api/transaction";
import { QueryKey } from "@/types/QueryKey";
import { Routes } from "@/types/Routes";
import { Transaction } from "@/types/Transaction";
import { WalletData } from "@/types/Wallet";
import { currencyFormat, removeCurrencyFormat } from "@/utils/currencyFormat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

import useTransaction from "../../../stores/transactionStore";
import CurrencyInput from "../../dls/Form/CurrencyInput";
import TextArea from "../../dls/Form/TextArea";
import IconWrapper from "../../dls/IconWrapper";
import Option from "../../dls/Select/Option";
import Select from "../../dls/Select/Select";
import ArrowIcon from "../../icons/ArrowIcon";
import { walletLabelColor } from "../../WalletCard/constants";
import TransactionOption from "../AllTransactions/TransactionOption";

type Props = {
  transaction: Transaction;
};

/**
 * This is a full transaction item component, it will be used in the transactions page to show the full transaction item and it can be editable
 *
 * @param props
 * @returns
 */
const FullTransactionItem = ({ transaction }: Props) => {
  const {
    setTransactionDetailState,
    dispatchUpdateTransaction,
    dispatchDeleteTransaction,
  } = useTransaction((state) => ({
    setTransactionDetailState: state.setTransactionDetailState,
    dispatchUpdateTransaction: state.dispatchUpdateTransaction,
    dispatchDeleteTransaction: state.dispatchDeleteTransaction,
  }));
  const [isOnEdit, setIsOnEdit] = useState<boolean>(false);
  const { handleSubmit, control, register, setError } = useForm();

  const queryClient = useQueryClient();

  const wallets = queryClient.getQueryData([QueryKey.WALLETS]) as WalletData[];

  const currentWallet = wallets?.find(
    (wallet: any) => wallet._id === transaction.walletId,
  );

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (data) => {
      // refetch dashboard data
      queryClient.refetchQueries([QueryKey.TOTAL_TRANSACTIONS]);

      // delete transactions from transactions store
      dispatchDeleteTransaction(data._id);

      // update recent transactions data
      queryClient.setQueryData(
        [QueryKey.RECENT_TRANSACTIONS],
        (oldData: any) => {
          if (!oldData) return;
          const newData = oldData.filter(
            (transaction: Transaction) => transaction._id !== data._id,
          );
          return newData;
        },
      );

      // if deleted transaction has wallet id, update wallet data
      if (data.walletId) {
        queryClient.setQueryData([QueryKey.WALLETS], (oldData: any) => {
          if (!oldData) return;
          const newData = oldData.map((wallet: any) => {
            if (wallet._id === data.walletId) {
              return {
                ...wallet,
                balance:
                  wallet.balance -
                  (data.type === "in" ? data.amount : -data.amount),
              };
            }
            return wallet;
          });
          return newData;
        });
      }

      toast.success("Transaksi berhasil dihapus");
    },
    onError: (error) => {
      toast.error((error as any).response.data.message, {
        duration: 5000,
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: editTransaction,
    onSuccess: (data) => {
      setIsOnEdit(false);
      // refetch total transactions
      queryClient.refetchQueries([QueryKey.TOTAL_TRANSACTIONS]);

      // update transactions data from transactions store
      dispatchUpdateTransaction(data._id, data);

      // update recent transaction data
      queryClient.setQueryData(
        [QueryKey.RECENT_TRANSACTIONS],
        (oldData: any) => {
          if (!oldData) return;
          const newData: Transaction[] = oldData.map(
            (oldTransaction: Transaction) => {
              if (oldTransaction._id === data._id) {
                return {
                  ...oldTransaction,
                  description: data.description,
                  amount: data.amount,
                  type: data.type,
                };
              }
              return oldTransaction;
            },
          );
          return newData;
        },
      );

      // if edited transaction has wallet id and transaction amount is changed, invalidate wallet query
      if (data.walletId && data.amount !== transaction.amount) {
        queryClient.invalidateQueries([QueryKey.WALLETS]);
      }

      // send toast
      toast.success("Transaksi berhasil diubah", {
        duration: 2000,
      });
    },

    onError: (error) => {
      toast.error((error as any).response.data.message, {
        duration: 6000,
      });
      setError(
        "amount",
        {
          type: "manual",
          message: "Ada yang salah",
        },
        {
          shouldFocus: true,
        },
      );
    },
  });

  const onSaveHandler: SubmitHandler<any> = (values: any) => {
    const editedTransactionData = {
      id: transaction._id,
      transactionInput: {
        ...values,
        amount: removeCurrencyFormat(values.amount),
      },
    };

    if (values.amount < 0) {
      setError(
        "amount",
        {
          type: "manual",
          message: "Jumlah tidak boleh kurang dari 0",
        },
        {
          shouldFocus: true,
        },
      );
      toast.error("Jumlah tidak boleh kurang dari 0");
      return;
    }

    //  if transaction data not changed, just close the edit mode
    if (
      values.description === transaction.description &&
      values.amount == transaction.amount &&
      values.type === transaction.type
    ) {
      setIsOnEdit(false);
      return;
    }

    // if editMutation is error, and the request data is the same as the previous request, just close the edit mode
    if (
      editMutation.isError &&
      (editMutation.error as any)?.config.data === JSON.stringify(values)
    ) {
      editMutation.reset();
      setIsOnEdit(false);
      toast.error("Tidak ada perubahan");
      return;
    }

    editMutation.mutate(editedTransactionData);
  };

  const onDeleteHandler = (transactionId: string) => {
    deleteMutation.mutate(transactionId);
  };

  const date = new Date(transaction.createdAt).toTimeString().slice(0, 5);

  return (
    <>
      {isOnEdit && (
        <div className="absolute right-0 top-0 z-40 h-screen w-screen bg-transparent"></div>
      )}
      <tr
        className={classNames("group pr-0 dark:hover:bg-blue-900/50 lg:pr-4", {
          "relative z-50": isOnEdit,
        })}
      >
        {!isOnEdit ? (
          <>
            <td className="hidden h-14 rounded-l-xl pl-3 text-gray-500 group-hover:bg-blue-100 group-hover:text-slate-900 dark:group-hover:bg-blue-900/50 dark:group-hover:text-slate-200 lg:table-cell ">
              {date}
            </td>
            <td className="rounded-l-xl py-3 pl-2 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 lg:rounded-none lg:pl-0">
              <div
                onClick={() =>
                  setTransactionDetailState({
                    isOpen: true,
                    transaction: transaction,
                  })
                }
                className="block w-36 cursor-pointer  truncate font-semibold text-slate-800 dark:text-slate-200 md:w-72 lg:w-96 lg:font-medium"
              >
                {transaction.description}
              </div>
              <div
                className={classNames(
                  "text-gray-500 group-hover:text-slate-900 dark:group-hover:text-slate-200 lg:hidden",
                )}
              >
                {date}
              </div>
            </td>
            <td
              align="center"
              className="group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
            >
              <Link
                href={
                  currentWallet
                    ? `${Routes.Wallet}/${currentWallet._id}`
                    : Routes.Transactions
                }
                className={classNames(
                  "block w-fit rounded-xl px-3 py-1 text-center text-sm font-medium",
                  `${
                    currentWallet &&
                    !currentWallet.color.includes("#") &&
                    (walletLabelColor as any)[currentWallet.color]
                  }`,
                  {
                    "cursor-pointer": currentWallet,
                  },
                  {
                    "!cursor-default text-slate-600 dark:text-slate-200":
                      !currentWallet,
                  },
                  {
                    "text-white": currentWallet?.color.includes("#"),
                  },
                )}
                style={{
                  backgroundColor: currentWallet?.color.includes("#")
                    ? currentWallet?.color
                    : undefined,
                }}
              >
                {currentWallet ? currentWallet.name.split(" ")[0] : " - "}
              </Link>
            </td>
            <td
              className={classNames(
                "text-right font-medium group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50",
                { "text-blue-500": transaction.type === "in" },
                { "text-orange-500": transaction.type === "out" },
              )}
            >
              <span>
                {transaction.type === "out" ? "-" : "+"}
                {currencyFormat(transaction.amount, {})}
              </span>
            </td>
          </>
        ) : (
          <td
            colSpan={4}
            className="rounded-l-xl bg-blue-100 py-2 pl-3 pr-2 dark:bg-blue-900/50"
          >
            <form
              className="flex w-full items-center gap-3"
              id="edit-transaction-form"
              onSubmit={handleSubmit(onSaveHandler)}
            >
              <TextArea
                id="Deskripsi"
                required
                spellCheck={false}
                placeholder="Deskripsi"
                transparent
                defaultValue={transaction.description}
                className="h-auto w-[50%]"
                padding="p-2 h-12"
                {...register("description")}
              />
              <div className="flex gap-3 dark:text-slate-200">
                <Controller
                  name="type"
                  control={control}
                  defaultValue={transaction.type}
                  render={({ field }) => (
                    <Select required className="!p-3" {...field}>
                      <Option selected={transaction.type === "in"} value="in">
                        <div className="flex items-center gap-2">
                          <IconWrapper className="!w-4 text-blue-500">
                            <ArrowIcon direction="up" />
                          </IconWrapper>
                          Masuk
                        </div>
                      </Option>
                      <Option selected={transaction.type === "out"} value="out">
                        <div className="flex items-center gap-2">
                          <IconWrapper className="!w-4 text-orange-500">
                            <ArrowIcon direction="down" />
                          </IconWrapper>
                          Keluar
                        </div>
                      </Option>
                    </Select>
                  )}
                />
                <Controller
                  name="amount"
                  control={control}
                  defaultValue={String(transaction.amount)}
                  render={({ field }) => (
                    <CurrencyInput
                      prefixSymbol=""
                      inputStyle="!p-2 h-12"
                      placeholder="Jumlah"
                      id="amount"
                      {...field}
                    />
                  )}
                />
              </div>
            </form>
          </td>
        )}
        <td
          className={classNames(
            "rounded-r-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50",
            {
              "bg-blue-100 dark:bg-blue-900/50": isOnEdit,
            },
          )}
        >
          <TransactionOption
            isLoading={deleteMutation.isLoading || editMutation.isLoading}
            onCancel={() => setIsOnEdit(false)}
            isOnEdit={isOnEdit}
            onEdit={() => setIsOnEdit(true)}
            onDelete={() => onDeleteHandler(transaction._id)}
          />
        </td>
      </tr>
    </>
  );
};

export default FullTransactionItem;
