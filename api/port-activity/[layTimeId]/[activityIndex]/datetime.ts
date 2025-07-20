export default function handler(req: any, res: any) {
  const { layTimeId, activityIndex } = req.query;
  
  if (req.method === 'PATCH') {
    const { field, value } = req.body;
    
    // Return only the updated datetime field
    res.status(200).json({
      [field]: value
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
