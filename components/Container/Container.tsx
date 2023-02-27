import React from "react";

type ContainerProps = {
  children: React.ReactNode;
};

const Container = ({ children }: ContainerProps) => {
  return (
    <div className="max-w-7xl max-w mx-auto flex gap-5 lg:pb-5 pb-32 px-3">
      {children}
    </div>
  );
};

export default Container;
