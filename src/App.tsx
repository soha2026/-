import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Send, 
  MapPin, 
  Clock, 
  Copy, 
  Check, 
  ChevronRight, 
  FileText, 
  Truck,
  Heart,
  User,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowDownLeft,
  ArrowUpRight,
  PenTool,
  Info,
  Layers,
  HelpCircle,
  Calendar,
  Gift
} from "lucide-react";
import { PARTICIPANTS, ROTATION_ORDER } from "./data";
import { Participant, UserChecklist } from "./types";
import { generateMarkdown } from "./utils";
import { saveUserChecklist, subscribeToChecklists } from "./firebase";

export default function App() {
  // Simple name-based login state
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => {
    return localStorage.getItem("book_rotation_logged_in_user");
  });
  const [customLoginName, setCustomLoginName] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Select active member (defaults to loggedInUserId if present, or first participant 'soha')
  const [selectedId, setSelectedId] = useState<string>(() => {
    return localStorage.getItem("book_rotation_logged_in_user") || "soha";
  });
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [markdownCopied, setMarkdownCopied] = useState<boolean>(false);
  const [showMarkdownModal, setShowMarkdownModal] = useState<boolean>(false);
  
  // Today's real date reference
  const todayObj = new Date();
  const currentRealMonth = todayObj.getMonth() + 1; // 1-indexed (e.g. 7 for July)
  const currentRealDay = todayObj.getDate();

  // Calendar active month state (0: 7월, 1: 8월, ..., 5: 12월)
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(() => {
    const currentM = new Date().getMonth() + 1;
    if (currentM >= 7 && currentM <= 12) {
      return currentM - 7;
    }
    return 0; // Default to 7월
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<{ month: number; day: number } | null>(null);

  // Load checklists from localStorage as initial fallback
  const [checklists, setChecklists] = useState<Record<string, UserChecklist>>(() => {
    const saved = localStorage.getItem("book_rotation_checklists");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all new keys exist
        const updated = { ...parsed };
        Object.keys(PARTICIPANTS).forEach((id) => {
          if (!updated[id]) {
            updated[id] = {
              sentBook: false,
              receivedBook: false,
              trackingNumber: "",
              memo: "",
            };
          }
        });
        return updated;
      } catch (e) {
        console.error("Failed to parse checklists", e);
      }
    }
    
    // Initialize default states for all participants
    const initial: Record<string, UserChecklist> = {};
    Object.keys(PARTICIPANTS).forEach((id) => {
      initial[id] = {
        sentBook: false,
        receivedBook: false,
        trackingNumber: "",
        memo: "",
      };
    });
    return initial;
  });

  // Save checklists to localStorage when they change locally
  useEffect(() => {
    localStorage.setItem("book_rotation_checklists", JSON.stringify(checklists));
  }, [checklists]);

  // Connect to Firestore in real-time
  useEffect(() => {
    const unsubscribe = subscribeToChecklists((updatedData) => {
      setChecklists((prev) => {
        const next = { ...prev };
        Object.keys(updatedData).forEach((id) => {
          next[id] = {
            ...next[id],
            ...updatedData[id],
          };
        });
        return next;
      });
    }, checklists);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const activeUser = PARTICIPANTS[selectedId] || PARTICIPANTS["soha"];
  const sendToUser = PARTICIPANTS[activeUser.sendToId];
  const receiveFromUser = PARTICIPANTS[activeUser.receiveFromId];

  // Login handler
  const handleLogin = (id: string) => {
    localStorage.setItem("book_rotation_logged_in_user", id);
    setLoggedInUserId(id);
    setSelectedId(id);
    setLoginError(null);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customLoginName.trim().toLowerCase();
    if (!query) return;

    // Find participant matching the name
    const foundId = Object.keys(PARTICIPANTS).find((id) => {
      const p = PARTICIPANTS[id];
      return (
        p.name.toLowerCase() === query ||
        p.name.toLowerCase().replace("님", "") === query ||
        id.toLowerCase() === query
      );
    });

    if (foundId) {
      handleLogin(foundId);
    } else {
      setLoginError("일치하는 회원 이름을 찾을 수 없습니다. (예: 소하, 가지, 글, 유리아, 베키, 이는)");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("book_rotation_logged_in_user");
    setLoggedInUserId(null);
  };

  // Helper to copy text to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyMarkdown = (text: string) => {
    navigator.clipboard.writeText(text);
    setMarkdownCopied(true);
    setTimeout(() => setMarkdownCopied(false), 2000);
  };

  // Toggle checklist items
  const toggleChecklistItem = async (userId: string, item: "sentBook" | "receivedBook") => {
    const updated = {
      ...checklists[userId],
      [item]: !checklists[userId][item],
    };
    setChecklists((prev) => ({
      ...prev,
      [userId]: updated,
    }));
    await saveUserChecklist(userId, updated);
  };

  // Update tracking number
  const updateTrackingNumber = async (userId: string, value: string) => {
    const updated = {
      ...checklists[userId],
      trackingNumber: value,
    };
    setChecklists((prev) => ({
      ...prev,
      [userId]: updated,
    }));
    await saveUserChecklist(userId, updated);
  };

  // Update user memo
  const updateMemo = async (userId: string, value: string) => {
    const updated = {
      ...checklists[userId],
      memo: value,
    };
    setChecklists((prev) => ({
      ...prev,
      [userId]: updated,
    }));
    await saveUserChecklist(userId, updated);
  };

  const formatDateStr = (month: number, day: number) => {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `2026-${mm}-${dd}`;
  };

  const handleSaveCalendarEvent = async (userId: string, dateStr: string, type: "sent" | "received" | null) => {
    const currentEvents = checklists[userId]?.calendarEvents || {};
    const updatedEvents = { ...currentEvents };
    
    if (type === null) {
      delete updatedEvents[dateStr];
    } else {
      updatedEvents[dateStr] = type;
    }
    
    const updatedChecklist = {
      ...checklists[userId],
      calendarEvents: updatedEvents
    };
    
    setChecklists((prev) => ({
      ...prev,
      [userId]: updatedChecklist
    }));
    
    await saveUserChecklist(userId, updatedChecklist);
  };

  // Calculate task completion percentage based on calendar events
  const getProgressPercentage = (userId: string) => {
    const list = checklists[userId];
    if (!list) return 0;
    let score = 0;
    
    // Check if there is any 'sent' event in calendarEvents
    const hasSent = list.calendarEvents && Object.values(list.calendarEvents).includes("sent");
    // Check if there is any 'received' event in calendarEvents
    const hasReceived = list.calendarEvents && Object.values(list.calendarEvents).includes("received");
    
    if (hasSent) score += 50;
    if (hasReceived) score += 50;
    
    return score;
  };

  const activeProgress = getProgressPercentage(selectedId);
  const activeMarkdown = generateMarkdown(selectedId);

  // Profile avatar letter
  const getAvatarLetter = (name: string) => name.charAt(0);

  // Book cover gradient styling based on user custom pen colors (주황, 남색, 형광연두, 분홍, 하늘, 보라)
  const getBookCoverColor = (id: string) => {
    const covers: Record<string, string> = {
      soha: "bg-gradient-to-br from-orange-400 to-amber-600 text-white", // 주황 (Orange)
      gaji: "bg-gradient-to-br from-blue-700 to-indigo-900 text-white", // 남색 (Navy)
      geul: "bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-900", // 형광연두 (Neon Lime - black text for contrast)
      yuria: "bg-gradient-to-br from-pink-400 to-rose-600 text-white", // 분홍 (Pink)
      becky: "bg-gradient-to-br from-sky-400 to-blue-600 text-white", // 하늘 (Sky Blue)
      ineu: "bg-gradient-to-br from-purple-500 to-violet-800 text-white", // 보라 (Purple)
    };
    return covers[id] || "bg-gradient-to-br from-slate-500 to-slate-700 text-white";
  };

  // Pen color badge style
  const getPenColorBadgeStyle = (color: string) => {
    switch (color) {
      case "주황": return "bg-orange-50 text-orange-700 border-orange-200";
      case "남색": return "bg-blue-50 text-blue-800 border-blue-200";
      case "형광연두": return "bg-lime-50 text-lime-800 border-lime-300";
      case "분홍": return "bg-pink-50 text-pink-700 border-pink-200";
      case "하늘": return "bg-sky-50 text-sky-800 border-sky-200";
      case "보라": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const renderPencilIcon = (color: string) => {
    let fillCol = "#94a3b8"; // fallback gray
    switch (color) {
      case "주황": fillCol = "#f97316"; break; // orange-500
      case "남색": fillCol = "#1e3a8a"; break; // blue-900
      case "형광연두": fillCol = "#84cc16"; break; // lime-500
      case "분홍": fillCol = "#ec4899"; break; // pink-500
      case "하늘": fillCol = "#0ea5e9"; break; // sky-500
      case "보라": fillCol = "#8b5cf6"; break; // purple-500
    }
    return (
      <span className="inline-flex items-center gap-1 font-extrabold" style={{ color: fillCol }}>
        <span>{color}</span>
        <svg className="w-3.5 h-3.5 inline-block stroke-current fill-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M12 20h9" stroke="currentColor" fill="none" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="currentColor" stroke="currentColor" />
        </svg>
      </span>
    );
  };

  const MONTHS_2026 = [
    { month: 7, name: "7월", startDayOfWeek: 3, daysInMonth: 31, dDayOffset: 22 }, // July 1st is Wed, 22 days left from July 3rd
    { month: 8, name: "8월", startDayOfWeek: 6, daysInMonth: 31, dDayOffset: 53 }, // Aug 1st is Sat, 53 days left
    { month: 9, name: "9월", startDayOfWeek: 2, daysInMonth: 30, dDayOffset: 83 }, // Sept 1st is Tue
    { month: 10, name: "10월", startDayOfWeek: 4, daysInMonth: 31, dDayOffset: 113 }, // Oct 1st is Thu
    { month: 11, name: "11월", startDayOfWeek: 0, daysInMonth: 30, dDayOffset: 144 }, // Nov 1st is Sun
    { month: 12, name: "12월", startDayOfWeek: 2, daysInMonth: 31, dDayOffset: 174 }, // Dec 1st is Tue
  ];

  const currentMonthData = MONTHS_2026[activeMonthIdx];
  const blanks = Array(currentMonthData.startDayOfWeek).fill(null);
  const days = Array.from({ length: currentMonthData.daysInMonth }, (_, i) => i + 1);
  const totalCells = [...blanks, ...days];

  if (!loggedInUserId) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-sans antialiased flex flex-col justify-center items-center py-16 px-4">
        <div className="max-w-5xl w-full text-center space-y-8">
          
          {/* Header Area */}
          <div className="space-y-3">
            <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-800 rounded-full text-xs font-black uppercase tracking-widest">
              2026 하반기 교환독서 모임 📚
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
              6인의 도서 로테이션 대시보드
            </h1>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm leading-relaxed">
              매달 25일, 서로의 책장에 새로운 온기를 선물하는 6인의 약속.<br/>
              본인의 이름을 클릭하거나 입력하여 접속할 수 있습니다.
            </p>
          </div>

          {/* Members Visual Grid */}
          <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-slate-200/50 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {ROTATION_ORDER.map((id, idx) => {
                const p = PARTICIPANTS[id];
                const progress = getProgressPercentage(id);

                return (
                  <button
                    key={id}
                    onClick={() => handleLogin(id)}
                    className="p-4 rounded-[2rem] border bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-md text-left flex flex-col justify-between min-h-[300px] focus:outline-none cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between w-full mb-3">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          0{idx + 1}
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {progress}%
                        </span>
                      </div>

                      <div className="font-black text-lg flex items-center justify-between w-full">
                        <span>{p.name}</span>
                      </div>

                      {/* Visual book representation */}
                      <div className={`mt-3 w-full aspect-[3/4] rounded-2xl ${getBookCoverColor(id)} shadow-sm relative overflow-hidden text-left border border-white/10`}>
                        {p.recommendedBook.imageUrl ? (
                          <div className="w-full h-full relative">
                            <img 
                              src={p.recommendedBook.imageUrl} 
                              alt={p.recommendedBook.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {/* dark elegant overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 flex flex-col justify-between p-3.5 text-white">
                              <div className="text-[7px] font-black tracking-widest uppercase opacity-80">
                                Book Owned
                              </div>
                              <div>
                                <div className="text-[10px] font-black line-clamp-2 leading-snug my-0.5">
                                  《{p.recommendedBook.title}》
                                </div>
                                <div className="text-[8px] opacity-75 truncate">
                                  {p.name} 소장
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full p-3.5 flex flex-col justify-between">
                            <div className="text-[7px] font-black tracking-widest uppercase opacity-80">
                              Book Owned
                            </div>
                            <div className="text-[10px] font-black line-clamp-3 leading-snug my-1">
                              《{p.recommendedBook.title}》
                            </div>
                            <div className="text-[8px] opacity-75 truncate">
                              {p.name} 소장
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-dashed border-slate-100 w-full flex flex-col gap-0.5 text-[9px] text-slate-400">
                      <div className="flex justify-between">
                        <span>시그니처 펜</span>
                        <strong className="font-extrabold text-slate-600">{renderPencilIcon(p.penColor)}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Text Input Area */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm max-w-md mx-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              또는 직접 이름 입력해서 로그인하기 ✍️
            </h3>
            
            <form onSubmit={handleCustomLogin} className="flex gap-2">
              <input
                type="text"
                value={customLoginName}
                onChange={(e) => setCustomLoginName(e.target.value)}
                placeholder="예: 소하, 가지, 글, 유리아"
                className="flex-1 text-xs px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-xl"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>접속하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            
            {loginError && (
              <p className="text-red-500 text-xs font-semibold mt-2.5 text-left">{loginError}</p>
            )}
          </div>

          {/* Persistent storage disclaimer */}
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-green-500" />
            설정 변경 없이 브라우저(Local Storage)에 로그인 기록이 안전하게 저장됩니다.
          </div>

        </div>
      </div>
    );
  }

  const loggedInUser = PARTICIPANTS[loggedInUserId] || PARTICIPANTS["soha"];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased pb-16">
      
      {/* Visual Header */}
      <header className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl shadow-sm border border-orange-200">
              👤
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  안녕하세요, {loggedInUser.name}님! 👋
                </h1>
                <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-[9px] font-black tracking-wide flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                  접속 중
                </span>
              </div>
              <p className="text-slate-400 font-medium mt-0.5 text-xs">
                현재 <strong className="text-slate-700">{activeUser.name}님</strong>의 도서 매칭 정보 및 체크리스트를 조회하고 있습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 shadow-sm rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-red-500" />
              <span>로그아웃 / 다른 이름 접속 🚪</span>
            </button>

            <button
              onClick={() => setShowMarkdownModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              <span>기획안 마크다운 복사하기 📋</span>
            </button>
            
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Season</span>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold">
                2026 하반기 진행 중
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 mt-6">
        
        {/* SECTION 1: 7월 도서 순환 스케줄 */}
        <section className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between px-1 mb-3">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                7월 도서 순환 스케줄 📅
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">회원을 탭하시면 해당 회원의 맞춤 주소록 및 체크리스트 정보로 즉시 대시보드가 전환됩니다.</p>
            </div>
            <span className="hidden sm:inline text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-semibold">
              교환주기: 매월 25일 📦
            </span>
          </div>

          {/* Expanded Rich Cards with Book Images, Owners & Pen Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {ROTATION_ORDER.map((id, idx) => {
              const p = PARTICIPANTS[id];
              const isSelected = selectedId === id;
              const progress = getProgressPercentage(id);

              return (
                <button
                  key={id}
                  onClick={() => setSelectedId(id)}
                  className={`p-3 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between min-h-[260px] md:min-h-[270px] focus:outline-none ${
                    isSelected 
                      ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/15 scale-[1.02]" 
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
                  }`}
                >
                  <div className="w-full">
                    {/* Card Header: index & progress */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                        0{idx + 1}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                        isSelected 
                          ? "bg-white/20 text-white" 
                          : progress === 100 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-slate-100 text-slate-600"
                      }`}>
                        {progress}% 완료
                      </span>
                    </div>

                    {/* Member Name */}
                    <div className="font-black text-base flex items-center justify-between w-full">
                      <span>{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${isSelected ? "border-white/30 text-white bg-white/10" : getPenColorBadgeStyle(p.penColor)}`}>
                        {p.penColor}
                      </span>
                    </div>

                    {/* Book Cover Image Representation */}
                    <div className={`mt-3 w-full aspect-[3/4] rounded-2xl ${getBookCoverColor(id)} shadow-md relative overflow-hidden text-left border border-white/10`}>
                      {p.recommendedBook.imageUrl ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={p.recommendedBook.imageUrl} 
                            alt={p.recommendedBook.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {/* dark elegant overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 flex flex-col justify-between p-3.5 text-white">
                            <div className="text-[8px] font-black tracking-widest uppercase opacity-80">
                              Premium Book
                            </div>
                            <div>
                              <div className="text-xs font-black line-clamp-2 leading-tight tracking-tight my-1">
                                《{p.recommendedBook.title}》
                              </div>
                              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px]">
                                <span className="opacity-90">주인: {p.name}</span>
                                <span className="opacity-75 truncate max-w-[50px]">{p.recommendedBook.author}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full p-3.5 flex flex-col justify-between text-white">
                          {/* subtle aesthetic pattern */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4 blur-md"></div>
                          
                          <div className={`text-[8px] font-black tracking-widest ${id === 'geul' && !isSelected ? 'text-slate-800' : 'text-white/80'} uppercase`}>
                            Premium Book
                          </div>

                          <div className={`text-xs font-black line-clamp-3 leading-snug tracking-tight my-1.5 ${id === 'geul' && !isSelected ? 'text-slate-950' : 'text-white'}`}>
                            《{p.recommendedBook.title}》
                          </div>

                          <div className="mt-auto pt-1.5 border-t border-white/10">
                            <div className={`text-[9px] font-bold ${id === 'geul' && !isSelected ? 'text-slate-700' : 'text-white/90'}`}>주인: {p.name}</div>
                            <div className={`text-[8px] opacity-75 ${id === 'geul' && !isSelected ? 'text-slate-600' : 'text-white/70'} truncate`}>{p.recommendedBook.author}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-3.5 pt-2 border-t border-dashed border-slate-200/20 w-full flex flex-col gap-0.5 text-[10px] opacity-80">
                    <div className="flex justify-between">
                      <span className="opacity-65">책 소유자</span>
                      <strong className="font-extrabold">{p.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-65">시그니처 펜</span>
                      <strong className="font-extrabold">{renderPencilIcon(p.penColor)}</strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: 이번 달, 독서의 온기가 배달됩니다 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[300px]">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[180px] select-none font-black text-slate-900 pointer-events-none">
            📦
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest">
                CORE NOTIFICATION • Section 2
              </span>
              
              {/* Pen color indicator badge */}
              <span className={`px-2 py-0.5 border rounded-lg text-[10px] font-bold flex items-center gap-1 ${getPenColorBadgeStyle(activeUser.penColor)}`}>
                <PenTool className="w-3 h-3" />
                내 시그니처 펜색: {activeUser.penColor}
              </span>

              {/* Micro badge */}
              <span className="px-2 py-0.5 bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                <Clock className="w-3 h-3" />
                매달 25일 발송
              </span>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">
              이번달 도서 순환 일정 브리핑
            </h2>
            
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-lg mb-4 leading-relaxed">
              이번 달 책도 즐겁게 읽으시길 바라요. <strong className="text-slate-800 font-extrabold">25일까지</strong> 지정된 CU 편의점으로 발송해 주세요.
            </p>
          </div>

          {/* From & To Horizontal visual cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
            
            {/* FROM side (책 받음) */}
            <div className="bg-indigo-50/40 rounded-3xl p-6 border border-indigo-100 flex gap-4 justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Left Column (Content) */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Highly Intuitive "책 받음" Visual Badge with graphic icons - Enlarged 2x */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1.5 bg-indigo-600 text-white text-base sm:text-lg font-black px-4 py-1.5 rounded-full shadow-md">
                      <ArrowDownLeft className="w-5 h-5 stroke-[3px]" />
                      <span>책 받음</span>
                    </span>
                    <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                      FROM
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {getAvatarLetter(receiveFromUser.name)}
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900">{receiveFromUser.name}님</span>
                      <p className="text-[11px] text-slate-400 font-medium">나에게 책을 보내는 파트너</p>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">받을 도서 📚</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5 leading-snug line-clamp-1" title={receiveFromUser.recommendedBook.title}>
                      《{receiveFromUser.recommendedBook.title}》
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic mt-3 bg-white/80 p-2.5 rounded-xl border border-indigo-50/50 line-clamp-2">
                  "{receiveFromUser.recommendedBook.description}"
                </p>
              </div>

              {/* Right Column (Pen Color & Book Cover Thumbnail) */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {/* Pen Color Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold border shadow-sm ${getPenColorBadgeStyle(receiveFromUser.penColor)}`}>
                  펜색: {receiveFromUser.penColor}
                </span>

                {/* Refined Book Cover Thumbnail right below the Pen Color Badge */}
                {receiveFromUser.recommendedBook.imageUrl ? (
                  <div className="w-14 h-20 sm:w-16 sm:h-22 rounded-xl shadow-md border border-slate-200 overflow-hidden relative transform hover:scale-105 transition-transform duration-300 bg-white">
                    <img 
                      src={receiveFromUser.recommendedBook.imageUrl} 
                      alt={receiveFromUser.recommendedBook.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 via-black/5 to-transparent"></div>
                  </div>
                ) : (
                  <div className={`w-14 h-20 sm:w-16 sm:h-22 rounded-xl shadow-md p-2 flex flex-col justify-between text-white border border-white/10 overflow-hidden relative ${getBookCoverColor(receiveFromUser.id)}`}>
                    <div className="text-[9px] font-black line-clamp-3 leading-snug">
                      {receiveFromUser.recommendedBook.title}
                    </div>
                    <div className="text-[8px] opacity-75 truncate">{receiveFromUser.recommendedBook.author}</div>
                  </div>
                )}
              </div>
            </div>

            {/* TO side (책 보냄) */}
            <div className="bg-orange-50/40 rounded-3xl p-6 border border-orange-100 flex gap-4 justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Left Column (Content) */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Highly Intuitive "책 보냄" Visual Badge with graphic icons - Enlarged 2x */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1.5 bg-orange-500 text-white text-base sm:text-lg font-black px-4 py-1.5 rounded-full shadow-md">
                      <ArrowUpRight className="w-5 h-5 stroke-[3px]" />
                      <span>책 보냄</span>
                    </span>
                    <span className="text-xs text-orange-600 font-bold uppercase tracking-wider bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg">
                      TO
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {getAvatarLetter(sendToUser.name)}
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-slate-900">{sendToUser.name}님</span>
                      <p className="text-[11px] text-orange-600 font-medium">내가 책을 보낼 파트너</p>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">보낼 도서 📚</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5 leading-snug line-clamp-1" title={activeUser.recommendedBook.title}>
                      《{activeUser.recommendedBook.title}》
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-orange-800/80 italic mt-3 bg-white/80 p-2.5 rounded-xl border border-orange-50/50 line-clamp-2">
                  "{activeUser.recommendedBook.description}"
                </p>
              </div>

              {/* Right Column (Pen Color & Book Cover Thumbnail) */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {/* Pen Color Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold border shadow-sm ${getPenColorBadgeStyle(sendToUser.penColor)}`}>
                  펜색: {sendToUser.penColor}
                </span>

                {/* Refined Book Cover Thumbnail right below the Pen Color Badge */}
                {activeUser.recommendedBook.imageUrl ? (
                  <div className="w-14 h-20 sm:w-16 sm:h-22 rounded-xl shadow-md border border-slate-200 overflow-hidden relative transform hover:scale-105 transition-transform duration-300 bg-white">
                    <img 
                      src={activeUser.recommendedBook.imageUrl} 
                      alt={activeUser.recommendedBook.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 via-black/5 to-transparent"></div>
                  </div>
                ) : (
                  <div className={`w-14 h-20 sm:w-16 sm:h-22 rounded-xl shadow-md p-2 flex flex-col justify-between text-white border border-white/10 overflow-hidden relative ${getBookCoverColor(activeUser.id)}`}>
                    <div className="text-[9px] font-black line-clamp-3 leading-snug">
                      {activeUser.recommendedBook.title}
                    </div>
                    <div className="text-[8px] opacity-75 truncate">{activeUser.recommendedBook.author}</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: 소하님께 보내는 법 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xl flex flex-col md:flex-row gap-6 items-stretch min-h-[300px]">
          
          {/* Book Cover Design Block */}
          <div className="w-full md:w-[240px] shrink-0 rounded-3xl p-5 bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black tracking-widest bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded uppercase">
                ACTIVE BOOK COVER
              </span>
              
              {/* Dynamic visual book wrapper */}
              {activeUser.recommendedBook.imageUrl ? (
                <div className="mt-4 w-full aspect-[3/4] rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative group">
                  <img 
                    src={activeUser.recommendedBook.imageUrl} 
                    alt={activeUser.recommendedBook.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Spine shadow to simulate a physical book page fold */}
                  <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/25 via-black/8 to-transparent"></div>
                  <div className="absolute inset-y-0 left-3 w-1 bg-white/5"></div>
                  {/* Soft gradient bottom text card so book info is clear when hovered */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                    <div className="text-xs font-black">《{activeUser.recommendedBook.title}》</div>
                    <div className="text-[10px] opacity-80">{activeUser.recommendedBook.author}</div>
                  </div>
                </div>
              ) : (
                <div className={`mt-4 w-full aspect-[3/4] rounded-2xl ${getBookCoverColor(selectedId)} p-5 shadow-lg border border-white/10 flex flex-col justify-between relative overflow-hidden group`}>
                  {/* subtle pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg"></div>
                  
                  <div className="text-lg font-black tracking-tight leading-snug line-clamp-3">
                    {activeUser.recommendedBook.title}
                  </div>
                  <div>
                    <div className="text-xs font-bold opacity-95">{activeUser.recommendedBook.author}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 font-mono uppercase">BY {activeUser.name} ({activeUser.penColor})</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase">내가 이번 달 추천한 책</div>
              <h5 className="text-xs font-black text-slate-900 mt-1 line-clamp-1">{activeUser.recommendedBook.title}</h5>
            </div>
          </div>

          {/* Right details: Address details & description */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Delivery Guide • Section 3</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2 mb-4">
                {sendToUser.name}님께 보내는 법 📍
              </h3>

              {/* Receiver Delivery Address details card */}
              <div className="bg-[#F9F7F2] p-6 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold text-base sm:text-lg">수령인</span>
                  <span className="font-black text-slate-900 text-lg sm:text-xl">{sendToUser.name}님</span>
                </div>
                <div className="flex justify-between items-start gap-4 pt-3 border-t border-slate-200/60">
                  <span className="text-slate-600 font-bold text-base sm:text-lg shrink-0">CU 수령 점포</span>
                  <span className="font-black text-slate-900 text-lg sm:text-xl text-right font-mono select-all break-all text-orange-600">{sendToUser.address}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200/60">
                  <span className="text-slate-600 font-bold text-base sm:text-lg">보낼 도서</span>
                  <span className="font-black text-slate-900 text-base sm:text-lg">《{activeUser.recommendedBook.title}》</span>
                </div>
              </div>
              
              {/* Note memo block */}
              <div className="mt-4">
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  ✍️ 전달 한 줄 메모 (선택)
                </label>
                <textarea
                  rows={2}
                  value={checklists[selectedId].memo}
                  onChange={(e) => updateMemo(selectedId, e.target.value)}
                  placeholder="배송 특이사항이나 파트너를 향한 따뜻한 격려를 남기실 수 있습니다."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 rounded-2xl resize-none"
                />
              </div>
            </div>

            {/* Address Action buttons - CU Reservation button enlarged and centered */}
            <div className="mt-6">
              <button
                onClick={() => window.open("https://www.cupost.co.kr", "_blank")}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-base sm:text-lg font-black tracking-wide shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Truck className="w-6 h-6 stroke-[2.5]" />
                <span>CU 편의점택배 예약 접수 바로가기 🚚</span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: 교환독서 6개월 매칭 달력 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xl relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-100 text-orange-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest">
                  2026 SEASON TIMELINE • 하반기 일정
                </span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded-md">
                  7월 ~ 12월 교환독서
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                교환독서 6개월 매칭 달력 📅
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                우리가 운영하는 교환독서는 <strong className="text-slate-600">2026년 7월부터 12월까지</strong> 진행되며, <strong className="text-orange-600">매달 25일</strong>은 서로에게 추천 도서를 보내는 날입니다! 
              </p>
            </div>

            {/* Month Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {MONTHS_2026.map((m, idx) => (
                <button
                  key={m.month}
                  onClick={() => setActiveMonthIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    activeMonthIdx === idx
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Calendar Grid Col 8 */}
            <div className="lg:col-span-8 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-inner">
              <div className="flex justify-between items-center mb-4 px-2">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  2026년 {currentMonthData.name} 스케줄러
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-orange-600">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full inline-block animate-pulse"></span>
                    25일: 책 보내는 날 📦
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-indigo-600">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                    오늘 📍
                  </span>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2 py-1 border-b border-slate-200">
                <div className="text-red-500">일 (Sun)</div>
                <div>월 (Mon)</div>
                <div>화 (Tue)</div>
                <div>수 (Wed)</div>
                <div>목 (Thu)</div>
                <div>금 (Fri)</div>
                <div className="text-blue-500">토 (Sat)</div>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {totalCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square bg-slate-200/20 rounded-xl"></div>;
                  }

                  const isShippingDay = day === 25;
                  const isToday = currentMonthData.month === currentRealMonth && day === currentRealDay;
                  const dateStr = formatDateStr(currentMonthData.month, day);

                  // Gather statuses
                  const ownEvent = checklists[selectedId]?.calendarEvents?.[dateStr];
                  const recipientId = activeUser.sendToId;
                  const recipientReceived = checklists[recipientId]?.calendarEvents?.[dateStr] === "received";
                  const senderId = activeUser.receiveFromId;
                  const senderSent = checklists[senderId]?.calendarEvents?.[dateStr] === "sent";

                  // Check which book image to display
                  let bookCoverToShow = null;
                  let bookTitleToShow = "";
                  
                  if (ownEvent === "sent" || recipientReceived) {
                    bookCoverToShow = activeUser.recommendedBook.imageUrl;
                    bookTitleToShow = activeUser.recommendedBook.title;
                  } else if (ownEvent === "received" || senderSent) {
                    const sender = PARTICIPANTS[senderId];
                    if (sender) {
                      bookCoverToShow = sender.recommendedBook.imageUrl;
                      bookTitleToShow = sender.recommendedBook.title;
                    }
                  }

                  // Accumulate status badges for the cell
                  const dateStatuses: { label: string; bg: string; icon: string; type: string }[] = [];
                  if (ownEvent === "sent") {
                    dateStatuses.push({ label: "발송", bg: "bg-orange-500 text-white", icon: "📤", type: "own_sent" });
                  }
                  if (ownEvent === "received") {
                    dateStatuses.push({ label: "수령", bg: "bg-emerald-500 text-white", icon: "📥", type: "own_received" });
                  }
                  if (recipientReceived) {
                    dateStatuses.push({ label: "상대수령", bg: "bg-teal-600 text-white", icon: "✅", type: "partner_received" });
                  }
                  if (senderSent) {
                    dateStatuses.push({ label: "상대발송", bg: "bg-amber-600 text-white", icon: "📦", type: "partner_sent" });
                  }

                  // Determine overall background color style for the day card
                  let dayColorStyle = "bg-white text-slate-800 border-slate-200 hover:bg-slate-50";
                  if (ownEvent === "sent") {
                    dayColorStyle = "bg-orange-50 border-orange-300 text-orange-950 shadow-sm hover:bg-orange-100/70";
                  } else if (ownEvent === "received") {
                    dayColorStyle = "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm hover:bg-emerald-100/70";
                  } else if (recipientReceived) {
                    dayColorStyle = "bg-teal-50 border-teal-200 text-teal-950 shadow-sm hover:bg-teal-100/70";
                  } else if (senderSent) {
                    dayColorStyle = "bg-amber-50 border-amber-200 text-amber-950 shadow-sm hover:bg-amber-100/70";
                  } else if (isToday) {
                    dayColorStyle = "bg-indigo-600 text-white border-indigo-700 shadow-md font-black ring-4 ring-indigo-200 hover:bg-indigo-700";
                  } else if (isShippingDay) {
                    dayColorStyle = "bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/10 font-black ring-4 ring-orange-200 hover:bg-orange-600";
                  }

                  return (
                    <div
                      key={`day-${day}`}
                      onClick={() => setSelectedCalendarDay({ month: currentMonthData.month, day })}
                      className={`relative aspect-square rounded-2xl border p-1.5 flex flex-col justify-between transition-all duration-200 cursor-pointer group ${dayColorStyle}`}
                      title={bookTitleToShow ? `${day}일: 《${bookTitleToShow}》` : `${day}일`}
                    >
                      <div className="flex justify-between items-center w-full z-10">
                        <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded-lg ${bookCoverToShow ? "bg-white/95 text-slate-900 shadow-sm z-20" : ""}`}>
                          {day}
                        </span>
                        {isToday && dateStatuses.length === 0 && (
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        )}
                      </div>
                      
                      {bookCoverToShow && (
                        <div className="absolute inset-0 flex items-center justify-center p-1.5 pointer-events-none z-0">
                          <div className="w-8 h-11 sm:w-11 sm:h-15 rounded shadow-lg border border-white bg-slate-100 overflow-hidden transform group-hover:scale-115 group-hover:rotate-3 transition-all duration-300 relative">
                            <img 
                              src={bookCoverToShow} 
                              alt={bookTitleToShow}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {/* spine fold shadow */}
                            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 via-black/5 to-transparent"></div>
                          </div>
                        </div>
                      )}

                      {/* Floating Tooltip */}
                      {bookTitleToShow && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-fade-in max-w-[180px] drop-shadow-xl">
                          <div className="bg-slate-900/95 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col items-center text-center gap-0.5">
                            <span className="text-orange-400 font-extrabold text-[9px] uppercase tracking-wider">교환 도서 📚</span>
                            <span className="truncate max-w-[150px]">《{bookTitleToShow}》</span>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="w-2 h-2 bg-slate-900/95 rotate-45 -mt-1 border-r border-b border-slate-700/50"></div>
                        </div>
                      )}

                      <div className="flex flex-col gap-1 w-full mt-auto overflow-hidden z-10 max-w-[85%]">
                        {dateStatuses.map((st, sIdx) => (
                          <span 
                            key={sIdx} 
                            className={`text-[8px] md:text-[9px] text-center font-bold px-1 py-0.5 rounded leading-none flex items-center justify-center gap-0.5 shadow-sm uppercase shrink-0 truncate ${st.bg}`}
                          >
                            <span>{st.icon}</span>
                            <span className="hidden sm:inline">{st.label}</span>
                          </span>
                        ))}
                        
                        {/* Fallback to default schedule markers if no custom logged statuses are present */}
                        {dateStatuses.length === 0 && isShippingDay && (
                          <span className="text-[8px] md:text-[9px] text-center font-black bg-white text-orange-600 py-0.5 rounded px-1 flex items-center justify-center gap-0.5 shadow-sm uppercase shrink-0">
                            📦 발송일
                          </span>
                        )}
                        {dateStatuses.length === 0 && isToday && (
                          <span className="text-[8px] md:text-[9px] text-center font-black bg-white text-indigo-700 py-0.5 rounded px-1 flex items-center justify-center gap-0.5 shadow-sm uppercase shrink-0">
                            📍 오늘
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info panel Col 4 */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-orange-50/70 p-6 rounded-3xl border border-orange-200/60 flex flex-col justify-between h-full min-h-[260px]">
                <div>
                  <span className="text-[10px] font-black tracking-widest bg-orange-100 text-orange-800 px-2.5 py-1 rounded uppercase">
                    TIMELINE STATUS
                  </span>
                  
                  <h4 className="text-lg font-black text-slate-900 mt-4">
                    {currentMonthData.name} 도서 순환 스케줄 ⏰
                  </h4>
                  
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    2026년 하반기 독서 로테이션은 참여자분들의 열정과 정성으로 완성됩니다. <strong className="text-orange-600">매달 25일</strong>은 파트너의 책장에 온기를 선물하는 즐거운 날입니다.
                  </p>

                  <div className="mt-6 bg-white p-4 rounded-2xl border border-orange-200/40 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                      📅
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400">남은 시간 (D-Day)</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5 truncate">
                        {(() => {
                          const cleanToday = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
                          const cleanTarget = new Date(2026, currentMonthData.month - 1, 25);
                          const diffMs = cleanTarget.getTime() - cleanToday.getTime();
                          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

                          if (diffDays > 0) {
                            return (
                              <span>{currentMonthData.month}월 25일 발송까지 <strong className="text-orange-600 text-lg font-mono">D-{diffDays}일</strong> ⏳</span>
                            );
                          } else if (diffDays === 0) {
                            return (
                              <span>오늘({currentMonthData.month}월 25일)은 <strong className="text-orange-600 text-lg font-mono">발송 D-Day</strong>입니다! 📦</span>
                            );
                          } else {
                            return (
                              <span>{currentMonthData.month}월 25일 발송일 경과 (<strong className="text-slate-600 text-lg font-mono">+{Math.abs(diffDays)}일</strong>)</span>
                            );
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SECTION 5: 6인의 한 달 순환맵 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xl flex flex-col justify-between min-h-[280px] relative">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-orange-50 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-lg">
                  Active Rotation Loop • Section 5
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-900 leading-tight flex flex-wrap items-center gap-2">
                  <span>6인의 한 달 순환맵</span>
                  <span className="text-xs sm:text-sm font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                    ( 매달 27일 기준 수령 책 )
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  매달 25일 발송 후 <strong>27일 수령을 기준</strong>으로 각 파트너가 지니고 있는 추천 도서 표지가 반영됩니다. 카드를 클릭해 프로필을 전환해 보세요.
                </p>
              </div>

              {/* Month Tabs for Section 5 */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                {MONTHS_2026.map((m, idx) => (
                  <button
                    key={m.month}
                    onClick={() => setActiveMonthIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      activeMonthIdx === idx
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Row Loop Container */}
            <div className="mt-6 select-none">
              
              {/* Helper functions for colors & held book calculation */}
              {(() => {
                const getHeldBookInfo = (participantId: string, monthIdx: number) => {
                  const pIdx = ROTATION_ORDER.indexOf(participantId);
                  if (pIdx === -1) {
                    const p = PARTICIPANTS[participantId];
                    return { book: p.recommendedBook, originalOwnerName: p.name, originalOwnerId: participantId };
                  }
                  
                  const viewingMonthNum = MONTHS_2026[monthIdx].month; // 7..12
                  
                  // Calculate rotation shift:
                  // Books rotate on the 27th of each month.
                  // Before 27th of current month (e.g. 7/23), shift = viewingMonthNum - 7
                  // On/after 27th or previewing future/past post-27th cycles, shift = viewingMonthNum - 7 + 1
                  let shift = viewingMonthNum - 7 + 1;
                  if (viewingMonthNum === currentRealMonth && currentRealDay < 27) {
                    shift = viewingMonthNum - 7;
                  }

                  const ownerIdx = (pIdx - (shift % 6) + 6) % 6;
                  const ownerId = ROTATION_ORDER[ownerIdx];
                  const owner = PARTICIPANTS[ownerId];
                  
                  return {
                    book: owner.recommendedBook,
                    originalOwnerName: owner.name,
                    originalOwnerId: ownerId,
                  };
                };

                const getSoftBgColor = (color: string) => {
                  switch (color) {
                    case "주황": return "bg-orange-50/70 border-orange-200/60 hover:bg-orange-100/60";
                    case "남색": return "bg-blue-50/70 border-blue-200/50 hover:bg-blue-100/50";
                    case "형광연두": return "bg-lime-50/70 border-lime-200/50 hover:bg-lime-100/50";
                    case "분홍": return "bg-pink-50/70 border-pink-200/50 hover:bg-pink-100/50";
                    case "하늘": return "bg-sky-50/70 border-sky-200/50 hover:bg-sky-100/50";
                    case "보라": return "bg-purple-50/70 border-purple-200/50 hover:bg-purple-100/50";
                    default: return "bg-slate-50 border-slate-200 hover:bg-slate-100";
                  }
                };

                const getBgColor = (color: string) => {
                  switch (color) {
                    case "주황": return "bg-orange-500 text-white";
                    case "남색": return "bg-blue-700 text-white";
                    case "형광연두": return "bg-lime-400 text-slate-950";
                    case "분홍": return "bg-pink-500 text-white";
                    case "하늘": return "bg-sky-400 text-white";
                    case "보라": return "bg-purple-600 text-white";
                    default: return "bg-slate-400 text-white";
                  }
                };

                // Custom block arrows
                const BlockArrowRight = () => (
                  <div className="flex items-center justify-center shrink-0 w-8 sm:w-10 h-12">
                    <svg className="w-7 h-5 drop-shadow-sm filter" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M2 8h16V3l12 9-12 9v-5H2V8z" 
                        fill="#ffffff" 
                        stroke="#1e293b" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                );

                const BlockArrowLeft = () => (
                  <div className="flex items-center justify-center shrink-0 w-8 sm:w-10 h-12">
                    <svg className="w-7 h-5 drop-shadow-sm filter" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M30 8H14V3L2 12l12 9v-5h16V8z" 
                        fill="#ffffff" 
                        stroke="#1e293b" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                );

                const BlockArrowDown = () => (
                  <div className="flex items-center justify-center shrink-0 h-10">
                    <svg className="w-6 h-7 drop-shadow-sm filter" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M8 2v16H3l9 12 9-12h-5V2H8z" 
                        fill="#ffffff" 
                        stroke="#1e293b" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                );

                const BlockArrowUp = () => (
                  <div className="flex items-center justify-center shrink-0 h-10">
                    <svg className="w-6 h-7 drop-shadow-sm filter" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M8 30V14H3l9-12 9 12h-5v16H8z" 
                        fill="#ffffff" 
                        stroke="#1e293b" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                );

                const renderLoopCard = (id: string, globalIdx: number) => {
                  const p = PARTICIPANTS[id];
                  const isCurrent = id === selectedId;
                  const sendToUser = PARTICIPANTS[p.sendToId];
                  const heldInfo = getHeldBookInfo(id, activeMonthIdx);
                  const heldBook = heldInfo.book;

                  return (
                    <div 
                      key={id}
                      onClick={() => setSelectedId(id)}
                      className={`flex flex-col items-center justify-between text-center p-3.5 sm:p-4 rounded-3xl transition-all duration-300 border cursor-pointer h-full ${
                        isCurrent 
                          ? "bg-orange-100/90 border-orange-400 shadow-md scale-[1.02]" 
                          : `${getSoftBgColor(p.penColor)}`
                      }`}
                    >
                      <div className="w-full flex flex-col items-center">
                        {/* Member Info */}
                        <div className="flex items-center gap-2 mb-2 w-full justify-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm text-white shrink-0 ${getBgColor(p.penColor)}`}>
                            {p.name}
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                              <span>{p.name}님</span>
                              <span className="text-[9px] text-slate-400 font-mono">0{globalIdx + 1}</span>
                            </div>
                            <span className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold border ${getPenColorBadgeStyle(p.penColor)}`}>
                              {p.penColor}
                            </span>
                          </div>
                        </div>

                        {/* Currently Held Book Display */}
                        <div className="my-2 flex flex-col items-center w-full">
                          <div className="text-[9px] font-black text-indigo-600 bg-white/90 border border-indigo-100 px-2 py-0.5 rounded-md mb-1.5 uppercase tracking-wider shadow-xs">
                            보유 책 📖
                          </div>
                          
                          {heldBook.imageUrl ? (
                            <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl shadow-md border border-slate-200 overflow-hidden relative transform hover:scale-105 transition-transform duration-300 bg-white">
                              <img 
                                src={heldBook.imageUrl} 
                                alt={heldBook.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 via-black/5 to-transparent"></div>
                            </div>
                          ) : (
                            <div className={`w-16 h-22 sm:w-20 sm:h-28 rounded-xl shadow-md p-2 flex flex-col justify-between text-white border border-white/10 overflow-hidden relative ${getBookCoverColor(heldInfo.originalOwnerId)}`}>
                              <div className="text-[9px] font-black line-clamp-3 leading-snug">
                                {heldBook.title}
                              </div>
                              <div className="text-[8px] opacity-75 truncate">{heldBook.author}</div>
                            </div>
                          )}

                          <p className="text-[11px] font-black text-slate-900 mt-2 line-clamp-1 w-full px-1" title={heldBook.title}>
                            《{heldBook.title}》
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                            ({heldInfo.originalOwnerName}님의 책)
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200/80 w-full">
                        <p className="text-[9.5px] font-black text-orange-600 flex items-center justify-center gap-0.5 leading-none">
                          <span>📤</span>
                          <span className="truncate">{sendToUser.name}님께 발송 예정</span>
                        </p>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="w-full">
                    {/* DESKTOP 2-ROW CIRCULAR LOOP LAYOUT */}
                    <div className="hidden md:grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-2 gap-y-3 items-center bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                      {/* ROW 1: Members 1, 2, 3 */}
                      {renderLoopCard(ROTATION_ORDER[0], 0)}
                      <BlockArrowRight />
                      {renderLoopCard(ROTATION_ORDER[1], 1)}
                      <BlockArrowRight />
                      {renderLoopCard(ROTATION_ORDER[2], 2)}

                      {/* ROW 2 (TRANSITION ROW) */}
                      <div className="flex justify-center py-1">
                        <BlockArrowUp />
                      </div>
                      <div />
                      <div />
                      <div />
                      <div className="flex justify-center py-1">
                        <BlockArrowDown />
                      </div>

                      {/* ROW 3: Members 6, 5, 4 */}
                      {renderLoopCard(ROTATION_ORDER[5], 5)}
                      <BlockArrowLeft />
                      {renderLoopCard(ROTATION_ORDER[4], 4)}
                      <BlockArrowLeft />
                      {renderLoopCard(ROTATION_ORDER[3], 3)}
                    </div>

                    {/* MOBILE 1-COLUMN STACKED LIST WITH DOWN ARROWS */}
                    <div className="flex md:hidden flex-col gap-3 items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                      {ROTATION_ORDER.map((id, index) => (
                        <React.Fragment key={id}>
                          <div className="w-full">
                            {renderLoopCard(id, index)}
                          </div>
                          {index < ROTATION_ORDER.length - 1 ? (
                            <BlockArrowDown />
                          ) : (
                            <div className="flex flex-col items-center gap-1 my-1">
                              <BlockArrowDown />
                              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                                소하님께 루프백 🔁
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

      </main>

      {/* MARKDOWN EXPORTER MODAL DRAWER */}
      <AnimatePresence>
        {showMarkdownModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    📋 {activeUser.name} 대시보드 기획안 마크다운 양식
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    사용자가 요청한 4가지 섹션을 UX/UI 가이드라인 마크다운 텍스트 규격으로 완전하게 설계한 최종 기획 명세서입니다.
                  </p>
                </div>
                <button
                  onClick={() => setShowMarkdownModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Code output display box */}
              <div className="p-6 flex-1 overflow-y-auto bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed">
                <pre className="whitespace-pre-wrap select-all">{activeMarkdown}</pre>
              </div>

              {/* Footer actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  💡 UX 기획의 친절하고 귀여운 이모지 톤앤매너가 100% 반영되었습니다.
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCopyMarkdown(activeMarkdown)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-orange-500/20"
                  >
                    {markdownCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>클립보드 전체 복사</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowMarkdownModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CALENDAR EVENT LOGGER MODAL */}
      <AnimatePresence>
        {selectedCalendarDay && (() => {
          const day = selectedCalendarDay.day;
          const month = selectedCalendarDay.month;
          const dateStr = formatDateStr(month, day);
          
          // Check statuses
          const ownEvent = checklists[selectedId]?.calendarEvents?.[dateStr];
          const recipientId = activeUser.sendToId;
          const recipientReceived = checklists[recipientId]?.calendarEvents?.[dateStr] === "received";
          const senderId = activeUser.receiveFromId;
          const senderSent = checklists[senderId]?.calendarEvents?.[dateStr] === "sent";
          
          const isShippingDay = day === 25;
          const isToday = month === 7 && day === 3;
          
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      📅 {month}월 {day}일 교환 일정 기록
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeUser.name}님의 일정 달력 기록기
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCalendarDay(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  
                  {/* Calendar Info indicators */}
                  <div className="flex flex-wrap gap-2">
                    {isShippingDay && (
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-800 border border-orange-200 text-xs font-black rounded-lg">
                        📦 하반기 공식 발송일 (25일)
                      </span>
                    )}
                    {isToday && (
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-black rounded-lg">
                        📍 오늘 날짜
                      </span>
                    )}
                  </div>

                  {/* Status description box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">현재 실시간 연동 상황</p>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span className="text-slate-700">
                          내 발송 상태: {ownEvent === "sent" ? (
                            <strong className="text-orange-600">📤 {sendToUser.name}님께 책을 발송했습니다.</strong>
                          ) : (
                            <span className="text-slate-400">기록 없음</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span className="text-slate-700">
                          내 수령 상태: {ownEvent === "received" ? (
                            <strong className="text-emerald-600">📥 {receiveFromUser.name}님으로부터 책을 받았습니다.</strong>
                          ) : (
                            <span className="text-slate-400">기록 없음</span>
                          )}
                        </span>
                      </div>

                      <div className="border-t border-slate-200/60 my-2 pt-2"></div>

                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span className="text-slate-700">
                          받는 파트너 ({sendToUser.name}님) 수령: {recipientReceived ? (
                            <strong className="text-teal-600">🎉 책 수령을 완료했습니다! (발송 완료 확인)</strong>
                          ) : (
                            <span className="text-slate-400">아직 수령하지 않음</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span className="text-slate-700">
                          보내는 파트너 ({receiveFromUser.name}님) 발송: {senderSent ? (
                            <strong className="text-amber-600">📦 나에게 책을 발송했습니다!</strong>
                          ) : (
                            <span className="text-slate-400">아직 발송하지 않음</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">상태 기록/변경하기</p>
                    
                    <button
                      onClick={async () => {
                        await handleSaveCalendarEvent(selectedId, dateStr, "sent");
                        setSelectedCalendarDay(null);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 transition text-left cursor-pointer"
                    >
                      <div>
                        <span className="text-sm font-extrabold flex items-center gap-1.5">
                          📤 책 발송 완료 등록
                        </span>
                        <p className="text-[11px] text-orange-700/80 mt-0.5">
                          {sendToUser.name}님에게 책을 포장 및 발송 완료했습니다.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-orange-500 shrink-0" />
                    </button>

                    <button
                      onClick={async () => {
                        await handleSaveCalendarEvent(selectedId, dateStr, "received");
                        setSelectedCalendarDay(null);
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition text-left cursor-pointer"
                    >
                      <div>
                        <span className="text-sm font-extrabold flex items-center gap-1.5">
                          📥 책 수령 완료 등록
                        </span>
                        <p className="text-[11px] text-emerald-700/80 mt-0.5">
                          {receiveFromUser.name}님이 보낸 책을 안전하게 수령했습니다.
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                    </button>

                    {ownEvent && (
                      <button
                        onClick={async () => {
                          await handleSaveCalendarEvent(selectedId, dateStr, null);
                          setSelectedCalendarDay(null);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl hover:bg-red-50 text-red-600 border border-dashed border-red-200 hover:border-red-300 transition text-xs font-bold cursor-pointer"
                      >
                        ❌ 오늘 내 기록 초기화하기
                      </button>
                    )}
                  </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedCalendarDay(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
