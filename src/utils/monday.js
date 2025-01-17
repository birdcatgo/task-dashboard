// Monday.com API integration
export const MONDAY_API_URL = 'https://api.monday.com/v2';
export const BOARD_ID = '8262497941'; // Add your board ID back
export const LEAVE_BOARD_ID = '8262497942';  // Your leave board ID (replace with actual ID)

// Update the mapping logic to use status or other criteria
const determineTaskType = (item, status) => {
  // Priority tasks: Tasks with "NEW" status
  if (status === 'NEW') {
    return 'priority';
  }
  
  // Queued tasks: Tasks with "Follow Up" status
  if (status === 'Follow Up') {
    return 'queued';
  }
  
  // Daily tasks: Everything else (Need To Do, Working On It, Done)
  return 'daily';
};

export const STATUS_ORDER = {
  'NEW': 0,
  'Need To Do': 1,
  'Working On It': 2,
  'Follow Up': 3,
  'Done': 4
};

export async function fetchMondayTasks() {
  try {
    // Updated query to get ALL items and their full details
    const query = `
      query {
        boards (ids: ${BOARD_ID}) {
          items_page {
            items {
              id
              name
              state
              column_values {
                id
                title
                text
                value
                type
              }
              subitems {
                id
                name
                column_values {
                  id
                  text
                  value
                }
              }
              created_at
              updated_at
            }
          }
        }
      }
    `;

    console.log('Fetching tasks from Monday.com...');

    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_MONDAY_API_KEY
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Monday.com API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw Monday.com response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      console.error('Monday.com API errors:', data.errors);
      throw new Error(data.errors[0].message);
    }

    const items = data.data?.boards?.[0]?.items_page?.items || [];
    console.log('Total items from Monday:', items.length);

    // Transform the data
    const transformedTasks = items.map(item => {
      const columnValues = item.column_values || [];
      
      // Get all column values
      const status = columnValues.find(col => 
        col.id === 'status' || 
        col.id === 'status_1'
      )?.text || 'Need To Do';

      const type = columnValues.find(col => 
        col.id === 'type' || 
        col.id.includes('type')
      )?.text?.toLowerCase() || 'daily';

      // Get all text/notes columns
      const notes = columnValues
        .filter(col => 
          col.id.startsWith('text') || 
          col.id.includes('notes') ||
          col.type === "text" ||
          col.type === "long-text"
        )
        .map(col => col.text)
        .filter(Boolean)
        .join(' | ');

      // Get target date if exists
      const targetDate = columnValues.find(col => 
        col.id === 'date' ||
        col.id.includes('date')
      )?.text;

      return {
        id: item.id,
        name: item.name,
        status,
        type,
        notes,
        targetDate,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    console.log('Transformed tasks:', transformedTasks);

    // Group tasks by type
    const groupedTasks = {
      dailyTasks: [],
      priorityTasks: [],
      queuedTasks: []
    };

    transformedTasks.forEach(task => {
      const taskType = determineTaskType(task, task.status);
      const key = `${taskType}Tasks`;
      if (groupedTasks[key]) {
        groupedTasks[key].push(task);
      } else {
        console.warn(`Unknown task type: ${taskType} for task:`, task);
      }
    });

    // Sort each group
    Object.keys(groupedTasks).forEach(key => {
      groupedTasks[key].sort((a, b) => {
        return (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
      });
    });

    console.log('Final grouped tasks:', groupedTasks);
    return groupedTasks;

  } catch (error) {
    console.error('Error fetching Monday.com data:', error);
    throw error;
  }
}

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
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_MONDAY_API_KEY
      },
      body: JSON.stringify({ 
        query: mutation,
        variables: {}
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Monday.com API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data;
  } catch (error) {
    console.error('Error updating Monday.com task:', error);
    throw error;
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

// Add function to move task to next working day
export const moveTaskToNextDay = async (itemId) => {
  const nextWorkingDay = getNextWorkingDay();
  
  const mutation = `
    mutation {
      change_multiple_column_values(
        board_id: ${BOARD_ID},
        item_id: ${itemId},
        column_values: ${JSON.stringify(JSON.stringify({
          status: { label: "Not Started" },
          date: { date: nextWorkingDay }
        }))}
      ) {
        id
      }
    }
  `;

  try {
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_MONDAY_API_KEY
      },
      body: JSON.stringify({ query: mutation })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Monday.com API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data;
  } catch (error) {
    console.error('Error moving task to next day:', error);
    throw error;
  }
};

// Export the getNextWorkingDay function
export function getNextWorkingDay() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // If tomorrow is Saturday, add 2 days
  if (tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 2);
  }
  // If tomorrow is Sunday, add 1 day
  else if (tomorrow.getDay() === 0) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  return tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Add this function to fetch user profile
export async function fetchUserProfile() {
  const query = `
    query {
      me {
        name
        photo_original
      }
    }
  `;

  try {
    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_MONDAY_API_KEY
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    // Check for errors in the response
    if (data.errors) {
      console.error('Monday.com API error:', data.errors);
      return null;
    }

    // Check if me data exists
    if (!data.data?.me) {
      console.error('No user profile data returned');
      return null;
    }

    return data.data.me;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}