import Heading from "../dls/Heading";

type ChartHeaderProps = {
  title: string;
  children?: React.ReactNode;
};

const ChartHeader = ({ title, children }: ChartHeaderProps) => (
  <div className="mb-5 flex items-center justify-between px-3">
    <Heading fontWeight="medium" level={3}>
      {title}
    </Heading>
    <div role="contentinfo" className="dark:text-slate-300">
      {children}
    </div>
  </div>
);

export default ChartHeader;
