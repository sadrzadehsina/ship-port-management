import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface UpdatePortActivityPercentageData {
  layTimeId: string;
  activityIndex: number;
  percentage: number;
}

export function useUpdatePortActivityPercentage() {
  const queryClient = useQueryClient();

  return useMutation<Partial<PortActivity>, AxiosError, UpdatePortActivityPercentageData>({
    mutationFn: async ({ layTimeId, activityIndex, percentage }) => {
      return axios.patch(`${portActivity.getAll(layTimeId)}/${activityIndex}/percentage`, {
        percentage,
      });
    },
    onSuccess: (partialUpdate, { layTimeId, activityIndex }) => {
      // Update the cache by merging the partial response with existing data
      queryClient.setQueryData<PortActivity[]>(
        qk.portActivity.list(layTimeId),
        (oldData) => {
          if (!oldData) return oldData;
          const newData = [...oldData];
          // Merge the partial update with the existing activity
          newData[activityIndex] = { ...newData[activityIndex], ...partialUpdate };
          return newData;
        }
      );
    },
  });
}
