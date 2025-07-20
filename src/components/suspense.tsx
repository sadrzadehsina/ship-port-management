import { type ReactNode, Suspense as BaseSuspense } from "react";

type SuspenseProps = {
  children: ReactNode;
};

const Suspense = ({ children }: SuspenseProps) => {
  return (
    <BaseSuspense fallback={<FallbackComponent />}>{children}</BaseSuspense>
  );
};

const FallbackComponent = () => {
  return <span>Loading ...</span>;
};

export { Suspense };
