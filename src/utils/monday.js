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
    console.log('Starting Monday.com API request...');

    if (!process.env.NEXT_MONDAY_API_KEY) {
      throw new Error('Monday.com API key is not configured');
    }

    // Log the board ID we're using
    console.log('Using Board ID:', BOARD_ID);

    const query = `
      query {
        boards (ids: ${BOARD_ID}) {
          items_page (limit: 100) {
            cursor
            items {
              id
              name
              state
              column_values {
                id
                text
                value
                type
              }
              created_at
              updated_at
            }
          }
        }
      }
    `;

    // Log the request we're about to make
    console.log('Making request to Monday.com with:', {
      url: MONDAY_API_URL,
      method: 'POST',
      hasAuth: !!process.env.NEXT_MONDAY_API_KEY,
      query: query
    });

    const response = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_MONDAY_API_KEY,
        'API-Version': '2024-01'  // Add explicit API version
      },
      body: JSON.stringify({ query })
    });

    // Log response status
    console.log('Monday.com response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('Monday.com API error details:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: text,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Monday.com API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    
    // Log the raw response for debugging
    console.log('Monday.com raw response:', {
      hasData: !!data.data,
      hasErrors: !!data.errors,
      itemsCount: data.data?.boards?.[0]?.items_page?.items?.length || 0
    });

    if (data.errors) {
      console.error('Monday.com API returned errors:', data.errors);
      throw new Error(data.errors[0].message);
    }

    const items = data.data?.boards?.[0]?.items_page?.items;
    if (!items) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response structure from Monday.com');
    }

    console.log(`Found ${items.length} items from Monday.com`);

    // Add debug logging for items
    console.log('Raw items from Monday:', {
      itemCount: items.length,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        status: item.column_values.find(col => 
          col.id === 'status' || 
          col.id === 'status_1' ||
          col.id === 'status4'
        )?.text || 'Need To Do'
      }))
    });

    // Transform and group tasks
    const transformedTasks = items.map(item => {
      const columnValues = item.column_values || [];
      
      const status = columnValues.find(col => 
        col.id === 'status' || 
        col.id === 'status_1' ||
        col.id === 'status4'  // Add other possible status column IDs
      )?.text || 'Need To Do';

      // Get type from column ID instead of title
      const type = columnValues.find(col => 
        col.id === 'type' || 
        col.id === 'dropdown' ||
        col.id === 'dropdown0'
      )?.text?.toLowerCase() || 'daily';

      // Get notes from text columns
      const notes = columnValues
        .filter(col => 
          col.id.startsWith('text') || 
          col.id.includes('notes') ||
          col.type === "text" ||
          col.type === "long_text"
        )
        .map(col => col.text)
        .filter(Boolean)
        .join(' | ');

      // Get target date
      const targetDate = columnValues.find(col => 
        col.id === 'date' ||
        col.id === 'date4' ||
        col.id === 'date0'
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

    // Group by type
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
      }
    });

    // Sort each group
    Object.keys(groupedTasks).forEach(key => {
      groupedTasks[key].sort((a, b) => 
        (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99)
      );
    });

    console.log('Transformed tasks by type:', {
      daily: groupedTasks.dailyTasks.length,
      priority: groupedTasks.priorityTasks.length,
      queued: groupedTasks.queuedTasks.length,
      total: Object.values(groupedTasks).reduce((sum, arr) => sum + arr.length, 0)
    });

    // Add check for archived items
    const archivedItems = items.filter(item => item.state === 'archived');
    if (archivedItems.length > 0) {
      console.log('Note: Found archived items:', archivedItems.length);
    }

    return groupedTasks;

  } catch (error) {
    console.error('Error fetching Monday.com data:', error);
    throw error;
  }
}

const makeRequest = async (query) => {
  try {
    if (typeof window === 'undefined') {
      // Server-side request
      const response = await fetch(MONDAY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.NEXT_MONDAY_API_KEY
        },
        body: JSON.stringify({ query })
      });
      return response;
    } else {
      // Client-side request
      const response = await fetch('/api/monday/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      return response;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const updateMondayTask = async (itemId, columnId, value) => {
  try {
    // If changing to Follow Up status, also set the date to tomorrow
    let columnValues = {};
    
    if (columnId === 'status' && value.label === 'Follow Up') {
      const nextWorkingDay = getNextWorkingDay();
      columnValues = {
        status: value,
        date: { date: nextWorkingDay }
      };
    } else {
      columnValues = {
        [columnId]: value
      };
    }

    const mutation = `
      mutation {
        change_multiple_column_values(
          board_id: ${BOARD_ID},
          item_id: ${itemId},
          column_values: ${JSON.stringify(JSON.stringify(columnValues))}
        ) {
          id
        }
      }
    `;

    const response = await makeRequest(mutation);

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
  try {
    const nextWorkingDay = getNextWorkingDay();
    const taskIds = Array.isArray(itemId) ? itemId : [itemId];
    
    console.log('Moving tasks to next day:', {
      taskIds,
      nextWorkingDay
    });

    // Move each task one by one
    for (const id of taskIds) {
      const mutation = `
        mutation {
          change_multiple_column_values(
            board_id: ${BOARD_ID},
            item_id: "${id}",
            column_values: ${JSON.stringify(JSON.stringify({
              status: { label: "Need To Do" },
              date: { date: nextWorkingDay }
            }))}
          ) {
            id
          }
        }
      `;

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
        console.error('Monday.com mutation error:', data.errors);
        throw new Error(data.errors[0].message);
      }

      console.log(`Successfully moved task ${id} to ${nextWorkingDay}`);
    }

    return { success: true, movedCount: taskIds.length };
  } catch (error) {
    console.error('Error moving tasks to next day:', error);
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
  `