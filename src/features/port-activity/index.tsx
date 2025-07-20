import { faker } from "@faker-js/faker";
import { createColumnHelper } from "@tanstack/react-table";

import type { PortActivity } from "@/types";

import { DataTable } from "@/components/data-table";
import { DateTimePicker } from "@/components/date-time-picker";
import { useAddPortActivity } from "@/queries/use-add-port-activity";
import { useAllPortActivities } from "@/queries/use-all-port-activities";
import { useClonePortActivity } from "@/queries/use-clone-port-activity";
import { useDeletePortActivity } from "@/queries/use-delete-port-activity";
import { useAdjustPortActivity } from "@/queries/use-adjust-port-activity";
import { useUpdatePortActivityType } from "@/queries/use-update-port-activity-type";
import { useUpdatePortActivityDateTime } from "@/queries/use-update-port-activity-datetime";
import { useUpdatePortActivityPercentage } from "@/queries/use-update-port-activity-percentage";

type PortActivityProps = {
  layTimeId?: string;
};

export function PortActivity({ layTimeId }: PortActivityProps) {
  // Show empty table with headers when no layTimeId is selected
  if (!layTimeId) {
    return (
      <div className="flex flex-col gap-2 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2">
            Port Activity
          </h1>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled
          >
            Add Event
          </button>
        </div>
        <DataTable data={[] as PortActivity[]} columns={getColumns(() => {}, () => {}, () => {}, () => {}, () => {}, () => {}, [])} />
        <div className="text-center text-gray-500 py-4">
          Select a lay time row to view port activities
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useAllPortActivities(layTimeId);
  const addPortActivityMutation = useAddPortActivity();
  const deletePortActivityMutation = useDeletePortActivity();
  const clonePortActivityMutation = useClonePortActivity();
  const updatePercentageMutation = useUpdatePortActivityPercentage();
  const updateDateTimeMutation = useUpdatePortActivityDateTime();
  const updateActivityTypeMutation = useUpdatePortActivityType();
  const adjustPortActivityMutation = useAdjustPortActivity();

  // Function to validate sequential timing
  const validateSequentialTiming = (activities: PortActivity[]) => {
    const violations: number[] = [];
    
    for (let i = 1; i < activities.length; i++) {
      const currentActivity = activities[i];
      const previousActivity = activities[i - 1];
      
      const currentFromTime = new Date(currentActivity.fromDateTime).getTime();
      const previousToTime = new Date(previousActivity.toDateTime).getTime();
      
      // Check if current row's fromDateTime doesn't match previous row's toDateTime
      if (Math.abs(currentFromTime - previousToTime) > 60000) { // 1 minute tolerance
        violations.push(i);
      }
    }
    
    return violations;
  };

  // Get validation violations
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
    
    const currentActivity = data[index];
    
    if (index === 0) return; // Can't adjust first row
    
    // Find the last row that meets the sequential rule
    let lastValidIndex = -1;
    
    // Check from the beginning to find the last valid row before the violation
    for (let i = 0; i < index; i++) {
      if (i === 0) {
        // First row is always valid as a starting point
        lastValidIndex = 0;
      } else {
        const currentRow = data[i];
        const previousRow = data[i - 1];
        
        const currentFromTime = new Date(currentRow.fromDateTime).getTime();
        const previousToTime = new Date(previousRow.toDateTime).getTime();
        
        // Check if this row follows the sequential rule (1 minute tolerance)
        if (Math.abs(currentFromTime - previousToTime) <= 60000) {
          lastValidIndex = i;
        } else {
          // This row also violates the rule, so the last valid row is the previous one
          break;
        }
      }
    }
    
    // Calculate the correct fromDateTime based on the last valid row
    let correctFromDateTime: Date;
    
    if (lastValidIndex === -1) {
      // No valid rows found, shouldn't happen but fallback to first row's end time
      correctFromDateTime = new Date(data[0].toDateTime);
    } else {
      correctFromDateTime = new Date(data[lastValidIndex].toDateTime);
    }
    
    // Preserve the original duration of the current activity
    const originalDuration = new Date(currentActivity.toDateTime).getTime() - new Date(currentActivity.fromDateTime).getTime();
    const correctToDateTime = new Date(correctFromDateTime.getTime() + originalDuration);
    
    const adjustedActivity: PortActivity = {
      ...currentActivity,
      fromDateTime: correctFromDateTime,
      toDateTime: correctToDateTime,
      day: correctFromDateTime.toISOString(),
    };
    
    adjustPortActivityMutation.mutate({
      layTimeId,
      activityIndex: index,
      adjustedActivity,
    });
  };

  const handleDeleteEvent = (index: number) => {
    if (!layTimeId) return;
    
    deletePortActivityMutation.mutate({
      layTimeId,
      activityId: index.toString(),
    });
  };

  const handleCloneEvent = (index: number) => {
    if (!layTimeId || !data) return;
    
    const activityToClone = data[index];
    const insertIndex = index; // Insert at the same position (above the original)
    
    // Calculate the new fromDateTime based on sequential timing
    let newFromDateTime: Date;
    
    if (index === 0) {
      // If cloning the first item, start with a time before it
      const originalFromTime = new Date(activityToClone.fromDateTime);
      newFromDateTime = new Date(originalFromTime.getTime() - activityToClone.duration * 60 * 60 * 1000);
    } else {
      // If cloning any other item, start from the previous item's toDateTime
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

    // Calculate the next fromDateTime based on the last activity's toDateTime
    let nextFromDateTime: Date;
    
    if (existingData.length === 0) {
      // If no existing data, start with a recent date
      nextFromDateTime = faker.date.recent();
    } else {
      // Start from the last activity's toDateTime
      const lastActivity = existingData[existingData.length - 1];
      nextFromDateTime = new Date(lastActivity.toDateTime);
    }

    const duration = faker.number.int({ min: 1, max: 24 }); // duration in hours
    const toDateTime = new Date(nextFromDateTime.getTime() + duration * 60 * 60 * 1000);

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
      percentage: faker.helpers.arrayElement([0, 50, 100]), // Only 0, 50, or 100
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
    <div className="flex flex-col gap-2 bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h1 className="text-md font-bold border-l-4 border-l-blue-400 pl-2">
          Port Activity
        </h1>
        <button
          onClick={() => handleAddEvent(data || [])}
          disabled={addPortActivityMutation.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addPortActivityMutation.isPending ? 'Adding...' : 'Add Event'}
        </button>
      </div>
      <DataTable data={data} columns={getColumns(handleDeleteEvent, handleCloneEvent, handleUpdatePercentage, handleUpdateDateTime, handleUpdateActivityType, handleAdjustActivity, validationViolations)} validationViolations={validationViolations} />
      {isEmpty && (
        <div className="text-center text-gray-500 py-8">
          <div className="mb-2">📋</div>
          <div className="text-lg font-medium mb-1">No port activities found</div>
          <div className="text-sm">Click "Add Event" to create your first port activity</div>
        </div>
      )}
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
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    header: "From",
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
    header: "To",
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
          onChange={(newDate) => onUpdateDateTime(rowIndex, 'toDateTime', newDate)}
        />
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
      
      // Calculate the difference in milliseconds
      const diffMs = toDateTime.getTime() - fromDateTime.getTime();
      
      if (diffMs < 0) {
        return <span className="text-red-500">Invalid</span>;
      }
      
      // Convert to days, hours, and minutes
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(diffMinutes / (24 * 60));
      const hours = Math.floor((diffMinutes % (24 * 60)) / 60);
      const minutes = diffMinutes % 60;
      
      // Format as "01d 07:30" or "07:30" if no days
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <select
            value={percentage}
            onChange={(e) => onUpdatePercentage(rowIndex, parseInt(e.target.value))}
            className="text-sm font-medium border rounded px-1 py-0.5 bg-white min-w-[60px]"
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
        <span className="text-gray-700">{remarks}</span>
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
      
      // Calculate the total duration in minutes
      const totalDiffMs = toDateTime.getTime() - fromDateTime.getTime();
      
      if (totalDiffMs < 0) {
        return <span className="text-red-500">Invalid</span>;
      }
      
      const totalDiffMinutes = Math.floor(totalDiffMs / (1000 * 60));
      
      // Calculate deduction time: percentage * total duration
      const deductionMinutes = Math.floor((percentage / 100) * totalDiffMinutes);
      
      // Convert to days, hours, and minutes
      const days = Math.floor(deductionMinutes / (24 * 60));
      const hours = Math.floor((deductionMinutes % (24 * 60)) / 60);
      const minutes = deductionMinutes % 60;
      
      // Format as "01d 07:30" or "07:30" if no days
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
          {hasViolation && rowIndex > 0 && (
            <button
              onClick={() => onAdjust(rowIndex)}
              className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50"
              title="Adjust timing to fix sequence violation"
            >
              Adjust
            </button>
          )}
          {rowIndex > 0 && (
            <button
              onClick={() => onClone(rowIndex)}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
              title="Clone activity"
            >
              Clone
            </button>
          )}
          <button
            onClick={() => onDelete(rowIndex)}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
            title="Delete activity"
          >
            Delete
          </button>
        </div>
      );
    },
  }),
];
