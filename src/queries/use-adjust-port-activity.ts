import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface AdjustPortActivityData {
  layTimeId: string;
  activityIndex: number;
  adjustedActivity: PortActivity;
}

export function useAdjustPortActivity() {
  const queryClient = useQueryClient();

  return useMutation<PortActivity, AxiosError, AdjustPortActivityData>({
    mutationFn: async ({ layTimeId, activityIndex, adjustedActivity }) => {
      return axios.patch(`${portActivity.getAll(layTimeId)}/${activityIndex}/adjust`, adjustedActivity);
    },
    onSuccess: (updatedActivity, { layTimeId, activityIndex }) => {
      // Update the cache with the adjusted activity
      queryClient.setQueryData<PortActivity[]>(
        qk.portActivity.list(layTimeId),
        (oldData) => {
          if (!oldData) return [updatedActivity];
          const newData = [...oldData];
          newData[activityIndex] = updatedActivity;
          return newData;
        }
      );
    },
  });
}
