import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onCancel?: () => void;
}

export function DateTimePicker({ value, onChange, onCancel }: DateTimePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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

  const calculatePopupPosition = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    // Calculate absolute position including scroll
    const buttonTop = buttonRect.top + scrollY;
    const buttonBottom = buttonRect.bottom + scrollY;
    const buttonLeft = buttonRect.left + scrollX;
    
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const popupHeight = 150; // More accurate popup height
    
    let top: number;
    let placement: 'top' | 'bottom';
    
    // If there's not enough space below and more space above, show popup above
    if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
      top = buttonTop - popupHeight - 4; // 4px gap above
      placement = 'top';
    } else {
      top = buttonBottom + 4; // 4px gap below
      placement = 'bottom';
    }
    
    setPopupPosition({
      top,
      left: buttonLeft,
      placement
    });
  };

  // Close popup when clicking outside
  useEffect(() => {
    if (!showCalendar) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleCancel();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const handleToggleCalendar = () => {
    if (!showCalendar) {
      calculatePopupPosition();
    }
    setShowCalendar(!showCalendar);
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
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleCalendar}
        className="text-left hover:bg-gray-100 dark:hover:bg-gray-800 px-1 py-0.5 rounded text-sm"
        title="Click to edit date/time"
      >
        <div className="flex flex-col">
          <span className="font-medium">{value.toLocaleDateString()}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {value.toLocaleTimeString()}
          </span>
        </div>
      </button>

      {showCalendar && createPortal(
        <div 
          ref={popupRef}
          className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[250px]"
          style={{
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 9999
          }}
        >
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeInput(tempDate)}
              onChange={handleDateTimeChange}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
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
        </div>,
        document.body
      )}
    </>
  );
}
