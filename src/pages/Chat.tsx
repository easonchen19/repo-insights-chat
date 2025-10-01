import { useState } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

const Chat = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Example Chat",
      timestamp: new Date(),
      messages: [
        {
          id: "1",
          role: "user",
          content: "Hello! How can I help you today?",
          timestamp: new Date(),
        },
        {
          id: "2",
          role: "assistant",
          content: "Hi! I'm here to assist you. What would you like to know?",
          timestamp: new Date(),
        },
      ],
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<string | null>("1");

  const currentChat = chatSessions.find((chat) => chat.id === currentChatId);

  const handleNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      timestamp: new Date(),
      messages: [],
    };
    setChatSessions([newChat, ...chatSessions]);
    setCurrentChatId(newChat.id);
  };

  const handleDeleteChat = (chatId: string) => {
    setChatSessions(chatSessions.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(chatSessions[0]?.id || null);
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChatSessions(
      chatSessions.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const handleSendMessage = (content: string) => {
    if (!currentChatId) return;

    setError(null);
    setIsGenerating(true);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setChatSessions(
      chatSessions.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              title: chat.messages.length === 0 ? content.slice(0, 30) : chat.title,
            }
          : chat
      )
    );

    // Simulate assistant response with streaming effect
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a **simulated response**. Here's some example code:\n\n```typescript\nconst example = () => {\n  console.log('Hello, World!');\n};\n```\n\nImplement your AI logic here with real streaming support.",
        timestamp: new Date(),
      };

      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
      setIsGenerating(false);
    }, 1500);
  };

  const handleStopGeneration = () => {
    setIsGenerating(false);
  };

  const handleRegenerate = (messageId: string) => {
    if (!currentChatId) return;

    setError(null);
    setIsGenerating(true);

    // Remove the message being regenerated and regenerate
    setChatSessions(
      chatSessions.map((chat) => {
        if (chat.id === currentChatId) {
          const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
          if (messageIndex > 0) {
            const previousMessage = chat.messages[messageIndex - 1];
            handleSendMessage(previousMessage.content);
            return {
              ...chat,
              messages: chat.messages.slice(0, messageIndex),
            };
          }
        }
        return chat;
      })
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        chatSessions={chatSessions}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
      />
      <ChatArea
        currentChat={currentChat}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
        onRegenerate={handleRegenerate}
        error={error}
      />
    </div>
  );
};

export default Chat;
