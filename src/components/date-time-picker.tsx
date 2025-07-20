import { useState } from "react";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onCancel?: () => void;
}

export function DateTimePicker({ value, onChange, onCancel }: DateTimePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatDateTimeInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setTempDate(newDate);
  };

  const handleSave = () => {
    onChange(tempDate);
    setShowCalendar(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setShowCalendar(false);
    onCancel?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="text-left hover:bg-gray-100 px-1 py-0.5 rounded text-sm"
        title="Click to edit date/time"
      >
        <div className="flex flex-col">
          <span className="font-medium">{value.toLocaleDateString()}</span>
          <span className="text-sm text-gray-500">
            {value.toLocaleTimeString()}
          </span>
        </div>
      </button>

      {showCalendar && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 min-w-[250px]">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeInput(tempDate)}
              onChange={handleDateTimeChange}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
