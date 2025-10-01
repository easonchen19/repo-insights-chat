import { createContext, useContext, useReducer, ReactNode } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isGenerating: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  searchQuery: string;
}

type ChatAction =
  | { type: "CREATE_NEW_CHAT" }
  | { type: "SELECT_CONVERSATION"; payload: string }
  | { type: "ADD_MESSAGE"; payload: { conversationId: string; message: ChatMessage } }
  | { type: "DELETE_CONVERSATION"; payload: string }
  | { type: "UPDATE_CHAT_TITLE"; payload: { id: string; title: string } }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "IMPORT_CHATS"; payload: Conversation[] }
  | { type: "UPDATE_CONVERSATION"; payload: { id: string; updates: Partial<Conversation> } };

const initialState: ChatState = {
  conversations: [
    {
      id: "1",
      title: "Welcome Chat",
      messages: [
        {
          id: "msg-1",
          role: "assistant",
          content: "Hello! How can I help you today?",
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  currentConversationId: "1",
  isGenerating: false,
  sidebarCollapsed: false,
  theme: "dark",
  searchQuery: "",
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "CREATE_NEW_CHAT": {
      const newChat: Conversation = {
        id: `chat-${Date.now()}`,
        title: "New Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return {
        ...state,
        conversations: [newChat, ...state.conversations],
        currentConversationId: newChat.id,
      };
    }

    case "SELECT_CONVERSATION":
      return {
        ...state,
        currentConversationId: action.payload,
      };

    case "ADD_MESSAGE": {
      const { conversationId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, message],
                title:
                  conv.messages.length === 0
                    ? message.content.slice(0, 50)
                    : conv.title,
                updatedAt: new Date(),
              }
            : conv
        ),
      };
    }

    case "DELETE_CONVERSATION": {
      const filteredConvs = state.conversations.filter(
        (c) => c.id !== action.payload
      );
      const wasCurrentDeleted = state.currentConversationId === action.payload;
      return {
        ...state,
        conversations: filteredConvs,
        currentConversationId: wasCurrentDeleted
          ? filteredConvs[0]?.id || null
          : state.currentConversationId,
      };
    }

    case "UPDATE_CHAT_TITLE":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id
            ? { ...conv, title: action.payload.title, updatedAt: new Date() }
            : conv
        ),
      };

    case "SET_GENERATING":
      return {
        ...state,
        isGenerating: action.payload,
      };

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };

    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload,
      };

    case "IMPORT_CHATS":
      return {
        ...state,
        conversations: [...action.payload, ...state.conversations],
      };

    case "UPDATE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.updates }
            : conv
        ),
      };

    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  createNewChat: () => void;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => void;
  updateChatTitle: (id: string, title: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  searchConversations: (query: string) => void;
  exportChats: () => string;
  importChats: (json: string) => void;
  getFilteredConversations: () => Conversation[];
  stopGeneration: () => void;
  regenerateResponse: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const createNewChat = () => {
    dispatch({ type: "CREATE_NEW_CHAT" });
  };

  const selectConversation = (id: string) => {
    dispatch({ type: "SELECT_CONVERSATION", payload: id });
  };

  const sendMessage = async (content: string) => {
    if (!state.currentConversationId) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        conversationId: state.currentConversationId,
        message: userMessage,
      },
    });

    dispatch({ type: "SET_GENERATING", payload: true });

    // Simulate AI response with streaming effect
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `This is a simulated response to: "${content}"\n\nHere's some example markdown:\n\n**Bold text** and *italic text*\n\n\`\`\`javascript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n\`\`\`\n\nYou can integrate your AI API here for real responses.`,
        timestamp: new Date(),
      };

      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          conversationId: state.currentConversationId!,
          message: assistantMessage,
        },
      });

      dispatch({ type: "SET_GENERATING", payload: false });
    }, 1500);
  };

  const deleteConversation = (id: string) => {
    dispatch({ type: "DELETE_CONVERSATION", payload: id });
  };

  const updateChatTitle = (id: string, title: string) => {
    dispatch({ type: "UPDATE_CHAT_TITLE", payload: { id, title } });
  };

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  const setTheme = (theme: "light" | "dark") => {
    dispatch({ type: "SET_THEME", payload: theme });
  };

  const searchConversations = (query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  };

  const getFilteredConversations = () => {
    if (!state.searchQuery.trim()) {
      return state.conversations;
    }

    const query = state.searchQuery.toLowerCase();
    return state.conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some((msg) => msg.content.toLowerCase().includes(query))
    );
  };

  const exportChats = () => {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      conversations: state.conversations,
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importChats = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.conversations && Array.isArray(data.conversations)) {
        const importedChats = data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        dispatch({ type: "IMPORT_CHATS", payload: importedChats });
      }
    } catch (error) {
      console.error("Failed to import chats:", error);
    }
  };

  const stopGeneration = () => {
    dispatch({ type: "SET_GENERATING", payload: false });
  };

  const regenerateResponse = async (messageId: string) => {
    if (!state.currentConversationId) return;

    const currentConv = state.conversations.find(
      (c) => c.id === state.currentConversationId
    );
    if (!currentConv) return;

    const messageIndex = currentConv.messages.findIndex(
      (m) => m.id === messageId
    );
    if (messageIndex <= 0) return;

    const previousUserMessage = currentConv.messages[messageIndex - 1];
    if (previousUserMessage.role !== "user") return;

    // Remove messages from the regeneration point
    const updatedMessages = currentConv.messages.slice(0, messageIndex);
    dispatch({
      type: "UPDATE_CONVERSATION",
      payload: {
        id: state.currentConversationId,
        updates: { messages: updatedMessages },
      },
    });

    // Resend the user message
    await sendMessage(previousUserMessage.content);
  };

  const value: ChatContextType = {
    state,
    createNewChat,
    selectConversation,
    sendMessage,
    deleteConversation,
    updateChatTitle,
    toggleSidebar,
    setTheme,
    searchConversations,
    exportChats,
    importChats,
    getFilteredConversations,
    stopGeneration,
    regenerateResponse,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
