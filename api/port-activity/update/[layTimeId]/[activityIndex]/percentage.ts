import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { layTimeId, activityIndex } = req.query;
  
  if (req.method === 'PATCH') {
    const { percentage } = req.body;
    
    // Return only the updated percentage
    res.status(200).json({
      percentage
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
