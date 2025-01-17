export async function sendSlackMessage(channel, message) {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel,
        text: message,
        parse: 'full'
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Slack API error:', data);
      throw new Error(data.error || 'Failed to send message to Slack');
    }

    return data;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}