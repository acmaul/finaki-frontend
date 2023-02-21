import IconWrapper from "@/dls/IconWrapper";
import ArrowCircleIcon from "@/icons/ArrowCircleIcon";
import { currencyFormat } from "@/utils/currencyFormat";
import classNames from "classnames";
import React from "react";

type ListProps = {
  isLastItem: boolean;
  type: string;
  description: string;
  createdAt: string;
  amount: number;
  theme?: "default" | "light";
};

const RecentItem = ({
  isLastItem,
  type,
  description,
  createdAt,
  amount,
  theme = "default",
}: ListProps) => {
  const date = new Date(createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const hour = new Date(createdAt).toLocaleTimeString("id-ID", {
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <li
      className={classNames("flex w-full py-3 items-center gap-3", {
        "border-b": !isLastItem,
        "dark:border-slate-500 dark:text-slate-200 text-slate-800":
          theme === "default",
        "border-white/40": theme === "light",
      })}
    >
      <span>
        <IconWrapper className="w-7">
          <ArrowCircleIcon
            direction={type === "in" ? "up" : "down"}
            className={classNames(
              { "text-blue-500": type === "in" && theme === "default" },
              { "text-orange-500": type === "out" && theme === "default" },
              { "text-white": theme === "light" }
            )}
          />
        </IconWrapper>
      </span>
      <span>
        <span className={classNames("font-medium")}>{description}</span>
        <span className="flex items-center">
          <span className="font-medium text-sm md:text-base mr-1">{date}</span>
          <span
            className={classNames(
              "text-sm md:text-base",
              {
                "dark:text-slate-400 text-slate-500": theme === "default",
              },
              {
                "text-white/80": theme === "light",
              }
            )}
          >
            {hour}
          </span>
        </span>
      </span>
      <span
        className={classNames(
          "font-medium  ml-auto whitespace-nowrap",
          { "text-blue-500": type === "in" && theme === "default" },
          { "text-orange-500": type === "out" && theme === "default" },
          { "text-white": theme === "light" }
        )}
      >
        {type === "in" ? "+" : "-"}
        {currencyFormat(amount)}
      </span>
    </li>
  );
};

export default RecentItem;
