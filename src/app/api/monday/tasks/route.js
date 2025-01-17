import { fetchMondayTasks } from '@/utils/monday';

export async function GET() {
  try {
    // Add debug logging
    console.log('Starting tasks fetch from Monday.com...');
    
    const tasks = await fetchMondayTasks();
    
    // Validate tasks structure
    if (!tasks || typeof tasks !== 'object') {
      console.error('Invalid tasks data:', tasks);
      return Response.json(
        { error: 'Invalid tasks data received' },
        { status: 500 }
      );
    }

    // Log successful response
    console.log(`Successfully fetched ${Object.values(tasks).flat().length} tasks`);
    
    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Detailed error logging
    console.error('Error in /api/monday/tasks:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch tasks from Monday.com',
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request) {
  return GET();
} 