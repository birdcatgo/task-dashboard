import { fetchUserProfile } from '@/utils/monday';

export async function GET() {
  try {
    const profile = await fetchUserProfile();
    return Response.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
} 