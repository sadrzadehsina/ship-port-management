import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { layTimeId, activityId } = req.query;
  
  if (req.method === 'DELETE') {
    // Handle delete activity
    // In a real app, you would delete from database
    // For now, just return success
    res.status(204).end();
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
