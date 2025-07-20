import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { layTimeId, activityIndex } = req.query;
  
  if (req.method === 'PATCH') {
    const adjustedActivity = req.body;
    
    // Return the adjusted activity
    res.status(200).json(adjustedActivity);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
