// Contoh penggunaan Google SSO untuk React Native Expo
// Pastikan sudah install: expo-auth-session, expo-crypto

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Konfigurasi Google OAuth
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Ganti dengan client ID Anda
const API_BASE_URL = 'http://localhost:3000'; // Ganti dengan URL API Anda

// Setup untuk web browser
WebBrowser.maybeCompleteAuthSession();

export const GoogleAuthService = {
  // Login dengan Google
  async loginWithGoogle() {
    try {
      // Request Google ID token
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri: AuthSession.makeRedirectUri({
          useProxy: true,
        }),
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        const { id_token } = result.params;
        
        // Kirim id_token ke API backend
        const response = await fetch(`${API_BASE_URL}/api/auth/mobile/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: id_token,
          }),
        });

        const data = await response.json();

        if (data.status === 'success') {
          // Simpan token JWT untuk sesi
          await this.saveAuthToken(data.token);
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
      } else {
        return {
          success: false,
          error: 'Google login dibatalkan',
        };
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      return {
        success: false,
        error: 'Terjadi kesalahan saat login',
      };
    }
  },

  // Simpan token ke storage
  async saveAuthToken(token) {
    try {
      // Gunakan AsyncStorage atau SecureStore untuk menyimpan token
      // Contoh dengan AsyncStorage:
      // await AsyncStorage.setItem('auth_token', token);
      
      // Contoh dengan SecureStore:
      // await SecureStore.setItemAsync('auth_token', token);
      
      console.log('Token disimpan:', token);
    } catch (error) {
      console.error('Error menyimpan token:', error);
    }
  },

  // Ambil token dari storage
  async getAuthToken() {
    try {
      // return await AsyncStorage.getItem('auth_token');
      // atau
      // return await SecureStore.getItemAsync('auth_token');
      return null; // Implementasi sesuai kebutuhan
    } catch (error) {
      console.error('Error mengambil token:', error);
      return null;
    }
  },

  // Logout
  async logout() {
    try {
      // Hapus token dari storage
      // await AsyncStorage.removeItem('auth_token');
      // atau
      // await SecureStore.deleteItemAsync('auth_token');
      
      console.log('Logout berhasil');
    } catch (error) {
      console.error('Error logout:', error);
    }
  },

  // Cek apakah user sudah login
  async isAuthenticated() {
    const token = await this.getAuthToken();
    return token !== null;
  },

  // Validasi token dengan API
  async validateToken() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
};

// Contoh penggunaan di komponen React Native
export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const login = async () => {
    setIsLoading(true);
    setError(null);

    const result = await GoogleAuthService.loginWithGoogle();
    
    if (result.success) {
      setUser(result.user);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const logout = async () => {
    await GoogleAuthService.logout();
    setUser(null);
  };

  return {
    login,
    logout,
    isLoading,
    user,
    error,
    isAuthenticated: !!user,
  };
};

// Contoh komponen login
/*
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useGoogleAuth } from './GoogleAuthService';

export default function LoginScreen() {
  const { login, logout, isLoading, user, error, isAuthenticated } = useGoogleAuth();

  if (isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Selamat datang, {user.nama}!</Text>
        <TouchableOpacity onPress={logout} style={{ marginTop: 20, padding: 10, backgroundColor: 'red' }}>
          <Text style={{ color: 'white' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>RZ Humanitarian App</Text>
      
      {error && (
        <Text style={{ color: 'red', marginVertical: 10 }}>{error}</Text>
      )}
      
      <TouchableOpacity 
        onPress={login} 
        disabled={isLoading}
        style={{ 
          marginTop: 20, 
          padding: 15, 
          backgroundColor: isLoading ? 'gray' : '#4285f4',
          borderRadius: 5
        }}
      >
        <Text style={{ color: 'white' }}>
          {isLoading ? 'Loading...' : 'Login dengan Google'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
*/
