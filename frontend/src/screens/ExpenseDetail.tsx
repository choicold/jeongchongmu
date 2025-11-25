import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Receipt, Calendar, User, Tag, ShoppingBag, Users } from 'lucide-react-native';
import { api } from '../api/client';
import { useAlert } from '../components/CustomAlert';

interface ExpenseDetailScreenProps {
    expenseId: number;
    userTitle: string; // 목록에서 넘겨받은 사용자가 설정한 지출 제목
    onBack: () => void;
    token: string | null;
}

interface ReceiptItem {
    name: string;
    price: number;
    quantity: number;
}

interface ExpenseDetailData {
    id: number;
    title: string; // API에서의 title은 영수증 상호명
    amount: number;
    expenseData: string;
    receiptUrl: string;
    payerName: string;
    groupId: number;
    items: ReceiptItem[];
    participants: string[];
    tagNames: string[];
}

export const ExpenseDetailScreen: React.FC<ExpenseDetailScreenProps> = ({ expenseId, userTitle, onBack, token }) => {
    const [detail, setDetail] = useState<ExpenseDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    useEffect(() => {
        const fetchDetail = async () => {
            if (!token || !expenseId) return;
            setLoading(true);
            try {
                const data = await api.getExpenseDetail(token, expenseId);
                setDetail(data);
            } catch (error: any) {
                console.error("지출 상세 로드 실패:", error);
                showAlert({ title: "오류", message: "지출 상세 정보를 불러오지 못했습니다.", type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [token, expenseId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!detail) return null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* 헤더: 사용자 지정 제목 표시 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ArrowLeft color="#1F2937" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{userTitle}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* 1. 상단 요약 정보 */}
                <View style={styles.summaryCard}>
                    <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>총 결제 금액</Text>
                        <Text style={styles.amountValue}>{detail.amount.toLocaleString()}원</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <View style={styles.iconText}>
                            <ShoppingBag size={16} color="#6B7280" />
                            <Text style={styles.infoText}>{detail.title}</Text>
                            {/* API의 title은 상호명 */}
                        </View>
                        <View style={styles.iconText}>
                            <Calendar size={16} color="#6B7280" />
                            <Text style={styles.infoText}>
                                {new Date(detail.expenseData).toLocaleString('ko-KR', {
                                    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <View style={styles.iconText}>
                            <User size={16} color="#6B7280" />
                            <Text style={styles.infoText}>결제자: {detail.payerName}</Text>
                        </View>
                    </View>
                    {detail.tagNames && detail.tagNames.length > 0 && (
                        <View style={styles.tagRow}>
                            <Tag size={16} color="#4F46E5" />
                            {detail.tagNames.map((tag, idx) => (
                                <View key={idx} style={styles.tagBadge}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* 2. 참여 멤버 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Users size={20} color="#4F46E5" />
                        <Text style={styles.sectionTitle}>함께한 멤버 ({detail.participants.length})</Text>
                    </View>
                    <View style={styles.participantsContainer}>
                        {detail.participants.map((name, idx) => (
                            <View key={idx} style={styles.participantBadge}>
                                <Text style={styles.participantText}>{name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 3. 영수증 이미지 */}
                {detail.receiptUrl && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Receipt size={20} color="#4F46E5" />
                            <Text style={styles.sectionTitle}>영수증</Text>
                        </View>
                        <View style={styles.receiptImageContainer}>
                            <Image
                                source={{ uri: detail.receiptUrl }}
                                style={styles.receiptImage}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                )}

                {/* 4. 영수증 상세 품목 (OCR 결과) */}
                {detail.items && detail.items.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ShoppingBag size={20} color="#4F46E5" />
                            <Text style={styles.sectionTitle}>상세 품목</Text>
                        </View>
                        <View style={styles.itemsTable}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 2 }]}>품명</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>수량</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>금액</Text>
                            </View>
                            {detail.items.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableText, { flex: 2 }]}>{item.name}</Text>
                                    <Text style={[styles.tableText, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                                    <Text style={[styles.tableText, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>
                                        {item.price.toLocaleString()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', flex: 1, textAlign: 'center' },
    content: { padding: 20, paddingBottom: 50 },

    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2
    },
    amountRow: { alignItems: 'center', marginBottom: 15 },
    amountLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
    amountValue: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    divider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginBottom: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    iconText: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
    tagBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },

    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },

    participantsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    participantBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    participantText: { fontSize: 14, color: '#374151' },

    receiptImageContainer: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', height: 200 },
    receiptImage: { width: '100%', height: '100%' },

    itemsTable: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    tableHeaderText: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
    tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    tableText: { fontSize: 14, color: '#374151' },
});