const layTime = {
  getAll: () => "/v1/api/lay-time",
};

const portActivity = {
  getAll: (layTimeId: string) => `/v1/api/port-activity/${layTimeId}`,
};

export { layTime, portActivity };
