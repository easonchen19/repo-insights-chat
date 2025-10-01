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

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a simulated response. Implement your AI logic here.",
        timestamp: new Date(),
      };

      setChatSessions((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    }, 1000);
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
      />
    </div>
  );
};

export default Chat;
