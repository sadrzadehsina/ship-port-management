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

export function makeData(length: number, layTimeId: string = 'default'): PortActivity[] {
  // Set initial seed based on layTimeId for the starting date
  const baseSeed = hashCode(layTimeId);
  faker.seed(baseSeed);
  
  const activities: PortActivity[] = [];
  let currentDateTime = faker.date.recent(); // Start with a seeded recent date
  
  for (let i = 0; i < length; i++) {
    const activity = newPortActivity(currentDateTime, layTimeId, i);
    activities.push(activity);
    
    // For testing: Create a gap after the first activity to test validation
    if (i === 0 && length > 1) {
      // Add a 2-hour gap after the first activity
      currentDateTime = new Date(activity.toDateTime.getTime() + 2 * 60 * 60 * 1000);
    } else {
      // Next activity starts where this one ends (normal sequential behavior)
      currentDateTime = activity.toDateTime;
    }
  }
  
  return activities;
}
