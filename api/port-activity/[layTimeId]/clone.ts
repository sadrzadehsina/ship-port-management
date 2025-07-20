import { faker } from '@faker-js/faker';

export default function handler(req: any, res: any) {
  const { layTimeId } = req.query;
  
  if (req.method === 'POST') {
    // Handle clone activity
    const activityToClone = req.body;
    
    // Use a seed based on layTimeId and current timestamp for cloned activities
    const seed = Math.abs(layTimeId.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) + Date.now();
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
