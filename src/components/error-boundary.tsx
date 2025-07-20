import type { ReactNode } from "react";
import { ErrorBoundary as BaseErrorBoundary } from "react-error-boundary";

type ErrorBoundaryProps = {
  error: Error;
  children: ReactNode;
};

const ErrorBoundary = ({ error, children }: ErrorBoundaryProps) => {
  return (
    <BaseErrorBoundary fallback={<FallbackComponent error={error} />}>
      {children}
    </BaseErrorBoundary>
  );
};

const FallbackComponent = ({
  error,
}: {
  error: ErrorBoundaryProps["error"];
}) => {
  return <span>{error.message}</span>;
};

export { ErrorBoundary };