import React, { useState, useEffect } from 'react';
import { 
  Wallet, User, ArrowRight, Users, Plus, Bell, Menu,
  ChevronRight, Receipt, LogOut, ArrowLeft, Copy, Settings, Check, MapPin,
  Camera, Edit2, Image as ImageIcon, Trash2, Calendar
} from 'lucide-react';

// --- 유틸리티 ---
const formatMoney = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// --- 공통 컴포넌트: 헤더 ---
const Header = ({ title, onBack, rightAction, transparent = false }) => (
  <div className={`flex items-center justify-between px-6 py-4 sticky top-0 z-10 transition-colors ${transparent ? 'bg-transparent text-white' : 'bg-white border-b border-slate-100 text-slate-800'}`}>
    <button onClick={onBack} className={`p-2 -ml-2 rounded-full transition-colors ${transparent ? 'hover:bg-white/20' : 'hover:bg-slate-50 text-slate-600'}`}>
      <ArrowLeft className="w-6 h-6" />
    </button>
    <h1 className="font-bold text-lg">{title}</h1>
    <div className="w-10 flex justify-end">
      {rightAction}
    </div>
  </div>
);

// --- 3.4 OCR 스캔 화면 ---
const OCRScanScreen = ({ onBack, onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  
  const handleCapture = () => {
    setScanning(true);
    // 2.5초 뒤 스캔 완료 시뮬레이션
    setTimeout(() => {
      setScanning(false);
      onScanComplete({
        title: "제주 흑돼지 맛집",
        amount: "158000",
        date: new Date().toISOString().split('T')[0],
        category: "음식",
        items: [
          { name: "흑돼지 오겹살 3인", price: 54000 },
          { name: "목살 2인", price: 36000 },
          { name: "김치찌개", price: 8000 },
          { name: "공기밥 4개", price: 4000 },
          { name: "소주 3병", price: 15000 },
          { name: "맥주 2병", price: 10000 },
        ]
      });
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full bg-black relative animate-fade-in overflow-hidden">
      {/* 카메라 뷰파인더 시뮬레이션 */}
      <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
         <p className="text-white/50 mb-4">카메라 미리보기 화면</p>
         <Receipt className="w-24 h-24 text-white/20" />
      </div>

      <Header title="" onBack={onBack} transparent={true} />

      {/* 스캔 가이드 라인 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-96 border-2 border-emerald-400 rounded-3xl opacity-80 flex flex-col justify-between p-4">
         <div className="flex justify-between">
            <div className="w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
            <div className="w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
         </div>
         <div className="text-center text-emerald-400 text-xs font-bold bg-black/50 py-1 px-2 rounded-full self-center">
            영수증을 사각형 안에 맞춰주세요
         </div>
         <div className="flex justify-between">
            <div className="w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
            <div className="w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
         </div>
      </div>

      {/* 스캔 애니메이션 (Scanning...) */}
      {scanning && (
        <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-bold text-lg animate-pulse">영수증 분석 중...</p>
          <p className="text-white/70 text-sm mt-2">AI가 텍스트를 읽고 있습니다</p>
        </div>
      )}

      {/* 하단 컨트롤러 */}
      <div className="absolute bottom-0 w-full p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center z-10">
        <button className="p-3 bg-white/20 rounded-full backdrop-blur-md">
           <ImageIcon className="w-6 h-6 text-white" />
        </button>
        <button 
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:bg-white/20 transition-all"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>
         <button className="p-3 bg-transparent rounded-full">
           <div className="w-6 h-6"></div> {/* 공간 차지용 */}
        </button>
      </div>
    </div>
  );
};

// --- 3.3 지출 등록 화면 ---
const CreateExpenseScreen = ({ initialData, onBack, onSave }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [selectedMembers, setSelectedMembers] = useState([1, 2, 3, 4]); 
  
  // OCR로 가져온 세부 항목이 있다면 표시
  const [items, setItems] = useState(initialData?.items || []);

  const members = [
    { id: 1, name: '김총무 (나)', avatar: 'User' },
    { id: 2, name: '박지성', avatar: 'User' },
    { id: 3, name: '손흥민', avatar: 'User' },
    { id: 4, name: '이강인', avatar: 'User' },
  ];

  const toggleMember = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(m => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSave = () => {
      onSave({
          id: Date.now(),
          title,
          amount: parseInt(amount),
          date,
          payer: '나',
          category: initialData?.category || '기타',
          items
      });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <Header title="지출 등록" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {/* 금액 입력 섹션 */}
        <div className="bg-white p-6 pb-8 rounded-b-3xl shadow-sm mb-4">
           <label className="text-xs font-bold text-slate-400 block mb-2">지출 금액</label>
           <div className="flex items-center gap-2">
             <span className="text-3xl font-bold text-slate-800">₩</span>
             <input 
               type="text" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0"
               className="text-4xl font-bold text-slate-800 w-full focus:outline-none placeholder:text-slate-200"
             />
           </div>
        </div>

        <div className="px-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">내용</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text" 
                placeholder="예: 저녁 회식, 마트 장보기" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-bold text-slate-700 block mb-2">날짜</label>
                <div className="relative">
                   <input 
                     type="date" 
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                   />
                </div>
              </div>
              <div className="flex-1">
                 <label className="text-sm font-bold text-slate-700 block mb-2">결제자</label>
                 <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none">
                    <option>김총무 (나)</option>
                    <option>박지성</option>
                    <option>손흥민</option>
                 </select>
              </div>
            </div>
          </div>

          {/* OCR 인식 결과 (항목이 있을 때만 표시) */}
          {items.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 animate-slide-up">
               <div className="flex items-center gap-2 mb-3">
                 <div className="bg-emerald-500 p-1 rounded">
                   <Check className="w-3 h-3 text-white" />
                 </div>
                 <span className="text-xs font-bold text-emerald-700">영수증 자동 인식됨</span>
               </div>
               <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                 {items.map((item, idx) => (
                   <div key={idx} className="flex justify-between text-sm border-b border-emerald-100/50 pb-1 last:border-0">
                     <span className="text-slate-600">{item.name}</span>
                     <span className="font-bold text-slate-700">{formatMoney(item.price)}</span>
                   </div>
                 ))}
               </div>
               <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-between items-center">
                  <span className="text-xs text-emerald-600 font-bold">총 합계 확인</span>
                  <span className="text-emerald-700 font-bold">{formatMoney(items.reduce((acc, cur) => acc + cur.price, 0))}원</span>
               </div>
            </div>
          )}

          {/* 함께한 멤버 선택 */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-slate-700">함께한 멤버 ({selectedMembers.length})</label>
              <button 
                onClick={() => setSelectedMembers(selectedMembers.length === members.length ? [] : members.map(m => m.id))}
                className="text-xs text-emerald-500 font-bold"
              >
                {selectedMembers.length === members.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <button 
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${isSelected ? 'bg-emerald-50 ring-2 ring-emerald-500' : 'bg-white border border-slate-100 opacity-60'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                       <User className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? 'text-emerald-800' : 'text-slate-400'}`}>
                      {member.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-white safe-area-bottom">
        <button 
          onClick={handleSave}
          disabled={!amount || !title}
          className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${amount && title ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          지출 등록하기
        </button>
      </div>
    </div>
  );
};

// --- 3.2 지출 상세 화면 ---
const ExpenseDetailScreen = ({ expense, onBack }) => {
  if (!expense) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <div className="bg-emerald-500 text-white px-6 pt-6 pb-20 rounded-b-[2.5rem] relative">
         <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors">
               <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
               <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <Edit2 className="w-5 h-5" />
               </button>
               <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
         </div>
         <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 text-2xl">
               {expense.category === '음식' ? '🥓' : expense.category === '카페' ? '☕' : '🛒'}
            </div>
            <p className="text-emerald-100 text-sm mb-1">{formatDate(expense.date)}</p>
            <h1 className="text-2xl font-bold mb-1">{expense.title}</h1>
            <p className="text-emerald-100 text-xs">결제자: {expense.payer}</p>
         </div>
      </div>

      <div className="px-6 -mt-12 flex-1 overflow-y-auto pb-6 scrollbar-hide">
         {/* 금액 카드 */}
         <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center mb-4">
            <p className="text-slate-400 text-xs font-bold mb-1">총 지출 금액</p>
            <h2 className="text-3xl font-bold text-slate-800">{formatMoney(expense.amount)}원</h2>
         </div>

         {/* 참여 멤버 정보 */}
         <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
            <h3 className="font-bold text-slate-700 text-sm mb-4">참여 멤버 (4명)</h3>
            <div className="space-y-4">
               {/* 1/N 계산 로직 시각화 */}
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                        N
                     </div>
                     <span className="text-sm font-bold text-slate-600">1인당 부담금</span>
                  </div>
                  <span className="font-bold text-emerald-600">{formatMoney(Math.floor(expense.amount / 4))}원</span>
               </div>

               <div className="flex -space-x-2 overflow-hidden py-2">
                  {[1,2,3,4].map(i => (
                     <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {i === 1 ? '나' : `M${i}`}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* 영수증 데이터가 있으면 표시 */}
         {expense.items && expense.items.length > 0 && (
             <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-3">영수증 상세</h3>
                <div className="space-y-2">
                    {expense.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-600">
                            <span>{item.name}</span>
                            <span>{formatMoney(item.price)}</span>
                        </div>
                    ))}
                    <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between font-bold text-sm">
                        <span>합계</span>
                        <span>{formatMoney(expense.amount)}</span>
                    </div>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

// --- 그룹 생성, 리스트, 상세 등 기존 컴포넌트 생략 없이 포함 ---

const CreateGroupScreen = ({ onBack, onCreate }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('✈️');
    const icons = ['✈️', '🍺', '☕', '🏠', '🎁', '⚽', '🎤', '🛒'];
  
    return (
      <div className="flex flex-col h-full bg-white animate-fade-in">
        <Header title="새 모임 만들기" onBack={onBack} />
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl border-2 border-dashed border-slate-300 relative">
              {selectedIcon}
            </div>
          </div>
          <div className="flex gap-2 justify-center mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {icons.map(icon => (
              <button key={icon} onClick={() => setSelectedIcon(icon)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${selectedIcon === icon ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-slate-50'}`}>{icon}</button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">모임 이름</label>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="예: 제주도 여행" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 safe-area-bottom">
          <button onClick={() => onCreate({ id: Date.now(), name: groupName, icon: selectedIcon, members: 1, createdAt: '방금 전' })} disabled={!groupName} className={`w-full font-bold py-4 rounded-xl ${groupName ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>모임 생성 완료</button>
        </div>
      </div>
    );
};

const GroupListScreen = ({ groups, onBack, onNavigate, onCreateGroup }) => (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <Header title="내 모임 전체" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCreateGroup} className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-500 transition-all">
            <Plus className="w-6 h-6" /><span className="text-sm font-bold">새 모임</span>
          </button>
          {groups.map((group) => (
             <button key={group.id} onClick={() => onNavigate('groupDetail', group)} className="aspect-square bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group text-left">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-2xl">{group.icon}</div>
              <div><h4 className="font-bold text-slate-700 text-sm truncate">{group.name}</h4><p className="text-slate-400 text-xs mt-1">멤버 {group.members}명</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
);

const GroupDetailScreen = ({ group, expenses, onBack, onNavigate, onOpenAddMenu }) => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  if (!group) return null;

  const toggleAddMenu = () => setIsAddMenuOpen(!isAddMenuOpen);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative">
      <div className="bg-white pb-6 pt-4 px-6 rounded-b-[2rem] shadow-sm z-10">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-50"><ArrowLeft className="w-6 h-6 text-slate-600" /></button>
          <Settings className="w-6 h-6 text-slate-400" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">{group.icon}</div>
          <div><h1 className="text-2xl font-bold text-slate-800">{group.name}</h1><p className="text-slate-500 text-sm">멤버 {group.members}명</p></div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-0">
        {['expenses', 'members', 'settlement'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-sm font-bold ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400'}`}>{tab === 'expenses' ? '지출' : tab === 'members' ? '멤버' : '정산'}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {activeTab === 'expenses' && (
            <div className="space-y-3 pb-24">
                {expenses.length === 0 ? (
                    <div className="text-center py-10 text-slate-400"><p>아직 지출 내역이 없습니다.</p></div>
                ) : (
                    expenses.map((expense) => (
                        <div key={expense.id} onClick={() => onNavigate('expenseDetail', expense)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">{expense.category === '음식' ? '🥓' : '💰'}</div>
                                <div><h4 className="font-bold text-slate-700 text-sm">{expense.title}</h4><p className="text-xs text-slate-400">{expense.payer} • {formatDate(expense.date)}</p></div>
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{formatMoney(expense.amount)}원</span>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>

      {/* FAB 및 확장 메뉴 */}
      {activeTab === 'expenses' && (
        <>
            {isAddMenuOpen && <div className="absolute inset-0 bg-black/50 z-20" onClick={toggleAddMenu}></div>}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-30">
                {isAddMenuOpen && (
                    <>
                        <button onClick={() => { toggleAddMenu(); onNavigate('ocrScan'); }} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg animate-slide-up">
                            <span className="font-bold text-sm text-slate-700">영수증 스캔</span>
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white"><Camera className="w-5 h-5" /></div>
                        </button>
                        <button onClick={() => { toggleAddMenu(); onNavigate('createExpense'); }} className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-lg animate-slide-up" style={{ animationDelay: '0.05s' }}>
                            <span className="font-bold text-sm text-slate-700">직접 입력</span>
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Edit2 className="w-5 h-5" /></div>
                        </button>
                    </>
                )}
                <button onClick={toggleAddMenu} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 ${isAddMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                    <Plus className="w-7 h-7" />
                </button>
            </div>
        </>
      )}
    </div>
  );
};

const MainScreen = ({ groups, onNavigate, onCreateGroup }) => (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative overflow-hidden">
      <div className="bg-emerald-500 px-6 pt-12 pb-24 rounded-b-[2.5rem] shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"><User className="w-5 h-5 text-white" /></div><div><p className="text-emerald-100 text-xs">안녕하세요,</p><h2 className="text-white font-bold text-lg">김총무님</h2></div></div>
        </div>
        <div className="flex justify-between items-end"><div><p className="text-emerald-100 text-sm mb-1">이번 달 총 지출</p><h1 className="text-white text-3xl font-bold">452,000원</h1></div></div>
      </div>
      <div className="px-6 -mt-16 z-20 mb-2"><div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex justify-between divide-x divide-slate-100"><div className="flex-1 text-center pr-2"><p className="text-slate-400 text-xs mb-1">받을 돈</p><p className="text-emerald-500 font-bold text-lg">+ 125,000</p></div><div className="flex-1 text-center pl-2"><p className="text-slate-400 text-xs mb-1">보낼 돈</p><p className="text-rose-500 font-bold text-lg">- 32,500</p></div></div></div>
      <div className="flex-1 overflow-y-auto px-6 pb-20 pt-4 scrollbar-hide">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-800">내 모임</h3><button onClick={() => onNavigate('groupList')} className="text-emerald-500 text-xs font-semibold flex items-center hover:bg-emerald-50 px-2 py-1 rounded-lg">전체보기 <ChevronRight className="w-3 h-3 ml-0.5" /></button></div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {groups.map((group) => (
               <button key={group.id} onClick={() => onNavigate('groupDetail', group)} className="min-w-[140px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group text-left">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-2xl">{group.icon}</div>
                <div><h4 className="font-bold text-slate-700 text-sm truncate">{group.name}</h4><p className="text-slate-400 text-xs mt-1">멤버 {group.members}명</p></div>
              </button>
            ))}
            <div className="min-w-[60px] flex items-center justify-center"><button onClick={onCreateGroup} className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 hover:bg-emerald-100 hover:text-emerald-500 transition-colors"><Plus className="w-6 h-6" /></button></div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 py-3 px-6 flex justify-between items-center z-30 pb-6">
        <button className="flex flex-col items-center text-emerald-500 gap-1"><Wallet className="w-6 h-6" /><span className="text-[10px] font-bold">홈</span></button>
        <button className="flex flex-col items-center text-slate-300 gap-1"><Users className="w-6 h-6" /><span className="text-[10px] font-medium">친구</span></button>
        <div className="-mt-8"><button onClick={onCreateGroup} className="w-14 h-14 bg-slate-800 rounded-full shadow-lg shadow-slate-300 flex items-center justify-center text-emerald-400 border-4 border-slate-50"><Plus className="w-7 h-7" /></button></div>
        <button className="flex flex-col items-center text-slate-300 gap-1"><Receipt className="w-6 h-6" /><span className="text-[10px] font-medium">정산</span></button>
        <button className="flex flex-col items-center text-slate-300 gap-1"><Menu className="w-6 h-6" /><span className="text-[10px] font-medium">전체</span></button>
      </div>
    </div>
);

// --- App 메인 ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('main'); 
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  
  // 그룹 데이터 관리
  const [groups, setGroups] = useState([
    { id: 1, name: '제주도 여행', icon: '🏝️', members: 4, createdAt: '2024.11.01' },
    { id: 2, name: '불금 파티', icon: '🍺', members: 6, createdAt: '2024.11.15' }
  ]);

  // 지출 데이터 관리 (더미 데이터)
  const [expenses, setExpenses] = useState([
      { id: 101, groupId: 1, title: "흑돼지 맛집", amount: 128000, payer: "나", date: "2024-11-24", category: "음식" },
      { id: 102, groupId: 1, title: "오설록 카페", amount: 45000, payer: "박지성", date: "2024-11-24", category: "카페" },
  ]);

  const handleNavigate = (screen, params = null) => {
    if (params && screen === 'groupDetail') setSelectedGroup(params);
    if (params && screen === 'expenseDetail') setSelectedExpense(params);
    if (params && screen === 'createExpense') setScannedData(params); // OCR 데이터 전달
    setCurrentScreen(screen);
  };

  const handleCreateGroup = (newGroup) => {
    setGroups([...groups, newGroup]);
    handleNavigate('main');
  };

  const handleCreateExpense = (newExpense) => {
      // 그룹 ID 연결 (현재 선택된 그룹)
      const expenseWithGroup = { ...newExpense, groupId: selectedGroup.id };
      setExpenses([expenseWithGroup, ...expenses]);
      handleNavigate('groupDetail', selectedGroup);
  };

  // 현재 선택된 그룹의 지출만 필터링
  const currentGroupExpenses = selectedGroup 
      ? expenses.filter(e => e.groupId === selectedGroup.id) 
      : [];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[375px] h-[812px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-slate-800 relative ring-4 ring-slate-300/50">
        
        {/* 상태바 */}
        <div className="absolute top-0 w-full h-7 bg-transparent z-50 flex justify-between px-6 items-end pb-1 pointer-events-none">
          <span className="text-[10px] font-bold text-black/50 ml-2">9:41</span>
          <div className="flex gap-1.5 mr-2">
             <div className="w-3 h-3 bg-black/20 rounded-full"></div><div className="w-3 h-3 bg-black/20 rounded-full"></div><div className="w-3 h-3 bg-black/20 rounded-full"></div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-50"></div>

        {/* 라우터 */}
        <div className="h-full w-full pt-6">
          {currentScreen === 'main' && (
            <MainScreen groups={groups} onNavigate={handleNavigate} onCreateGroup={() => handleNavigate('createGroup')} />
          )}
          {currentScreen === 'createGroup' && (
            <CreateGroupScreen onBack={() => handleNavigate('main')} onCreate={handleCreateGroup} />
          )}
          {currentScreen === 'groupList' && (
            <GroupListScreen groups={groups} onBack={() => handleNavigate('main')} onNavigate={handleNavigate} onCreateGroup={() => handleNavigate('createGroup')} />
          )}
          {currentScreen === 'groupDetail' && (
            <GroupDetailScreen 
                group={selectedGroup} 
                expenses={currentGroupExpenses}
                onBack={() => handleNavigate('main')} 
                onNavigate={handleNavigate}
            />
          )}
          {currentScreen === 'ocrScan' && (
              <OCRScanScreen onBack={() => handleNavigate('groupDetail', selectedGroup)} onScanComplete={(data) => handleNavigate('createExpense', data)} />
          )}
          {currentScreen === 'createExpense' && (
              <CreateExpenseScreen 
                  initialData={scannedData} 
                  onBack={() => handleNavigate('groupDetail', selectedGroup)} 
                  onSave={handleCreateExpense} 
              />
          )}
          {currentScreen === 'expenseDetail' && (
              <ExpenseDetailScreen expense={selectedExpense} onBack={() => handleNavigate('groupDetail', selectedGroup)} />
          )}
        </div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-50"></div>
      </div>
    </div>
  );
}