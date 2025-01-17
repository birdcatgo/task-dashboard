import { fetchMondayTasks } from '@/utils/monday';

export async function GET() {
  try {
    console.log('API Route Environment:', {
      hasApiKey: !!process.env.NEXT_MONDAY_API_KEY,
      keyLength: process.env.NEXT_MONDAY_API_KEY?.length,
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!process.env.NEXT_MONDAY_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'Monday.com API key is not configured',
          details: 'NEXT_MONDAY_API_KEY environment variable is missing'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const tasks = await fetchMondayTasks();
    
    if (!tasks || typeof tasks !== 'object') {
      console.error('Invalid tasks data:', tasks);
      return new Response(
        JSON.stringify({ error: 'Invalid tasks data received' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const taskCount = Object.values(tasks).flat().length;
    console.log(`Successfully fetched ${taskCount} tasks`);
    
    return new Response(
      JSON.stringify(tasks),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in /api/monday/tasks:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch tasks from Monday.com',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.message.includes('API key') ? 401 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request) {
  return GET();
} 