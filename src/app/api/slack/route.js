import { sendSlackMessage } from '@/utils/slack';

export async function POST(request) {
  try {
    const { channel, message } = await request.json();
    
    if (!channel || !message) {
      return Response.json(
        { error: 'Channel and message are required' },
        { status: 400 }
      );
    }

    const result = await sendSlackMessage(channel, message);
    
    if (!result.ok) {
      console.error('Slack API error:', result);
      throw new Error(result.error || 'Failed to send message to Slack');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return Response.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}