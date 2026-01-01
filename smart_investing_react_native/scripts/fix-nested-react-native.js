#!/usr/bin/env node

/**
 * Fix for nested React Native in react-native-smallcase-gateway
 * Updates React.Ref to React.ElementRef for codegen compatibility
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/react-native-smallcase-gateway/node_modules/react-native/Libraries/Components/DrawerAndroid/AndroidDrawerLayoutNativeComponent.js'
);

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace React.Ref with React.ElementRef
  const updatedContent = content.replace(
    /React\.Ref<'AndroidDrawerLayout'>/g,
    "React.ElementRef<'AndroidDrawerLayout'>"
  );
  
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log('✓ Fixed React.Ref to React.ElementRef in nested React Native');
  }
} else {
  console.log('⚠ Nested React Native file not found, skipping fix');
}

