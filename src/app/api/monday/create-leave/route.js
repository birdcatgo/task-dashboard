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
    return Response.json(data);
  } catch (error) {
    console.error('Error creating leave:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
} 