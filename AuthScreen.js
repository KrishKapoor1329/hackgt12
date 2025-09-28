import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import supabase from './supabaseClient';

const AuthScreen = ({ theme, isDarkMode, onAuthenticated }) => {
  const [mode, setMode] = useState('signIn'); // 'signIn' | 'signUp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        onAuthenticated?.(session);
      }
    });
    return () => {
      authListener.subscription?.unsubscribe?.();
    };
  }, [onAuthenticated]);

  const handleAuth = async () => {
    try {
      setLoading(true);
      if (!email || !password) {
        Alert.alert('Missing info', 'Enter email and password');
        return;
      }
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Verify Email', 'We sent you a confirmation link. Please verify to log in.');
      }
    } catch (e) {
      Alert.alert('Auth error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>PickWise</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {mode === 'signIn' ? 'Welcome back' : 'Create your account'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="Email"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="Password"
            placeholderTextColor={theme.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            disabled={loading} 
            onPress={handleAuth} 
            style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          >
            <Text style={[styles.primaryButtonText, { color: theme.primaryText || '#ffffff' }]}>
              {mode === 'signIn' ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            disabled={loading} 
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
            style={styles.switchButton}
          >
            <Text style={[styles.switchText, { color: theme.textSecondary }]}>
              {mode === 'signIn' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AuthScreen;


