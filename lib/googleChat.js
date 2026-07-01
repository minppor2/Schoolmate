export function normalizeGoogleChatMessages(messages = [], spaceName = 'Google Chat') {
  return (messages || []).map((message, index) => {
    const text = message?.text || message?.body?.content || '새 메시지';
    const title = text.replace(/\s+/g, ' ').trim() || '새 메시지';
    const createdAt = message?.createTime || new Date().toISOString();

    return {
      id: message?.name || `${index + 1}`,
      title,
      source: spaceName,
      date: createdAt.slice(0, 10),
      importance: /상담|긴급|확인|업무/.test(title) ? 'important' : 'normal',
      raw: message,
    };
  });
}

export async function fetchGoogleChatMessages(accessToken) {
  if (!accessToken) {
    throw new Error('Google access token is missing.');
  }

  const response = await fetch('https://chat.googleapis.com/v1/spaces?maxResults=10', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google Chat data.');
  }

  const data = await response.json();
  return data.spaces || [];
}
