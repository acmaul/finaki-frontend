import React, { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WalletCard from "@/components/WalletCard/WalletCard";
import { RxDragHandleDots2 } from "react-icons/rx";
import classNames from "classnames";

type Props = {} & ComponentProps<typeof WalletCard>;

export const SortableWalletCard = ({ ...props }: Props) => {
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames("rounded-xl relative", {
        "z-50": isDragging,
      })}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 text-white"
      >
        <RxDragHandleDots2 size={25} color="currentColor" />
      </button>
      <WalletCard
        key={props.id}
        id={props.id}
        name={props.name}
        initColorKey={props.initColorKey}
        balance={props.balance}
      />
    </div>
  );
};