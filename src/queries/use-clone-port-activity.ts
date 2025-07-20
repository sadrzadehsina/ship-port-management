import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface ClonePortActivityData {
  layTimeId: string;
  activity: PortActivity;
  insertIndex: number;
}

export function useClonePortActivity() {
  const queryClient = useQueryClient();

  return useMutation<PortActivity, AxiosError, ClonePortActivityData>({
    mutationFn: async ({ layTimeId, activity }) => {
      // Clone the activity (the backend would handle this)
      return axios.post(`${portActivity.getAll(layTimeId)}/clone`, activity);
    },
    onSuccess: (clonedActivity, { layTimeId, insertIndex }) => {
      // Update the cache by inserting the cloned activity at the correct position
      queryClient.setQueryData<PortActivity[]>(
        qk.portActivity.list(layTimeId),
        (oldData) => {
          if (!oldData) return [clonedActivity];
          const newData = [...oldData];
          newData.splice(insertIndex, 0, clonedActivity);
          return newData;
        }
      );
    },
  });
}
