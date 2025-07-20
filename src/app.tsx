import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { config } from "./config";
import PortActivityByLayTimes from "./pages/port-activity-by-lay-times";

const client = new QueryClient(config.queryClient);

function App() {
  return (
    <QueryClientProvider client={client}>
      <PortActivityByLayTimes />
    </QueryClientProvider>
  );
}

export default App;
