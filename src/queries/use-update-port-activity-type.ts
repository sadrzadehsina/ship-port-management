import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface UpdatePortActivityTypeData {
  layTimeId: string;
  activityIndex: number;
  activityType: string;
}

export function useUpdatePortActivityType() {
  const queryClient = useQueryClient();

  return useMutation<Partial<PortActivity>, AxiosError, UpdatePortActivityTypeData>({
    mutationFn: async ({ layTimeId, activityIndex, activityType }) => {
      return axios.patch(`${portActivity.getAll(layTimeId)}/${activityIndex}/activity-type`, {
        activityType,
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
