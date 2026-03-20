const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/components/SplashScreen.tsx',
  'src/navigation/RootNavigator.tsx',
  'src/navigation/AuthNavigator.tsx',
  'src/navigation/AppTabs.tsx',
  'src/screens/Auth/LoginScreen.tsx',
  'src/screens/Auth/RegisterScreen.tsx',
  'src/screens/Main/DashboardScreen.tsx',
  'src/screens/Tasks/TaskListScreen.tsx',
  'src/screens/Timer/TimerScreen.tsx',
  'src/screens/Insights/InsightsScreen.tsx',
  'src/screens/Settings/SettingsScreen.tsx',
  'src/screens/Settings/ProfileScreen.tsx',
  'src/screens/Settings/ChangePasswordScreen.tsx',
];

console.log('🔍 Checking for default exports...\n');

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasDefaultExport = content.includes('export default ');
    console.log(`${hasDefaultExport ? '✅' : '❌'} ${file} - ${hasDefaultExport ? 'Has default export' : 'MISSING default export!'}`);
  } else {
    console.log(`❓ ${file} - File not found`);
  }
});