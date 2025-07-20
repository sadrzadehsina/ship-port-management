import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";

import type { LayTime } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { layTime } from "@/endpoints";

export function useAllLayTimes() {
  return useQuery<LayTime[], AxiosError, LayTime[]>({
    queryKey: qk.layTime.list(),
    queryFn: getAllLayTimes,
  });
}

function getAllLayTimes(): Promise<LayTime[]> {
  return axios.get(layTime.getAll());
}
