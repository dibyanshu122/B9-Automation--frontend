import { useApi } from './useApi';
import { useChatStore, ChatMessage } from '@/store/chatStore';
import toast from 'react-hot-toast';

export const useChat = () => {
  const {
    messages,
    sessionId,
    isLoading,
    addMessage,
    setMessages,
    setSessionId,
    setLoading,
    setError,
    clearChat,
  } = useChatStore();
  const { post } = useApi();

  const sendMessage = async (assistantId: string, message: string) => {
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setLoading(true);

    try {
      const response = await post(`/api/chat/${assistantId}/message`, {
        message,
        session_id: sessionId,
      });

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        sources: response.data.sources || [],
      };
      addMessage(assistantMsg);

      // Set session ID if new
      if (!sessionId && response.data.session_id) {
        setSessionId(response.data.session_id);
      }

      setError(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to send message';
      setError(errorMsg);
      toast.error(errorMsg);
      // Remove user message on error
      setMessages(messages.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    sessionId,
    isLoading,
    sendMessage,
    clearChat,
    setMessages,
  };
};
