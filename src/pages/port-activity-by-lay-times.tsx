import { useState } from "react";

import type { LayTime } from "@/types";

import { LayTimes } from "@/features/lay-times";
import { PortActivity } from "@/features/port-activity";

export default function PortActivityByLayTimes() {
  const [selectedLayTime, setSelectedLayTime] = useState<LayTime | null>(null);

  const handleLayTimeSelect = (layTime: LayTime) => {
    setSelectedLayTime(layTime);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <LayTimes
          onRowSelect={handleLayTimeSelect}
          selectedRowId={selectedLayTime?.id}
        />
      </div>
      <div>
        <PortActivity layTimeId={selectedLayTime?.id} />
      </div>
    </div>
  );
}
