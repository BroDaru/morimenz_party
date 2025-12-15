import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { User, X, Home, Edit3, Settings, Search, RotateCcw, Download, Camera, Cloud, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';

// [추가] Firebase 연동
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from './firebase'; 

import characterData from './data/character.json';
import equipmentData from './data/myeongryun.json';

// --- [2] 초기 파티 데이터 설정 ---
const INITIAL_DATA = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `파티 ${i + 1}`,
  slots: Array.from({ length: 4 }, (_, j) => ({ id: j, character: null, equipments: [null, null] }))
}));

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const ELEMENT_ORDER = ["Chaos", "Aequor", "Caro", "Ultra"];
const ELEMENT_ICONS = {
  "Chaos": "/morimenz_party/images/chaos.png",
  "Aequor": "/morimenz_party/images/aequor.png",
  "Caro": "/morimenz_party/images/caro.png",
  "Ultra": "/morimenz_party/images/ultra.png"
};
const ROLE_ORDER = ["데미지형", "방어형", "보조형"];

// --- [신규] 덮어쓸 파티 선택 모달 ---
const TargetSelectionModal = ({ isOpen, onClose, parties, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-2xl rounded-xl border-2 border-slate-600 shadow-2xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <div>
            <h3 className="text-xl font-bold text-yellow-500">저장할 위치 선택</h3>
            <p className="text-sm text-slate-400 mt-1">어떤 파티에 덮어씌우시겠습니까? (기존 데이터는 삭제됩니다)</p>
          </div>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {parties.map((party, index) => (
            <button 
              key={party.id} 
              onClick={() => onSelect(party.id)}
              className="flex flex-col items-center p-3 bg-slate-800 border border-slate-600 rounded-lg hover:border-yellow-500 hover:bg-slate-700 transition-all group"
            >
              <span className="font-serif text-2xl text-slate-500 group-hover:text-yellow-500 mb-1">{ROMAN_NUMERALS[index]}</span>
              <span className="text-sm font-bold text-white truncate w-full text-center">{party.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">취소</button>
        </div>
      </div>
    </div>
  );
};

// --- [수정] 추천 덱 공유 모달 ---
const ShareModal = ({ isOpen, onClose, party }) => {
  const [author, setAuthor] = useState("망붕이");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription(""); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!author.trim()) return alert("작성자 이름을 입력해주세요.");
    
    const hasCharacter = party.slots.some(s => s.character);
    if (!hasCharacter) return alert("최소한 한 명 이상의 캐릭터가 배치되어야 합니다.");

    setIsSubmitting(true);
    try {
      const deckData = {
        name: party.name,
        author: author,
        description: description,
        createdAt: serverTimestamp(),
        slots: party.slots.map(s => ({
          charId: s.character ? s.character.id : null,
          equipIds: s.equipments.map(e => e ? e.id : null)
        }))
      };

      await addDoc(collection(db, "recommended_decks"), deckData);
      alert("성공적으로 공유되었습니다!");
      onClose();
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("업로드 중 오류가 발생했습니다. (Firebase 설정을 확인하세요)");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border-2 border-slate-600 shadow-2xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-yellow-500">서버에 덱 공유하기</h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
        </div>
        
        <div>
          <label className="block text-sm text-slate-400 mb-1">작성자</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" value={author} onChange={e => setAuthor(e.target.value)} placeholder="닉네임" />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">한줄 코멘트</label>
          <input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" value={description} onChange={e => setDescription(e.target.value)} placeholder="이 덱의 특징은..." />
        </div>

        <button onClick={handleShare} disabled={isSubmitting} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex justify-center items-center gap-2 mt-2">
          {isSubmitting ? "업로드 중..." : <><Cloud size={20}/> 공유하기</>}
        </button>
      </div>
    </div>
  );
};

// --- [수정] 추천 덱 리스트 페이지 ---
const RecommendPage = ({ onImportDeck, parties }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState(null); // 가져오기 위해 선택된 덱
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const q = query(collection(db, "recommended_decks"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const loadedDecks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDecks(loadedDecks);
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, []);

  // 1. 가져오기 버튼 클릭 -> 모달 열기
  const handleImportClick = (deck) => {
    setSelectedDeck(deck);
    setIsTargetModalOpen(true);
  };

  // 2. 모달에서 파티 선택 완료
  const handleTargetSelect = (targetPartyId) => {
    if (!selectedDeck) return;
    
    // 타겟 파티 이름 찾기 (confirm 메시지용)
    const targetPartyName = parties.find(p => p.id === targetPartyId)?.name || "선택한 파티";

    if(window.confirm(`'${selectedDeck.name}' 덱을 '${targetPartyName}'에 덮어씌우시겠습니까?`)) {
      onImportDeck(selectedDeck, targetPartyId); 
      setIsTargetModalOpen(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-20">
      <div className="max-w-4xl mx-auto mt-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><Home size={24}/></button>
          <h1 className="text-3xl font-bold text-yellow-500">⭐ 유저 추천 덱 게시판</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">데이터를 불러오는 중입니다...</div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20 text-slate-500">등록된 덱이 없습니다. 첫 번째 공유자가 되어보세요!</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {decks.map(deck => (
              <div key={deck.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-yellow-500/50 transition-all shadow-lg flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{deck.name}</h3>
                    <p className="text-sm text-slate-400">by {deck.author}</p>
                  </div>
                  {/* [수정] 바로 적용이 아니라 선택 함수 호출 */}
                  <button onClick={() => handleImportClick(deck)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Download size={16}/> 가져오기
                  </button>
                </div>
                
                <p className="text-slate-300 text-sm mb-4 bg-slate-800 p-2 rounded italic">"{deck.description || '코멘트 없음'}"</p>

                <div className="grid grid-cols-4 gap-2 mt-auto">
                  {deck.slots.map((slot, idx) => {
                    const char = characterData.find(c => c.id === slot.charId);
                    return (
                      <div key={idx} className="aspect-[5/9] bg-black rounded border border-slate-700 overflow-hidden">
                        {char ? <img src={char.img} className="w-full h-full object-cover" alt={char.name} /> : <div className="w-full h-full bg-slate-800"/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* [추가] 덮어쓰기 대상 선택 모달 */}
      <TargetSelectionModal 
        isOpen={isTargetModalOpen} 
        onClose={() => setIsTargetModalOpen(false)} 
        parties={parties} 
        onSelect={handleTargetSelect} 
      />
    </div>
  );
};

// --- [기존] SelectionModal (유지) ---
const SelectionModal = ({ isOpen, onClose, title, data, onSelect, usedIds, type, activeElements = [], selectedId }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedSubStat, setSelectedSubStat] = useState(null);
  
    useEffect(() => {
      if (isOpen) {
        setSearchTerm("");
        setSelectedElement(null);
        setSelectedRole(null);
        setSelectedSubStat(null);
      }
    }, [isOpen]);
  
    const subStatOptions = useMemo(() => {
      if (type === 'char') return [];
      const stats = new Set();
      data.forEach(item => {
        if (item.sub_stats) {
          const name = item.sub_stats.trim();
          if (name && name !== "몰루") {
            stats.add(name);
          }
        }
      });
      return Array.from(stats).sort();
    }, [data, type]);
  
    const filteredData = data.filter(item => {
      const lowerSearch = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(lowerSearch);
      const matchStats = type !== 'char' && item.stats && item.stats.toLowerCase().includes(lowerSearch);
      
      if (!matchName && !matchStats) return false;
      
      if (type === 'char') {
        if (activeElements.length >= 2) {
          const charElement = item.element;
          const isAll = charElement.toLowerCase() === 'all';
          const isAllowed = activeElements.includes(charElement);
          if (!isAll && !isAllowed && item.id !== selectedId) return false;
        }
  
        const charElement = item.element ? item.element.toLowerCase() : "";
        const isAllElement = charElement === "all";
        
        const matchElement = !selectedElement || 
                             isAllElement || 
                             charElement === selectedElement.toLowerCase();
  
        const matchRole = !selectedRole || item.role === selectedRole;
  
        return matchElement && matchRole;
      } else {
        const matchSubStat = !selectedSubStat || (item.sub_stats && item.sub_stats === selectedSubStat);
        return matchSubStat;
      }
    });
  
    const sortedData = useMemo(() => {
      if (!selectedId) return filteredData;
  
      const index = filteredData.findIndex(item => item.id === selectedId);
      
      if (index === -1) return filteredData;
  
      const newArr = [...filteredData];
      const [selectedItem] = newArr.splice(index, 1);
      newArr.unshift(selectedItem);
      
      return newArr;
    }, [filteredData, selectedId]);
  
    if (!isOpen) return null;
  
    const gridClass = type === 'char' ? 'grid-cols-4' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
    const aspectClass = type === 'char' ? 'aspect-[5/9]' : 'aspect-[1/2]';
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-6xl rounded-xl border-2 border-slate-600 shadow-2xl overflow-hidden m-4 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
          
          <div className="p-4 border-b border-slate-700 bg-slate-950 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-yellow-500">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
                <X size={28} />
              </button>
            </div>
  
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder={`${title === '캐릭터 선택' ? '캐릭터' : '명륜'} 이름/옵션 검색...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
                />
              </div>
  
              <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-1 w-full md:w-auto">
                {type === 'char' && (
                  <>
                    <div className="flex gap-2 shrink-0">
                      {ELEMENT_ORDER.map((element) => {
                        let isDisabled = false;
                        const currentItemElement = data.find(d => d.id === selectedId)?.element;
                        if (activeElements.length >= 2 && !activeElements.includes(element)) {
                             if(currentItemElement !== element) isDisabled = true;
                        }
  
                        return (
                          <button
                            key={element}
                            disabled={isDisabled}
                            onClick={() => setSelectedElement(prev => prev === element ? null : element)}
                            className={`
                              w-10 h-10 rounded-full border-2 overflow-hidden transition-all p-1 bg-slate-800
                              ${isDisabled ? 'opacity-20 cursor-not-allowed grayscale' : ''}
                              ${!isDisabled && selectedElement === element 
                                ? 'border-yellow-500 bg-yellow-900/30 shadow-[0_0_10px_rgba(234,179,8,0.8)] scale-110' 
                                : !isDisabled && 'border-slate-600 hover:border-slate-400 opacity-60 hover:opacity-100'}
                            `}
                            title={element}
                          >
                            <img src={ELEMENT_ICONS[element]} alt={element} className="w-full h-full object-contain" />
                          </button>
                        );
                      })}
                    </div>
                    <div className="w-[1px] h-8 bg-slate-700 mx-1 shrink-0"></div>
                    <div className="flex gap-2 shrink-0">
                      {ROLE_ORDER.map(role => (
                        <button
                          key={role}
                          onClick={() => setSelectedRole(prev => prev === role ? null : role)}
                          className={`
                            px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
                            ${selectedRole === role
                              ? 'bg-slate-800 text-yellow-400 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                              : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white'}
                          `}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </>
                )}
  
                {type !== 'char' && subStatOptions.length > 0 && (
                  <div className="flex gap-2 shrink-0">
                    {subStatOptions.map(stat => (
                      <button
                        key={stat}
                        onClick={() => setSelectedSubStat(prev => prev === stat ? null : stat)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
                          ${selectedSubStat === stat
                            ? 'bg-slate-800 text-yellow-400 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                            : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white'}
                        `}
                      >
                        {stat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
  
          <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
            {sortedData.length > 0 ? (
              <div className={`grid ${gridClass} gap-4`}>
                {sortedData.map((item) => {
                  const isSelected = item.id === selectedId;
                  const isUsedOther = usedIds.includes(item.id) && !isSelected;
                  const elKey = item.element ? item.element.charAt(0).toUpperCase() + item.element.slice(1).toLowerCase() : "";
                  const displayKeyword = item.keyword;
  
                  return (
                    <button
                      key={item.id}
                      disabled={isUsedOther}
                      onClick={() => onSelect(isSelected ? null : item)}
                      className={`
                        relative group flex flex-col items-center rounded-lg border-2 transition-all overflow-visible
                        ${isUsedOther
                          ? 'border-slate-800 opacity-40 grayscale cursor-not-allowed' 
                          : isSelected 
                            ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-[1.02]' 
                            : 'border-slate-600 hover:border-yellow-500 hover:scale-[1.02] shadow-lg bg-slate-800'
                        }
                      `}
                    >
                      <div className={`w-full ${aspectClass} bg-slate-950 relative overflow-hidden rounded-t-md`}>
                         <img src={item.img} alt={item.name} className="w-full h-full object-cover object-top" loading="lazy" />
                         
                         {type === 'char' && ELEMENT_ICONS[elKey] && (
                           <div className="absolute top-1 right-1 w-6 h-6 md:w-7 md:h-7 bg-black/40 rounded-full p-0.5 backdrop-blur-[1px]">
                             <img src={ELEMENT_ICONS[elKey]} alt={item.element} className="w-full h-full object-contain drop-shadow-md" />
                           </div>
                         )}
  
                         {type !== 'char' && (
                           <div 
                             className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 backdrop-blur-[2px]"
                             style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }} 
                           >
                             <div className="w-full h-full border border-yellow-500/50 rounded flex flex-col items-center justify-center p-2">
                               <p className="font-bold text-yellow-500 mb-1 text-sm drop-shadow-md">{item.name}</p>
                               {item.sub_stats && (
                                 <p className="text-sm text-white font-bold mb-2 drop-shadow-md">{item.sub_stats}</p>
                               )}
                               <div className="w-full h-[1px] bg-slate-500/50 mb-2"></div>
                               <p className="text-xs text-white leading-relaxed break-keep overflow-y-auto scrollbar-hide max-h-full font-medium drop-shadow-sm text-left w-full">
                                 {item.stats}
                               </p>
                             </div>
                           </div>
                         )}
  
                         <div className="absolute bottom-0 w-full bg-black/70 p-2 text-center flex flex-col justify-center min-h-[3.5rem]">
                           <span className="text-sm font-bold text-white truncate block">{item.name}</span>
                           {type !== 'char' && item.sub_stats && item.sub_stats !== "몰루" && (
                             <span className="text-[10px] text-slate-400 truncate block">{item.sub_stats}</span>
                           )}
                           {type !== 'char' && displayKeyword && displayKeyword !== "몰루" && (
                             <span className="text-[10px] md:text-xs text-yellow-400 font-bold truncate block mt-0.5">{displayKeyword}</span>
                           )}
                         </div>
                      </div>
                      
                      {isSelected ? (
                        <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center z-20">
                          <span className="bg-yellow-500 text-slate-900 font-bold px-3 py-1 rounded text-sm border-2 border-yellow-400 shadow-lg animate-pulse">
                            장착중 (해제)
                          </span>
                        </div>
                      ) : isUsedOther && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <span className="bg-red-600 text-white font-bold px-3 py-1 rounded text-sm border border-red-400">사용중</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-10 flex flex-col items-center gap-2">
                <Search size={48} className="opacity-20" />
                <span>조건에 맞는 결과가 없습니다.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

// --- [기존] ImportModal (유지) ---
const ImportModal = ({ isOpen, onClose, onImport }) => {
    const [text, setText] = useState("");
  
    useEffect(() => {
      if (isOpen) setText("");
    }, [isOpen]);
  
    if (!isOpen) return null;
  
    const handleApply = () => {
      onImport(text);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-900 w-full max-w-lg rounded-xl border-2 border-slate-600 shadow-2xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-yellow-500">인게임 코드 가져오기</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            게임 내 [편성 공유] 버튼을 눌러 복사된 텍스트 전체를 아래에 붙여넣으세요.<br/>
            (이름 정보를 기반으로 파티를 구성합니다)
          </p>
          <textarea 
            className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
            placeholder={`예시:\n조사 활동——편성 공유...\n카티구라、거인의 검、-、\n...\n@@1jWm1a9...@@`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600">취소</button>
            <button onClick={handleApply} className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 font-bold">적용하기</button>
          </div>
        </div>
      </div>
    );
  };

const PartyListPage = ({ parties }) => {
  return (
    <div 
      className="p-8 min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/morimenz_party/images/BG.png')" }}
    >
      <div className="bg-black/60 p-8 rounded-xl backdrop-blur-sm max-w-2xl mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-8 text-center text-yellow-500">📋 팀 편성 리스트</h1>
        <div className="flex justify-end mb-4">
          <Link to="/recommend" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            ⭐ 유저 추천 덱 보러가기
          </Link>
        </div>
        <div className="grid gap-4">
          {parties.map((party) => (
            <Link key={party.id} to={`/party/${party.id}`} className="block p-6 bg-slate-800/80 rounded-lg border border-slate-600 hover:border-yellow-500 hover:bg-slate-700/90 transition-all shadow-lg flex justify-between items-center group">
              <span className="text-xl font-bold group-hover:text-yellow-400 transition-colors">{party.name}</span>
              <span className="text-slate-400 text-sm group-hover:translate-x-1 transition-transform">편성 하러가기 &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const PartyEditPage = ({ parties, handleUpdateSlot, renameParty, resetParty, importParty }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentId = parseInt(id);
  const party = parties.find(p => p.id === currentId);
  const captureRef = useRef(null);

  const [modalState, setModalState] = useState({ isOpen: false, type: null, slotIndex: null, equipIndex: null });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const allUsedCharIds = parties.flatMap(p => p.slots.filter(s => s.character).map(s => s.character.id));
  const allUsedEquipIds = parties.flatMap(p => p.slots.flatMap(s => s.equipments.filter(e => e).map(e => e.id)));

  const currentSelectedId = useMemo(() => {
    if (!party || !modalState.isOpen) return null;
    const slot = party.slots[modalState.slotIndex];
    if (modalState.type === 'char') {
      return slot.character?.id;
    } else {
      return slot.equipments[modalState.equipIndex]?.id;
    }
  }, [party, modalState]);

  const getActiveElements = useMemo(() => {
    if (!party) return [];
    const currentSlotIndex = modalState.slotIndex;
    const elements = new Set();
    party.slots.forEach((slot, idx) => {
      if (!slot.character) return;
      if (modalState.isOpen && modalState.type === 'char' && idx === currentSlotIndex) return;
      if (slot.character.element.toLowerCase() === 'all') return;
      elements.add(slot.character.element);
    });
    return Array.from(elements);
  }, [party, modalState]);

  const onCharClick = (slotIndex) => {
    setModalState({ isOpen: true, type: 'char', slotIndex, equipIndex: null });
  };

  const onEquipClick = (e, slotIndex, equipIndex) => {
    e.stopPropagation();
    if (!party.slots[slotIndex].character) return alert("먼저 캐릭터를 배치해주세요!");
    setModalState({ isOpen: true, type: 'equip', slotIndex, equipIndex });
  };

  const handleSelect = (data) => {
    if (modalState.type === 'char') {
      handleUpdateSlot(party.id, modalState.slotIndex, 'character', data);
    } else {
      handleUpdateSlot(party.id, modalState.slotIndex, 'equipment', data, modalState.equipIndex);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, slotIndex: null, equipIndex: null });
  };

  const onRenameClick = () => {
    const newName = window.prompt("새로운 파티 이름을 입력해주세요:", party.name);
    if (newName && newName.trim() !== "") {
      renameParty(party.id, newName.trim());
    }
  };

  const onResetClick = () => {
    resetParty(party.id);
  };

  const handleCapture = async () => {
    if (captureRef.current) {
      try {
        const canvas = await html2canvas(captureRef.current, {
          backgroundColor: '#0f172a',
          scale: 2,
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${party.name}_편성.png`;
        link.click();
      } catch (err) {
        console.error("이미지 저장 실패:", err);
        alert("이미지 저장에 실패했습니다.");
      }
    }
  };

  const handleImport = (text) => {
    const lines = text.split('\n').filter(line => line.trim().includes('、'));
    if (lines.length === 0) {
      alert("유효한 코드가 아닙니다.");
      return;
    }
    importParty(party.id, lines);
  };

  const handleExportText = () => {
    let result = "";
    party.slots.forEach(slot => {
        if (slot.character) {
            const equip1 = slot.equipments[0] ? slot.equipments[0].name : "-";
            const equip2 = slot.equipments[1] ? slot.equipments[1].name : "-";
            result += `${slot.character.name}、${equip1}、${equip2}、\n`;
        } else {
            result += `-\n`; // 빈 슬롯
        }
    });

    navigator.clipboard.writeText(result)
        .then(() => alert("파티 구성이 텍스트로 복사되었습니다!"))
        .catch(err => alert("복사 실패: " + err));
  };

  if (!party) return <div>파티를 찾을 수 없습니다.</div>;

  return (
    <div className="flex min-h-screen text-white bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/morimenz_party/images/BG.png')" }}>
      <div className="w-16 md:w-20 bg-slate-950/80 border-r border-slate-700/50 flex flex-col items-center py-6 gap-6 fixed h-full z-10 backdrop-blur-sm">
        <button onClick={() => navigate('/')} className="mb-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
          <Home size={24} />
        </button>
        {parties.map((p, index) => (
          <button key={p.id} onClick={() => navigate(`/party/${p.id}`)} className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-serif font-bold text-lg md:text-xl transition-all ${p.id === currentId ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)] border-2 border-yellow-400 scale-110' : 'bg-black/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300 border border-slate-700/50'}`}>
            {ROMAN_NUMERALS[index]}
          </button>
        ))}
      </div>

      <div className="flex-1 ml-16 md:ml-20 p-4 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl flex items-center mb-6 pl-4 gap-3">
          <div className="flex items-center gap-2 border-l-4 border-yellow-600 pl-4">
            <h2 className="text-2xl font-bold text-yellow-500 drop-shadow-md">{party.name}</h2>
            <button onClick={onRenameClick} className="text-slate-400 hover:text-yellow-400 hover:bg-slate-800/50 p-1.5 rounded-full transition-all ml-2" title="파티 이름 변경"><Edit3 size={20} /></button>
            <button onClick={onResetClick} className="text-slate-400 hover:text-red-500 hover:bg-slate-800/50 p-1.5 rounded-full transition-all" title="파티 초기화"><RotateCcw size={20} /></button>
            <button onClick={() => setImportModalOpen(true)} className="text-slate-400 hover:text-green-400 hover:bg-slate-800/50 p-1.5 rounded-full transition-all" title="인게임 코드 가져오기"><Download size={20} /></button>
            <button onClick={handleExportText} className="text-slate-400 hover:text-orange-400 hover:bg-slate-800/50 p-1.5 rounded-full transition-all" title="텍스트로 복사"><Copy size={20} /></button>
            <button onClick={handleCapture} className="text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 p-1.5 rounded-full transition-all" title="이미지로 저장"><Camera size={20} /></button>
            <button onClick={() => setShareModalOpen(true)} className="text-slate-400 hover:text-purple-400 hover:bg-slate-800/50 p-1.5 rounded-full transition-all" title="서버에 공유하기"><Cloud size={20} /></button>
          </div>
        </div>

        <div ref={captureRef} className="grid grid-cols-4 gap-4 w-full max-w-5xl px-2 p-4 rounded-lg">
          {party.slots.map((slot, index) => {
            const elKey = slot.character?.element ? slot.character.element.charAt(0).toUpperCase() + slot.character.element.slice(1).toLowerCase() : "";
            return (
              <div key={index} onClick={() => onCharClick(index)} className={`relative w-full max-w-[500px] aspect-[5/9] mx-auto border-2 rounded-lg cursor-pointer flex flex-col group transition-all backdrop-blur-[2px] ${slot.character ? 'border-yellow-600 bg-slate-900/90' : 'border-slate-500/50 bg-black/40 hover:border-yellow-400 hover:bg-black/60'}`}>
                {slot.character ? (
                  <>
                    <img src={slot.character.img} alt={slot.character.name} className="absolute inset-0 w-full h-full object-cover object-top z-0 opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 w-full h-full flex flex-col">
                      <div className="h-[65%] relative">
                        {ELEMENT_ICONS[elKey] && <div className="absolute top-2 left-2 w-7 h-7 md:w-8 md:h-8 bg-black/30 rounded-full p-0.5 backdrop-blur-[1px]"><img src={ELEMENT_ICONS[elKey]} alt={slot.character.element} className="w-full h-full object-contain drop-shadow-md" /></div>}
                        <div className="absolute bottom-0 w-full bg-black/60 p-1 text-center backdrop-blur-sm"><span className="font-bold text-sm text-white drop-shadow-md">{slot.character.name}</span></div>
                      </div>
                      <div className="h-[35%] border-t border-slate-600/30 p-1 flex justify-center items-center gap-4 bg-black/30">
                        {[0, 1].map((equipIdx) => (
                          <div key={equipIdx} onClick={(e) => onEquipClick(e, index, equipIdx)} className={`h-[95%] aspect-[1/2] border rounded flex items-center justify-center overflow-hidden transition-colors ${slot.equipments[equipIdx] ? 'border-yellow-500' : 'bg-black/40 border-slate-500/50 hover:border-yellow-300'}`}>
                            {slot.equipments[equipIdx] ? <img src={slot.equipments[equipIdx].img} alt="명륜" className="w-full h-full object-cover" /> : <Settings size={20} className="text-slate-500/70" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="h-[65%] flex items-center justify-center text-slate-400/70"><div className="flex flex-col items-center"><User size={48} strokeWidth={1} /><span className="text-sm mt-2">터치하여 추가</span></div></div>
                    <div className="h-[35%] bg-black/30 border-t border-slate-600/50 p-1 flex justify-center items-center gap-4">{[0, 1].map((idx) => <div key={idx} className="h-[95%] aspect-[1/2] border border-slate-600/30 rounded bg-black/20"></div>)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SelectionModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.type === 'char' ? '캐릭터 선택' : '명륜 선택'} data={modalState.type === 'char' ? characterData : [...equipmentData].reverse()} onSelect={handleSelect} usedIds={modalState.type === 'char' ? allUsedCharIds : allUsedEquipIds} type={modalState.type} activeElements={getActiveElements} selectedId={currentSelectedId} />
      <ImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImport} />
      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} party={party} />
    </div>
  );
};

function App() {
  const [parties, setParties] = useState(() => {
    const savedData = localStorage.getItem('morimenz_party_data');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData.length < 10) {
        const more = Array.from({ length: 10 - parsedData.length }, (_, i) => ({
          id: parsedData.length + i + 1,
          name: `파티 ${parsedData.length + i + 1}`,
          slots: Array.from({ length: 4 }, (_, j) => ({ id: j, character: null, equipments: [null, null] }))
        }));
        return [...parsedData, ...more];
      }
      return parsedData;
    } else {
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('morimenz_party_data', JSON.stringify(parties));
  }, [parties]);

  const renameParty = (partyId, newName) => {
    setParties(prevParties => prevParties.map(p => p.id === partyId ? { ...p, name: newName } : p));
  };

  const resetParty = (partyId) => {
    if (!window.confirm("정말로 이 파티를 초기화하시겠습니까?\n배치된 모든 캐릭터와 명륜이 삭제됩니다.")) return;
    setParties(prevParties => prevParties.map(p => {
      if (p.id !== partyId) return p;
      return { ...p, slots: Array.from({ length: 4 }, (_, j) => ({ id: j, character: null, equipments: [null, null] })) };
    }));
  };

  const importParty = (partyId, lines) => {
    setParties(prevParties => prevParties.map(p => {
      if (p.id !== partyId) return p;
      const newSlots = p.slots.map(slot => ({ ...slot }));
      lines.slice(0, 4).forEach((line, idx) => {
        const parts = line.split('、').map(s => s.trim());
        const charName = parts[0];
        const equip1Name = parts[1];
        const equip2Name = parts[2]; 
        const foundChar = characterData.find(c => c.name === charName);
        const foundEquip1 = equip1Name && equip1Name !== '-' ? equipmentData.find(e => e.name === equip1Name) : null;
        const foundEquip2 = equip2Name && equip2Name !== '-' ? equipmentData.find(e => e.name === equip2Name) : null;
        if (foundChar) {
          newSlots[idx].character = foundChar;
          newSlots[idx].equipments = [foundEquip1 || null, foundEquip2 || null];
        } else {
          newSlots[idx].character = null;
          newSlots[idx].equipments = [null, null];
        }
      });
      return { ...p, slots: newSlots };
    }));
  };

  // [수정] 덱 가져오기 (타겟 파티 지정)
  const onImportDeckFromRecommend = (deckData, targetPartyId) => {
    setParties(prev => prev.map(p => {
      if (p.id !== targetPartyId) return p; // 타겟이 아니면 유지

      const newSlots = Array.from({ length: 4 }, (_, j) => ({ id: j, character: null, equipments: [null, null] }));
      deckData.slots.forEach((s, idx) => {
          if(idx < 4) {
              const char = characterData.find(c => c.id === s.charId);
              const equip1 = equipmentData.find(e => e.id === s.equipIds[0]);
              const equip2 = equipmentData.find(e => e.id === s.equipIds[1]);
              newSlots[idx].character = char || null;
              newSlots[idx].equipments = [equip1 || null, equip2 || null];
          }
      });

      return {
          ...p,
          name: deckData.name, // 덱 이름도 가져옴
          slots: newSlots
      };
    }));
  };

  const handleUpdateSlot = (partyId, slotIndex, type, data, equipIndex = 0) => {
    setParties(prevParties => {
      if (data === null) return applyUpdate(prevParties, partyId, slotIndex, type, null, equipIndex);
      let duplicateInfo = null;
      prevParties.forEach(party => {
        party.slots.forEach(slot => {
          if (type === 'character') {
            const isSelf = (party.id === partyId && slot.id === slotIndex);
            if (!isSelf && slot.character?.id === data.id) duplicateInfo = `[${party.name}]`;
          } else {
             slot.equipments.forEach((equip, eIdx) => {
               const isSelf = (party.id === partyId && slot.id === slotIndex && eIdx === equipIndex);
               if (!isSelf && equip?.id === data.id) duplicateInfo = `[${party.name}]의 ${slot.character?.name || '캐릭터'}`;
             });
          }
        });
      });
      if (duplicateInfo) {
        alert(type === 'character' ? `이미 ${duplicateInfo}에 배치된 캐릭터입니다!` : `이미 ${duplicateInfo}가 착용 중입니다!`);
        return prevParties;
      }
      return applyUpdate(prevParties, partyId, slotIndex, type, data, equipIndex);
    });
  };

  const applyUpdate = (currentParties, partyId, slotIndex, type, data, equipIndex) => {
    return currentParties.map(p => {
      if (p.id !== partyId) return p;
      const newSlots = [...p.slots];
      const targetSlot = { ...newSlots[slotIndex] };
      if (type === 'character') {
        targetSlot.character = data;
        if (!data) targetSlot.equipments = [null, null];
      } else {
        const newEquips = [...targetSlot.equipments];
        newEquips[equipIndex] = data;
        targetSlot.equipments = newEquips;
      }
      newSlots[slotIndex] = targetSlot;
      return { ...p, slots: newSlots };
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PartyListPage parties={parties} />} />
        {/* [수정] parties prop 전달 */}
        <Route path="/recommend" element={<RecommendPage onImportDeck={onImportDeckFromRecommend} parties={parties} />} />
        <Route path="/party/:id" element={<PartyEditPage parties={parties} handleUpdateSlot={handleUpdateSlot} renameParty={renameParty} resetParty={resetParty} importParty={importParty} />} />
      </Routes>
    </Router>
  );
}

export default App;