import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Shield, Sword, User } from 'lucide-react';

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

// --- [3] 공용 모달 컴포넌트 (캐릭터/장비 공용) ---
const SelectionModal = ({ isOpen, onClose, title, data, onSelect, usedIds, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <h3 className="text-xl font-bold text-yellow-500">{title} 선택</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕ 닫기</button>
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
                  <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center text-xl bg-slate-800 border ${isUsed ? 'border-slate-600' : 'border-slate-500'}`}>
                    {type === 'char' ? '🧙‍♀️' : '⚔️'}
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

// --- [4] 메인 페이지: 파티 목록 ---
const PartyListPage = ({ parties }) => {
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-yellow-500">📋 팀 편성 리스트</h1>
      <div className="grid gap-4 max-w-2xl mx-auto">
        {parties.map((party) => (
          <Link key={party.id} to={`/party/${party.id}`} className="block p-6 bg-slate-800 rounded-lg border border-slate-700 hover:border-yellow-500 hover:bg-slate-700 transition-all shadow-lg flex justify-between items-center">
            <span className="text-xl font-bold">{party.name}</span>
            <span className="text-slate-400 text-sm">편성 하러가기 &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// --- [5] 상세 페이지: 캐릭터 및 장비 편성 ---
// --- [5] 상세 페이지: 캐릭터 및 장비 편성 ---
const PartyEditPage = ({ parties, handleUpdateSlot }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const party = parties.find(p => p.id === parseInt(id));

  // 모달 상태 관리
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
    setModalState({ ...modalState, isOpen: false });
  };

  if (!party) return <div>파티를 찾을 수 없습니다.</div>;

  return (
    <div className="p-4 bg-slate-900 min-h-screen text-white flex flex-col items-center">
      <div className="w-full max-w-4xl flex items-center mb-8">
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">&larr; 뒤로가기</button>
        <h2 className="text-2xl font-bold ml-auto mr-auto text-yellow-500">{party.name} 편성</h2>
        <div className="w-[100px]"></div>
      </div>

      <div className="grid grid-cols-4 gap-4 w-full max-w-5xl">
        {party.slots.map((slot, index) => (
          <div 
            key={index} 
            onClick={() => onCharClick(index)} 
            // ▼▼▼ 여기가 변경되었습니다: aspect-[2/5] ▼▼▼
            className={`relative aspect-[2/5] border-2 rounded-lg cursor-pointer flex flex-col overflow-hidden group transition-all 
              ${slot.character ? 'border-yellow-600 bg-slate-800' : 'border-slate-600 bg-slate-800 hover:border-yellow-400'}`}
          >
            {/* 캐릭터 표시 영역 */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              {slot.character ? (
                <>
                  <img 
                    src={slot.character.img} 
                    alt={slot.character.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 w-full bg-black/60 p-1 text-center">
                    <span className="font-bold text-sm">{slot.character.name}</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <User size={48} strokeWidth={1} />
                  <span className="text-sm mt-2">터치하여 추가</span>
                </div>
              )}
            </div>

            {/* 하단 장비 슬롯 */}
            <div className="h-[20%] bg-slate-950/90 border-t border-slate-600 p-1 flex justify-center items-center gap-2">
              {[0, 1].map((equipIdx) => (
                <div 
                  key={equipIdx} 
                  onClick={(e) => onEquipClick(e, index, equipIdx)} 
                  className={`w-8 h-8 md:w-10 md:h-10 border rounded flex items-center justify-center overflow-hidden transition-colors 
                    ${slot.equipments[equipIdx] ? 'border-yellow-500' : 'bg-slate-800 border-slate-500 hover:border-yellow-300'}`}
                >
                  {slot.equipments[equipIdx] ? (
                    <img src={slot.equipments[equipIdx].img} alt="장비" className="w-full h-full object-cover" />
                  ) : (
                    (equipIdx === 0 ? <Sword size={14} className="text-slate-500" /> : <Shield size={14} className="text-slate-500" />)
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SelectionModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.type === 'char' ? '캐릭터' : '장비'}
        data={modalState.type === 'char' ? characterData : equipmentData}
        onSelect={handleSelect}
        usedIds={modalState.type === 'char' ? allUsedCharIds : allUsedEquipIds}
        type={modalState.type}
      />
    </div>
  );
};

// --- [6] 앱 메인 로직 (업데이트 함수) ---
function App() {
  const [parties, setParties] = useState(INITIAL_DATA);

  const handleUpdateSlot = (partyId, slotIndex, type, data, equipIndex = 0) => {
    setParties(prevParties => {
      if (data === null) return applyUpdate(prevParties, partyId, slotIndex, type, null, equipIndex);

      // 전체 파티 중복 검사
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
        <Route path="/party/:id" element={<PartyEditPage parties={parties} handleUpdateSlot={handleUpdateSlot} />} />
      </Routes>
    </Router>
  );
}

export default App;