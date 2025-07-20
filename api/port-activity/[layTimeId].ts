import { faker } from '@faker-js/faker';

// Copy of PortActivity type (simplified for API use)
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

// Exact copy from get-port-activity.ts
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Exact copy from get-port-activity.ts
const newPortActivity = (fromDateTime: Date, layTimeId: string, index: number): PortActivity => {
  // Create a unique seed for this specific activity based on layTimeId and index
  const seed = hashCode(layTimeId) + index;
  faker.seed(seed);
  
  const duration = faker.number.int({ min: 1, max: 24 }); // duration in hours
  const toDateTime = new Date(fromDateTime.getTime() + duration * 60 * 60 * 1000);
  
  return {
    day: fromDateTime.toISOString(),
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
    fromDateTime,
    duration,
    percentage: faker.helpers.arrayElement([0, 50, 100]), // Only 0, 50, or 100
    toDateTime,
    remarks: faker.lorem.sentence(),
    deductions: faker.lorem.sentence(),
  };
};

// Exact copy from get-port-activity.ts
function makeData(layTimeId: string = 'default'): PortActivity[] {
  // Set initial seed based on layTimeId for the starting date
  const baseSeed = hashCode(layTimeId);
  faker.seed(baseSeed);
  
  // Generate a random length for this specific layTimeId (between 2 and 10 activities)
  const length = faker.number.int({ min: 2, max: 10 });
  
  const activities: PortActivity[] = [];
  let currentDateTime = new Date(); // Start with the current moment
  
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      // For the first event, both fromDateTime and toDateTime are the same (current moment)
      const activity = newPortActivity(currentDateTime, layTimeId, i);
      activity.toDateTime = currentDateTime; // Set toDateTime to the same as fromDateTime
      activity.duration = 0; // Duration is 0 for the first event
      activities.push(activity);
      
      // Next activity starts where this one ends (which is the same time for the first event)
      currentDateTime = activity.toDateTime;
    } else {
      const activity = newPortActivity(currentDateTime, layTimeId, i);
      activities.push(activity);
      
      // Next activity starts where this one ends (sequential behavior)
      currentDateTime = activity.toDateTime;
    }
  }
  
  return activities;
}

export default function handler(req: any, res: any) {
  const { layTimeId } = req.query;
  
  if (req.method === 'GET') {
    const data = makeData(layTimeId || 'default');
    res.status(200).json(data);
  } else if (req.method === 'POST') {
    // Handle add activity
    const newActivity = req.body;
    
    // Use a seed based on layTimeId and current timestamp for new activities
    const seed = Math.abs(layTimeId.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) + Date.now();
    faker.seed(seed);
    
    // Return the activity with any server-side modifications
    res.status(200).json({
      ...newActivity,
      remarks: newActivity.remarks || faker.lorem.sentence(),
      deductions: newActivity.deductions || faker.lorem.sentence(),
    });
  } else if (req.method === 'DELETE') {
    // Handle delete activity
    res.status(204).end();
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
