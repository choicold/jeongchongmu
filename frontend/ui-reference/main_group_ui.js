import React, { useState } from 'react';
import { 
  Wallet, User, ArrowRight, Users, Plus, Bell, Menu,
  ChevronRight, Receipt, LogOut, ArrowLeft, Copy, Settings, Check, MapPin
} from 'lucide-react';

// --- 유틸리티 ---
const formatMoney = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// --- 공통 컴포넌트: 헤더 ---
const Header = ({ title, onBack, rightAction }) => (
  <div className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-10 border-b border-slate-100">
    <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
      <ArrowLeft className="w-6 h-6" />
    </button>
    <h1 className="font-bold text-lg text-slate-800">{title}</h1>
    <div className="w-10 flex justify-end">
      {rightAction}
    </div>
  </div>
);

// --- 2.3 그룹 생성 화면 ---
const CreateGroupScreen = ({ onBack, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('✈️');

  const icons = ['✈️', '🍺', '☕', '🏠', '🎁', '⚽', '🎤', '🛒', '🏕️', '🎓'];

  const handleSubmit = () => {
    if (!groupName) return;
    const newGroup = {
      id: Date.now(), // 고유 ID 생성
      name: groupName,
      description: description,
      icon: selectedIcon,
      members: 1, // 생성자 본인
      createdAt: new Date().toLocaleDateString()
    };
    onCreate(newGroup);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in">
      <Header title="새 모임 만들기" onBack={onBack} />
      
      <div className="p-6 flex-1 overflow-y-auto">
        {/* 아이콘 선택 */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl border-2 border-dashed border-slate-300 relative">
            {selectedIcon}
            <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1.5 border-2 border-white">
               <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <p className="text-xs text-center text-slate-400 mb-4">모임을 대표할 아이콘을 선택하세요</p>
        <div className="flex gap-2 justify-center mb-8 flex-wrap px-4">
          {icons.map((icon) => (
            <button 
              key={icon}
              onClick={() => setSelectedIcon(icon)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${selectedIcon === icon ? 'bg-emerald-100 border-2 border-emerald-500 scale-110' : 'bg-slate-50 border border-slate-100'}`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* 입력 폼 */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">모임 이름 <span className="text-emerald-500">*</span></label>
            <input 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              type="text" 
              placeholder="예: 제주도 여행, 불금 파티" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">한줄 설명 (선택)</label>
            <input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              type="text" 
              placeholder="모임의 목적을 입력해주세요" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-white safe-area-bottom">
        <button 
          onClick={handleSubmit}
          disabled={!groupName}
          className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${groupName ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          모임 생성 완료
        </button>
      </div>
    </div>
  );
};

// --- 2.1 그룹 리스트 화면 (전체보기) ---
const GroupListScreen = ({ groups, onBack, onNavigate, onCreateGroup }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <Header title="내 모임 전체" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-2 gap-4">
          {/* 그룹 추가 카드 */}
          <button 
            onClick={onCreateGroup}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-500 transition-all"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold">새 모임 만들기</span>
          </button>

          {/* 그룹 리스트 */}
          {groups.map((group) => (
             <button 
              key={group.id}
              onClick={() => onNavigate('groupDetail', group)}
              className="aspect-square bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group text-left hover:border-emerald-500 transition-colors"
             >
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-2xl">
                {group.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-700 text-sm truncate">{group.name}</h4>
                <p className="text-slate-400 text-xs mt-1">멤버 {group.members}명</p>
              </div>
              <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-1/2"></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 2.2 그룹 상세 화면 ---
const GroupDetailScreen = ({ group, onBack }) => {
  const [activeTab, setActiveTab] = useState('expenses'); // expenses, members, settlement
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!group) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      {/* 상세 화면 헤더 */}
      <div className="bg-white pb-6 pt-4 px-6 rounded-b-[2rem] shadow-sm z-10">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            {group.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">{group.name}</h1>
            <p className="text-slate-500 text-sm mt-1">멤버 {group.members}명 • {group.createdAt || '방금 전'} 생성</p>
          </div>
        </div>

        {/* 초대 코드 */}
        <div 
          onClick={handleCopyCode}
          className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">초대 코드</span>
            <span className="text-sm font-mono font-bold text-slate-800">INV-{group.id.toString().slice(-4)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs transition-colors ${copied ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
              {copied ? '복사됨!' : '복사'}
            </span>
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-slate-200 bg-white sticky top-0 z-0">
        {['expenses', 'members', 'settlement'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === tab ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            {tab === 'expenses' && '지출 내역'}
            {tab === 'members' && '멤버'}
            {tab === 'settlement' && '정산 현황'}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {activeTab === 'expenses' && (
          <div className="space-y-3 pb-20">
             <div className="bg-emerald-500 rounded-2xl p-5 text-white shadow-lg mb-4">
                <p className="text-emerald-100 text-xs mb-1">현재까지 총 지출</p>
                <div className="flex items-baseline gap-1">
                  <h2 className="text-3xl font-bold">128,000</h2>
                  <span className="text-lg">원</span>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-400/50 flex justify-between text-sm">
                   <span>나의 지출</span>
                   <span className="font-bold">128,000원</span>
                </div>
             </div>

            <p className="text-xs font-bold text-slate-400 mb-2 pl-1">최근 활동</p>
            {[
              { title: "첫 번째 지출", amount: 128000, payer: "나", time: "방금 전", category: "음식" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                    {item.category === '음식' ? '🥓' : '💰'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400">{item.payer} 결제 • {item.time}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-800 text-sm">{formatMoney(item.amount)}원</span>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="space-y-3">
             <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-700 text-sm">김총무 (나)</p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold">OWNER</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded-lg font-medium">정산완료</span>
              </div>
            
            <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-bold mt-4 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> 멤버 초대하기
            </button>
          </div>
        )}

        {activeTab === 'settlement' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Receipt className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">아직 생성된 정산이 없습니다.</p>
                <button className="mt-4 px-6 py-2 bg-emerald-500 text-white text-sm font-bold rounded-full shadow-lg shadow-emerald-200">
                    정산 시작하기
                </button>
            </div>
        )}
      </div>

      {activeTab === 'expenses' && (
        <div className="absolute bottom-6 right-6">
          <button className="w-14 h-14 bg-emerald-500 rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors">
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- 메인 화면 (대시보드) ---
const MainScreen = ({ groups, onNavigate, onCreateGroup }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative overflow-hidden">
      {/* 헤더 */}
      <div className="bg-emerald-500 px-6 pt-12 pb-24 rounded-b-[2.5rem] shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-xs">안녕하세요,</p>
              <h2 className="text-white font-bold text-lg">김총무님</h2>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-400 rounded-full border border-emerald-500"></span>
            </button>
          </div>
        </div>

        {/* 정산 요약 */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-emerald-100 text-sm mb-1">이번 달 총 지출</p>
            <h1 className="text-white text-3xl font-bold">452,000원</h1>
          </div>
        </div>
      </div>

      {/* 플로팅 카드 */}
      <div className="px-6 -mt-16 z-20 mb-2">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 flex justify-between divide-x divide-slate-100">
          <div className="flex-1 text-center pr-2">
            <p className="text-slate-400 text-xs mb-1">받을 돈</p>
            <p className="text-emerald-500 font-bold text-lg">+ 125,000</p>
          </div>
          <div className="flex-1 text-center pl-2">
            <p className="text-slate-400 text-xs mb-1">보낼 돈</p>
            <p className="text-rose-500 font-bold text-lg">- 32,500</p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 스크롤 */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 pt-4 scrollbar-hide">
        
        {/* 진행 중인 모임 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800">내 모임</h3>
            <button 
              onClick={() => onNavigate('groupList')}
              className="text-emerald-500 text-xs font-semibold flex items-center hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
            >
              전체보기 <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          
          {/* 가로 스크롤 모임 리스트 */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            
            {/* 동적으로 렌더링되는 그룹 리스트 */}
            {groups.map((group) => (
               <button 
                key={group.id}
                onClick={() => onNavigate('groupDetail', group)}
                className="min-w-[140px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group text-left hover:border-emerald-500 transition-colors"
               >
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-2xl">
                  {group.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-sm truncate">{group.name}</h4>
                  <p className="text-slate-400 text-xs mt-1">멤버 {group.members}명</p>
                </div>
                <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-1/2"></div>
                </div>
              </button>
            ))}

            {/* 모임 추가 버튼 */}
            <div className="min-w-[60px] flex items-center justify-center">
               <button 
                  onClick={onCreateGroup}
                  className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 hover:bg-emerald-100 hover:text-emerald-500 transition-colors"
               >
                  <Plus className="w-6 h-6" />
               </button>
            </div>
          </div>
        </div>

        {/* 최근 활동 내역 */}
        <div>
          <h3 className="font-bold text-slate-800 mb-3">최근 활동</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1 divide-y divide-slate-50">
            {[
              { title: "강남역 삼겹살", time: "방금 전", amount: "128,000원", user: "나 (결제)", type: "income", icon: "🥓" },
              { title: "2차 노래방", time: "2시간 전", amount: "-15,000원", user: "박지성 외 3명", type: "expense", icon: "🎤" },
              { title: "스타벅스 커피", time: "어제", amount: "-4,500원", user: "정산 완료", type: "completed", icon: "☕" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-lg mr-3 shadow-inner">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-700 text-sm">{item.title}</h4>
                  <p className="text-slate-400 text-xs">{item.user} • {item.time}</p>
                </div>
                <div className={`font-bold text-sm ${item.type === 'income' ? 'text-emerald-500' : item.type === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 py-3 px-6 flex justify-between items-center z-30 pb-6">
        <button className="flex flex-col items-center text-emerald-500 gap-1">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold">홈</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 gap-1 hover:text-slate-500 transition-colors">
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">친구</span>
        </button>
        
        {/* 중앙 FAB (모임 생성 바로가기) */}
        <div className="-mt-8">
          <button 
            onClick={onCreateGroup}
            className="w-14 h-14 bg-slate-800 rounded-full shadow-lg shadow-slate-300 flex items-center justify-center text-emerald-400 border-4 border-slate-50 hover:scale-105 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <button className="flex flex-col items-center text-slate-300 gap-1 hover:text-slate-500 transition-colors">
          <Receipt className="w-6 h-6" />
          <span className="text-[10px] font-medium">정산</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 gap-1 hover:text-slate-500 transition-colors">
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-medium">전체</span>
        </button>
      </div>
    </div>
  );
};

// --- 메인 App 컴포넌트 ---
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('main'); // main, createGroup, groupDetail, groupList
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // 그룹 데이터 관리 (초기 더미 데이터)
  const [groups, setGroups] = useState([
    { id: 1, name: '제주도 여행', icon: '🏝️', members: 4, createdAt: '2024.11.01' },
    { id: 2, name: '불금 파티', icon: '🍺', members: 6, createdAt: '2024.11.15' }
  ]);

  // 화면 전환 핸들러
  const handleNavigate = (screen, params = null) => {
    if (params) setSelectedGroup(params);
    setCurrentScreen(screen);
  };

  // 새 그룹 생성 핸들러
  const handleCreateGroup = (newGroup) => {
    setGroups([...groups, newGroup]);
    handleNavigate('main');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[375px] h-[812px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] border-slate-800 relative ring-4 ring-slate-300/50">
        
        {/* 상태바 */}
        <div className="absolute top-0 w-full h-7 bg-transparent z-50 flex justify-between px-6 items-end pb-1 pointer-events-none">
          <span className="text-[10px] font-bold text-black/50 ml-2">9:41</span>
          <div className="flex gap-1.5 mr-2">
             <div className="w-3 h-3 bg-black/20 rounded-full"></div>
             <div className="w-3 h-3 bg-black/20 rounded-full"></div>
             <div className="w-3 h-3 bg-black/20 rounded-full"></div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-50"></div>

        {/* 라우터 */}
        <div className="h-full w-full pt-6">
          
          {currentScreen === 'main' && (
            <MainScreen 
              groups={groups}
              onNavigate={handleNavigate}
              onCreateGroup={() => handleNavigate('createGroup')}
            />
          )}

          {currentScreen === 'createGroup' && (
            <CreateGroupScreen 
              onBack={() => handleNavigate('main')} 
              onCreate={handleCreateGroup}
            />
          )}

          {currentScreen === 'groupDetail' && (
            <GroupDetailScreen 
              group={selectedGroup} 
              onBack={() => handleNavigate('main')}
            />
          )}

          {/* 전체보기(리스트) 화면 연결 */}
          {currentScreen === 'groupList' && (
            <GroupListScreen 
              groups={groups}
              onBack={() => handleNavigate('main')}
              onNavigate={handleNavigate}
              onCreateGroup={() => handleNavigate('createGroup')}
            />
          )}
        </div>
        
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-50"></div>
      </div>
    </div>
  );
}