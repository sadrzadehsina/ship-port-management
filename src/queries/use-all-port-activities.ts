import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

export function useAllPortActivities(layTimeId: string) {
  return useQuery<PortActivity[], AxiosError, PortActivity[]>({
    queryKey: qk.portActivity.list(layTimeId),
    queryFn: () => getAllPortActivities(layTimeId),
    enabled: !!layTimeId,
  });
}

function getAllPortActivities(layTimeId: string): Promise<PortActivity[]> {
  return axios.get(portActivity.getAll(layTimeId));
}
