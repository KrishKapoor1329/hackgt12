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
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('./assets/image.png')} style={styles.logo} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {mode === 'signIn' ? 'Sign in to continue' : 'Create your account'}
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

        <TouchableOpacity disabled={loading} onPress={handleAuth} style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}>
          <Text style={styles.primaryButtonText}>{mode === 'signIn' ? 'Sign In' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity disabled={loading} onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
          <Text style={[styles.switchText, { color: theme.textSecondary }]}>
            {mode === 'signIn' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    marginTop: 12,
  },
});

export default AuthScreen;


