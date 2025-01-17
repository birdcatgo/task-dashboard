import { SLACK_BOT_TOKEN } from '@/utils/slack';

export async function POST(request) {
  try {
    const { channel, message } = await request.json();

    // Validate inputs
    if (!channel || !message) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send message to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel: channel,
        text: message,
        parse: 'full'  // Enable parsing of markup
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack API error:', {
        error: data.error,
        details: data,
        scopes: data.needed_scopes || []
      });

      // Handle specific error cases
      if (data.error === 'missing_scope') {
        return Response.json({
          error: 'Bot needs additional permissions',
          details: 'Please add the following scopes: ' + (data.needed_scopes || ['chat:write']).join(', ')
        }, { status: 403 });
      }

      throw new Error(data.error || 'Failed to send message to Slack');
    }

    return Response.json({ ok: true });

  } catch (error) {
    console.error('Error sending to Slack:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}