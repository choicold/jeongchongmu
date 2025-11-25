import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, Alert, TextInput, Switch, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Upload, Trash2, Plus, User, CheckCircle, Calendar, DollarSign, Tag, X, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';
import { useAlert } from '../components/CustomAlert';
import { PrimaryButton } from '../components/ui';

interface ExpenseRegisterProps {
    groupId: number;
    onBack: () => void;
    onComplete: () => void;
    token: string | null;
}

interface ReceiptItem {
    name: string;
    price: number;
    quantity: number;
}

interface Member {
    id: number;
    user: { id: number; name: string };
    role: string;
}

export const ExpenseRegisterScreen: React.FC<ExpenseRegisterProps> = ({ groupId, onBack, onComplete, token }) => {
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();

    // --- State ---
    const [step, setStep] = useState<'upload' | 'analyzing' | 'edit'>('upload');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [receiptUrlFromOcr, setReceiptUrlFromOcr] = useState<string | null>(null); // OCR 결과로 받은 URL
    const [isImageModalVisible, setIsImageModalVisible] = useState(false); // 이미지 확대 모달

    // Form Data
    const [title, setTitle] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<ReceiptItem[]>([]);

    // Members
    const [groupMembers, setGroupMembers] = useState<Member[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [ownerId, setOwnerId] = useState<number | null>(null); // 정산 생성자(Owner) ID

    // [수정] items가 변경될 때마다 총 금액 자동 계산
    const calculatedTotalAmount = useMemo(() => {
        // 각 item의 price와 quantity가 숫자인지 확인하고 계산
        return items.reduce((sum, item) => {
            const p = Number(item.price) || 0;
            const q = Number(item.quantity) || 0;
            return sum + (p * q);
        }, 0);
    }, [items]);

    // --- 1. 그룹 멤버 로드 ---
    useEffect(() => {
        const loadMembers = async () => {
            if (!token || !groupId) return;
            try {
                const data = await api.getGroupMembers(token, groupId);
                if (Array.isArray(data)) {
                    setGroupMembers(data);
                    // 기본적으로 모든 멤버 선택
                    setSelectedMemberIds(data.map((m: Member) => m.user.id));

                    // OWNER 역할인 멤버 찾기 (생성자로 가정하고 고정)
                    const owner = data.find((m: Member) => m.role === 'OWNER');
                    if (owner) {
                        setOwnerId(owner.user.id);
                    }
                }
            } catch (e) {
                console.error("멤버 로드 실패", e);
            }
        };
        loadMembers();
    }, [token, groupId]);

    // --- 2. 이미지 선택 및 OCR 요청 ---
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // 원본 비율 유지
            quality: 1,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            uploadAndAnalyze(uri);
        }
    };

    const uploadAndAnalyze = async (uri: string) => {
        setStep('analyzing');

        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'receipt.jpg';
            // @ts-ignore
            formData.append('image', {
                uri: uri,
                name: filename,
                type: 'image/jpeg',
            });

            if(token) {
                const ocrResult = await api.uploadReceipt(token, formData);

                if (ocrResult) {
                    setTitle(ocrResult.title || '');

                    if (ocrResult.expenseData) {
                        setExpenseDate(ocrResult.expenseData.split('T')[0]);
                    }
                    // [수정] OCR 결과의 items가 숫자로 잘 들어오는지 확인 및 초기화
                    const safeItems = (ocrResult.items || []).map((item: any) => ({
                        name: item.name || '',
                        price: Number(item.price) || 0,
                        quantity: Number(item.quantity) || 1 // 수량이 없으면 기본 1
                    }));
                    setItems(safeItems);

                    setReceiptUrlFromOcr(ocrResult.receiptUrl); // OCR 서버가 돌려준 URL 저장
                    setStep('edit');
                } else {
                    throw new Error("OCR 결과가 비어있습니다.");
                }
            }
        } catch (error: any) {
            console.error("OCR 실패:", error);
            showAlert({
                title: "분석 실패",
                message: "영수증을 분석하지 못했습니다. 직접 입력해주세요.",
                type: 'error',
                onConfirm: () => setStep('edit')
            });
        }
    };

    // --- 3. 아이템 수정 로직 ---
    const updateItem = (index: number, field: keyof ReceiptItem, value: string) => {
        const newItems = [...items];

        if (field === 'price' || field === 'quantity') {
            // 입력값을 숫자로 변환하되, 빈 문자열이면 0으로 처리하지 않고 텍스트 입력 중임을 고려해야 함
            // 하지만 여기서는 데이터 무결성을 위해 바로 숫자로 변환하거나,
            // API 전송 시에만 숫자로 확실히 변환하는 전략을 쓸 수 있음.
            // 여기서는 사용자 입력을 위해 일단 숫자로 변환 가능한 문자만 받도록 정규식 처리 후 Number 변환
            const cleanValue = value.replace(/[^0-9]/g, '');
            const numValue = Number(cleanValue);

            // @ts-ignore
            newItems[index] = { ...newItems[index], [field]: numValue };
        } else {
            // @ts-ignore
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { name: '', price: 0, quantity: 1 }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    // --- 4. 멤버 선택 토글 ---
    const toggleMember = (userId: number) => {
        // [수정] 생성자(Owner)는 선택 해제 불가
        if (userId === ownerId) {
            showAlert({ title: "알림", message: "정산 생성자는 제외할 수 없습니다.", type: 'info' });
            return;
        }

        setSelectedMemberIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    // --- 5. 최종 등록 ---
    const handleRegister = async () => {
        if (!title || calculatedTotalAmount <= 0) {
            showAlert({ title: "입력 확인", message: "상호명과 총 금액(0원 이상)을 확인해주세요.", type: 'error' });
            return;
        }
        if (selectedMemberIds.length === 0) {
            showAlert({ title: "멤버 선택", message: "최소 한 명 이상의 멤버를 선택해주세요.", type: 'error' });
            return;
        }

        try {
            if(!token) return;

            // [중요] API 전송 전 데이터 검증 및 변환
            const cleanItems = items.map(item => ({
                name: item.name,
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 0
            }));

            // 재계산 (혹시 모를 오차 방지)
            const finalTotalAmount = cleanItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const requestBody = {
                title: title,
                amount: finalTotalAmount, // [수정] 최종 계산된 총액 전송
                expenseData: new Date(expenseDate).toISOString(),
                groupId: groupId,
                participantIds: selectedMemberIds,
                items: cleanItems, // [수정] 정제된 items 전송
                tagName: "기타",
                receiptUrl: receiptUrlFromOcr || imageUri || ""
            };

            console.log("Registering Expense Payload:", JSON.stringify(requestBody, null, 2)); // 디버깅용 로그

            await api.createExpense(token, requestBody);

            showAlert({
                title: "등록 완료! 🎉",
                message: "지출이 성공적으로 등록되었습니다.",
                type: 'success',
                onConfirm: onComplete
            });

        } catch (error: any) {
            console.error("등록 실패:", error);
            showAlert({ title: "등록 실패", message: error.message || "알 수 없는 오류가 발생했습니다.", type: 'error' });
        }
    };

    // --- 렌더링: 로딩 화면 ---
    if (step === 'analyzing') {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>영수증을 분석하고 있어요... 🧾</Text>
                <Text style={styles.loadingSubText}>잠시만 기다려주세요.</Text>
            </View>
        );
    }

    // --- 렌더링: 업로드 화면 ---
    if (step === 'upload') {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack}><ArrowLeft color="#1F2937" size={24}/></TouchableOpacity>
                    <Text style={styles.headerTitle}>지출 등록</Text>
                    <View style={{width:24}}/>
                </View>

                <View style={styles.uploadContent}>
                    <View style={styles.uploadBox}>
                        <View style={styles.iconCircle}>
                            <Camera size={48} color="#4F46E5" />
                        </View>
                        <Text style={styles.uploadTitle}>영수증을 찍어주세요</Text>
                        <Text style={styles.uploadDesc}>
                            영수증을 업로드하면 AI가 자동으로{'\n'}품목과 금액을 입력해드립니다.
                        </Text>

                        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                            <Upload color="#FFF" size={20} />
                            <Text style={styles.uploadButtonText}>사진 업로드</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep('edit')} style={styles.skipButton}>
                            <Text style={styles.skipText}>직접 입력하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // --- 렌더링: 편집 화면 (Edit) ---
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('upload')}><ArrowLeft color="#1F2937" size={24}/></TouchableOpacity>
                <Text style={styles.headerTitle}>내역 확인 및 수정</Text>
                <View style={{width:24}}/>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 1. 기본 정보 */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <Text style={styles.label}>상호명 (지출 제목)</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="예: 스타벅스 강남점"
                    />

                    <Text style={styles.label}>총 금액 (자동 계산)</Text>
                    <View style={[styles.moneyInputRow, {backgroundColor: '#F3F4F6'}]}>
                        <DollarSign size={20} color="#6B7280"/>
                        <TextInput
                            style={[styles.input, {flex:1, borderWidth:0, marginBottom:0, backgroundColor: 'transparent', color: '#6B7280'}]}
                            value={calculatedTotalAmount.toLocaleString()} // [수정] 계산된 값 표시 (콤마 포맷)
                            editable={false} // [수정] 수정 불가
                        />
                        <Lock size={16} color="#9CA3AF" style={{marginRight: 4}}/>
                        <Text style={styles.unitText}>원</Text>
                    </View>

                    <Text style={styles.label}>날짜</Text>
                    <TextInput
                        style={styles.input}
                        value={expenseDate}
                        onChangeText={setExpenseDate}
                        placeholder="YYYY-MM-DD"
                    />
                </View>

                {/* 2. 세부 품목 및 영수증 확인 */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>세부 품목 ({items.length})</Text>
                        <TouchableOpacity onPress={addItem} style={styles.addBtnSmall}>
                            <Plus size={16} color="#4F46E5"/>
                            <Text style={styles.addBtnText}>추가</Text>
                        </TouchableOpacity>
                    </View>

                    {/* [추가] 영수증 원본 이미지 표시 (확대 가능) */}
                    {imageUri && (
                        <TouchableOpacity
                            onPress={() => setIsImageModalVisible(true)}
                            style={styles.receiptPreviewContainer}
                            activeOpacity={0.8}
                        >
                            <Image source={{ uri: imageUri }} style={styles.receiptPreviewImage} resizeMode="cover" />
                            <View style={styles.receiptOverlay}>
                                <Text style={styles.receiptOverlayText}>영수증 원본 보기</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* [추가] 품목 리스트 헤더 */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, {flex: 2}]}>품목명</Text>
                        <Text style={[styles.tableHeaderText, {flex: 1, textAlign: 'center'}]}>수량</Text>
                        <Text style={[styles.tableHeaderText, {flex: 1.5, textAlign: 'right', paddingRight: 24}]}>단가</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={{flex: 2, marginRight: 8}}>
                                <TextInput
                                    style={styles.smallInput}
                                    value={item.name}
                                    onChangeText={(t) => updateItem(index, 'name', t)}
                                    placeholder="품명"
                                />
                            </View>
                            <View style={{flex: 1, marginRight: 8}}>
                                <TextInput
                                    style={[styles.smallInput, {textAlign: 'center'}]}
                                    value={item.quantity.toString()}
                                    onChangeText={(t) => updateItem(index, 'quantity', t)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <View style={{flex: 1.5, marginRight: 8}}>
                                <TextInput
                                    style={[styles.smallInput, {textAlign: 'right'}]}
                                    value={item.price.toString()}
                                    onChangeText={(t) => updateItem(index, 'price', t)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <TouchableOpacity onPress={() => removeItem(index)} style={{padding: 4}}>
                                <Trash2 size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* 3. 멤버 선택 */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>참여 멤버 선택</Text>
                    <View style={styles.memberList}>
                        {groupMembers.map((member) => {
                            const isSelected = selectedMemberIds.includes(member.user.id);
                            const isOwner = member.user.id === ownerId; // 생성자인지 확인

                            return (
                                <TouchableOpacity
                                    key={member.id}
                                    style={[
                                        styles.memberChip,
                                        isSelected && styles.memberChipSelected,
                                        isOwner && { opacity: 0.8 } // 생성자는 약간 다르게 표시 (선택적)
                                    ]}
                                    onPress={() => toggleMember(member.user.id)}
                                    disabled={isOwner} // [수정] 생성자는 클릭 비활성화
                                >
                                    <View style={styles.row}>
                                        <User size={16} color={isSelected ? "#FFF" : "#6B7280"} />
                                        <Text style={[styles.memberChipText, isSelected && {color: '#FFF'}]}>
                                            {member.user.name} {isOwner && "(나)"}
                                        </Text>
                                    </View>
                                    {isSelected && <CheckCircle size={16} color="#FFF" style={{marginLeft: 6}}/>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={{marginTop: 10, marginBottom: 40}}>
                    <PrimaryButton title={`총 ${calculatedTotalAmount.toLocaleString()}원 등록하기`} onPress={handleRegister} />
                </View>

            </ScrollView>

            {/* 영수증 이미지 확대 모달 */}
            <Modal visible={isImageModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsImageModalVisible(false)}>
                        <X color="#FFF" size={32} />
                    </TouchableOpacity>
                    {imageUri && (
                        <Image source={{ uri: imageUri }} style={styles.modalImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    // Upload Screen
    uploadContent: { flex: 1, justifyContent: 'center', padding: 20 },
    uploadBox: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    uploadTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
    uploadDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
    uploadButton: { flexDirection: 'row', backgroundColor: '#4F46E5', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center', marginBottom: 16, width: '100%', justifyContent: 'center' },
    uploadButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    skipButton: { padding: 10 },
    skipText: { color: '#6B7280', textDecorationLine: 'underline' },

    // Loading
    loadingText: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#4F46E5' },
    loadingSubText: { marginTop: 8, color: '#6B7280' },

    // Edit Screen
    scrollContent: { padding: 20 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 10 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937' },
    moneyInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12 },
    unitText: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginLeft: 8 },

    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    addBtnSmall: { flexDirection: 'row', alignItems: 'center', padding: 6 },
    addBtnText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 13, marginLeft: 4 },

    // Receipt Preview
    receiptPreviewContainer: { height: 150, borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative' },
    receiptPreviewImage: { width: '100%', height: '100%' },
    receiptOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, alignItems: 'center' },
    receiptOverlayText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    // Table Header
    tableHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 8 },
    tableHeaderText: { fontSize: 12, color: '#6B7280', fontWeight: 'bold' },

    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    smallInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, fontSize: 13, width: '100%', color: '#1F2937' },

    memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    memberChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    memberChipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
    memberChipText: { fontSize: 14, color: '#4B5563', marginLeft: 6 },
    row: { flexDirection: 'row', alignItems: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalImage: { width: '90%', height: '80%' },
    modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
});