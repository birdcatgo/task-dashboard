import { MONDAY_API_URL } from '@/utils/monday';

export async function POST(request) {
  try {
    const { mutation } = await request.json();

    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_MONDAY_API_KEY
      },
      body: JSON.stringify({ query: mutation })
    });

    const data = await response.json();

    // Check for API errors
    if (data.errors) {
      console.error('Monday.com API errors:', data.errors);
      return Response.json(
        { error: data.errors[0].message },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!data.data?.create_item?.id) {
      console.error('Unexpected response structure:', data);
      return Response.json(
        { error: 'Invalid response from Monday.com' },
        { status: 500 }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating task:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 