"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { getAllTransactions } from "@/api/transaction";
import { QueryKey } from "@/types/QueryKey";
import { groupByDay } from "@/utils/array";
import { useInfiniteQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { toast } from "react-hot-toast";
import { useInView } from "react-intersection-observer";
import { shallow } from "zustand/shallow";

import Input from "../../../components/dls/Form/Input";
import Heading from "../../../components/dls/Heading";
import LoadingSpinner from "../../../components/dls/Loading/LoadingSpinner";
import TransactionHeader from "../../../components/Transactions/AllTransactions/TransactionHeader";
import TransactionList from "../../../components/Transactions/AllTransactions/TransactionList";
import { SimpleTSkeleton } from "../../../components/Transactions/TransactionItem";
import { useDebounce } from "../../../hooks/useDebounce";
import useTransaction from "../../../stores/transactionStore";
import ExportPDF from "./ExportPDF";

const LIMIT = 20;
const AllTransactions = () => {
  const { setTransactions, transactions } = useTransaction(
    (state) => ({
      transactions: state.transactions,
      setTransactions: state.setTransactions,
    }),
    shallow,
  );
  const { ref, inView } = useInView();
  const [search, setSearch] = useState("");

  const {
    error,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    data,
  } = useInfiniteQuery({
    queryKey: [QueryKey.TRANSACTIONS],
    queryFn: ({ pageParam = 1 }) =>
      getAllTransactions({
        limit: LIMIT,
        page: pageParam,
      }),
    onSuccess: (data) => {
      if (!data.pages) return;
      const transactions = data.pages.flatMap((page) => page.transactions);
      setTransactions(transactions);
    },
    onError: () => {
      toast.error("Terjadi kesalahan");
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.totalPages == lastPage.currentPage) {
        return undefined;
      }
      const nextPage = parseInt(lastPage.currentPage as unknown as string) + 1;
      return nextPage;
    },
  });

  const debounceSearch = useDebounce(search, 800);
  const searchQuery = useInfiniteQuery({
    queryKey: [QueryKey.TRANSACTIONS, debounceSearch],
    queryFn: () => getAllTransactions({ search: debounceSearch, limit: LIMIT }),
    getNextPageParam: (lastPage) => {
      if (lastPage.totalPages == lastPage.currentPage) {
        return undefined;
      }
      const nextPage = parseInt(lastPage.currentPage as unknown as string) + 1;
      return nextPage;
    },
    enabled: Boolean(debounceSearch),
  });

  const transactionLists = useMemo(() => {
    if (!data) return [];
    return groupByDay(transactions);
  }, [data, transactions]);

  const filteredTransactionLists = useMemo(() => {
    if (!searchQuery.data) return [];
    const data = searchQuery.data.pages.flatMap((page) => page.transactions);
    return groupByDay(data);
  }, [searchQuery.data]);

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  if (isLoading) {
    return (
      <div className="mt-7 space-y-4">
        {Array(6)
          .fill("")
          .map((_, index) => (
            <SimpleTSkeleton key={index} delay={index * 300} />
          ))}
      </div>
    );
  }

  if (!transactionLists || error) {
    return (
      <Heading className="mt-10 text-center" level={3}>
        Terjadi Kesalahan
      </Heading>
    );
  }

  if (transactionLists.length < 1) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center font-semibold dark:text-slate-300">
        <Image
          src="/images/transaction.png"
          alt="Transaction is empty"
          width={200}
          height={200}
        />
        <Heading level={3}>Belum ada transaksi</Heading>
        <br />
        <strong className="text-lg font-normal">
          Untuk menambahkan transaksi, klik icon + atau tambah transaksi
        </strong>
      </div>
    );
  }

  const notFound = () => {
    if (
      filteredTransactionLists.length < 1 &&
      search.length > 0 &&
      !searchQuery.isLoading
    ) {
      return (
        <div className="mt-10 flex flex-col items-center justify-center font-semibold dark:text-slate-300">
          <Image
            src="/images/transaction.png"
            alt="Transaction is empty"
            width={200}
            height={200}
          />
          <Heading level={3}>Transaksi tidak ditemukan</Heading>
          <br />
          <strong className="text-lg font-normal">
            Silahkan coba kata kunci lain
          </strong>
        </div>
      );
    }
  };

  return (
    <>
      <Head>
        <title>Transaksi</title>
      </Head>
      <div className="flex justify-between gap-4">
        <Input
          className="max-w-md !bg-gray-200 font-semibold ring-0 ring-slate-300 transition-all focus:!bg-gray-100 focus:ring-2 dark:!bg-slate-700 dark:ring-slate-500"
          type="text"
          placeholder="Cari Transaksi"
          onChange={(e) => setSearch(e.target.value)}
        />
        <ExportPDF />
      </div>
      <table className="w-full" border={0}>
        <TransactionHeader />
        <TransactionList
          data={search.length > 0 ? filteredTransactionLists : transactionLists}
        />
      </table>
      {notFound()}
      {searchQuery.isLoading && search.length > 0 && (
        <div className="mt-7 space-y-4">
          {Array(6)
            .fill("")
            .map((_, index) => (
              <SimpleTSkeleton key={index} delay={index * 300} />
            ))}
        </div>
      )}
      <button
        ref={ref}
        disabled={!hasNextPage || isFetchingNextPage}
        className={classNames(
          "mx-auto mt-5 flex items-center gap-2 rounded-lg bg-blue-200 px-5 py-2 font-medium text-blue-500",
          { hidden: !hasNextPage },
        )}
        onClick={() => fetchNextPage()}
      >
        {isFetchingNextPage ? (
          <>
            <LoadingSpinner className=" stroke-blue-500" /> Loading
          </>
        ) : hasNextPage ? (
          "Load More"
        ) : (
          "No more data"
        )}
      </button>
    </>
  );
};

export default AllTransactions;
