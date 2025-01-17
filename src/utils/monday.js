// Monday.com API integration
const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_API_KEY = process.env.NEXT_PUBLIC_MONDAY_API_KEY;
const BOARD_ID = '8262497941';

export const fetchMondayTasks = async () => {
  const query = `
    query {
      boards(ids: ${BOARD_ID}) {
        items {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    return transformMondayData(data);
  } catch (error) {
    console.error('Error fetching Monday.com data:', error);
    return null;
  }
};

export const updateMondayTask = async (itemId, columnId, value) => {
  const mutation = `
    mutation {
      change_column_value(
        board_id: ${BOARD_ID}, 
        item_id: ${itemId}, 
        column_id: "${columnId}", 
        value: ${JSON.stringify(JSON.stringify(value))}
      ) {
        id
      }
    }
  `;

  try {
    await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY
      },
      body: JSON.stringify({ query: mutation })
    });
  } catch (error) {
    console.error('Error updating Monday.com task:', error);
  }
};

const transformMondayData = (data) => {
  if (!data.data?.boards[0]?.items) return [];

  return data.data.boards[0].items.map(item => {
    const status = item.column_values.find(col => col.id === 'status')?.text || 'Not Started';
    const type = item.column_values.find(col => col.id === 'type')?.text || 'weekly';
    const notes = item.column_values.find(col => col.id === 'notes')?.text || '';
    const priority = item.column_values.find(col => col.id === 'priority')?.text?.toLowerCase() || 'normal';

    return {
      id: item.id,
      name: item.name,
      status,
      type,
      notes,
      priority
    };
  });
};