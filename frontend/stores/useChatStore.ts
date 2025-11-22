import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChatMessage, ChatSession } from "@/types";
import { generateId } from "@/lib/utils";

// ==========================================
// State Interface
// ==========================================
interface ChatState {
  // Chat data
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  
  // UI state
  isOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Input state
  inputValue: string;
  suggestedQuestions: string[];
}

// ==========================================
// Actions Interface
// ==========================================
interface ChatActions {
  // Panel actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  
  // Message actions
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  
  // Session actions
  createSession: (datasetId: string) => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  
  // Loading states
  setIsLoading: (isLoading: boolean) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  
  // Input actions
  setInputValue: (value: string) => void;
  setSuggestedQuestions: (questions: string[]) => void;
  
  // Reset
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================
const initialState: ChatState = {
  messages: [],
  sessions: [],
  currentSessionId: null,
  isOpen: false,
  isLoading: false,
  isStreaming: false,
  error: null,
  inputValue: "",
  suggestedQuestions: [
    "What are the key trends in this data?",
    "Show me any anomalies or outliers",
    "What's driving the highest values?",
    "Summarize the main insights",
    "Compare categories performance",
  ],
};

// ==========================================
// Default welcome message
// ==========================================
const createWelcomeMessage = (): ChatMessage => ({
  id: generateId("msg"),
  role: "assistant",
  content:
    "Hello! I've analyzed your dataset and I'm ready to help you explore insights. Ask me anything about your data, like trends, patterns, or specific metrics.",
  timestamp: new Date().toISOString(),
});

// ==========================================
// Store
// ==========================================
export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Panel actions
      openChat: () => {
        const { messages } = get();
        // Add welcome message if no messages
        if (messages.length === 0) {
          set(
            {
              isOpen: true,
              messages: [createWelcomeMessage()],
            },
            false,
            "openChat"
          );
        } else {
          set({ isOpen: true }, false, "openChat");
        }
      },

      closeChat: () => {
        set({ isOpen: false }, false, "closeChat");
      },

      toggleChat: () => {
        const { isOpen, openChat, closeChat } = get();
        if (isOpen) {
          closeChat();
        } else {
          openChat();
        }
      },

      // Message actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId("msg"),
          timestamp: new Date().toISOString(),
        };

        set(
          (state) => ({
            messages: [...state.messages, newMessage],
            error: null,
          }),
          false,
          "addMessage"
        );
      },

      updateMessage: (id, content) => {
        set(
          (state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, content } : msg
            ),
          }),
          false,
          "updateMessage"
        );
      },

      clearMessages: () => {
        set(
          { messages: [createWelcomeMessage()] },
          false,
          "clearMessages"
        );
      },

      // Session actions
      createSession: (datasetId) => {
        const sessionId = generateId("session");
        const newSession: ChatSession = {
          id: sessionId,
          datasetId,
          messages: [createWelcomeMessage()],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(
          (state) => ({
            sessions: [...state.sessions, newSession],
            currentSessionId: sessionId,
            messages: newSession.messages,
          }),
          false,
          "createSession"
        );

        return sessionId;
      },

      switchSession: (sessionId) => {
        const { sessions } = get();
        const session = sessions.find((s) => s.id === sessionId);

        if (session) {
          set(
            {
              currentSessionId: sessionId,
              messages: session.messages,
            },
            false,
            "switchSession"
          );
        }
      },

      deleteSession: (sessionId) => {
        set(
          (state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            currentSessionId:
              state.currentSessionId === sessionId
                ? null
                : state.currentSessionId,
            messages:
              state.currentSessionId === sessionId
                ? [createWelcomeMessage()]
                : state.messages,
          }),
          false,
          "deleteSession"
        );
      },

      // Loading states
      setIsLoading: (isLoading) => {
        set({ isLoading }, false, "setIsLoading");
      },

      setIsStreaming: (isStreaming) => {
        set({ isStreaming }, false, "setIsStreaming");
      },

      setError: (error) => {
        set({ error, isLoading: false, isStreaming: false }, false, "setError");
      },

      // Input actions
      setInputValue: (inputValue) => {
        set({ inputValue }, false, "setInputValue");
      },

      setSuggestedQuestions: (suggestedQuestions) => {
        set({ suggestedQuestions }, false, "setSuggestedQuestions");
      },

      // Reset
      reset: () => {
        set(initialState, false, "reset");
      },
    }),
    { name: "ChatStore" }
  )
);

// ==========================================
// Selectors
// ==========================================
export const useChatMessages = () => useChatStore((state) => state.messages);
export const useChatIsOpen = () => useChatStore((state) => state.isOpen);
export const useChatIsLoading = () => useChatStore((state) => state.isLoading);
export const useChatSuggestions = () =>
  useChatStore((state) => state.suggestedQuestions);