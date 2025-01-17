import { fetchMondayTasks } from '@/utils/monday';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_MONDAY_API_KEY;
    
    // Debug environment variables (safely)
    console.log({
      'API Key exists': !!apiKey,
      'API Key length': apiKey?.length,
      'API Key starts with': apiKey?.substring(0, 10) + '...',
      'Environment': process.env.NODE_ENV,
      'Is running on server': typeof window === 'undefined'
    });

    const tasks = await fetchMondayTasks();
    return Response.json(tasks);
  } catch (error) {
    console.error('Detailed error in /api/monday/tasks:', {
      message: error.message,
      type: error.constructor.name
    });
    
    return Response.json(
      { 
        error: 'Failed to fetch tasks', 
        details: error.message
      }, 
      { 
        status: error.message.includes('401') ? 401 : 500 
      }
    );
  }
} 