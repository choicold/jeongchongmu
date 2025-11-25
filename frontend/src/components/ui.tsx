import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export const InputField = ({ icon, placeholder, value, onChange, secureTextEntry, keyboardType, style }: any) => (
    <View style={[styles.inputWrapper, style]}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            placeholderTextColor="#9CA3AF"
        />
    </View>
);

export const PrimaryButton = ({ title, onPress, loading, color = '#4F46E5' }: any) => (
    <TouchableOpacity onPress={onPress} disabled={loading} style={[styles.button, { backgroundColor: color }, loading && styles.buttonDisabled]}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{title}</Text>}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, height: 56, paddingHorizontal: 16, marginBottom: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#111827' },
    button: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#9CA3AF' },
});