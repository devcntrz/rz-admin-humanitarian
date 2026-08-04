// Contoh penggunaan Email/Password Authentication untuk React Native
// Pastikan sudah install: @react-native-async-storage/async-storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

const API_BASE_URL = 'http://localhost:3000'; // Ganti dengan URL API Anda

export const EmailPasswordAuthService = {
  // Login dengan email dan password
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/volunteer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Simpan token dan data user
        await this.saveAuthData(data.token, data.user);
        return {
          success: true,
          user: data.user,
          token: data.token,
        };
      } else {
        return {
          success: false,
          error: data.message,
        };
      }
    } catch (error) {
      console.error('Login Error:', error);
      return {
        success: false,
        error: 'Terjadi kesalahan saat login',
      };
    }
  },

  // Logout
  async logout() {
    try {
      const token = await this.getAuthToken();
      
      if (token) {
        // Panggil API logout
        await fetch(`${API_BASE_URL}/api/auth/volunteer/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      // Hapus data dari storage
      await this.clearAuthData();
      return { success: true };
    } catch (error) {
      console.error('Logout Error:', error);
      // Tetap hapus data lokal meskipun API gagal
      await this.clearAuthData();
      return { success: true };
    }
  },

  // Validasi token
  async validateToken() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/volunteer/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Update data user jika ada perubahan
        await this.saveUserData(data.user);
        return true;
      } else {
        // Token tidak valid, hapus data
        await this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      await this.clearAuthData();
      return false;
    }
  },

  // Ubah password
  async changePassword(currentPassword, newPassword) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/volunteer/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.message,
          errors: data.errors || [],
        };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengubah password',
      };
    }
  },

  // Simpan data autentikasi
  async saveAuthData(token, user) {
    try {
      await AsyncStorage.multiSet([
        ['auth_token', token],
        ['user_data', JSON.stringify(user)],
        ['auth_timestamp', Date.now().toString()],
      ]);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  // Simpan data user
  async saveUserData(user) {
    try {
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  // Ambil token dari storage
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Ambil data user dari storage
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Hapus semua data autentikasi
  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        'auth_token',
        'user_data',
        'auth_timestamp',
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Cek apakah user sudah login
  async isAuthenticated() {
    const token = await this.getAuthToken();
    if (!token) return false;

    // Validasi token dengan server
    return await this.validateToken();
  },

  // Ambil timestamp login terakhir
  async getLastLoginTime() {
    try {
      const timestamp = await AsyncStorage.getItem('auth_timestamp');
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Error getting last login time:', error);
      return null;
    }
  },
};

// Hook untuk React Native
export const useEmailPasswordAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);

    const result = await EmailPasswordAuthService.login(email, password);
    
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const logout = async () => {
    setIsLoading(true);
    
    const result = await EmailPasswordAuthService.logout();
    
    if (result.success) {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }

    setIsLoading(false);
    return result;
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    setError(null);

    const result = await EmailPasswordAuthService.changePassword(currentPassword, newPassword);
    
    if (!result.success) {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    
    const isAuth = await EmailPasswordAuthService.isAuthenticated();
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      const userData = await EmailPasswordAuthService.getUserData();
      setUser(userData);
    } else {
      setUser(null);
    }
    
    setIsLoading(false);
    return isAuth;
  };

  return {
    login,
    logout,
    changePassword,
    checkAuthStatus,
    isLoading,
    user,
    error,
    isAuthenticated,
  };
};

// Contoh komponen login
/*
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useEmailPasswordAuth } from './EmailPasswordAuthService';

export default function LoginScreen() {
  const { login, logout, isLoading, user, error, isAuthenticated, checkAuthStatus } = useEmailPasswordAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Cek status autentikasi saat komponen dimount
    checkAuthStatus();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      Alert.alert('Sukses', 'Login berhasil!');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin logout?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Sukses', 'Logout berhasil!');
          }
        }
      ]
    );
  };

  if (isAuthenticated && user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Selamat datang!</Text>
        <Text style={styles.subtitle}>{user.nama}</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        <TouchableOpacity 
          onPress={handleLogout} 
          style={[styles.button, styles.logoutButton]}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>RZ Humanitarian App</Text>
      <Text style={styles.subtitle}>Login sebagai Volunteer</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      
      <TouchableOpacity 
        onPress={handleLogin} 
        style={[styles.button, styles.loginButton]}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
    color: '#888',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  loginButton: {
    backgroundColor: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 14,
  },
});
*/
