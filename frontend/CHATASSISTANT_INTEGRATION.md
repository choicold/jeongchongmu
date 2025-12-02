# ChatAssistant Integration Guide

## Quick Start

### 1. Files Created

```
src/
├── components/common/
│   ├── ChatAssistant.tsx          ✅ Main UI Component
│   └── index.ts                   ✅ Export file
├── hooks/
│   └── useChatAssistant.ts        ✅ Logic Hook
└── docs/
    └── chat_assistant_guide.md    ✅ Complete Documentation
```

### 2. Dependencies Installed

```bash
✅ react-native-markdown-display (installed)
✅ expo-image-picker (already in package.json)
✅ axios (already in package.json)
✅ react-native-paper (already in package.json)
```

---

## Integration Steps

### Step 1: Add to Your App

Open `App.tsx` and add the ChatAssistant component:

```tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ChatAssistant } from './src/components/common';

export default function App() {
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Your existing app content */}
        <YourMainApp />

        {/* Add ChatAssistant - It will show a FAB in the bottom-right */}
        <ChatAssistant />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Step 2: Configure Permissions (iOS)

Add to `app.config.js`:

```javascript
export default {
  expo: {
    // ... existing config
    ios: {
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "정총무에서 영수증 이미지를 업로드하기 위해 사진 라이브러리 접근이 필요합니다.",
      },
    },
  },
};
```

### Step 3: Test the Integration

1. **Start the backend** (make sure `/api/mcp/chat` endpoint is running)
2. **Start the app**:
   ```bash
   npm start
   ```
3. **Test features**:
   - Click the purple FAB in the bottom-right corner
   - Send a text message
   - Upload images (up to 5)
   - Check markdown rendering in AI responses

---

## Features Overview

### 🎨 UI Components

| Component | Description | Location |
|-----------|-------------|----------|
| **FAB** | Purple floating button | Bottom-right corner |
| **Modal** | Chat interface | 80% of screen height |
| **Message Bubbles** | User (right) / AI (left) | Chat area |
| **Image Picker** | Gallery selection | Bottom input area |
| **Markdown Renderer** | AI response formatting | AI message bubbles |

### 🔧 API Integration

- **Endpoint**: `POST /api/mcp/chat`
- **Content-Type**: `multipart/form-data`
- **Auth**: `Authorization: Bearer <token>` (auto-added)
- **Timeout**: 60 seconds
- **Max Images**: 5 per message

### 📝 Supported Markdown

AI responses support:
- **Bold** (`**text**`)
- *Italic* (`*text*`)
- Lists (`- item`, `1. item`)
- `Code` (`` `code` ``)
- Links (`[text](url)`)

---

## API Structure

### Request Format

```typescript
POST /api/mcp/chat
Content-Type: multipart/form-data

{
  message: string;           // User message text
  files: File[];            // Image files (max 5, optional)
}
```

### Response Format

```typescript
// Plain string with optional markdown formatting
"안녕하세요! **정총무 AI 비서**입니다.\n\n다음을 도와드릴 수 있습니다:\n- 그룹 관리\n- 지출 기록\n- 영수증 분석"
```

---

## Customization

### Change Colors

Edit `src/components/common/ChatAssistant.tsx`:

```tsx
const styles = StyleSheet.create({
  fab: {
    backgroundColor: '#6200EE', // Change FAB color
  },
  userBubble: {
    backgroundColor: '#6200EE', // Change user message color
  },
  sendButton: {
    backgroundColor: '#6200EE', // Change send button color
  },
});
```

### Adjust Modal Size

```tsx
modalContainer: {
  height: SCREEN_HEIGHT * 0.8, // Change from 0.8 to 0.9 for 90% height
},
```

### Change Image Limit

Edit `src/hooks/useChatAssistant.ts`:

```tsx
const pickImages = useCallback(async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    selectionLimit: 5 - selectedImages.length, // Change 5 to desired limit
  });
}, [selectedImages]);
```

---

## Troubleshooting

### FAB not showing?

**Solution**: Wrap your app with `PaperProvider`:

```tsx
import { Provider as PaperProvider } from 'react-native-paper';

<PaperProvider>
  <YourApp />
  <ChatAssistant />
</PaperProvider>
```

### "Login required" error?

**Solution**: Check if user is authenticated and token is saved:

```tsx
import { getToken } from './src/utils/storage';

const token = await getToken();
console.log('Token:', token); // Should not be null
```

### Images not uploading?

**Solutions**:
1. Check permissions in `app.config.js`
2. Rebuild the app after config changes: `npx expo run:ios` or `npx expo run:android`
3. Check file size (backend might have limits)

### Backend connection failed?

**Solutions**:
1. Verify backend is running
2. Check API URL in `app.config.js`:
   ```javascript
   extra: {
     apiUrl: "http://YOUR_IP:8080" // Use IP, not localhost on mobile
   }
   ```
3. Check network connectivity

---

## Example Usage

### Scenario 1: Simple Text Chat

1. User clicks FAB
2. Types: "안녕하세요"
3. AI responds with markdown-formatted greeting
4. User can see bold text, lists, etc. properly rendered

### Scenario 2: Image Upload

1. User clicks FAB
2. Clicks image icon
3. Selects 3 receipt images from gallery
4. Types: "이 영수증들 분석해줘"
5. AI analyzes images and returns structured data

### Scenario 3: Complex Request

1. User: "우리 그룹의 이번 달 지출 보여줘"
2. AI fetches group data → fetches expenses → returns formatted list
3. User: "가장 큰 지출 3개 투표 만들어줘"
4. AI creates votes → returns confirmation

---

## Performance Tips

1. **Reduce image quality** for faster uploads:
   ```tsx
   quality: 0.6, // Lower value = smaller file size
   ```

2. **Limit message history** to save memory:
   ```tsx
   const MAX_MESSAGES = 50;
   setMessages(prev => [...prev, newMsg].slice(-MAX_MESSAGES));
   ```

3. **Use production builds** for testing real performance

---

## Next Steps

1. ✅ Integration complete
2. 🧪 Test all features (text, images, markdown)
3. 🎨 Customize colors to match your brand
4. 📱 Test on both iOS and Android
5. 🚀 Deploy to production

---

## Documentation

- **Complete Guide**: `docs/chat_assistant_guide.md`
- **Hook Documentation**: `src/hooks/useChatAssistant.ts` (JSDoc comments)
- **Component Documentation**: `src/components/common/ChatAssistant.tsx` (JSDoc comments)

---

## Support

For issues or questions, refer to:
1. `docs/chat_assistant_guide.md` - Detailed troubleshooting
2. Backend logs - Check for API errors
3. Console logs - Enable `__DEV__` for detailed logging

---

**Status**: ✅ Ready for Integration
**Last Updated**: 2025-12-02
