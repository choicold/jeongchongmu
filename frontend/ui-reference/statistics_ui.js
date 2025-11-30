// [File 1] StatisticsScreen Component
const StatisticsScreen = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('category'); // category, monthly
  
    // 더미 데이터: 카테고리별 지출
    const categoryData = [
      { name: "식비", amount: 256000, percent: 45, color: "#10B981", icon: "🥓" }, // Emerald-500
      { name: "술/유흥", amount: 142000, percent: 25, color: "#3B82F6", icon: "🍺" }, // Blue-500
      { name: "카페/디저트", amount: 85000, percent: 15, color: "#F59E0B", icon: "☕" }, // Amber-500
      { name: "쇼핑/기타", amount: 85000, percent: 15, color: "#94A3B8", icon: "🛒" }, // Slate-400
    ];
  
    // 더미 데이터: 월별 추이
    const monthlyTrend = [
      { month: "8월", amount: 320000, height: "60%" },
      { month: "9월", amount: 450000, height: "80%" },
      { month: "10월", amount: 280000, height: "50%" },
      { month: "11월", amount: 568000, height: "100%", current: true },
    ];
  
    // 총 지출 계산
    const totalAmount = categoryData.reduce((acc, cur) => acc + cur.amount, 0);
  
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        <Header 
          title="지출 리포트" 
          onBack={onBack} 
          rightAction={<MoreHorizontal className="w-6 h-6 text-slate-400" />}
        />
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {/* 월 선택기 */}
          <div className="flex justify-center items-center gap-4 mb-6">
              <button className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-emerald-500 transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h2 className="text-xl font-bold text-slate-800">2025년 11월</h2>
              <button className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-emerald-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
              </button>
          </div>
  
          {/* 1. 총 지출 요약 카드 (Dark Theme) */}
          <div className="bg-slate-800 rounded-[2rem] p-7 shadow-xl shadow-slate-300/50 mb-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
              
              <p className="text-slate-400 text-sm font-medium mb-1">이번 달 총 지출</p>
              <h1 className="text-4xl font-extrabold mb-4">{formatMoney(totalAmount)}<span className="text-2xl text-slate-500 font-medium">원</span></h1>
              
              <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <div className="bg-rose-500 rounded-full p-0.5">
                      <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-200">지난달보다 <span className="text-white font-bold">118,000원</span> 더 썼어요</span>
              </div>
          </div>
  
          {/* 2. 통계 탭 */}
          <div className="bg-white p-1.5 rounded-2xl flex mb-6 shadow-sm border border-slate-100">
              <button 
                  onClick={() => setActiveTab('category')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'category' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  카테고리별
              </button>
              <button 
                  onClick={() => setActiveTab('monthly')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'monthly' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  월별 추이
              </button>
          </div>
  
          {activeTab === 'category' && (
              <div className="animate-fade-in">
                  {/* 도넛 차트 */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-6 flex flex-col items-center justify-center relative">
                      {/* CSS Conic Gradient로 차트 구현 */}
                      <div 
                          className="w-48 h-48 rounded-full relative shadow-inner"
                          style={{
                              background: `conic-gradient(
                                  #10B981 0% 45%, 
                                  #3B82F6 45% 70%, 
                                  #F59E0B 70% 85%, 
                                  #94A3B8 85% 100%
                              )`
                          }}
                      >
                          {/* 차트 가운데 구멍 */}
                          <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-lg">
                              <span className="text-3xl">🥓</span>
                              <span className="text-xs font-bold text-emerald-600 mt-1">식비 45%</span>
                          </div>
                      </div>
                  </div>
  
                  {/* 카테고리 리스트 */}
                  <h3 className="font-bold text-slate-700 mb-3 px-1">상세 내역</h3>
                  <div className="space-y-3">
                      {categoryData.map((cat, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform">
                                      {cat.icon}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                          <p className="font-bold text-slate-700 text-sm">{cat.name}</p>
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{cat.percent}%</span>
                                      </div>
                                      {/* 게이지 바 */}
                                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}></div>
                                      </div>
                                  </div>
                              </div>
                              <span className="font-bold text-slate-800">{formatMoney(cat.amount)}원</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}
  
          {activeTab === 'monthly' && (
              <div className="animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 h-80 flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-slate-700">최근 4개월 지출</h3>
                          <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-1 rounded font-bold">+12% 증가</span>
                      </div>
                      
                      {/* 막대 차트 */}
                      <div className="flex items-end justify-between h-full px-2 gap-4">
                          {monthlyTrend.map((data, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                                  <div className="text-[10px] font-bold text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {formatMoney(data.amount / 10000)}만
                                  </div>
                                  <div 
                                      className={`w-full rounded-t-xl relative transition-all duration-500 ${data.current ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                                      style={{ height: data.height }}
                                  >
                                      {data.current && (
                                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45"></div>
                                      )}
                                  </div>
                                  <span className={`text-xs font-bold ${data.current ? 'text-emerald-600' : 'text-slate-400'}`}>{data.month}</span>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="mt-6 bg-slate-50 p-6 rounded-3xl text-center">
                      <p className="text-slate-500 text-sm mb-2">💡 <strong>알뜰 팁</strong></p>
                      <p className="text-slate-700 text-sm leading-relaxed">
                          이번 달은 <span className="text-emerald-600 font-bold">식비</span> 지출이 가장 많아요.<br/>
                          배달보다는 집밥을 도전해보는 건 어떨까요?
                      </p>
                  </div>
              </div>
          )}
        </div>
      </div>
    );
  };

  // [File 2] StatisticsScreen Component (리디자인 v2)
const StatisticsScreen = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState('category'); // category, monthly
  
    // 더미 데이터
    const categoryData = [
      { name: "식비", amount: 256000, percent: 45, color: "bg-emerald-500", icon: "🥓" },
      { name: "술/유흥", amount: 142000, percent: 25, color: "bg-blue-500", icon: "🍺" },
      { name: "카페/디저트", amount: 85000, percent: 15, color: "bg-amber-500", icon: "☕" },
      { name: "쇼핑/기타", amount: 85000, percent: 15, color: "bg-slate-400", icon: "🛒" },
    ];
  
    const monthlyTrend = [
      { month: "8월", amount: 320000, height: "60%" },
      { month: "9월", amount: 450000, height: "80%" },
      { month: "10월", amount: 280000, height: "50%" },
      { month: "11월", amount: 568000, height: "100%", current: true },
    ];
  
    const totalAmount = categoryData.reduce((acc, cur) => acc + cur.amount, 0);
  
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        <Header 
          title="통계" 
          onBack={onBack} 
          rightAction={<MoreHorizontal className="w-6 h-6 text-slate-400" />}
        />
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* 1. 상단 요약 (미니멀 스타일) */}
          <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 mb-2 bg-slate-100 rounded-full px-3 py-1">
                  <span className="text-xs font-bold text-slate-500">2025년 11월</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex justify-center items-end gap-1 mb-2">
                  <h1 className="text-4xl font-extrabold text-slate-800">{formatMoney(totalAmount)}</h1>
                  <span className="text-xl text-slate-400 font-bold mb-1">원</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-emerald-600 text-xs font-bold">
                  <TrendingUp className="w-3 h-3" /> 지난달보다 12% 증가
              </div>
          </div>
  
          {/* 2. 탭 스위처 (세그먼트 스타일) */}
          <div className="bg-slate-100 p-1 rounded-2xl flex mb-8">
              {['category', 'monthly'].map(tab => (
                  <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      {tab === 'category' ? '카테고리' : '월별 추이'}
                  </button>
              ))}
          </div>
  
          {/* 3. 컨텐츠 영역 */}
          {activeTab === 'category' ? (
              <div className="space-y-6 animate-fade-in">
                  {categoryData.map((cat, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                                      {cat.icon}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-700">{cat.name}</p>
                                      <p className="text-xs text-slate-400 font-medium">{cat.percent}%</p>
                                  </div>
                              </div>
                              <span className="font-bold text-slate-800">{formatMoney(cat.amount)}원</span>
                          </div>
                          {/* 가로형 막대 그래프 (Progress Bar) */}
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full rounded-full transition-all duration-1000 ease-out ${cat.color}`} 
                                  style={{ width: `${cat.percent}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="animate-fade-in">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-72 flex items-end justify-between px-4 mb-6">
                      {/* 세로형 막대 그래프 */}
                      {monthlyTrend.map((data, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-3 w-12 group relative h-full justify-end">
                              <div 
                                  className={`w-full rounded-t-xl transition-all duration-700 relative group-hover:opacity-80 ${data.current ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                  style={{ height: data.height }}
                              >
                                   {/* 툴팁 (호버 시 표시) */}
                                   <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                      {formatMoney(data.amount)}
                                   </div>
                              </div>
                              <span className={`text-xs font-bold ${data.current ? 'text-emerald-600' : 'text-slate-400'}`}>{data.month}</span>
                          </div>
                      ))}
                  </div>
                  
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                      <div className="flex gap-3">
                          <div className="bg-white p-2 rounded-full h-fit shadow-sm text-emerald-500">
                              <Coins className="w-5 h-5" />
                          </div>
                          <div>
                              <h4 className="font-bold text-emerald-900 text-sm mb-1">소비 분석</h4>
                              <p className="text-emerald-700/80 text-xs leading-relaxed">
                                  이번 달은 지난 달보다 지출이 늘었어요.<br/>
                                  특히 <span className="font-bold underline">식비</span>가 전체의 45%를 차지하고 있네요!
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    );
  };