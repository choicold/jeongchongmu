// --- [리디자인] 3.2 지출 상세 화면 (ExpenseDetailScreen) ---
const ExpenseDetailScreen = ({ expense, onBack }) => {
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  
    if (!expense) return null;
  
    // 참여 멤버 더미 데이터 (시각화용)
    const mockParticipants = [
      { name: '나', color: 'bg-emerald-100 text-emerald-600' },
      { name: '박', color: 'bg-blue-100 text-blue-600' },
      { name: '이', color: 'bg-amber-100 text-amber-600' },
      { name: '김', color: 'bg-purple-100 text-purple-600' },
    ];
  
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        <Header 
          title="지출 상세" 
          onBack={onBack} 
          rightAction={
            <div className="flex gap-2">
               <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <Edit2 className="w-5 h-5" />
               </button>
               <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
          }
        />
  
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           {/* 1. 핵심 정보 카드 (금액, 타이틀) */}
           <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 mb-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-full mb-4 text-3xl">
                 {expense.category === '음식' ? '🥓' : expense.category === '카페' ? '☕' : '🛒'}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1 leading-tight">{expense.title}</h2>
              <div className="flex justify-center items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{formatMoney(expense.amount)}</span>
                  <span className="text-xl text-slate-500 font-bold">원</span>
              </div>
           </div>
  
           {/* 2. 세부 정보 카드 (날짜, 결제자, 카테고리) */}
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex justify-around">
              <div className="text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold mb-1">날짜</p>
                  <p className="text-sm font-bold text-slate-700">{formatDate(expense.date)}</p>
              </div>
              <div className="text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold mb-1">결제자</p>
                  <p className="text-sm font-bold text-slate-700">{expense.payer}</p>
              </div>
              <div className="text-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Receipt className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold mb-1">카테고리</p>
                  <p className="text-sm font-bold text-slate-700">{expense.category}</p>
              </div>
           </div>
  
           {/* 3. 참여 멤버 & N빵 정보 */}
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <span className="text-base font-bold text-slate-800">함께한 멤버 <span className="text-slate-400 font-normal">(4명)</span></span>
                  </div>
                  <div className="bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="text-xs font-bold text-emerald-600">1인당</span>
                      <span className="text-sm font-bold text-emerald-700">{formatMoney(Math.floor(expense.amount / 4))}원</span>
                  </div>
              </div>
              
              <div className="flex -space-x-3">
                  {mockParticipants.map((p, i) => (
                      <div key={i} className={`w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-sm font-bold shadow-sm ${p.color}`}>
                          {p.name}
                      </div>
                  ))}
              </div>
           </div>
  
           {/* 4. 영수증 상세 내역 (아코디언 UI) */}
           {expense.items && expense.items.length > 0 && (
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                   <button 
                      onClick={() => setIsReceiptOpen(!isReceiptOpen)}
                      className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                   >
                       <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                               <Receipt className="w-5 h-5 text-slate-600" />
                           </div>
                           <span className="text-base font-bold text-slate-800">영수증 상세 내역</span>
                       </div>
                       {isReceiptOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                   </button>
                   
                   {isReceiptOpen && (
                       <div className="p-6 pt-2 border-t border-slate-100">
                           <div className="space-y-3">
                               {expense.items.map((item, idx) => (
                                   <div key={idx} className="flex justify-between items-center text-sm group">
                                       <span className="text-slate-600 font-medium">{item.name}</span>
                                       <div className="flex-1 border-b border-dashed border-slate-200 mx-3 opacity-50"></div>
                                       <span className="font-bold text-slate-700">{formatMoney(item.price)}</span>
                                   </div>
                               ))}
                           </div>
                           <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
                               <span className="text-sm font-bold text-slate-500">합계</span>
                               <span className="text-lg font-bold text-emerald-600">{formatMoney(expense.amount)}원</span>
                           </div>
                       </div>
                   )}
               </div>
           )}
        </div>
      </div>
    );
  };