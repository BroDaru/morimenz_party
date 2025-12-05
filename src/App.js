import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { User, X, Home, Edit3, Settings, Search, Filter } from 'lucide-react';

// --- [1] JSON 데이터 임포트 ---
import characterData from './data/character.json';
import equipmentData from './data/myeongryun.json';

// --- [2] 초기 파티 데이터 설정 ---
const INITIAL_DATA = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `파티 ${i + 1}`,
  slots: Array.from({ length: 4 }, (_, j) => ({
    id: j,
    character: null, 
    equipments: [null, null] 
  }))
}));

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V"];

// --- [3] 통합 선택 모달 (검색 & 필터 기능 추가) ---
const SelectionModal = ({ isOpen, onClose, title, data, onSelect, usedIds, type }) => {
  // 상태 관리: 검색어, 속성 필터, 역할 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedElement, setSelectedElement] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");

  // 모달이 열릴 때마다 필터 초기화
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedElement("All");
      setSelectedRole("All");
    }
  }, [isOpen]);

  // [필터 옵션 추출] 데이터에서 중복 제거하여 필터 목록 생성 (캐릭터일 때만)
  const elements = useMemo(() => {
    if (type !== 'char') return [];
    const uniqueElements = [...new Set(data.map(item => item.element))].filter(Boolean);
    return ["All", ...uniqueElements];
  }, [data, type]);

  const roles = useMemo(() => {
    if (type !== 'char') return [];
    const uniqueRoles = [...new Set(data.map(item => item.role))].filter(Boolean);
    return ["All", ...uniqueRoles];
  }, [data, type]);

  if (!isOpen) return null;

  // [핵심] 필터링 로직: 이름 + 속성 + 역할 모두 만족해야 함
  const filteredData = data.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 캐릭터가 아니면(명륜이면) 속성/역할 검사 통과 처리
    if (type !== 'char') return matchName;

    const matchElement = selectedElement === "All" || item.element === selectedElement;
    const matchRole = selectedRole === "All" || item.role === selectedRole;

    return matchName && matchElement && matchRole;
  });

  const gridClass = type === 'char' ? 'grid-cols-4' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
  const aspectClass = type === 'char' ? 'aspect-[5/9]' : 'aspect-[1/2]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-6xl rounded-xl border-2 border-slate-600 shadow-2xl overflow-hidden m-4 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* 헤더 영역 */}
        <div className="p-4 border-b border-slate-700 bg-slate-950 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-yellow-500">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
              <X size={28} />
            </button>
          </div>

          {/* 검색 및 필터 컨트롤 영역 */}
          <div className="flex flex-col md:flex-row gap-2">
            {/* 1. 검색창 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={`${title === '캐릭터 선택' ? '캐릭터' : '명륜'} 이름 검색...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors"
                autoFocus
              />
            </div>

            {/* 2. 필터 (캐릭터일 때만 표시) */}
            {type === 'char' && (
              <div className="flex gap-2">
                {/* 속성 필터 */}
                <div className="relative">
                  <select 
                    value={selectedElement}
                    onChange={(e) => setSelectedElement(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-600 text-white pl-8 pr-8 py-2 rounded-lg focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    {elements.map(el => <option key={el} value={el}>{el === 'All' ? '모든 속성' : el}</option>)}
                  </select>
                  <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                </div>

                {/* 역할 필터 */}
                <div className="relative">
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-600 text-white pl-8 pr-8 py-2 rounded-lg focus:outline-none focus:border-yellow-500 cursor-pointer"
                  >
                    {roles.map(r => <option key={r} value={r}>{r === 'All' ? '모든 역할' : r}</option>)}
                  </select>
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 리스트 영역 */}
        <div className="p-6 overflow-y-auto scrollbar-hide flex-1">
          {filteredData.length > 0 ? (
            <div className={`grid ${gridClass} gap-4`}>
              {filteredData.map((item) => {
                const isUsed = usedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    disabled={isUsed}
                    onClick={() => onSelect(item)}
                    className={`
                      relative group flex flex-col items-center rounded-lg border-2 transition-all overflow-hidden
                      ${isUsed 
                        ? 'border-slate-800 opacity-40 grayscale cursor-not-allowed' 
                        : 'border-slate-600 hover:border-yellow-500 hover:scale-[1.02] shadow-lg bg-slate-800'
                      }
                    `}
                  >
                    <div className={`w-full ${aspectClass} bg-slate-950 relative`}>
                       <img 
                         src={item.img} 
                         alt={item.name} 
                         className="w-full h-full object-cover" 
                         loading="lazy"
                       />
                       <div className="absolute bottom-0 w-full bg-black/70 p-2 text-center">
                         <span className="text-sm font-bold text-white truncate block">
                           {item.name}
                         </span>
                       </div>
                    </div>
                    
                    {isUsed && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold px-3 py-1 rounded text-sm border border-red-400">
                          사용중
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-10 flex flex-col items-center gap-2">
              <Search size={48} className="opacity-20" />
              <span>검색 결과가 없습니다.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- [4] 메인 리스트 ---
const PartyListPage = ({ parties }) => {
  return (
    <div 
      className="p-8 min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/morimenz_party/images/BG.png')" }}
    >
      <div className="bg-black/60 p-8 rounded-xl backdrop-blur-sm max-w-2xl mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-8 text-center text-yellow-500">📋 팀 편성 리스트</h1>
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

// --- [5] 상세 페이지 ---
const PartyEditPage = ({ parties, handleUpdateSlot, renameParty }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentId = parseInt(id);
  const party = parties.find(p => p.id === currentId);

  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    type: null, 
    slotIndex: null, 
    equipIndex: null 
  });

  const allUsedCharIds = parties.flatMap(p => p.slots.filter(s => s.character).map(s => s.character.id));
  const allUsedEquipIds = parties.flatMap(p => p.slots.flatMap(s => s.equipments.filter(e => e).map(e => e.id)));

  const onCharClick = (slotIndex) => {
    if (party.slots[slotIndex].character) {
      if(window.confirm("캐릭터를 파티에서 제외하시겠습니까?")) {
        handleUpdateSlot(party.id, slotIndex, 'character', null);
      }
    } else {
      setModalState({ isOpen: true, type: 'char', slotIndex, equipIndex: null });
    }
  };

  const onEquipClick = (e, slotIndex, equipIndex) => {
    e.stopPropagation();
    if (!party.slots[slotIndex].character) return alert("먼저 캐릭터를 배치해주세요!");

    if (party.slots[slotIndex].equipments[equipIndex]) {
      if(window.confirm("명륜을 해제하시겠습니까?")) {
        handleUpdateSlot(party.id, slotIndex, 'equipment', null, equipIndex);
      }
    } else {
      setModalState({ isOpen: true, type: 'equip', slotIndex, equipIndex });
    }
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

  if (!party) return <div>파티를 찾을 수 없습니다.</div>;

  return (
    <div 
      className="flex min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/morimenz_party/images/BG.png')" }}
    >
      <div className="w-16 md:w-20 bg-slate-950/80 border-r border-slate-700/50 flex flex-col items-center py-6 gap-6 fixed h-full z-10 backdrop-blur-sm">
        <button onClick={() => navigate('/')} className="mb-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
          <Home size={24} />
        </button>

        {parties.map((p, index) => (
          <button
            key={p.id}
            onClick={() => navigate(`/party/${p.id}`)}
            className={`
              w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-serif font-bold text-lg md:text-xl transition-all
              ${p.id === currentId 
                ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)] border-2 border-yellow-400 scale-110' 
                : 'bg-black/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300 border border-slate-700/50'
              }
            `}
          >
            {ROMAN_NUMERALS[index]}
          </button>
        ))}
      </div>

      <div className="flex-1 ml-16 md:ml-20 p-4 flex flex-col items-center justify-center min-h-screen">
        
        <div className="w-full max-w-4xl flex items-center mb-6 pl-4 gap-3">
          <div className="flex items-center gap-3 border-l-4 border-yellow-600 pl-4">
            <h2 className="text-2xl font-bold text-yellow-500 drop-shadow-md">
              {party.name} 편성
            </h2>
            <button 
              onClick={onRenameClick} 
              className="text-slate-400 hover:text-yellow-400 hover:bg-slate-800/50 p-1.5 rounded-full transition-all"
              title="파티 이름 변경"
            >
              <Edit3 size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 w-full max-w-5xl px-2">
          {party.slots.map((slot, index) => (
            <div 
              key={index} 
              onClick={() => onCharClick(index)} 
              className={`
                relative w-full max-w-[500px] aspect-[5/9] mx-auto border-2 rounded-lg cursor-pointer flex flex-col group transition-all backdrop-blur-[2px]
                ${slot.character 
                  ? 'border-yellow-600 bg-slate-900/90' 
                  : 'border-slate-500/50 bg-black/40 hover:border-yellow-400 hover:bg-black/60'}
              `}
            >
              <div className="h-[65%] flex items-center justify-center relative overflow-hidden">
                {slot.character ? (
                  <>
                    <img src={slot.character.img} alt={slot.character.name} className="w-full h-full object-cover"/>
                    <div className="absolute bottom-0 w-full bg-black/60 p-1 text-center">
                      <span className="font-bold text-sm">{slot.character.name}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400/70 flex flex-col items-center">
                    <User size={48} strokeWidth={1} />
                    <span className="text-sm mt-2">터치하여 추가</span>
                  </div>
                )}
              </div>

              <div className="h-[35%] bg-black/60 border-t border-slate-600/50 p-1 flex justify-center items-center gap-4">
                {[0, 1].map((equipIdx) => (
                  <div 
                    key={equipIdx} 
                    onClick={(e) => onEquipClick(e, index, equipIdx)} 
                    className={`
                      h-[95%] aspect-[1/2] 
                      border rounded flex items-center justify-center overflow-hidden transition-colors 
                      ${slot.equipments[equipIdx] ? 'border-yellow-500' : 'bg-black/40 border-slate-500/50 hover:border-yellow-300'}
                    `}
                  >
                    {slot.equipments[equipIdx] ? (
                      <img src={slot.equipments[equipIdx].img} alt="명륜" className="w-full h-full object-cover" />
                    ) : (
                      <Settings size={20} className="text-slate-500/70" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SelectionModal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.type === 'char' ? '캐릭터 선택' : '명륜 선택'}
        data={modalState.type === 'char' ? characterData : [...equipmentData].reverse()}
        onSelect={handleSelect}
        usedIds={modalState.type === 'char' ? allUsedCharIds : allUsedEquipIds}
        type={modalState.type}
      />
    </div>
  );
};

// --- [6] 앱 메인 로직 ---
function App() {
  const [parties, setParties] = useState(() => {
    const savedData = localStorage.getItem('morimenz_party_data');
    if (savedData) {
      return JSON.parse(savedData);
    } else {
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('morimenz_party_data', JSON.stringify(parties));
  }, [parties]);

  const renameParty = (partyId, newName) => {
    setParties(prevParties => 
      prevParties.map(p => 
        p.id === partyId ? { ...p, name: newName } : p
      )
    );
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
    <Router basename="/morimenz_party">
      <Routes>
        <Route path="/" element={<PartyListPage parties={parties} />} />
        <Route path="/party/:id" element={<PartyEditPage parties={parties} handleUpdateSlot={handleUpdateSlot} renameParty={renameParty} />} />
      </Routes>
    </Router>
  );
}

export default App;