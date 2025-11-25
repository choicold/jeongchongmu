import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import {
  Text,
  Button,
  SegmentedButtons,
  Card,
  Title,
  Paragraph,
  Checkbox,
  TextInput,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import { createSettlement } from '../services/settlementService';
import { SettlementRequest, SettlementResponse, DirectEntry, PercentEntry } from '../types/settlement';

// Mock data - in a real app, this would come from your group/API
const MOCK_PARTICIPANTS = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'David' },
];

const MOCK_EXPENSE_ID = 101; // This would come from the expense you are settling

type SettlementMethod = "N_BUN_1" | "DIRECT" | "PERCENT" | "ITEM";

const SettlementScreen = () => {
  const [method, setMethod] = useState<SettlementMethod>('N_BUN_1');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [directEntries, setDirectEntries] = useState<DirectEntry[]>([]);
  const [percentEntries, setPercentEntries] = useState<PercentEntry[]>([]);

  const [result, setResult] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParticipantToggle = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };
  
  const handleCreateSettlement = async () => {
    if (selectedParticipants.length === 0) {
      setError('Please select at least one participant.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const settlementRequest: SettlementRequest = {
      expenseId: MOCK_EXPENSE_ID,
      method: method,
      participantUserIds: selectedParticipants,
      directEntries: method === 'DIRECT' ? directEntries : undefined,
      percentEntries: method === 'PERCENT' ? percentEntries : undefined,
    };

    try {
      const response = await createSettlement(settlementRequest);
      setResult(response);
    } catch (e) {
      setError('Failed to calculate settlement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openTossLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open Toss link.");
    }
  };

  const handleDirectEntryChange = (userId: number, amount: string) => {
    const value = parseInt(amount, 10) || 0;
    setDirectEntries(prev => {
      const existing = prev.find(e => e.userId === userId);
      if (existing) {
        return prev.map(e => e.userId === userId ? { ...e, amount: value } : e);
      }
      return [...prev, { userId, amount: value }];
    });
  };

  const handlePercentEntryChange = (userId: number, ratio: string) => {
    const value = parseInt(ratio, 10) || 0;
    setPercentEntries(prev => {
      const existing = prev.find(e => e.userId === userId);
      if (existing) {
        return prev.map(e => e.userId === userId ? { ...e, ratio: value } : e);
      }
      return [...prev, { userId, ratio: value }];
    });
  };

  const renderInputs = () => {
    return (
      <View>
        <Title>Select Participants</Title>
        {MOCK_PARTICIPANTS.map(p => (
          <View key={p.id}>
            <Checkbox.Item
              label={p.name}
              status={selectedParticipants.includes(p.id) ? 'checked' : 'unchecked'}
              onPress={() => handleParticipantToggle(p.id)}
            />
            {selectedParticipants.includes(p.id) && method === 'DIRECT' && (
              <TextInput
                label="Amount (KRW)"
                keyboardType="numeric"
                onChangeText={text => handleDirectEntryChange(p.id, text)}
                style={styles.input}
              />
            )}
            {selectedParticipants.includes(p.id) && method === 'PERCENT' && (
              <TextInput
                label="Percent (%)"
                keyboardType="numeric"
                onChangeText={text => handlePercentEntryChange(p.id, text)}
                style={styles.input}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Create Settlement</Title>
          <SegmentedButtons
            value={method}
            onValueChange={(value) => setMethod(value as SettlementMethod)}
            buttons={[
              { value: 'N_BUN_1', label: 'N빵' },
              { value: 'DIRECT', label: 'Direct' },
              { value: 'PERCENT', label: 'Percent' },
              { value: 'ITEM', label: 'Item', disabled: true }, // Disable unimplemented methods
            ]}
            style={styles.segment}
          />

          {renderInputs()}

          <Button
            mode="contained"
            onPress={handleCreateSettlement}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Calculate Settlement
          </Button>

          {error ? <Text style={styles.error}>{error}</Text> : null}

        </Card.Content>
      </Card>

      {loading && <ActivityIndicator animating={true} style={styles.loader} />}

      {result && (
        <Card style={styles.card}>
            <Card.Content>
                <Title>Settlement Results</Title>
                <Paragraph>Total: {result.totalAmount.toLocaleString()} KRW</Paragraph>
                <List.Section>
                    {result.details.map((detail, index) => (
                        <List.Item
                            key={index}
                            title={`${detail.debtorName} -> ${detail.creditorName}`}
                            description={`${detail.amount.toLocaleString()} KRW`}
                            right={() => (
                                detail.transferUrl ? (
                                    <Button onPress={() => openTossLink(detail.transferUrl!)}>Pay with Toss</Button>
                                ) : <Text>Sent</Text>
                            )}
                        />
                    ))}
                </List.Section>
            </Card.Content>
        </Card>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 8,
  },
  segment: {
    marginVertical: 16,
  },
  button: {
    marginTop: 16,
  },
  error: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 8,
  }
});

export default SettlementScreen;