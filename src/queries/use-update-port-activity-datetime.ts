import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PortActivity } from "@/types";

import axios from "@/lib/axios";
import * as qk from "@/query-keys";
import { portActivity } from "@/endpoints";

interface UpdatePortActivityDateTimeData {
  layTimeId: string;
  activityIndex: number;
  field: 'fromDateTime' | 'toDateTime';
  dateTime: Date;
}

export function useUpdatePortActivityDateTime() {
  const queryClient = useQueryClient();

  return useMutation<Partial<PortActivity>, AxiosError, UpdatePortActivityDateTimeData>({
    mutationFn: async ({ layTimeId, activityIndex, field, dateTime }) => {
      return axios.patch(`${portActivity.getAll(layTimeId)}/${activityIndex}/datetime`, {
        field,
        value: dateTime.toISOString(),
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
