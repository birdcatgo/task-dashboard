import { NextResponse } from 'next/server';
import { sendSlackMessage } from '@/utils/slack';

export async function POST(request) {
  try {
    const { channel, message } = await request.json();
    const result = await sendSlackMessage(channel, message);
    
    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}