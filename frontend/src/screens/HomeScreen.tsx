import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      {user && <Text style={styles.subtitle}>You are logged in as {user.name || user.email}</Text>}
      <Button mode="contained" onPress={logout} style={styles.button}>
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  }
});

export default HomeScreen;

