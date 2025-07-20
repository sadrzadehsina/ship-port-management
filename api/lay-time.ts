import { VercelRequest, VercelResponse } from '@vercel/node';
import { faker } from '@faker-js/faker';

// Copy of LayTime type (simplified for API use)
type LayTime = {
  id: string;
  portName: string;
  cargo: string;
  f: string;
  blCode: string;
  quantity: string;
  ldRate: string;
  term: string;
  demRate: string;
  desRate: string;
  allowed: number;
  used: string;
  deduction: string;
  balance: string;
  laycanFrom: Date;
  laycanTo: Date;
};

// Exact copy from get-lay-times.ts
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

// Exact copy from get-lay-times.ts
function makeData(length: number): LayTime[] {
  return Array.from({ length }, () => newLayTime());
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const data = makeData(3);
    res.status(200).json(data);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
