import { useEffect } from 'react';
import { useApi } from './useApi';
import { useAssistantStore, Assistant } from '@/store/assistantStore';
import toast from 'react-hot-toast';

export const useAssistants = () => {
  const { assistants, setAssistants, addAssistant, removeAssistant, setLoading, setError } =
    useAssistantStore();
  const { get, post, delete: deleteReq, put } = useApi();

  const fetchAssistants = async () => {
    setLoading(true);
    try {
      const response = await get('/api/assistants');
      setAssistants(response.data);
      setError(null);
    } catch {
      setError('Failed to fetch assistants');
      toast.error('Failed to fetch assistants');
    } finally {
      setLoading(false);
    }
  };

  const createAssistant = async (data: Omit<Assistant, 'id' | 'created_at' | 'total_queries'>) => {
    try {
      const response = await post('/api/assistants', data);
      addAssistant(response.data);
      toast.success('Assistant created!');
      return response.data;
    } catch (error) {
      toast.error('Failed to create assistant');
      throw error;
    }
  };

  const updateAssistant = async (id: string, data: Partial<Assistant>) => {
    try {
      const response = await put(`/api/assistants/${id}`, data);
      toast.success('Assistant updated!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update assistant');
      throw error;
    }
  };

  const deleteAssistant = async (id: string) => {
    try {
      await deleteReq(`/api/assistants/${id}`);
      removeAssistant(id);
      toast.success('Assistant deleted');
    } catch (error) {
      toast.error('Failed to delete assistant');
      throw error;
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, []);

  return {
    assistants,
    loading: useAssistantStore((state) => state.loading),
    error: useAssistantStore((state) => state.error),
    fetchAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  };
};
