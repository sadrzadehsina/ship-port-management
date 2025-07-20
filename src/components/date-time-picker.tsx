import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onCancel?: () => void;
}

export function DateTimePicker({ value, onChange, onCancel }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(value);
  const [timeValue, setTimeValue] = useState({
    hours: value.getHours().toString().padStart(2, '0'),
    minutes: value.getMinutes().toString().padStart(2, '0')
  });

  const formatDateTimeDisplay = (date: Date) => {
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    return { dateStr, timeStr };
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = field === 'hours' 
      ? Math.max(0, Math.min(23, numValue))
      : Math.max(0, Math.min(59, numValue));
    
    setTimeValue(prev => ({
      ...prev,
      [field]: clampedValue.toString().padStart(2, '0')
    }));
  };

  const handleSave = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(parseInt(timeValue.hours), parseInt(timeValue.minutes));
    onChange(newDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(value);
    setTimeValue({
      hours: value.getHours().toString().padStart(2, '0'),
      minutes: value.getMinutes().toString().padStart(2, '0')
    });
    setIsOpen(false);
    onCancel?.();
  };

  const { dateStr, timeStr } = formatDateTimeDisplay(value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-left hover:bg-accent hover:text-accent-foreground px-1 py-0.5 rounded text-sm transition-colors"
          title="Click to edit date/time"
        >
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{dateStr}</span>
            <span className="text-sm text-muted-foreground">
              {timeStr}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Select Date</h4>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Select Time</h4>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={timeValue.hours}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="w-12 px-2 py-1 text-center border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-foreground">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timeValue.minutes}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="w-12 px-2 py-1 text-center border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
