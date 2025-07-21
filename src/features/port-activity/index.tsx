import { createColumnHelper } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useRef, memo, useEffect } from "react";
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
  const clonePortActivityMutation = useClonePortActivity();
  const updatePercentageMutation = useUpdatePortActivityPercentage();
  const updateDateTimeMutation = useUpdatePortActivityDateTime();
  const updateActivityTypeMutation = useUpdatePortActivityType();

  // Validation functions - must be defined before handleUpdateDateTime
  const validateSequentialTiming = useCallback((activities: PortActivity[]) => {
    const violations: number[] = [];
    
    for (let i = 1; i < activities.length; i++) {
      const currentActivity = activities[i];
      const previousActivity = activities[i - 1];
      
      const currentFromTime = new Date(currentActivity.fromDateTime).getTime();
      const previousToTime = new Date(previousActivity.toDateTime).getTime();
      
      // Allow for small time differences (1 minute tolerance)
      const timeDifference = Math.abs(currentFromTime - previousToTime);
      
      if (timeDifference > 60000) { // More than 1 minute difference
        violations.push(i);
      }
    }
    
    return violations;
  }, []);

  const validationViolations = useMemo(() => {
    return data ? validateSequentialTiming(data) : [];
  }, [data, validateSequentialTiming]);

  // All hooks must be called before any conditional returns
  const handleUpdatePercentage = useCallback((index: number, newPercentage: number) => {
    if (!layTimeId) return;
    
    updatePercentageMutation.mutate({
      layTimeId,
      activityIndex: index,
      percentage: newPercentage,
    });
  }, [layTimeId, updatePercentageMutation]);

  const handleUpdateDateTime = useCallback((index: number, field: 'fromDateTime' | 'toDateTime', newDateTime: Date) => {
    if (!layTimeId || !data) return;
    
    // If changing fromDateTime, check for auto-adjustment logic
    if (field === 'fromDateTime') {
      // Check if current row has violations - if so, skip auto-adjustment
      const hasViolation = validationViolations.includes(index);
      
      if (!hasViolation) {
        const previousActivity = index > 0 ? data[index - 1] : null;
        const nextActivity = index < data.length - 1 ? data[index + 1] : null;
        
        const newFromTime = newDateTime.getTime();
        const previousFromTime = previousActivity ? new Date(previousActivity.fromDateTime).getTime() : -Infinity;
        const nextFromTime = nextActivity ? new Date(nextActivity.fromDateTime).getTime() : Infinity;
        
        // Check if the new fromDateTime is within valid range
        if (newFromTime > previousFromTime && newFromTime < nextFromTime) {
          queryClient.setQueryData<PortActivity[]>(
            qk.portActivity.list(layTimeId),
            (oldData) => {
              if (!oldData) return oldData;
              const newData = [...oldData];
              
              // Update current activity's fromDateTime
              newData[index] = { ...newData[index], fromDateTime: newDateTime };
              
              // Update previous activity's toDateTime to maintain chain
              if (previousActivity) {
                newData[index - 1] = { ...newData[index - 1], toDateTime: newDateTime };
              }
              
              // If this is the last row, update its toDateTime to match fromDateTime
              if (!nextActivity) {
                newData[index] = { ...newData[index], toDateTime: newDateTime };
              }
              
              return newData;
            }
          );
          return; // Skip the normal mutation since we handled it locally
        }
      }
      // If has violations or not in valid range, let the normal mutation proceed - validation will catch it
    }
    
    // Normal update for toDateTime or invalid fromDateTime changes
    updateDateTimeMutation.mutate({
      layTimeId,
      activityIndex: index,
      field,
      dateTime: newDateTime,
    });
  }, [layTimeId, data, queryClient, updateDateTimeMutation, validationViolations]);

  const handleUpdateActivityType = useCallback((index: number, newActivityType: string) => {
    if (!layTimeId) return;
    
    updateActivityTypeMutation.mutate({
      layTimeId,
      activityIndex: index,
      activityType: newActivityType,
    });
  }, [layTimeId, updateActivityTypeMutation]);

  const handleUpdateRemarks = useCallback((index: number, newRemarks: string) => {
    if (!layTimeId) return;
    
    // Update cache directly
    queryClient.setQueryData<PortActivity[]>(
      qk.portActivity.list(layTimeId),
      (oldData) => {
        if (!oldData) return oldData;
        const newData = [...oldData];
        if (newData[index]) {
          newData[index] = { ...newData[index], remarks: newRemarks };
        }
        return newData;
      }
    );
  }, [layTimeId, queryClient]);

  const handleAdjustActivity = useCallback((index: number) => {
    if (!layTimeId || !data) return;
    
    const activity = data[index];
    setActivityToAdjust({ index, activity });
    setAdjustDialogOpen(true);
  }, [layTimeId, data]);

  const handleDeleteEvent = useCallback((index: number) => {
    if (!layTimeId || !data) return;
    
    const activity = data[index];
    setActivityToDelete({ index, activity });
    setDeleteDialogOpen(true);
  }, [layTimeId, data]);

  const confirmDelete = useCallback(() => {
    if (!layTimeId || !activityToDelete || !data) return;
    
    const deleteIndex = activityToDelete.index;
    const newData = [...data];
    
    // Store references before deletion
    const previousActivity = deleteIndex > 0 ? newData[deleteIndex - 1] : null;
    const nextActivity = deleteIndex < newData.length - 1 ? newData[deleteIndex + 1] : null;
    
    // Check for violations BEFORE deletion to see if activities were already problematic
    const originalViolations = validateSequentialTiming(data);
    const previousHadViolation = previousActivity ? originalViolations.includes(deleteIndex - 1) : false;
    const nextHadViolation = nextActivity ? originalViolations.includes(deleteIndex + 1) : false;
    
    // Remove the activity
    newData.splice(deleteIndex, 1);
    
    // Auto-adjust timing chain - connect previous and next activities
    if (previousActivity && nextActivity) {
      // Find the new indices of the previous and next activities after deletion
      const previousActivityNewIndex = deleteIndex - 1; // Previous activity index stays the same
      const nextActivityNewIndex = deleteIndex; // Next activity moves to deleted activity's position
      
      // Get the actual activities from the newData array
      const updatedPreviousActivity = newData[previousActivityNewIndex];
      const updatedNextActivity = newData[nextActivityNewIndex];
      
      if (updatedPreviousActivity && updatedNextActivity) {
        // Only auto-adjust if neither activity had violations BEFORE deletion
        // This way we don't auto-adjust activities that the user has already flagged as needing attention
        if (!previousHadViolation && !nextHadViolation) {
          // Connect previous activity's toDateTime to next activity's fromDateTime
          updatedPreviousActivity.toDateTime = new Date(updatedNextActivity.fromDateTime);
        }
      }
    }
    
    // Update the cache with the adjusted data
    queryClient.setQueryData<PortActivity[]>(
      qk.portActivity.list(layTimeId),
      newData
    );
    
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  }, [layTimeId, activityToDelete, data, queryClient, validateSequentialTiming]);

  const handleCloneEvent = useCallback((index: number) => {
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
      remarks: `${activityToClone.remarks || ""} (Copy)`,
    };

    clonePortActivityMutation.mutate({
      layTimeId,
      activity: clonedActivity,
      insertIndex,
    });
  }, [layTimeId, data, clonePortActivityMutation]);

  // Always call useMemo before any conditional returns
  const columns = useMemo(() => createColumns(
    handleDeleteEvent, 
    handleCloneEvent, 
    handleUpdatePercentage, 
    handleUpdateDateTime, 
    handleUpdateActivityType, 
    handleUpdateRemarks, 
    handleAdjustActivity, 
    validationViolations
  ), [
    handleDeleteEvent,
    handleCloneEvent, 
    handleUpdatePercentage, 
    handleUpdateDateTime, 
    handleUpdateActivityType, 
    handleUpdateRemarks, 
    handleAdjustActivity, 
    validationViolations
  ]);
  
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
        <DataTable data={[] as PortActivity[]} columns={columns} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          Select a lay time row to view port activities
        </div>
      </div>
    );
  }

  const confirmAdjust = () => {
    if (!layTimeId || !data || !activityToAdjust) return;
    
    // Find the current index of the activity to adjust (in case indices have changed due to deletions)
    const currentIndex = data.findIndex(activity => 
      activity.fromDateTime === activityToAdjust.activity.fromDateTime &&
      activity.activityType === activityToAdjust.activity.activityType &&
      activity.remarks === activityToAdjust.activity.remarks
    );
    
    if (currentIndex === -1) {
      // Activity not found, might have been deleted
      setAdjustDialogOpen(false);
      setActivityToAdjust(null);
      return;
    }
    
    const currentActivity = data[currentIndex];
    const currentFromTime = new Date(currentActivity.fromDateTime).getTime();
    
    const newData = [...data];
    
    // Check for violations BEFORE adjustment to avoid affecting rows that already have issues
    const originalViolations = validateSequentialTiming(data);
    
    const [activityToMove] = newData.splice(currentIndex, 1);
    
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
    
    // Only adjust the previous activity's toDateTime if it doesn't have a violation
    if (insertIndex > 0) {
      const previousActivity = newData[insertIndex - 1];
      const previousActivityOriginalIndex = insertIndex - 1;
      
      // Check if the previous activity had a violation in the original data
      const previousHadViolation = originalViolations.includes(previousActivityOriginalIndex);
      
      // Only auto-adjust if the previous activity didn't have a violation
      if (!previousHadViolation) {
        previousActivity.toDateTime = new Date(adjustedActivity.fromDateTime);
      }
    }
    
    // Adjust the moved activity's toDateTime based on the next activity
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
    
    // Forward chaining: Update toDateTime of each activity to match the next activity's fromDateTime
    // This ensures proper timing chain flow after adjustment, but respects violation boundaries
    for (let i = 0; i < newData.length - 1; i++) {
      const currentActivity = newData[i];
      const nextActivity = newData[i + 1];
      
      if (currentActivity && nextActivity) {
        // Check if either activity had violations in the original data
        // We need to map back to original indices to check violations properly
        const currentHadViolation = originalViolations.some(violationIndex => {
          // Find if this activity existed in the original data and had a violation
          const originalActivity = data.find(origActivity => 
            origActivity.fromDateTime === currentActivity.fromDateTime &&
            origActivity.activityType === currentActivity.activityType &&
            origActivity.remarks === currentActivity.remarks
          );
          return originalActivity && data.indexOf(originalActivity) === violationIndex;
        });
        
        const nextHadViolation = originalViolations.some(violationIndex => {
          const originalActivity = data.find(origActivity => 
            origActivity.fromDateTime === nextActivity.fromDateTime &&
            origActivity.activityType === nextActivity.activityType &&
            origActivity.remarks === nextActivity.remarks
          );
          return originalActivity && data.indexOf(originalActivity) === violationIndex;
        });
        
        // Only auto-adjust if neither activity had violations originally
        if (!currentHadViolation && !nextHadViolation) {
          // Update current activity's toDateTime to match next activity's fromDateTime
          currentActivity.toDateTime = new Date(nextActivity.fromDateTime);
        }
      }
    }
    
    // Handle the last activity - it should have zero duration or maintain its original toDateTime
    const lastActivity = newData[newData.length - 1];
    if (lastActivity) {
      // Keep the last activity's toDateTime as is, or make it zero duration if needed
      // This preserves the original behavior for the final activity
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

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  };

  const handleAddEvent = (existingData: PortActivity[]) => {
    if (!layTimeId) return;

    let nextFromDateTime: Date;
    
    if (existingData.length === 0) {
      // Start with a recent date for the first activity
      nextFromDateTime = new Date();
    } else {
      const lastActivity = existingData[existingData.length - 1];
      nextFromDateTime = new Date(lastActivity.toDateTime);
    }

    // toDateTime should match fromDateTime exactly (no gap)
    const toDateTime = new Date(nextFromDateTime.getTime());

    const newActivity: PortActivity = {
      day: nextFromDateTime.toISOString(),
      activityType: "Unknown", // Default to Unknown
      fromDateTime: nextFromDateTime,
      duration: 0, // Duration is 0 since toDateTime equals fromDateTime
      percentage: 0, // Default to 0%
      toDateTime,
      remarks: "", // Empty remarks by default
      deductions: "", // Empty deductions by default
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
      <DataTable data={data || []} columns={columns} validationViolations={validationViolations} />
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

// Memoized input component with its own local state to prevent re-renders
const RemarksInput = memo(({ 
  initialValue, 
  onUpdate, 
  placeholder = "Add remarks...",
  rowIndex
}: {
  initialValue: string;
  onUpdate: (index: number, value: string) => void;
  placeholder?: string;
  rowIndex: number;
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when initial value changes (e.g., from server)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleChange = (value: string) => {
    setLocalValue(value);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the update
    timeoutRef.current = setTimeout(() => {
      onUpdate(rowIndex, value);
    }, 300);
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
});

const createColumns = (
  onDelete: (index: number) => void, 
  onClone: (index: number) => void,
  onUpdatePercentage: (index: number, percentage: number) => void,
  onUpdateDateTime: (index: number, field: 'fromDateTime' | 'toDateTime', dateTime: Date) => void,
  onUpdateActivityType: (index: number, activityType: string) => void,
  onUpdateRemarks: (index: number, remarks: string) => void,
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
          <option value="Unknown">Unknown</option>
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
      const rowIndex = info.row.index;
      
      return (
        <RemarksInput
          initialValue={remarks || ""}
          onUpdate={onUpdateRemarks}
          rowIndex={rowIndex}
          placeholder="Add remarks..."
        />
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
