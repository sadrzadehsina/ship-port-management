import { useState } from "react";

import type { LayTime } from "@/types";

import { LayTimes } from "@/features/lay-times";
import { PortActivity } from "@/features/port-activity";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PortActivityByLayTimes() {
  const [selectedLayTime, setSelectedLayTime] = useState<LayTime | null>(null);

  const handleLayTimeSelect = (layTime: LayTime) => {
    setSelectedLayTime(layTime);
  };

  return (
    <div className="flex flex-col gap-4 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header with Theme Toggle */}
      <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Ship Port Management
        </h1>
        <ThemeToggle />
      </header>
      
      <div className="px-4">
        <LayTimes
          onRowSelect={handleLayTimeSelect}
          selectedRowId={selectedLayTime?.id}
        />
      </div>
      <div className="px-4 pb-4">
        <PortActivity layTimeId={selectedLayTime?.id} />
      </div>
    </div>
  );
}
