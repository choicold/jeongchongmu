import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, Text, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getExpensesByGroup } from '../services/expenseService';
import { Expense } from '../types/expense';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ExpenseList'>;

const ExpenseListScreen = ({ route, navigation }: Props) => {
  const { groupId } = route.params;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const fetchedExpenses = await getExpensesByGroup(groupId);
        setExpenses(fetchedExpenses);
      } catch (error) {
        console.error(`Failed to fetch expenses for group ${groupId}`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [groupId]);

  const handleExpensePress = (expense: Expense) => {
    Alert.alert(
      `'${expense.title}'`,
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Vote", onPress: () => navigation.navigate('Voting', { expenseId: expense.id }) },
        { text: "Settle", onPress: () => navigation.navigate('Settlement', { expenseId: expense.id }) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <List.Item
      title={item.title}
      description={`Paid by ${item.payer} - ${item.amount.toLocaleString()} KRW`}
      left={props => <List.Icon {...props} icon="receipt" />}
      onPress={() => handleExpensePress(item)}
    />
  );

  if (loading) {
    return <ActivityIndicator animating={true} style={styles.loader} />;
  }

  return (
    <FlatList
      data={expenses}
      renderItem={renderItem}
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={<Text style={styles.emptyText}>No expenses found for this group.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ExpenseListScreen;
