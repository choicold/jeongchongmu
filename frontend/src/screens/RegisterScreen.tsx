import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { register } from '../services/authService'; // Will implement this later

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(email, password); // This function needs to be implemented
      Alert.alert('Registration Successful', 'You can now log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
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
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading || !email || !password || !confirmPassword}
        style={styles.button}
      >
        Register
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.backButton}
      >
        Already have an account? Login
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
    fontSize: 32,
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
  backButton: {
    marginTop: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default RegisterScreen;