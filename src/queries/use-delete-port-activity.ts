import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface DeletePortActivityData {
  layTimeId: string;
  activityId: string; // We'll need to add an ID field to identify activities
}

export function useDeletePortActivity() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, DeletePortActivityData>({
    mutationFn: async ({ layTimeId, activityId }) => {
      return axios.delete(`${portActivity.getAll(layTimeId)}/${activityId}`);
    },
    onSuccess: (_, { layTimeId, activityId }) => {
      // Update the cache by removing the deleted activity
      queryClient.setQueryData<PortActivity[]>(
        qk.portActivity.list(layTimeId),
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter((_, index) => index.toString() !== activityId);
        }
      );
    },
  });
}
