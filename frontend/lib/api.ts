import axios from 'axios';
import { GraphStateResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export const sendChatMessage = async (
  prompt: string,
  file?: File,
  stateJson?: string
): Promise<GraphStateResponse> => {
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    
    if (file) {
      formData.append('file', file);
    }
    
    if (stateJson) {
      formData.append('state_json', stateJson);
    }

    const response = await axios.post(`${API_BASE_URL}/chart`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds timeout
    });

    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to send message');
    }
    throw new Error('Network error occurred');
  }
}; 