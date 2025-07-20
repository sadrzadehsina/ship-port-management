import { faker } from "@faker-js/faker";
import { createColumnHelper } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MdDelete, MdContentCopy, MdAutoFixHigh } from "react-icons/md";

import type { PortActivity } from "@/types";
import * as qk from "@/query-keys";

import { DataTable } from "@/components/data-table";
import { DateTimePicker } from "@/components/date-time-picker";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAddPortActivity } from "@/queries/use-add-port-activity";
import { useAllPortActivities } from "@/queries/use-all-port-activities";
import { useClonePortActivity } from "@/queries/use-clone-port-activity";
import { useDeletePortActivity } from "@/queries/use-delete-port-activity";
import { useUpdatePortActivityType } from "@/queries/use-update-port-activity-type";
import { useUpdatePortActivityDateTime } from "@/queries/use-update-port-activity-datetime";
import { useUpdatePortActivityPercentage } from "@/queries/use-update-port-activity-percentage";

type PortActivityProps = {
  layTimeId?: string;
};

export function PortActivity({ layTimeId }: PortActivityProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{ index: number; activity: PortActivity } | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [activityToAdjust, setActivityToAdjust] = useState<{ index: number; activity: PortActivity } | null>(null);
  
  const { data, isLoading, error } = useAllPortActivities(layTimeId || '');
  const addPortActivityMutation = useAddPortActivity();
  const deletePortActivityMutation = useDeletePortActivity();
  const clonePortActivityMutation = useClonePortActivity();
  const updatePercentageMutation = useUpdatePortActivityPercentage();
  const updateDateTimeMutation = useUpdatePortActivityDateTime();
  const updateActivityTypeMutation = useUpdatePortActivityType();
  
  if (!layTimeId) {
    return (
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2 text-gray-900 dark:text-gray-100">
            Port Activity
          </h1>
          <Button
            disabled
          >
            Add Event
          </Button>
        </div>
        <DataTable data={[] as PortActivity[]} columns={getColumns(() => {}, () => {}, () => {}, () => {}, () => {}, () => {}, [])} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          Select a lay time row to view port activities
        </div>
      </div>
    );
  }

  const validateSequentialTiming = (activities: PortActivity[]) => {
    const violations: number[] = [];
    
    for (let i = 1; i < activities.length; i++) {
      const currentActivity = activities[i];
      const previousActivity = activities[i - 1];
      
      const currentFromTime = new Date(currentActivity.fromDateTime).getTime();
      const previousToTime = new Date(previousActivity.toDateTime).getTime();
      
      if (Math.abs(currentFromTime - previousToTime) > 60000) {
        violations.push(i);
      }
    }
    
    return violations;
  };

  const validationViolations = data ? validateSequentialTiming(data) : [];

  const handleUpdatePercentage = (index: number, newPercentage: number) => {
    if (!layTimeId) return;
    
    updatePercentageMutation.mutate({
      layTimeId,
      activityIndex: index,
      percentage: newPercentage,
    });
  };

  const handleUpdateDateTime = (index: number, field: 'fromDateTime' | 'toDateTime', newDateTime: Date) => {
    if (!layTimeId) return;
    
    updateDateTimeMutation.mutate({
      layTimeId,
      activityIndex: index,
      field,
      dateTime: newDateTime,
    });
  };

  const handleUpdateActivityType = (index: number, newActivityType: string) => {
    if (!layTimeId) return;
    
    updateActivityTypeMutation.mutate({
      layTimeId,
      activityIndex: index,
      activityType: newActivityType,
    });
  };

  const handleAdjustActivity = (index: number) => {
    if (!layTimeId || !data) return;
    
    const activity = data[index];
    setActivityToAdjust({ index, activity });
    setAdjustDialogOpen(true);
  };

  const confirmAdjust = () => {
    if (!layTimeId || !data || !activityToAdjust) return;
    
    const index = activityToAdjust.index;
    const currentActivity = data[index];
    const currentFromTime = new Date(currentActivity.fromDateTime).getTime();
    
    const newData = [...data];
    
    const [activityToMove] = newData.splice(index, 1);
    
    let insertIndex = 0;
    
    for (let i = 0; i < newData.length; i++) {
      const otherActivity = newData[i];
      const otherFromTime = new Date(otherActivity.fromDateTime).getTime();
      
      if (currentFromTime < otherFromTime) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    
    newData.splice(insertIndex, 0, activityToMove);
    
    let adjustedActivity = { ...activityToMove };
    
    adjustedActivity.fromDateTime = new Date(adjustedActivity.fromDateTime);
    adjustedActivity.toDateTime = new Date(adjustedActivity.toDateTime);
    
    if (insertIndex < newData.length - 1) {
      const nextActivity = newData[insertIndex + 1];
      const nextActivityFromTime = new Date(nextActivity.fromDateTime);
      const movedActivityFromTime = adjustedActivity.fromDateTime;
      
      if (nextActivityFromTime.getTime() > movedActivityFromTime.getTime()) {
        adjustedActivity.toDateTime = new Date(nextActivityFromTime.getTime());
      } else {
        const originalDuration = new Date(activityToMove.toDateTime).getTime() - new Date(activityToMove.fromDateTime).getTime();
        const minDuration = Math.max(originalDuration, 60 * 60 * 1000);
        adjustedActivity.toDateTime = new Date(adjustedActivity.fromDateTime.getTime() + minDuration);
      }
    } else {
      const originalDuration = new Date(activityToMove.toDateTime).getTime() - new Date(activityToMove.fromDateTime).getTime();
      adjustedActivity.toDateTime = new Date(adjustedActivity.fromDateTime.getTime() + originalDuration);
    }
    
    if (adjustedActivity.toDateTime.getTime() < adjustedActivity.fromDateTime.getTime()) {
      adjustedActivity.toDateTime = new Date(adjustedActivity.fromDateTime.getTime());
    }
    
    adjustedActivity.day = adjustedActivity.fromDateTime.toISOString();
    
    newData[insertIndex] = adjustedActivity;
    
    if (index !== insertIndex) {
      if (insertIndex > 0) {
        const previousActivity = newData[insertIndex - 1];
        const movedActivityFromTime = adjustedActivity.fromDateTime;
        previousActivity.toDateTime = new Date(movedActivityFromTime.getTime());
      }
      
      if (index > 0 && index < data.length) {
        const activityAfterOriginalPosition = newData[index];
        if (activityAfterOriginalPosition && index > 0) {
          const activityBeforeOriginalPosition = newData[index - 1];
          if (activityBeforeOriginalPosition) {
            const nextActivityFromTime = new Date(activityAfterOriginalPosition.fromDateTime);
            activityBeforeOriginalPosition.toDateTime = new Date(nextActivityFromTime.getTime());
          }
        }
      }
    }
    
    queryClient.setQueryData<PortActivity[]>(
      qk.portActivity.list(layTimeId),
      newData
    );
    
    setAdjustDialogOpen(false);
    setActivityToAdjust(null);
  };

  const cancelAdjust = () => {
    setAdjustDialogOpen(false);
    setActivityToAdjust(null);
  };

  const handleDeleteEvent = (index: number) => {
    if (!layTimeId || !data) return;
    
    const activity = data[index];
    setActivityToDelete({ index, activity });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!layTimeId || !activityToDelete) return;
    
    deletePortActivityMutation.mutate({
      layTimeId,
      activityId: activityToDelete.index.toString(),
    });
    
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const handleCloneEvent = (index: number) => {
    if (!layTimeId || !data) return;
    
    const activityToClone = data[index];
    const insertIndex = index;
    
    let newFromDateTime: Date;
    
    if (index === 0) {
      const originalFromTime = new Date(activityToClone.fromDateTime);
      newFromDateTime = new Date(originalFromTime.getTime() - activityToClone.duration * 60 * 60 * 1000);
    } else {
      const previousActivity = data[index - 1];
      newFromDateTime = new Date(previousActivity.toDateTime);
    }
    
    const duration = activityToClone.duration;
    const newToDateTime = new Date(newFromDateTime.getTime() + duration * 60 * 60 * 1000);
    
    const clonedActivity: PortActivity = {
      ...activityToClone,
      day: newFromDateTime.toISOString(),
      fromDateTime: newFromDateTime,
      toDateTime: newToDateTime,
      remarks: `${activityToClone.remarks} (Copy)`,
    };

    clonePortActivityMutation.mutate({
      layTimeId,
      activity: clonedActivity,
      insertIndex,
    });
  };

  const handleAddEvent = (existingData: PortActivity[]) => {
    if (!layTimeId) return;

    let nextFromDateTime: Date;
    
    if (existingData.length === 0) {
      nextFromDateTime = faker.date.recent();
    } else {
      const lastActivity = existingData[existingData.length - 1];
      nextFromDateTime = new Date(lastActivity.toDateTime);
    }

    const duration = faker.number.int({ min: 1, max: 24 });
    const toDateTime = new Date(nextFromDateTime.getTime());

    const newActivity: PortActivity = {
      day: nextFromDateTime.toISOString(),
      activityType: faker.helpers.arrayElement([
        "Loading",
        "Unloading", 
        "Waiting",
        "Berthing",
        "Unberthing",
        "Inspection",
        "Bunkering",
        "Maintenance"
      ]),
      fromDateTime: nextFromDateTime,
      duration,
      percentage: faker.helpers.arrayElement([0, 50, 100]),
      toDateTime,
      remarks: faker.lorem.sentence(),
      deductions: faker.lorem.sentence(),
    };

    addPortActivityMutation.mutate({
      layTimeId,
      activity: newActivity,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading port activities</div>;
  }

  const isEmpty = !data || data.length === 0;

  return (
    <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2 text-gray-900 dark:text-gray-100">
          Port Activity
        </h1>
        <Button
          onClick={() => handleAddEvent(data || [])}
          disabled={addPortActivityMutation.isPending}
        >
          {addPortActivityMutation.isPending ? 'Adding...' : 'Add Event'}
        </Button>
      </div>
      <DataTable data={data || []} columns={getColumns(handleDeleteEvent, handleCloneEvent, handleUpdatePercentage, handleUpdateDateTime, handleUpdateActivityType, handleAdjustActivity, validationViolations)} validationViolations={validationViolations} />
      {isEmpty && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <div className="mb-2">📋</div>
          <div className="text-lg font-medium mb-1">No port activities found</div>
          <div className="text-sm">Click "Add Event" to create your first port activity</div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              {activityToDelete && (
                <>
                  Are you sure you want to delete this <strong>{activityToDelete.activity.activityType}</strong> activity 
                  from <strong>{new Date(activityToDelete.activity.fromDateTime).toLocaleDateString()}</strong>?
                  <br /><br />
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Confirmation Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Activity Timing</DialogTitle>
            <DialogDescription>
              {activityToAdjust && (
                <>
                  This will automatically adjust the timing of the <strong>{activityToAdjust.activity.activityType}</strong> activity 
                  from <strong>{new Date(activityToAdjust.activity.fromDateTime).toLocaleDateString()}</strong> to fix the sequential timing violation.
                  <br /><br />
                  The activity may be moved to a different position and its start time may be updated to maintain proper sequence.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelAdjust}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAdjust}
            >
              Adjust
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const columnHelper = createColumnHelper<PortActivity>();

const getColumns = (
  onDelete: (index: number) => void, 
  onClone: (index: number) => void,
  onUpdatePercentage: (index: number, percentage: number) => void,
  onUpdateDateTime: (index: number, field: 'fromDateTime' | 'toDateTime', dateTime: Date) => void,
  onUpdateActivityType: (index: number, activityType: string) => void,
  onAdjust: (index: number) => void,
  validationViolations: number[]
) => [
  columnHelper.accessor("day", {
    header: "Day",
    cell: (info) => {
      const dayValue = info.getValue();
      const date = new Date(dayValue);
      
      if (!isNaN(date.getTime())) {
        return (
          <span className="font-medium">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        );
      }
    },
  }),
  columnHelper.accessor("activityType", {
    header: "Activity Type",
    cell: (info) => {
      const activityType = info.getValue();
      const rowIndex = info.row.index;
      
      return (
        <select
          value={activityType}
          onChange={(e) => onUpdateActivityType(rowIndex, e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Loading">Loading</option>
          <option value="Unloading">Unloading</option>
          <option value="Waiting">Waiting</option>
          <option value="Berthing">Berthing</option>
          <option value="Unberthing">Unberthing</option>
          <option value="Inspection">Inspection</option>
          <option value="Bunkering">Bunkering</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      );
    },
  }),
  columnHelper.accessor("fromDateTime", {
    header: "From Date and Time",
    cell: (info) => {
      const dateValue = info.getValue();
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      const rowIndex = info.row.index;

      if (isNaN(date.getTime())) {
        return <span>Invalid Date</span>;
      }

      return (
        <DateTimePicker
          value={date}
          onChange={(newDate) => onUpdateDateTime(rowIndex, 'fromDateTime', newDate)}
        />
      );
    },
  }),
  columnHelper.accessor("toDateTime", {
    header: "To Date and Time",
    cell: (info) => {
      const dateValue = info.getValue();
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

      if (isNaN(date.getTime())) {
        return <span>Invalid Date</span>;
      }

      return (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div className="font-medium">
            {date.toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {date.toLocaleTimeString()}
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("duration", {
    header: "Duration",
    cell: (info) => {
      const row = info.row.original;
      const fromDateTime = row.fromDateTime instanceof Date ? row.fromDateTime : new Date(row.fromDateTime);
      const toDateTime = row.toDateTime instanceof Date ? row.toDateTime : new Date(row.toDateTime);
      
      if (isNaN(fromDateTime.getTime()) || isNaN(toDateTime.getTime())) {
        return <span className="text-gray-400">Invalid</span>;
      }
      
      const diffMs = new Date(toDateTime).getTime() - new Date(fromDateTime).getTime();      if (diffMs < 0) {
        return <span className="text-red-500">Invalid</span>;
      }
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(diffMinutes / (24 * 60));
      const hours = Math.floor((diffMinutes % (24 * 60)) / 60);
      const minutes = diffMinutes % 60;
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const formattedDuration = days > 0 ? `${days.toString().padStart(2, '0')}d ${formattedTime}` : formattedTime;
      
      return (
        <span className="font-mono text-sm">
          {formattedDuration}
        </span>
      );
    },
  }),
  columnHelper.accessor("percentage", {
    header: "%",
    cell: (info) => {
      const percentage = info.getValue();
      const rowIndex = info.row.index;
      
      if (percentage == null) {
        return <span className="text-gray-400">N/A</span>;
      }
      
      return (
        <div className="flex items-center gap-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <select
            value={percentage}
            onChange={(e) => onUpdatePercentage(rowIndex, parseInt(e.target.value))}
            className="text-sm font-medium border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[60px]"
          >
            <option value={0}>0%</option>
            <option value={50}>50%</option>
            <option value={100}>100%</option>
          </select>
        </div>
      );
    },
  }),
  columnHelper.accessor("remarks", {
    header: "Remarks",
    cell: (info) => {
      const remarks = info.getValue();
      return remarks ? (
        <span className="text-gray-700 dark:text-gray-300">{remarks}</span>
      ) : (
        <span className="text-gray-400 italic">No remarks</span>
      );
    },
  }),
  columnHelper.accessor("deductions", {
    header: "Deductions",
    cell: (info) => {
      const row = info.row.original;
      const fromDateTime = row.fromDateTime instanceof Date ? row.fromDateTime : new Date(row.fromDateTime);
      const toDateTime = row.toDateTime instanceof Date ? row.toDateTime : new Date(row.toDateTime);
      const percentage = row.percentage;
      
      if (isNaN(fromDateTime.getTime()) || isNaN(toDateTime.getTime()) || percentage == null) {
        return <span className="text-gray-400">Invalid</span>;
      }
      
      const totalDiffMs = toDateTime.getTime() - fromDateTime.getTime();
      
      if (totalDiffMs < 0) {
        return <span className="text-red-500">Invalid</span>;
      }
      
      const totalDiffMinutes = Math.floor(totalDiffMs / (1000 * 60));
      
      const deductionMinutes = Math.floor((percentage / 100) * totalDiffMinutes);
      
      const days = Math.floor(deductionMinutes / (24 * 60));
      const hours = Math.floor((deductionMinutes % (24 * 60)) / 60);
      const minutes = deductionMinutes % 60;
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const formattedDeduction = days > 0 ? `${days.toString().padStart(2, '0')}d ${formattedTime}` : formattedTime;
      
      return deductionMinutes > 0 ? (
        <span className="text-red-600 font-medium font-mono text-sm">
          {formattedDeduction}
        </span>
      ) : (
        <span className="text-gray-400 font-mono text-sm">00:00</span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const rowIndex = info.row.index;
      const hasViolation = validationViolations.includes(rowIndex);
      
      return (
                <div className="flex gap-1 flex-wrap">
          {hasViolation && (
            <Button
              onClick={() => onAdjust(rowIndex)}
              size="sm"
              variant="ghost"
              title="Adjust timing to fix sequence violation"
            >
              <MdAutoFixHigh className="h-4 w-4" />
            </Button>
          )}
          {rowIndex > 0 && (
            <Button
              onClick={() => onClone(rowIndex)}
              size="sm"
              variant="ghost"
              title="Clone activity"
            >
              <MdContentCopy className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => onDelete(rowIndex)}
            size="sm"
            variant="ghost"
            title="Delete activity"
          >
            <MdDelete className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  }),
];
