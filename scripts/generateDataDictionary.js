// scripts/generateDataDictionary.js
// Run with: node scripts/generateDataDictionary.js

const fs = require('fs');
const path = require('path');

const dataDictionary = [
  // ==================== USERS COLLECTION ====================
  { collection: 'users', field: 'displayName', type: 'string', required: true, default: 'null', description: 'User display name' },
  { collection: 'users', field: 'email', type: 'string', required: true, default: 'null', description: 'User email address' },
  { collection: 'users', field: 'photoURL', type: 'string', required: false, default: 'null', description: 'Profile picture URL' },
  { collection: 'users', field: 'bio', type: 'string', required: false, default: '""', description: 'User biography' },
  { collection: 'users', field: 'occupation', type: 'string', required: false, default: '""', description: 'Job title' },
  { collection: 'users', field: 'dailyGoal', type: 'number', required: true, default: '120', description: 'Daily focus goal (minutes)' },
  { collection: 'users', field: 'weeklyGoal', type: 'number', required: true, default: '600', description: 'Weekly focus goal (minutes)' },
  { collection: 'users', field: 'theme', type: 'string', required: true, default: '"light"', description: 'App theme preference (light/dark/system)' },
  { collection: 'users', field: 'createdAt', type: 'timestamp', required: true, default: 'now()', description: 'Account creation timestamp' },
  { collection: 'users', field: 'updatedAt', type: 'timestamp', required: true, default: 'now()', description: 'Last update timestamp' },
  
  // ==================== NOTIFICATIONS (Nested Object) ====================
  { collection: 'users.notifications', field: 'taskReminders', type: 'boolean', required: true, default: 'true', description: 'Enable task reminder notifications' },
  { collection: 'users.notifications', field: 'sessionReminders', type: 'boolean', required: true, default: 'true', description: 'Enable session reminder notifications' },
  { collection: 'users.notifications', field: 'dailySummary', type: 'boolean', required: true, default: 'false', description: 'Enable daily summary notifications' },
  { collection: 'users.notifications', field: 'sound', type: 'boolean', required: true, default: 'true', description: 'Enable notification sounds' },
  { collection: 'users.notifications', field: 'vibration', type: 'boolean', required: true, default: 'true', description: 'Enable notification vibration' },
  
  // ==================== TASKS SUBCOLLECTION ====================
  { collection: 'tasks', field: 'id', type: 'string', required: true, default: 'auto', description: 'Unique task identifier (UUID)' },
  { collection: 'tasks', field: 'title', type: 'string', required: true, default: 'null', description: 'Task title' },
  { collection: 'tasks', field: 'done', type: 'boolean', required: true, default: 'false', description: 'Completion status' },
  { collection: 'tasks', field: 'category', type: 'string', required: false, default: '"other"', description: 'Task category (work/personal/study/health/other)' },
  { collection: 'tasks', field: 'priority', type: 'string', required: false, default: '"medium"', description: 'Priority level (low/medium/high)' },
  { collection: 'tasks', field: 'dueDate', type: 'timestamp', required: false, default: 'null', description: 'Due date timestamp' },
  { collection: 'tasks', field: 'reminder', type: 'boolean', required: false, default: 'false', description: 'Reminder enabled' },
  { collection: 'tasks', field: 'reminderTime', type: 'timestamp', required: false, default: 'null', description: 'Reminder timestamp' },
  { collection: 'tasks', field: 'notes', type: 'string', required: false, default: '""', description: 'Additional notes' },
  { collection: 'tasks', field: 'createdAt', type: 'timestamp', required: true, default: 'now()', description: 'Creation timestamp' },
  { collection: 'tasks', field: 'updatedAt', type: 'timestamp', required: true, default: 'now()', description: 'Last update timestamp' },
  
  // ==================== SESSIONS SUBCOLLECTION ====================
  { collection: 'sessions', field: 'id', type: 'string', required: true, default: 'auto', description: 'Unique session identifier' },
  { collection: 'sessions', field: 'seconds', type: 'number', required: true, default: 'null', description: 'Duration in seconds' },
  { collection: 'sessions', field: 'endedAt', type: 'timestamp', required: true, default: 'now()', description: 'Session end timestamp' },
  { collection: 'sessions', field: 'taskId', type: 'string', required: false, default: 'null', description: 'Associated task ID (optional reference)' },
  { collection: 'sessions', field: 'productivity', type: 'number', required: false, default: '5', description: 'Self-rated productivity (1-10)' },
  { collection: 'sessions', field: 'focusScore', type: 'number', required: false, default: '5', description: 'Calculated focus score (1-10)' },
  { collection: 'sessions', field: 'interruptions', type: 'number', required: false, default: '0', description: 'Number of interruptions logged' },
  
  // ==================== LOCAL STORAGE (AsyncStorage) ====================
  { collection: 'local', field: 'worktwin_tasks', type: 'JSON Array', required: true, default: '[]', description: 'Cached tasks for offline access' },
  { collection: 'local', field: 'worktwin_focus', type: 'JSON Array', required: true, default: '[]', description: 'Cached focus sessions' },
  { collection: 'local', field: 'worktwin_trends', type: 'JSON Array', required: true, default: '[]', description: 'Productivity trends data' },
  { collection: 'local', field: 'theme', type: 'string', required: true, default: '"light"', description: 'User theme preference' },
  { collection: 'local', field: 'guestExpiry', type: 'string', required: false, default: 'null', description: 'Guest account expiration timestamp' },
  { collection: 'local', field: 'notifications_enabled', type: 'string', required: true, default: '"true"', description: 'Notification preference' },
  { collection: 'local', field: 'pending_changes_{userId}', type: 'JSON Array', required: false, default: '[]', description: 'Offline sync queue' },
  { collection: 'local', field: 'medicines', type: 'JSON Array', required: false, default: '[]', description: 'Medicine reminders data' },
  { collection: 'local', field: 'sleepData', type: 'JSON Array', required: false, default: '[]', description: 'Sleep tracking logs' },
  { collection: 'local', field: 'stepData', type: 'JSON Object', required: false, default: '{}', description: 'Step count data' },
  { collection: 'local', field: 'mentalHealthScore', type: 'number', required: false, default: '0', description: 'Mental health score' },
];

// Generate HTML table
function generateHTML() {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WorkTwin Data Dictionary</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 32px; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .collection-section {
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
        }
        .collection-title {
            background: #f1f5f9;
            padding: 15px 20px;
            font-size: 20px;
            font-weight: bold;
            color: #1e293b;
            border-bottom: 3px solid #6366F1;
        }
        .collection-title code {
            background: #e2e8f0;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 14px;
            color: #6366F1;
        }
        table { width: 100%; border-collapse: collapse; }
        th {
            background: #f8fafc;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            font-size: 14px;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            font-size: 14px;
        }
        tr:hover { background: #f8fafc; }
        .field-name {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #6366F1;
        }
        .type-badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
        }
        .required-yes { color: #10b981; font-weight: 600; }
        .required-no { color: #ef4444; font-weight: 600; }
        .default-value {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
        }
        .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
        }
        @media (max-width: 768px) {
            body { padding: 20px; }
            th, td { padding: 8px 10px; font-size: 12px; }
            .collection-title { font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 WorkTwin Data Dictionary</h1>
            <p>Complete database schema documentation</p>
            <p style="font-size: 12px; margin-top: 10px;">Generated on: ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">`;

  // Group by collection
  const groupedData = {};
  for (let i = 0; i < dataDictionary.length; i++) {
    const item = dataDictionary[i];
    if (!groupedData[item.collection]) {
      groupedData[item.collection] = [];
    }
    groupedData[item.collection].push(item);
  }

  // Generate tables for each collection
  const collections = Object.keys(groupedData);
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    const fields = groupedData[collection];
    
    html += `
            <div class="collection-section">
                <div class="collection-title">
                    📁 Collection: <code>${collection}</code>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Field Name</th>
                            <th>Data Type</th>
                            <th>Required</th>
                            <th>Default</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>`;

    for (let j = 0; j < fields.length; j++) {
      const field = fields[j];
      html += `
                        <tr>
                            <td class="field-name">${field.field}</td>
                            <td><span class="type-badge">${field.type}</span></td>
                            <td class="${field.required ? 'required-yes' : 'required-no'}">${field.required ? '✅ Yes' : '❌ No'}</td>
                            <td><code class="default-value">${field.default}</code></td>
                            <td>${field.description}</td>
                        </tr>`;
    }

    html += `
                    </tbody>
                </table>
            </div>`;
  }

  html += `
        </div>
        <div class="footer">
            <p>WorkTwin - Focus Timer & Task Management App</p>
            <p>Firestore NoSQL Database Schema | Version 2.0.0</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

// Save to file
const outputPath = path.join(__dirname, '..', 'data_dictionary.html');
const htmlContent = generateHTML();

fs.writeFileSync(outputPath, htmlContent);
console.log(`✅ Data Dictionary generated successfully!`);
console.log(`📁 File saved to: ${outputPath}`);
console.log(`🌐 Open in browser to view: ${outputPath}`);