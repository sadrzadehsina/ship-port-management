import { faker } from "@faker-js/faker";

import type { PortActivity } from "@/types";

// Create a simple hash function to convert layTimeId to a number
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

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

export function makeData(layTimeId: string = 'default'): PortActivity[] {
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
