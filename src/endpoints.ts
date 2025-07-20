// Use different endpoints for development vs production
const getEndpoint = (path: string) => {
  if (process.env.NODE_ENV === 'development') {
    // In development, MSW intercepts these paths
    return `/v1/api${path}`;
  } else {
    // In production, use Vercel API routes
    return `/api${path}`;
  }
};

const layTime = {
  getAll: () => getEndpoint("/lay-time"),
};

const portActivity = {
  getAll: (layTimeId: string) => getEndpoint(`/port-activity/${layTimeId}`),
  add: (layTimeId: string) => getEndpoint(`/port-activity/${layTimeId}`),
  delete: (layTimeId: string, activityId: string) => getEndpoint(`/port-activity/${layTimeId}/delete/${activityId}`),
  clone: (layTimeId: string) => getEndpoint(`/port-activity/${layTimeId}/clone`),
  updatePercentage: (layTimeId: string, activityIndex: number) => getEndpoint(`/port-activity/update/${layTimeId}/${activityIndex}/percentage`),
  updateDateTime: (layTimeId: string, activityIndex: number) => getEndpoint(`/port-activity/update/${layTimeId}/${activityIndex}/datetime`),
  updateActivityType: (layTimeId: string, activityIndex: number) => getEndpoint(`/port-activity/update/${layTimeId}/${activityIndex}/activity-type`),
  adjust: (layTimeId: string, activityIndex: number) => getEndpoint(`/port-activity/update/${layTimeId}/${activityIndex}/adjust`),
};

export { layTime, portActivity };
