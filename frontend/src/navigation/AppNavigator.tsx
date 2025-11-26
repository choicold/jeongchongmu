import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import GroupListScreen from '../screens/GroupListScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import VotingScreen from '../screens/VotingScreen';
import SettlementScreen from '../screens/SettlementScreen';
import RegisterScreen from '../screens/RegisterScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  GroupList: undefined;
  ExpenseList: { groupId: number, groupName: string };
  Voting: { expenseId: number };
  Settlement: { expenseId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: 'My Groups' }} />
            <Stack.Screen
              name="ExpenseList"
              component={ExpenseListScreen}
              options={({ route }) => ({ title: route.params.groupName })}
            />
            <Stack.Screen name="Voting" component={VotingScreen} />
            <Stack.Screen name="Settlement" component={SettlementScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;