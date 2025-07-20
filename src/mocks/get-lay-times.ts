import { faker } from "@faker-js/faker";

import type { LayTime } from "@/types";

const newLayTime = (): LayTime => {
  return {
    id: faker.string.uuid(),
    portName: faker.location.country(),
    cargo: faker.lorem.word(),
    f: faker.lorem.word(),
    blCode: faker.lorem.word(),
    quantity: faker.number.int(100).toFixed(3),
    ldRate: faker.number.float({ min: 0, max: 100 }).toFixed(2),
    term: faker.lorem.word(),
    demRate: faker.number.float({ min: 0, max: 100 }).toFixed(3),
    desRate: faker.number.float({ min: 0, max: 100 }).toFixed(3),
    allowed: faker.number.int(10),
    used: faker.lorem.word(),
    deduction: faker.lorem.word(),
    balance: faker.lorem.word(),
    laycanFrom: faker.date.past(),
    laycanTo: faker.date.future(),
  };
};

export function makeData(length: number): LayTime[] {
  return Array.from({ length }, () => newLayTime());
}
