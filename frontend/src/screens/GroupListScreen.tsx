import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, Text, ActivityIndicator, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getMyGroups } from '../services/groupService';
import { Group } from '../types/group';
import { useAuth } from '../contexts/AuthContext';

type GroupListNavigationProp = {
  navigate(screen: string, params: { groupId: number, groupName: string }): void;
};

const GroupListScreen = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<GroupListNavigationProp>();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const fetchedGroups = await getMyGroups();
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Failed to fetch groups", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const renderItem = ({ item }: { item: Group }) => (
    <List.Item
      title={item.name}
      description={`${item.memberCount} members`}
      left={props => <List.Icon {...props} icon="account-group" />}
      onPress={() => navigation.navigate('ExpenseList', { groupId: item.id, groupName: item.name })}
    />
  );

  if (loading) {
    return <ActivityIndicator animating={true} style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>No groups found.</Text>}
      />
      <Button onPress={logout} style={styles.logoutButton}>Logout</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
  },
  logoutButton: {
    margin: 16,
  }
});

export default GroupListScreen;
