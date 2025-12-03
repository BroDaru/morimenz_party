import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Shield, Sword, User, X, Home } from 'lucide-react';

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

// --- [3] 오버레이 선택창 (캐릭터용) ---
const OverlaySelector = ({ data, onSelect, onClose, usedIds }) => {
  return (
    <div className="absolute inset-0 z-20 bg-slate-900/95 flex flex-col border-2 border-yellow-500 rounded-lg overflow-hidden animate-fadeIn backdrop-blur-sm">
      <div className="flex justify-between items-center p-2 bg-slate-800/80 border-b border-slate-700">
        <span className="font-bold text-yellow-500 text-sm">캐릭터 선택</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="grid grid-cols-2 gap-2">
          {data.map((item) => {
            const isUsed = usedIds.includes(item.id);
            return (
              <button
                key={item.id}
                disabled={isUsed}
                onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                className={`
                  flex flex-col items-center p-2 rounded border transition-all
                  ${isUsed 
                    ? 'border-slate-700 bg-slate-800/30 opacity-40 cursor-not-allowed grayscale' 
                    : 'border-slate-600 bg-slate-800/80 hover:border-yellow-400 hover:bg-slate-700'
                  }
                `}
              >
                <div className="w-10 h-10 rounded-full mb-1 overflow-hidden border border-slate-500 bg-black">
                   <img src={item.img} alt={item.name} className="w-full h-full object-cover"/>
                </div>
                <span className="text-xs font-bold truncate w-full text-center text-white">{item.name}</span>
                {isUsed && <span className="text-[9px] text-red-400 mt-1">사용중</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- [4] 모달 (장비 선택용) ---
const SelectionModal = ({ isOpen, onClose, title, data, onSelect, usedIds }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h3 className="text-xl font-bold text-yellow-500">{title} 선택</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
            {data.map((item) => {
              const isUsed = usedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  disabled={isUsed}
                  onClick={() => onSelect(item)}
                  className={`
                    relative flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${isUsed 
                      ? 'border-slate-700 bg-slate-800/50 opacity-40 cursor-not-allowed grayscale' 
                      : 'border-slate-600 bg-slate-700 hover:border-yellow-400 hover:bg-slate-600 hover:scale-105 shadow-lg'
                    }
                  `}
                >
                  <div className="w-12 h-12 rounded-full mb-2 overflow-hidden border border-slate-500 bg-black">
                     <img src={item.img} alt={item.name} className="w-full h-full object-cover"/>
                  </div>
                  <span className="text-sm font-bold truncate w-full text-center text-white">{item.name}</span>
                  {isUsed && <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1 rounded">사용중</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [5] 메인 리스트 ---
const PartyListPage = ({ parties }) => {
  return (
    <div 
      className="p-8 min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/BG.png')" }}
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

// --- [6] 상세 페이지 ---
const PartyEditPage = ({ parties, handleUpdateSlot }) => {
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
    if (modalState.isOpen && modalState.slotIndex === slotIndex && modalState.type === 'char') {
      closeModal();
      return;
    }
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
      if(window.confirm("장비를 해제하시겠습니까?")) {
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

  if (!party) return <div>파티를 찾을 수 없습니다.</div>;

  return (
    // [변경] 배경 이미지 적용 (BG.png)
    <div 
      className="flex min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/BG.png')" }}
    >
      
      {/* --- SIDEBAR --- */}
      {/* 배경이 보일 수 있게 반투명 처리 (bg-slate-950/80) */}
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

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 ml-16 md:ml-20 p-4 flex flex-col items-center justify-center min-h-screen">
        {/* 상단 타이틀 (배경이 어두우므로 살짝 강조) */}
        <div className="w-full max-w-4xl flex items-center mb-6 pl-4">
          <h2 className="text-2xl font-bold text-yellow-500 border-l-4 border-yellow-600 pl-4 drop-shadow-md">
            {party.name} 편성
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4 w-full max-w-5xl px-2">
          {party.slots.map((slot, index) => {
            const isSelectingChar = modalState.isOpen && modalState.type === 'char' && modalState.slotIndex === index;

            return (
              <div 
                key={index} 
                onClick={() => onCharClick(index)} 
                className={`
                  relative w-full max-w-[500px] aspect-[5/9] mx-auto border-2 rounded-lg cursor-pointer flex flex-col group transition-all backdrop-blur-[2px]
                  ${slot.character 
                    ? 'border-yellow-600 bg-slate-900/90' // 캐릭터 있으면 진하게 
                    : 'border-slate-500/50 bg-black/40 hover:border-yellow-400 hover:bg-black/60'} // 없으면 투명하게
                `}
              >
                {isSelectingChar ? (
                  <OverlaySelector 
                    data={characterData} 
                    onSelect={handleSelect} 
                    onClose={closeModal} 
                    usedIds={allUsedCharIds} 
                  />
                ) : (
                  <>
                    <div className="h-[80%] flex items-center justify-center relative overflow-hidden">
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

                    <div className="h-[20%] bg-black/60 border-t border-slate-600/50 p-1 flex justify-center items-center gap-4">
                      {[0, 1].map((equipIdx) => (
                        <div 
                          key={equipIdx} 
                          onClick={(e) => onEquipClick(e, index, equipIdx)} 
                          className={`
                            h-[90%] aspect-[1/2] max-w-[150px] 
                            border rounded flex items-center justify-center overflow-hidden transition-colors 
                            ${slot.equipments[equipIdx] ? 'border-yellow-500' : 'bg-black/40 border-slate-500/50 hover:border-yellow-300'}
                          `}
                        >
                          {slot.equipments[equipIdx] ? (
                            <img src={slot.equipments[equipIdx].img} alt="장비" className="w-full h-full object-cover" />
                          ) : (
                            (equipIdx === 0 ? <Sword size={14} className="text-slate-500" /> : <Shield size={14} className="text-slate-500" />)
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalState.type === 'equip' && (
        <SelectionModal 
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title="장비"
          data={equipmentData}
          onSelect={handleSelect}
          usedIds={allUsedEquipIds}
        />
      )}
    </div>
  );
};

// --- [7] 앱 메인 로직 ---
function App() {
  const [parties, setParties] = useState(INITIAL_DATA);

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
        <Route path="/party/:id" element={<PartyEditPage parties={parties} handleUpdateSlot={handleUpdateSlot} />} />
      </Routes>
    </Router>
  );
}

export default App;