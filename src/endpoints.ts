// Use MSW endpoints for both development and production (GitHub Pages)
const getEndpoint = (path: string) => {
  // Always use MSW with /v1/api/ routes since we're GitHub Pages only
  return `/v1/api${path}`;
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
