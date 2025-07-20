import type { QueryClientConfig } from "@tanstack/react-query";

type Config = {
  queryClient: QueryClientConfig;
};

const config = {
  queryClient: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  },
} satisfies Config;

export { config };