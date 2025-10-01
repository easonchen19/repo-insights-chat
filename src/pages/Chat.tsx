import { ChatProvider } from "@/contexts/ChatContext";
import { useChatContext } from "@/contexts/ChatContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";

function ChatContent() {
  const {
    state,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    toggleSidebar,
  } = useChatContext();

  const currentConversation = state.conversations.find(
    (c) => c.id === state.currentConversationId
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        isCollapsed={state.sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <ChatArea
        currentChat={currentConversation}
        isSidebarCollapsed={state.sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onSendMessage={sendMessage}
        isGenerating={state.isGenerating}
        onStopGeneration={stopGeneration}
        onRegenerate={regenerateResponse}
        error={null}
      />
    </div>
  );
}

const Chat = () => {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
};

export default Chat;
