const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/verify_email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Email verification failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  async resendVerification(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/resend_verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend verification');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      // Content-Type multipart ke liye set mat karo; fetch FormData se khud set karega
      'Authorization': token ? `Token ${token}` : ''
    };
  }

  async getLostItems() {
    try {
      const response = await fetch(`${API_BASE_URL}/lost-items/`, {
        headers: await this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching lost items:', error);
      throw error;
    }
  }

  async createLostItem(itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/lost-items/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: itemData instanceof FormData ? itemData : JSON.stringify(itemData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating lost item:', error);
      throw error;
    }
  }

  async getFoundItems() {
    try {
      const response = await fetch(`${API_BASE_URL}/found-items/`, {
        headers: await this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching found items:', error);
      throw error;
    }
  }

  async deleteLostItem(id) {
    const response = await fetch(`${API_BASE_URL}/lost-items/${id}/`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.detail || 'Failed to delete lost item');
    }
    return { success: true };
  }

  async deleteFoundItem(id) {
    const response = await fetch(`${API_BASE_URL}/found-items/${id}/`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });
    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.detail || 'Failed to delete found item');
    }
    return { success: true };
  }

  async createFoundItem(itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/found-items/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: itemData instanceof FormData ? itemData : JSON.stringify(itemData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating found item:', error);
      throw error;
    }
  }

  async getMatches() {
    try {
      const response = await fetch(`${API_BASE_URL}/matches/`, {
        headers: await this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  // --- New: Double-confirmation status updates ---
  async updateLostItemStatus(id, status, feedback='') {
    const response = await fetch(`${API_BASE_URL}/lost-items/${id}/update_status/`, {
      method: 'POST',
      headers: {
        ...(await this.getAuthHeaders()),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, feedback })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to update status');
    return data;
  }

  async confirmLostFound(id) {
    const response = await fetch(`${API_BASE_URL}/lost-items/${id}/confirm_found/`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to confirm found');
    return data;
  }

  async updateFoundItemStatus(id, status, feedback='') {
    const response = await fetch(`${API_BASE_URL}/found-items/${id}/update_status/`, {
      method: 'POST',
      headers: {
        ...(await this.getAuthHeaders()),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, feedback })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to update status');
    return data;
  }

  async confirmFoundReturned(id) {
    const response = await fetch(`${API_BASE_URL}/found-items/${id}/confirm_returned/`, {
      method: 'POST',
      headers: await this.getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to confirm returned');
    return data;
  }

  // --- New: Public feedback ---
  async listFeedback() {
    const response = await fetch(`${API_BASE_URL}/feedbacks/`);
    return await response.json();
  }

  async createFeedback(payload) {
    const response = await fetch(`${API_BASE_URL}/feedbacks/`, {
      method: 'POST',
      headers: {
        ...(await this.getAuthHeaders()),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to submit feedback');
    return data;
  }

  async getChatMessages(matchId) {
    try {
      const url = `${API_BASE_URL}/chat-messages/?match_id=${encodeURIComponent(matchId)}`;
      const response = await fetch(url, {
        headers: await this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  async sendChatMessage(matchId, message) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat-messages/`, {
        method: 'POST',
        headers: {
          ...(await this.getAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ match_id: matchId, message })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to send message');
      }
      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  async updateUser(userId, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'PATCH',
        headers: {
          ...(await this.getAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async changePassword(oldPassword, newPassword, confirmPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/change_password/`, {
        method: 'POST',
        headers: {
          ...(await this.getAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to change password');
      }
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email) {
    const response = await fetch(`${API_BASE_URL}/users/forgot_password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await response.json();
  }

  async resetPasswordWithCode(code, newPassword, confirmPassword) {
    const response = await fetch(`${API_BASE_URL}/users/reset_password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, new_password: newPassword, confirm_password: confirmPassword })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to reset password');
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  }
}

export default new ApiService();
