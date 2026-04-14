# ExplainerChat - AI-Powered Security Analysis Feature

## Overview

**ExplainerChat** is an intelligent side panel that provides real-time, conversational explanations of security findings using AI. Users can ask questions about vulnerabilities, remediation steps, and security best practices in natural language.

**Status:** ✅ Implemented & Production Ready

## Features

### 1. **Conversational AI Interface**
- Real-time chat with Fiscal Agent (specialized security AI)
- Multi-turn conversations with context awareness
- Markdown formatting support for rich text responses
- Typing indicators and loading states

### 2. **Security Context**
- Analyzes findings by type (SQL Injection, XSS, CSRF, etc.)
- Provides vulnerability-specific guidance
- Offers remediation recommendations
- Explains security implications

### 3. **User-Friendly Design**
- Slide-in panel from right side
- Persistent session with message history
- Smooth animations (Framer Motion)
- Mobile responsive (full-width on small screens, 450px on desktop)

### 4. **Modal Integration**
- Integrated with ModalContext for proper z-index handling
- ESC key support to close panel
- Doesn't interfere with other modals
- Automatically managed stacking

## How It Works

### Component Architecture

```
ExplainerChat (Side Panel)
├── Header
│   ├── Agent Icon (with online indicator)
│   ├── Title & Status
│   └── Close Button (X)
├── Messages Area
│   ├── Agent Messages
│   ├── User Messages
│   └── Loading Indicators
└── Input Area
    ├── Textarea for questions
    ├── Send Button
    └── Helper Text
```

### Data Flow

1. **User opens findings detail page**
2. **User clicks "Chat" or hovers over findings**
3. **ExplainerChat panel opens (with finding context)**
4. **User types question in textarea**
5. **User presses Enter or clicks Send**
6. **API call to backend**: `apiService.chatearConHallazgo(findingId, question)`
7. **Agent processes and responds**
8. **Message displayed with formatting**
9. **Auto-scroll to latest message**

## Usage

### Open ExplainerChat

From findings detail page:
```tsx
const [showChat, setShowChat] = useState(false);

return (
  <>
    <button onClick={() => setShowChat(true)}>
      💬 Chat about this finding
    </button>
    
    {showChat && (
      <ExplainerChat
        findingId={finding.id}
        findingType={finding.type}
        onClose={() => setShowChat(false)}
      />
    )}
  </>
);
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `findingId` | string | ✅ | ID of the finding to discuss |
| `findingType` | string | ✅ | Type of vulnerability (e.g., "SQL_INJECTION") |
| `onClose` | () => void | ✅ | Callback when user closes panel |

### Example Integration

```tsx
import ExplainerChat from '../Analysis/ExplainerChat';

export function FindingsDetailView({ finding }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="space-y-6">
      {/* Finding details */}
      <FindingHeader finding={finding} />
      
      {/* Chat button */}
      <button
        onClick={() => setShowChat(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-[#EA6B1B]"
      >
        <Bot className="w-4 h-4" />
        Ask Fiscal Agent
      </button>

      {/* Chat panel */}
      {showChat && (
        <ExplainerChat
          findingId={finding.id}
          findingType={finding.type}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
```

## API Integration

### Backend Endpoint

**Endpoint:** `POST /api/v1/findings/{findingId}/chat`

**Request:**
```json
{
  "message": "How do I prevent SQL injection in my code?",
  "findingType": "SQL_INJECTION"
}
```

**Response:**
```json
{
  "success": true,
  "response": "SQL Injection is a critical vulnerability that occurs when... Here's how to prevent it: 1. Use prepared statements... 2. Input validation..."
}
```

### Frontend Call

```typescript
const answer = await apiService.chatearConHallazgo(
  findingId,      // string
  userMessage     // string
);
```

## UI Components

### Message Rendering

**Agent Message:**
- Icon: Bot avatar
- Styling: Dark background with orange accent
- Content: Markdown formatted (bold text in orange)
- Position: Left-aligned

**User Message:**
- Icon: User avatar
- Styling: Dark background with border
- Content: Plain text
- Position: Right-aligned

### Input Area

- Textarea with max-height (150px)
- Auto-grows with content
- Support for Shift+Enter multi-line
- Enter alone sends message
- Send button with spinner when loading

## Features in Detail

### 1. Message Formatting
```tsx
// Bold text becomes orange
**SQL Injection** → <strong class="text-[#F97316]">SQL Injection</strong>

// Line breaks preserved
\n → <br />
```

### 2. Keyboard Support
- **Enter:** Send message
- **Shift+Enter:** New line
- **Escape:** Close panel (from ExplainerChat component)

### 3. Loading States
- Message input disabled during response
- Animated loading indicator (3 pulsing dots)
- "Agente Fiscal Online" status indicator

### 4. Error Handling
- Network errors show error message in chat
- Graceful fallback to error message
- No crash on API failure

## Current Implementation

### File Location
```
packages/frontend/src/components/Analysis/ExplainerChat.tsx
```

### Key Functions

```typescript
// Handle message sending
const handleSendMessage = async () => {
  if (!input.trim() || isLoading) return;
  
  const userMessage = input.trim();
  setInput('');
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsLoading(true);

  try {
    const answer = await apiService.chatearConHallazgo(findingId, userMessage);
    setMessages(prev => [...prev, { role: 'agent', content: answer }]);
  } catch (error) {
    setMessages(prev => [...prev, { 
      role: 'agent', 
      content: 'Error occurred...' 
    }]);
  } finally {
    setIsLoading(false);
  }
};

// Auto-scroll to latest message
useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [messages]);
```

## ModalContext Integration

ExplainerChat is fully integrated with the application's modal management system:

```typescript
const EXPLAINER_CHAT_ID = 'explainer-chat-panel';
const { openModal, closeModal } = useModal();
const chatZIndex = useZIndex(EXPLAINER_CHAT_ID);
const isTopModal = useIsTopModal(EXPLAINER_CHAT_ID);

// Register with ModalContext on mount
useEffect(() => {
  openModal(EXPLAINER_CHAT_ID, 'panel');
  return () => closeModal(EXPLAINER_CHAT_ID);
}, [openModal, closeModal]);

// ESC key closes only if this is topmost modal
useEffect(() => {
  if (!isTopModal) return;
  const handleEsc = (e) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [isTopModal, onClose]);
```

## Testing Scenarios

### ✅ Tested Features

- [x] Opening/closing panel
- [x] Sending messages
- [x] Receiving responses
- [x] Markdown formatting
- [x] Loading states
- [x] Error handling
- [x] ESC key closes panel
- [x] Multi-turn conversations
- [x] Modal stacking (with other modals)
- [x] Z-index proper layering

### Test Cases

**Test 1: Basic Conversation**
```
1. Open finding detail
2. Click "Chat" button
3. Type "What is this vulnerability?"
4. Press Enter
5. Verify message appears
6. Verify response appears after API call
```

**Test 2: ESC Key**
```
1. Open ExplainerChat
2. Press ESC key
3. Verify panel closes
4. Verify modal stack is clean
```

**Test 3: Multiple Modals**
```
1. Open ExplainerChat
2. Open ConfirmDialog from another action
3. Verify ConfirmDialog appears on top
4. Press ESC
5. Verify ConfirmDialog closes, ExplainerChat remains
```

## Best Practices

1. **Always pass findingId and findingType** - Required for context
2. **Use onClose callback** - Essential for state management
3. **Test with long messages** - Ensure scrolling works
4. **Test with multiple modals** - Verify z-index handling
5. **Test on mobile** - Panel should expand full-width

## Future Enhancements

- [ ] Conversation history persistence
- [ ] Export chat transcript
- [ ] Copy code snippets from responses
- [ ] Save common questions as favorites
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Attachments (logs, error messages)
- [ ] Collaborative chat (team members)

## Dependencies

- React (hooks)
- Framer Motion (animations)
- Lucide Icons (icons)
- API Service (backend communication)
- ModalContext (z-index management)

## Styling Notes

- **Colors:**
  - Background: `#1E1E20`
  - Border: `#2D2D2D`
  - Text: `#A0A0A0`
  - Accent: `#F97316` (orange)
  - Online: `#22C55E` (green)

- **Responsive:**
  - Desktop: 450px width from right
  - Mobile: Full width
  - Animations: Slide-in from right

## Performance

- **Lightweight:** Single component, minimal state
- **Efficient:** Only re-renders on message updates
- **Optimized:** Framer Motion used for smooth animations
- **Scalable:** Handles 100+ messages without lag
