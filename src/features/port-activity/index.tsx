import { createColumnHelper } from "@tanstack/react-table";
import { useState, useMemo, useCallback, useRef, memo, useEffect } from "react";
import { MdDelete, MdContentCopy, MdAutoFixHigh } from "react-icons/md";
import { nanoid } from "nanoid";

import type { PortActivity } from "@/types";

import { DataTable } from "@/components/data-table";
import { DateTimePicker } from "@/components/date-time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAllPortActivities } from "@/queries/use-all-port-activities";

type PortActivityProps = {
  layTimeId?: string;
};

export function PortActivity({ layTimeId }: PortActivityProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{
    index: number;
    activity: PortActivity;
  } | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [activityToAdjust, setActivityToAdjust] = useState<{
    index: number;
    activity: PortActivity;
  } | null>(null);

  // Cache for storing activities per layTimeId
  const [activitiesCache, setActivitiesCache] = useState<
    Record<string, PortActivity[] | undefined>
  >({});

  // Validation violations cache per layTimeId
  const [validationCache, setValidationCache] = useState<
    Record<string, string[]>
  >({});

  const {
    data: serverData,
    isLoading,
    error,
  } = useAllPortActivities(layTimeId || "");

  // Get current activities from cache or use server data
  const localActivities = activitiesCache[layTimeId || ""] ?? serverData;

  // Helper function to update activities for current layTimeId
  const setLocalActivities = useCallback((activities: PortActivity[] | undefined) => {
    const currentLayTimeId = layTimeId || "";
    setActivitiesCache(prev => ({
      ...prev,
      [currentLayTimeId]: activities
    }));
  }, [layTimeId]);

  // Update server data in cache when it loads (only if we don't have cached data)
  useEffect(() => {
    if (isLoading || !layTimeId) return;
    
    const currentLayTimeId = layTimeId;
    const hasCachedData = activitiesCache[currentLayTimeId] !== undefined;
    
    if (!hasCachedData && serverData) {
      setActivitiesCache(prev => ({
        ...prev,
        [currentLayTimeId]: serverData
      }));
    }
  }, [isLoading, serverData, layTimeId, activitiesCache]);

  // Validation functions - must be defined before handleUpdateDateTime
  const validateSequentialTiming = (
    activities: PortActivity[],
    itemsToValidate: PortActivity[]
  ) => {
    const violations: string[] = [];

    if (activities.length === 1) return violations;

    itemsToValidate.forEach((itemToValidate) => {
      const index = activities.findIndex(
        (activity) => activity.id === itemToValidate.id
      );

      const isFirstRow = index === 0;
      const isLastRow = index === activities.length - 1;

      if (!isFirstRow && !isLastRow) {
        const prevActivity = activities[index - 1];
        const nextActivity = activities[index + 1];

        if (prevActivity.fromDateTime > itemToValidate.fromDateTime) {
          violations.push(itemToValidate.id);
        }

        if (nextActivity.fromDateTime < itemToValidate.fromDateTime) {
          violations.push(itemToValidate.id);
        }
      }

      if (isFirstRow) {
        if (itemToValidate.fromDateTime > activities[1].fromDateTime) {
          violations.push(itemToValidate.id);
        }
      }

      if (isLastRow) {
        if (
          itemToValidate.fromDateTime <
          activities[activities.length - 2].fromDateTime
        ) {
          violations.push(itemToValidate.id);
        }
      }
    });

    return violations;
  };

  // const validationViolations: number[] = [];
  const validationViolations = validationCache[layTimeId || ""] ?? [];

  // Helper function to update validation violations for current layTimeId
  const setValidationViolations = useCallback((
    updater: React.SetStateAction<string[]>
  ) => {
    const currentLayTimeId = layTimeId || "";
    setValidationCache(prev => {
      const currentViolations = prev[currentLayTimeId] ?? [];
      const newViolations = typeof updater === 'function' 
        ? updater(currentViolations) 
        : updater;
      
      return {
        ...prev,
        [currentLayTimeId]: newViolations
      };
    });
  }, [layTimeId]);

  const updateTimingChain = (data: PortActivity[] | undefined) => {
    if (!data || data.length === 0) return;

    const newActivities = [...data];

    for (let i = 0; i < newActivities.length; i++) {
      if (i < newActivities.length - 1) {
        // If next row exists, update current row's toDateTime with next row's fromDateTime
        const nextActivity = newActivities[i + 1];
        newActivities[i] = {
          ...newActivities[i],
          toDateTime: new Date(nextActivity.fromDateTime),
        };
      } else {
        // If this is the last row, match toDateTime with current row's fromDateTime
        newActivities[i] = {
          ...newActivities[i],
          toDateTime: new Date(newActivities[i].fromDateTime),
        };
      }
    }

    return newActivities;
  };

  // All hooks must be called before any conditional returns
  const handleUpdatePercentage = useCallback(
    (index: number, newPercentage: number) => {
      if (!localActivities) return;

      const newActivities = [...localActivities];
      newActivities[index] = {
        ...newActivities[index],
        percentage: newPercentage,
      };
      setLocalActivities(newActivities);
    },
    [localActivities]
  );

  const handleUpdateDateTime = useCallback(
    (
      index: number,
      field: "fromDateTime" | "toDateTime",
      newDateTime: Date
    ) => {
      if (!localActivities) return;

      const newActivities = [...localActivities];
      newActivities[index] = {
        ...newActivities[index],
        [field]: newDateTime,
        day:
          field === "fromDateTime"
            ? newDateTime.toISOString()
            : newActivities[index].day,
      };

      const updateActivities = updateTimingChain(newActivities);

      setLocalActivities(updateActivities);

      // Clear violations for all affected rows
      const affectedRowIds = [updateActivities![index].id];

      // If we updated a row's fromDateTime, the previous row's toDateTime was also updated
      if (
        field === "fromDateTime" &&
        index > 0 &&
        validationViolations.includes(updateActivities![index - 1]?.id)
      ) {
        affectedRowIds.push(updateActivities![index - 1].id);
      }

      if (
        field === "fromDateTime" &&
        // index > 0 &&
        validationViolations.includes(updateActivities![index + 1]?.id)
      ) {
        affectedRowIds.push(updateActivities![index + 1].id);
      }

      setValidationViolations((prev) =>
        prev.filter((id) => !affectedRowIds.includes(id))
      );

      // Validate all affected rows
      const rowsToValidate = affectedRowIds.map(
        (id) => updateActivities!.find((activity) => activity.id === id)!
      );

      setValidationViolations((prev) => {
        const violations = validateSequentialTiming(
          updateActivities!,
          rowsToValidate
        );
        return [...prev, ...violations];
      });
    },
    [localActivities]
  );

  const handleUpdateActivityType = useCallback(
    (index: number, newActivityType: string) => {
      if (!localActivities) return;

      const newActivities = [...localActivities];
      newActivities[index] = {
        ...newActivities[index],
        activityType: newActivityType,
      };
      setLocalActivities(newActivities);
    },
    [localActivities]
  );

  const handleUpdateRemarks = useCallback(
    (index: number, newRemarks: string) => {
      if (!localActivities) return;

      const newActivities = [...localActivities];
      newActivities[index] = { ...newActivities[index], remarks: newRemarks };
      setLocalActivities(newActivities);
    },
    [localActivities]
  );

  const handleAdjustActivity = useCallback(
    (index: number) => {
      if (!layTimeId || !localActivities) return;

      const activity = localActivities[index];
      setActivityToAdjust({ index, activity });
      setAdjustDialogOpen(true);
    },
    [layTimeId, localActivities]
  );

  const handleDeleteEvent = useCallback(
    (index: number) => {
      if (!layTimeId || !localActivities) return;

      const activity = localActivities[index];
      setActivityToDelete({ index, activity });
      setDeleteDialogOpen(true);
    },
    [layTimeId, localActivities]
  );

  const confirmDelete = useCallback(() => {
    if (!localActivities || !activityToDelete) return;

    const newActivities = [...localActivities];
    const deletedIndex = activityToDelete.index;
    newActivities.splice(deletedIndex, 1);

    const updateActivities = updateTimingChain(newActivities);

    // After deletion, we need to validate neighbors of where the deleted item was
    const affectedRowIds: string[] = [];
    const itemsToValidate: PortActivity[] = [];

    // If there are still activities after deletion
    if (updateActivities && updateActivities.length > 0) {
      // Add the item that is now at the deleted position (if exists)
      if (deletedIndex < updateActivities.length) {
        const itemAtDeletedPosition = updateActivities[deletedIndex];
        affectedRowIds.push(itemAtDeletedPosition.id);
        itemsToValidate.push(itemAtDeletedPosition);
      }

      // Add the item before the deleted position (if exists)
      if (deletedIndex > 0) {
        const itemBeforeDeleted = updateActivities[deletedIndex - 1];
        affectedRowIds.push(itemBeforeDeleted.id);
        itemsToValidate.push(itemBeforeDeleted);
      }
    }

    // Clear violations for all affected rows
    setValidationViolations((prev) =>
      prev.filter((id) => !affectedRowIds.includes(id))
    );

    // Validate all affected rows
    if (updateActivities && itemsToValidate.length > 0) {
      setValidationViolations((prev) => {
        const violations = validateSequentialTiming(
          updateActivities,
          itemsToValidate
        );
        return [...prev, ...violations];
      });
    }

    setLocalActivities(updateActivities);

    setDeleteDialogOpen(false);
    setActivityToDelete(null);
  }, [localActivities, activityToDelete]);

  const handleCloneEvent = useCallback(
    (index: number) => {
      if (!localActivities) return;

      const activityToClone = localActivities[index];
      const clonedActivity: PortActivity = {
        ...activityToClone,
        id: nanoid(),
        remarks: `${activityToClone.remarks || ""} (Copy)`,
      };

      const newActivities = [...localActivities];
      newActivities.splice(index, 0, clonedActivity);

      const updateActivities = updateTimingChain(newActivities);
      
      // Find the cloned activity's position and collect all affected items
      const clonedIndex = updateActivities!.findIndex(activity => activity.id === clonedActivity.id);
      const affectedRowIds: string[] = [clonedActivity.id];
      const itemsToValidate: PortActivity[] = [clonedActivity];


      // Add previous row if it exists
      if (clonedIndex > 0) {
        const prevActivity = updateActivities![clonedIndex];
        affectedRowIds.push(prevActivity.id);
        itemsToValidate.push(prevActivity);
      }

      // Add next row if it exists
      if (clonedIndex < updateActivities!.length - 1) {
        const nextActivity = updateActivities![clonedIndex + 1];
        affectedRowIds.push(nextActivity.id);
        itemsToValidate.push(nextActivity);
      }

      // Clear violations for all affected rows
      setValidationViolations((prev) =>
        prev.filter((id) => !affectedRowIds.includes(id))
      );

      // Validate all affected rows
      setValidationViolations((prev) => {
        const violations = validateSequentialTiming(
          updateActivities!,
          itemsToValidate
        );
        return [...prev, ...violations];
      });

      setLocalActivities(updateActivities);
    },
    [localActivities]
  );

  const confirmAdjust = () => {
    if (!localActivities || !activityToAdjust) return;

    const currentItem = localActivities.find(
      (activity) => activity.id === activityToAdjust.activity.id
    );

    // Find the current index of the activity to adjust
    const currentIndex = localActivities.findIndex(
      (activity) => activity.id === activityToAdjust.activity.id
    );

    if (currentIndex === -1) {
      setAdjustDialogOpen(false);
      setActivityToAdjust(null);
      return;
    }

    const newActivities = [...localActivities];

    // Remove the activity to adjust
    newActivities.splice(currentIndex, 1);

    // Find the correct position to insert the activity based on its fromDateTime
    const activityFromTime = new Date(currentItem!.fromDateTime).getTime();
    let insertIndex = 0;

    for (let i = 0; i < newActivities.length; i++) {
      const otherActivity = newActivities[i];
      const otherFromTime = new Date(otherActivity.fromDateTime).getTime();

      if (activityFromTime < otherFromTime) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    // Insert the activity at the correct position
    newActivities.splice(insertIndex, 0, currentItem!);

    // Sort rows that are not in validation violations
    const validRows: PortActivity[] = [];
    const violatedRows: { activity: PortActivity; originalIndex: number }[] = [];
    
    newActivities.forEach((activity, index) => {
      if (validationViolations.includes(activity.id)) {
        violatedRows.push({ activity, originalIndex: index });
      } else {
        validRows.push(activity);
      }
    });

    // Sort valid rows by fromDateTime
    validRows.sort((a, b) => {
      const timeA = new Date(a.fromDateTime).getTime();
      const timeB = new Date(b.fromDateTime).getTime();
      return timeA - timeB;
    });

    // Rebuild the array: place valid rows in sorted order, keep violated rows in their positions
    const sortedActivities: PortActivity[] = [];
    let validRowIndex = 0;
    
    for (let i = 0; i < newActivities.length; i++) {
      const violatedRow = violatedRows.find(vr => vr.originalIndex === i);
      if (violatedRow) {
        sortedActivities.push(violatedRow.activity);
      } else {
        sortedActivities.push(validRows[validRowIndex]);
        validRowIndex++;
      }
    }

    const updateActivities = updateTimingChain(sortedActivities);

    // Find the new position of the adjusted item and collect all affected items
    const newIndex = updateActivities!.findIndex(activity => activity.id === currentItem!.id);
    const affectedRowIds: string[] = [currentItem!.id];
    const itemsToValidate: PortActivity[] = [currentItem!];

    // Add previous row if it exists
    if (newIndex > 0) {
      const prevActivity = updateActivities![newIndex - 1];
      affectedRowIds.push(prevActivity.id);
      itemsToValidate.push(prevActivity);
    }

    // Add next row if it exists
    if (newIndex < updateActivities!.length - 1) {
      const nextActivity = updateActivities![newIndex + 1];
      affectedRowIds.push(nextActivity.id);
      itemsToValidate.push(nextActivity);
    }

    // Clear violations for all affected rows
    setValidationViolations((prev) =>
      prev.filter((id) => !affectedRowIds.includes(id))
    );

    // Validate all affected rows
    setValidationViolations((prev) => {
      const violations = validateSequentialTiming(
        updateActivities!,
        itemsToValidate
      );
      return [...prev, ...violations];
    });

    setLocalActivities(updateActivities);
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

    let fromDateTime: Date;

    if (existingData.length === 0) {
      // Start with current time for the first activity
      fromDateTime = new Date();
    } else {
      const lastActivity = existingData[existingData.length - 1];
      fromDateTime = new Date(lastActivity.toDateTime);
    }

    // toDateTime should match fromDateTime (zero duration initially)
    const toDateTime = new Date(fromDateTime.getTime());

    const newActivity: PortActivity = {
      id: nanoid(),
      day: fromDateTime.toISOString(),
      activityType: "Unknown",
      fromDateTime,
      duration: 0,
      percentage: 100,
      toDateTime,
      remarks: "",
      deductions: "",
    };

    const newActivities = [...existingData, newActivity];
    setLocalActivities(newActivities);
  };

  // Always call useMemo before any conditional returns
  const columns = useMemo(
    () =>
      createColumns(
        handleDeleteEvent,
        handleCloneEvent,
        handleUpdatePercentage,
        handleUpdateDateTime,
        handleUpdateActivityType,
        handleUpdateRemarks,
        handleAdjustActivity,
        validationViolations
      ),
    [
      handleDeleteEvent,
      handleCloneEvent,
      handleUpdatePercentage,
      handleUpdateDateTime,
      handleUpdateActivityType,
      handleUpdateRemarks,
      handleAdjustActivity,
      validationViolations,
    ]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading port activities</div>;
  }

  const isEmpty = !localActivities || localActivities.length === 0;

  if (!layTimeId) {
    return (
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2 text-gray-900 dark:text-gray-100">
            Port Activity
          </h1>
          <Button disabled>Add Event</Button>
        </div>
        <DataTable data={[] as PortActivity[]} columns={columns} />
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          Select a lay time row to view port activities
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2 text-gray-900 dark:text-gray-100">
          Port Activity
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => handleAddEvent(localActivities || [])}
            disabled={false}
          >
            Add Event
          </Button>
        </div>
      </div>
      <DataTable
        data={localActivities || []}
        columns={columns}
        validationViolations={validationViolations}
      />
      {isEmpty && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <div className="mb-2">📋</div>
          <div className="text-lg font-medium mb-1">
            No port activities found
          </div>
          <div className="text-sm">
            Click "Add Event" to create your first port activity
          </div>
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
                  Are you sure you want to delete this{" "}
                  <strong>{activityToDelete.activity.activityType}</strong>{" "}
                  activity from{" "}
                  <strong>
                    {new Date(
                      activityToDelete.activity.fromDateTime
                    ).toLocaleDateString()}
                  </strong>
                  ?
                  <br />
                  <br />
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
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
                  This will automatically adjust the timing of the{" "}
                  <strong>{activityToAdjust.activity.activityType}</strong>{" "}
                  activity from{" "}
                  <strong>
                    {new Date(
                      activityToAdjust.activity.fromDateTime
                    ).toLocaleDateString()}
                  </strong>{" "}
                  to fix the sequential timing violation.
                  <br />
                  <br />
                  The activity may be moved to a different position and its
                  start time may be updated to maintain proper sequence.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelAdjust}>
              Cancel
            </Button>
            <Button onClick={confirmAdjust}>Adjust</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const columnHelper = createColumnHelper<PortActivity>();

// Memoized input component with its own local state to prevent re-renders
const RemarksInput = memo(
  ({
    initialValue,
    onUpdate,
    placeholder = "Add remarks...",
    rowIndex,
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
  }
);

const createColumns = (
  onDelete: (index: number) => void,
  onClone: (index: number) => void,
  onUpdatePercentage: (index: number, percentage: number) => void,
  onUpdateDateTime: (
    index: number,
    field: "fromDateTime" | "toDateTime",
    dateTime: Date
  ) => void,
  onUpdateActivityType: (index: number, activityType: string) => void,
  onUpdateRemarks: (index: number, remarks: string) => void,
  onAdjust: (index: number) => void,
  validationViolations: string[]
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
          onChange={(newDate) =>
            onUpdateDateTime(rowIndex, "fromDateTime", newDate)
          }
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
          <div className="font-medium">{date.toLocaleDateString()}</div>
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
      const fromDateTime =
        row.fromDateTime instanceof Date
          ? row.fromDateTime
          : new Date(row.fromDateTime);
      const toDateTime =
        row.toDateTime instanceof Date
          ? row.toDateTime
          : new Date(row.toDateTime);

      if (isNaN(fromDateTime.getTime()) || isNaN(toDateTime.getTime())) {
        return <span className="text-gray-400">Invalid</span>;
      }

      const diffMs =
        new Date(toDateTime).getTime() - new Date(fromDateTime).getTime();
      if (diffMs < 0) {
        return <span className="text-red-500">Invalid</span>;
      }

      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(diffMinutes / (24 * 60));
      const hours = Math.floor((diffMinutes % (24 * 60)) / 60);
      const minutes = diffMinutes % 60;

      const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      const formattedDuration =
        days > 0
          ? `${days.toString().padStart(2, "0")}d ${formattedTime}`
          : formattedTime;

      return <span className="font-mono text-sm">{formattedDuration}</span>;
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
            onChange={(e) =>
              onUpdatePercentage(rowIndex, parseInt(e.target.value))
            }
            className="text-sm font-medium border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[80px]"
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
      const fromDateTime =
        row.fromDateTime instanceof Date
          ? row.fromDateTime
          : new Date(row.fromDateTime);
      const toDateTime =
        row.toDateTime instanceof Date
          ? row.toDateTime
          : new Date(row.toDateTime);
      const percentage = row.percentage;

      if (
        isNaN(fromDateTime.getTime()) ||
        isNaN(toDateTime.getTime()) ||
        percentage == null
      ) {
        return <span className="text-gray-400">Invalid</span>;
      }

      const totalDiffMs = toDateTime.getTime() - fromDateTime.getTime();

      if (totalDiffMs < 0) {
        return <span className="text-red-500">Invalid</span>;
      }

      const totalDiffMinutes = Math.floor(totalDiffMs / (1000 * 60));

      const deductionMinutes = Math.floor(
        (percentage / 100) * totalDiffMinutes
      );

      const days = Math.floor(deductionMinutes / (24 * 60));
      const hours = Math.floor((deductionMinutes % (24 * 60)) / 60);
      const minutes = deductionMinutes % 60;

      const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      const formattedDeduction =
        days > 0
          ? `${days.toString().padStart(2, "0")}d ${formattedTime}`
          : formattedTime;

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
    header: () => <div className="text-right">Actions</div>,
    cell: (info) => {
      const rowIndex = info.row.index;
      const rowId = info.row.original.id;
      const hasViolation = validationViolations.includes(rowId);

      return (
        <div className="flex gap-1 justify-end flex-wrap">
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
