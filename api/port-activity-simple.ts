import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple test version without faker
type PortActivity = {
  day: string;
  activityType: string;
  fromDateTime: Date;
  duration: number;
  percentage: number;
  toDateTime: Date;
  remarks: string;
  deductions: string;
};

const newPortActivity = (fromDateTime: Date, index: number): PortActivity => {
  const duration = (index + 1) * 2; // Simple duration calculation
  const toDateTime = new Date(fromDateTime.getTime() + duration * 60 * 60 * 1000);
  
  return {
    day: fromDateTime.toISOString(),
    activityType: ["Loading", "Unloading", "Waiting", "Berthing"][index % 4],
    fromDateTime,
    duration,
    percentage: [0, 50, 100][index % 3],
    toDateTime,
    remarks: `Remarks for activity ${index + 1}`,
    deductions: `Deductions for activity ${index + 1}`,
  };
};

function makeData(layTimeId: string = 'default'): PortActivity[] {
  const activities: PortActivity[] = [];
  let currentDateTime = new Date();
  
  for (let i = 0; i < 3; i++) {
    const activity = newPortActivity(currentDateTime, i);
    if (i === 0) {
      activity.toDateTime = currentDateTime;
      activity.duration = 0;
    }
    activities.push(activity);
    currentDateTime = activity.toDateTime;
  }
  
  return activities;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { layTimeId } = req.query;
    const layTimeIdString = Array.isArray(layTimeId) ? layTimeId[0] : layTimeId || 'default';
    
    if (req.method === 'GET') {
      const data = makeData(layTimeIdString);
      res.status(200).json(data);
    } else if (req.method === 'POST') {
      const newActivity = req.body;
      res.status(200).json({
        ...newActivity,
        remarks: newActivity.remarks || `Generated remarks`,
        deductions: newActivity.deductions || `Generated deductions`,
      });
    } else if (req.method === 'DELETE') {
      res.status(204).end();
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error in port-activity:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
