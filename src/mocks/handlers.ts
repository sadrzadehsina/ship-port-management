import { faker } from "@faker-js/faker";
import { http, HttpResponse } from "msw";

import type { PortActivity } from "@/types";

import { makeData as makeLayTimesData } from "./get-lay-times";
import { makeData as makePortActivityData } from "./get-port-activity";

export const handlers = [
  http.get("/v1/api/lay-time", () => {
    return HttpResponse.json(makeLayTimesData(3));
  }),
  http.get("/v1/api/port-activity/:layTimeId", ({ params }) => {
    const layTimeId = params.layTimeId as string;
    return HttpResponse.json(makePortActivityData(layTimeId));
  }),
  http.post("/v1/api/port-activity/:layTimeId", async ({ request, params }) => {
    const newActivity = await request.json() as PortActivity;
    const layTimeId = params.layTimeId as string;
    
    // Use a seed based on layTimeId and current timestamp for new activities
    const seed = Math.abs(layTimeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + Date.now();
    faker.seed(seed);
    
    // Return the activity as-is, preserving empty remarks and deductions
    return HttpResponse.json({
      ...newActivity,
      remarks: newActivity.remarks !== undefined ? newActivity.remarks : "",
      deductions: newActivity.deductions !== undefined ? newActivity.deductions : "",
    });
  }),
  http.post("/v1/api/port-activity/:layTimeId/clone", async ({ request, params }) => {
    const activityToClone = await request.json() as PortActivity;
    const layTimeId = params.layTimeId as string;
    
    // Use a seed based on layTimeId and current timestamp for cloned activities
    const seed = Math.abs(layTimeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + Date.now();
    faker.seed(seed);
    
    // Return the cloned activity preserving the remarks as provided
    return HttpResponse.json({
      ...activityToClone,
      remarks: activityToClone.remarks !== undefined ? activityToClone.remarks : "",
      deductions: activityToClone.deductions !== undefined ? activityToClone.deductions : "",
    });
  }),
  http.delete("/v1/api/port-activity/:layTimeId/delete/:activityId", () => {
    // Return success response for delete
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch("/v1/api/port-activity/update/:layTimeId/:activityIndex/percentage", async ({ request }) => {
    const { percentage } = await request.json() as { percentage: number };
    
    // For percentage updates, we should only return the updated percentage
    // In a real app, this would fetch the existing activity and only update the percentage
    // For now, we'll return a minimal response that the frontend can merge
    return HttpResponse.json({
      percentage, // Only the updated field
    });
  }),
    http.patch("/v1/api/port-activity/update/:layTimeId/:activityIndex/datetime", async ({ request }) => {
    const { field, value } = await request.json() as { field: 'fromDateTime' | 'toDateTime', value: string };
    
    // Only return the updated datetime field to avoid corrupting other fields
    return HttpResponse.json({
      [field]: value, // Only the updated field
    });
  }),
    http.patch("/v1/api/port-activity/update/:layTimeId/:activityIndex/activity-type", async ({ request }) => {
    const { activityType } = await request.json() as { activityType: string };
    
    // Only return the updated activity type to avoid corrupting other fields
    return HttpResponse.json({
      activityType, // Only the updated field
    });
  }),
  http.patch("/v1/api/port-activity/update/:layTimeId/:activityIndex/adjust", async ({ request }) => {
    const adjustedActivity = await request.json() as any;
    // Return the adjusted activity
    return HttpResponse.json(adjustedActivity);
  }),
];
