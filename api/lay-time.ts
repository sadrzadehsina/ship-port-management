import { VercelRequest, VercelResponse } from '@vercel/node';

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

// Simple mock data without faker
const newLayTime = (index: number): LayTime => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (index + 1) * 24 * 60 * 60 * 1000);
  
  return {
    id: `lay-time-${index + 1}`,
    portName: `Port ${index + 1}`,
    cargo: `Cargo ${index + 1}`,
    f: `F${index + 1}`,
    blCode: `BL${String(index + 1).padStart(3, '0')}`,
    quantity: `${(index + 1) * 1000}.000`,
    ldRate: `${(index + 1) * 10}.50`,
    term: `Term ${index + 1}`,
    demRate: `${(index + 1) * 5}.000`,
    desRate: `${(index + 1) * 3}.000`,
    allowed: (index + 1) * 2,
    used: `Used ${index + 1}`,
    deduction: `Deduction ${index + 1}`,
    balance: `Balance ${index + 1}`,
    laycanFrom: now,
    laycanTo: futureDate,
  };
};

// Simple data generation without faker
function makeData(length: number): LayTime[] {
  return Array.from({ length }, (_, index) => newLayTime(index));
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const data = makeData(3);
      res.status(200).json(data);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error in lay-time:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
