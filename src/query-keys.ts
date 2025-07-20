export const layTime = {
  all: [{ context: "layTime" }] as const,
  list: () => [{ ...layTime.all[0], entity: "list" }] as const,
};

export const portActivity = {
  all: [{ context: "portActivity" }] as const,
  list: (layTimeId: string) =>
    [{ ...portActivity.all[0], entity: "list", layTimeId }] as const,
};
