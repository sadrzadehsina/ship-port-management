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
};

export { layTime, portActivity };
