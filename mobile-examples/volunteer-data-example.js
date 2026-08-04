// Contoh penggunaan API untuk mendapatkan data volunteer di mobile app
// Pastikan sudah login dan memiliki token JWT

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000'; // Ganti dengan URL API Anda

export const VolunteerDataService = {
  // Ambil token dari storage
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Ambil data user dari token
  async getCurrentUser() {
    try {
      const token = await this.getAuthToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/volunteer/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Ambil semua site reports oleh volunteer
  async getMySiteReports() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/site-reports/volunteer/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch site reports');
      }
    } catch (error) {
      console.error('Error fetching site reports:', error);
      throw error;
    }
  },

  // Ambil semua distribution reports oleh volunteer
  async getMyDistributionReports() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/distributions/volunteer/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch distribution reports');
      }
    } catch (error) {
      console.error('Error fetching distribution reports:', error);
      throw error;
    }
  },

  // Ambil detail lengkap site report
  async getSiteReportDetails(siteReportId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/site-reports/${siteReportId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch site report details');
      }
    } catch (error) {
      console.error('Error fetching site report details:', error);
      throw error;
    }
  },

  // Ambil detail lengkap distribution report
  async getDistributionReportDetails(distributionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/distributions/${distributionId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch distribution report details');
      }
    } catch (error) {
      console.error('Error fetching distribution report details:', error);
      throw error;
    }
  },

  // Buat site report baru
  async createSiteReport(siteReportData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/site-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(siteReportData),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create site report');
      }
    } catch (error) {
      console.error('Error creating site report:', error);
      throw error;
    }
  },

  // Buat distribution report baru
  async createDistributionReport(distributionData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/distributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(distributionData),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create distribution report');
      }
    } catch (error) {
      console.error('Error creating distribution report:', error);
      throw error;
    }
  },

  // Tambah victim ke site report
  async addVictimToSiteReport(siteReportId, victimData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/site-reports/${siteReportId}/victims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(victimData),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add victim');
      }
    } catch (error) {
      console.error('Error adding victim:', error);
      throw error;
    }
  },

  // Tambah cluster ke distribution report
  async addClusterToDistributionReport(distributionId, clusterData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/distributions/${distributionId}/clusters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(clusterData),
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to add cluster');
      }
    } catch (error) {
      console.error('Error adding cluster:', error);
      throw error;
    }
  },

  // Ubah password (tidak perlu current password)
  async changePassword(newPassword) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/volunteer/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: newPassword
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        return data.message;
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },
};

// Hook untuk React Native
export const useVolunteerData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [siteReports, setSiteReports] = useState([]);
  const [distributionReports, setDistributionReports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const loadMyData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await VolunteerDataService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      setCurrentUser(user);

      // Load site reports dan distribution reports secara parallel
      const [siteReportsData, distributionReportsData] = await Promise.all([
        VolunteerDataService.getMySiteReports(),
        VolunteerDataService.getMyDistributionReports(),
      ]);

      setSiteReports(siteReportsData.siteReports);
      setDistributionReports(distributionReportsData.distributionReports);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSiteReportDetails = async (siteReportId) => {
    try {
      return await VolunteerDataService.getSiteReportDetails(siteReportId);
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const loadDistributionReportDetails = async (distributionId) => {
    try {
      return await VolunteerDataService.getDistributionReportDetails(distributionId);
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const createSiteReport = async (siteReportData) => {
    setIsLoading(true);
    setError(null);

    try {
      const newReport = await VolunteerDataService.createSiteReport(siteReportData);
      setSiteReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createDistributionReport = async (distributionData) => {
    setIsLoading(true);
    setError(null);

    try {
      const newReport = await VolunteerDataService.createDistributionReport(distributionData);
      setDistributionReports(prev => [newReport, ...prev]);
      return newReport;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    currentUser,
    siteReports,
    distributionReports,
    loadMyData,
    loadSiteReportDetails,
    loadDistributionReportDetails,
    createSiteReport,
    createDistributionReport,
  };
};

// Contoh komponen untuk menampilkan data volunteer
/*
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useVolunteerData } from './VolunteerDataService';

export default function VolunteerDashboard() {
  const {
    isLoading,
    error,
    currentUser,
    siteReports,
    distributionReports,
    loadMyData,
    loadSiteReportDetails,
  } = useVolunteerData();

  useEffect(() => {
    loadMyData();
  }, []);

  const renderSiteReport = ({ item }) => (
    <TouchableOpacity 
      style={styles.reportItem}
      onPress={() => loadSiteReportDetails(item.id)}
    >
      <Text style={styles.reportTitle}>Site Report #{item.id}</Text>
      <Text style={styles.reportDate}>{item.report_date}</Text>
      <Text style={styles.reportStatus}>Status: {item.status}</Text>
      <Text style={styles.reportDisaster}>Bencana: {item.disaster_name}</Text>
      <Text style={styles.reportLocation}>{item.village_name}, {item.district_name}</Text>
    </TouchableOpacity>
  );

  const renderDistributionReport = ({ item }) => (
    <TouchableOpacity style={styles.reportItem}>
      <Text style={styles.reportTitle}>Distribution #{item.id}</Text>
      <Text style={styles.reportDate}>{item.event_date}</Text>
      <Text style={styles.reportEvent}>{item.event_name}</Text>
      <Text style={styles.reportBeneficiaries}>Penerima: {item.beneficiary_count} orang</Text>
      <Text style={styles.reportLocation}>{item.village_name}, {item.district_name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Selamat datang, {currentUser?.nama}!
      </Text>
      
      <Text style={styles.sectionTitle}>Site Reports ({siteReports.length})</Text>
      <FlatList
        data={siteReports}
        renderItem={renderSiteReport}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
      
      <Text style={styles.sectionTitle}>Distribution Reports ({distributionReports.length})</Text>
      <FlatList
        data={distributionReports}
        renderItem={renderDistributionReport}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  reportStatus: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
  },
  reportDisaster: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 5,
  },
  reportEvent: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 5,
  },
  reportBeneficiaries: {
    fontSize: 14,
    color: '#FF9500',
    marginTop: 5,
  },
  reportLocation: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 5,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
});
*/
