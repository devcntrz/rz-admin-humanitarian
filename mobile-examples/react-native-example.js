// React Native Example - API Client
// File: src/services/api.js

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Volunteers
  async getVolunteers(query) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request(`/volunteers${params}`);
  }

  async createVolunteer(volunteerData) {
    return this.request('/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteerData),
    });
  }

  // Site Reports
  async getSiteReports(query) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request(`/site-reports${params}`);
  }

  async createSiteReport(reportData) {
    return this.request('/site-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getSiteReport(id) {
    return this.request(`/site-reports/${id}`);
  }

  // Distributions
  async getDistributions(query) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request(`/distributions${params}`);
  }

  async createDistribution(distributionData) {
    return this.request('/distributions', {
      method: 'POST',
      body: JSON.stringify(distributionData),
    });
  }

  // Options
  async getOptions() {
    return this.request('/options');
  }
}

export const apiService = new ApiService();

// Usage Example in React Native Component
/*
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { apiService } from '../services/api';

const VolunteersScreen = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async (query = '') => {
    try {
      setLoading(true);
      const response = await apiService.getVolunteers(query);
      if (response.success) {
        setVolunteers(response.data);
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadVolunteers(searchQuery);
  };

  const handleCreateVolunteer = async () => {
    try {
      const newVolunteer = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '081234567890'
      };
      
      const response = await apiService.createVolunteer(newVolunteer);
      if (response.success) {
        loadVolunteers(searchQuery); // Reload data
      }
    } catch (error) {
      console.error('Error creating volunteer:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        style={{ borderWidth: 1, padding: 8, marginBottom: 16 }}
        placeholder="Search volunteers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <TouchableOpacity onPress={handleSearch} style={{ backgroundColor: '#007AFF', padding: 12, marginBottom: 16 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Search</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleCreateVolunteer} style={{ backgroundColor: '#34C759', padding: 12, marginBottom: 16 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Create Volunteer</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={volunteers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ padding: 16, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{item.full_name}</Text>
              <Text>{item.email}</Text>
              <Text>{item.phone}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default VolunteersScreen;
*/
















