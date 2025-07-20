import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { config } from "./config";
import { ThemeProvider } from "./context/theme-provider";
import PortActivityByLayTimes from "./pages/port-activity-by-lay-times";

const client = new QueryClient(config.queryClient);

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ship-port-theme">
      <QueryClientProvider client={client}>
        <PortActivityByLayTimes />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
