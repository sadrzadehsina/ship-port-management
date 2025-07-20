export default function handler(req: any, res: any) {
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
