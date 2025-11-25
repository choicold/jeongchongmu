import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (e) {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>정총무</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading || !email || !password}
        style={styles.button}
      >
        Login
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        style={styles.registerButton}
      >
        Don't have an account? Register
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 48,
    fontFamily: 'sans-serif-condensed',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default LoginScreen;