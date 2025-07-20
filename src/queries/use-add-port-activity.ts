import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface AddPortActivityData {
  layTimeId: string;
  activity: Omit<PortActivity, 'toDateTime'> & { toDateTime?: Date };
}

export function useAddPortActivity() {
  const queryClient = useQueryClient();

  return useMutation<PortActivity, AxiosError, AddPortActivityData>({
    mutationFn: async ({ layTimeId, activity }) => {
      return axios.post(portActivity.add(layTimeId), activity);
    },
    onSuccess: (newActivity, { layTimeId }) => {
      // Update the cache with the new activity
      queryClient.setQueryData<PortActivity[]>(
        qk.portActivity.list(layTimeId),
        (oldData) => {
          if (!oldData) return [newActivity];
          return [...oldData, newActivity];
        }
      );
    },
  });
}
