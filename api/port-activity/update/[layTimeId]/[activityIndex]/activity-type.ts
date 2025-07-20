import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { layTimeId, activityIndex } = req.query;
  
  if (req.method === 'PATCH') {
    const { activityType } = req.body;
    
    // Return only the updated activity type
    res.status(200).json({
      activityType
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
