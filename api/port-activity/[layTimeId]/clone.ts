import { VercelRequest, VercelResponse } from '@vercel/node';
import { faker } from '@faker-js/faker';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { layTimeId } = req.query;
  const layTimeIdString = Array.isArray(layTimeId) ? layTimeId[0] : layTimeId || 'default';
  
  if (req.method === 'POST') {
    // Handle clone activity
    const activityToClone = req.body;
    
    // Use a seed based on layTimeId and current timestamp for cloned activities
    const seed = Math.abs(layTimeIdString.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) + Date.now();
    faker.seed(seed);
    
    // Return the cloned activity with any server-side modifications
    res.status(200).json({
      ...activityToClone,
      remarks: activityToClone.remarks || faker.lorem.sentence(),
      deductions: activityToClone.deductions || faker.lorem.sentence(),
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
