import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Target, LayoutDashboard, LogIn, UserCircle, LogOut, Rocket, Youtube, ExternalLink, MessageCircle, X } from 'lucide-react';
import CategorySelector from './components/CategorySelector';
import BriefDisplay from './components/BriefDisplay';
import Dashboard from './components/Dashboard';
import { generateDesignBrief } from './services/geminiService';
import { DesignCategory, BriefData, INDUSTRIES, EDUCATION_INDUSTRIES, YOUTUBE_INDUSTRIES, Project, User, Difficulty } from './types';

const App: React.FC = () => {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState<'category' | 'industry' | 'result'>('category');
  const [selectedCategory, setSelectedCategory] = useState<DesignCategory | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Beginner);
  const [currentBrief, setCurrentBrief] = useState<BriefData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard Data
  const [projects, setProjects] = useState<Project[]>([]);

  // --- Effects ---
  // Load data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('graphico_user');
    const savedProjects = localStorage.getItem('graphico_projects');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
  }, []);

  // Save projects on change
  useEffect(() => {
    localStorage.setItem('graphico_projects', JSON.stringify(projects));
  }, [projects]);

  // --- Handlers ---
  const handleLoginSubmit = (e: React.FormEvent, name: string) => {
    e.preventDefault();
    const mockUser: User = {
      name: name || "مصمم جرافيكو",
      email: "designer@graphico.com",
      avatar: "",
      level: "مستوى 1",
      xp: 0
    };
    setUser(mockUser);
    localStorage.setItem('graphico_user', JSON.stringify(mockUser));
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('graphico_user');
    setStep('category');
    setActiveTab('home');
  };

  const handleCategorySelect = (category: DesignCategory) => {
    setSelectedCategory(category);
    setStep('industry');
  };

  const handleGenerate = async (industry: string) => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    setError(null);
    setSelectedIndustry(industry);
    
    try {
      const data = await generateDesignBrief(
        selectedCategory, 
        difficulty,
        industry === "عشوائي" ? undefined : industry
      );
      setCurrentBrief(data);
      setStep('result');
    } catch (err) {
      setError("حدث خطأ أثناء توليد البرييف. يرجى المحاولة مرة أخرى.");
      console.error(err);
      setStep('industry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (selectedCategory) {
      handleGenerate(selectedIndustry);
    }
  };

  const handleAcceptBrief = (brief: BriefData) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      brief: brief,
      startTime: Date.now(),
      status: 'active'
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveTab('dashboard');
    setStep('category'); // Reset wizard
    setCurrentBrief(null);
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const handleBackToStart = () => {
    setCurrentBrief(null);
    setSelectedCategory(null);
    setSelectedIndustry("");
    setStep('category');
    setError(null);
  };

  // Helper to get correct industries list
  const getIndustryList = () => {
    if (selectedCategory === DesignCategory.Education) return EDUCATION_INDUSTRIES;
    if (selectedCategory === DesignCategory.YouTube) return YOUTUBE_INDUSTRIES;
    return INDUSTRIES;
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full p-4 md:px-8 flex justify-between items-center backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold">
            G
          </div>
          <span className="text-white font-bold tracking-tight hidden md:block">Graphico Brief</span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
               <button 
                onClick={() => setActiveTab(activeTab === 'home' ? 'dashboard' : 'home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-brand-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
              >
                {activeTab === 'home' ? <LayoutDashboard size={18} /> : <Rocket size={18} />}
                <span className="hidden md:inline">{activeTab === 'home' ? 'لوحة التحكم' : 'تحدي جديد'}</span>
              </button>
              
              <div className="flex items-center gap-3 border-r border-white/10 pr-4 mr-1">
                <div className="text-right hidden md:block">
                  <p className="text-sm text-white font-bold">{user.name}</p>
                  <p className="text-xs text-brand-400">{user.level}</p>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="تسجيل خروج">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
             <button 
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/5"
              >
                <LogIn size={18} />
                <span>تسجيل دخول</span>
              </button>
          )}
        </div>
      </nav>

      {/* AUTH MODAL */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} onSubmit={handleLoginSubmit} />
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center min-h-[calc(100vh-80px)]">
        
        {/* Main Header (Only on Home/Wizard) */}
        {activeTab === 'home' && !currentBrief && step !== 'industry' && (
          <header className="mb-12 text-center animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-white drop-shadow-2xl">
              جرافيكو <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400">برييف</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed font-light mb-8">
              مولد بريفات تصميم ذكي للمحترفين. احصل على تحديات كاملة مع نصوص (Copy)، صور مساعدة (Assets)، وتقييم AI لتصاميمك.
            </p>
          </header>
        )}

        {/* --- ROUTING --- */}
        
        {/* VIEW: DASHBOARD */}
        {activeTab === 'dashboard' && user && (
          <Dashboard 
            projects={projects} 
            onUpdateProject={handleUpdateProject} 
            onViewBrief={(project) => {
              setCurrentBrief(project.brief);
              setActiveTab('home');
              setStep('result');
            }}
          />
        )}

        {/* VIEW: WIZARD / HOME */}
        {activeTab === 'home' && (
          <main className="w-full flex flex-col items-center max-w-6xl">
            
            {error && (
              <div className="w-full max-w-lg bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8 text-center backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Step 1: Category Selection */}
            {step === 'category' && (
              <div className="w-full flex flex-col items-center animate-fade-in-up">
                
                {/* Difficulty Toggle */}
                <div className="flex bg-dark-900/50 p-1 rounded-xl mb-8 border border-white/10">
                  <button 
                    onClick={() => setDifficulty(Difficulty.Beginner)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${difficulty === Difficulty.Beginner ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    مستوى مبتدئ
                  </button>
                  <button 
                    onClick={() => setDifficulty(Difficulty.Professional)}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${difficulty === Difficulty.Professional ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    مستوى محترف
                  </button>
                </div>

                <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm">1</span>
                  اختر نوع التصميم
                </h3>
                <CategorySelector onSelect={handleCategorySelect} isLoading={false} />
              </div>
            )}

            {/* Step 2: Industry Selection */}
            {step === 'industry' && (
              <div className="w-full max-w-3xl animate-fade-in-up">
                <div className="flex items-center justify-center mb-8 relative">
                   <button onClick={() => setStep('category')} className="absolute right-0 text-gray-500 hover:text-white transition-colors p-2">
                      <ArrowRight />
                   </button>
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm">2</span>
                    اختر مجال المشروع ({selectedCategory})
                  </h3>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-dark-900/40 rounded-3xl border border-brand-500/20 backdrop-blur-xl">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-brand-900 border-t-brand-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-white font-bold text-lg mt-6">جاري تصميم البرييف...</p>
                    <p className="text-gray-400 mt-2 text-sm">مستوى {difficulty} - جاري كتابة النصوص وتجهيز الصور</p>
                  </div>
                ) : (
                  <div className="bg-dark-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                      {getIndustryList().map((ind) => (
                        <button
                          key={ind}
                          onClick={() => handleGenerate(ind)}
                          className="p-4 rounded-xl bg-dark-800 hover:bg-brand-600 border border-white/5 hover:border-brand-500 transition-all text-gray-300 hover:text-white font-semibold text-right flex justify-between group"
                        >
                          {ind}
                          <Target className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                      <button
                          onClick={() => handleGenerate("عشوائي")}
                          className="p-4 rounded-xl bg-gradient-to-r from-brand-900 to-dark-800 hover:from-brand-700 hover:to-brand-800 border border-brand-500/30 transition-all text-white font-bold text-right col-span-2 md:col-span-1 flex justify-between items-center"
                        >
                          مجال عشوائي
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                        </button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-dark-900 text-gray-500">أو اكتب مجالاً محدداً</span>
                      </div>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = (e.currentTarget.elements.namedItem('customInd') as HTMLInputElement).value;
                        if(val) handleGenerate(val);
                      }}
                      className="mt-6 flex gap-2"
                    >
                      <input 
                        name="customInd"
                        type="text" 
                        placeholder="مثلاً: شركة طيران اقتصادي، تطبيق توصيل..."
                        className="flex-1 bg-dark-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                      />
                      <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                        ابدأ
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Result Brief */}
            {step === 'result' && currentBrief && (
              <div className="w-full animate-fade-in-up">
                <div className="flex justify-start w-full max-w-6xl mx-auto mb-6">
                  <button 
                    onClick={handleBackToStart}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-4 py-2 rounded-lg hover:bg-white/5"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>العودة للقائمة الرئيسية</span>
                  </button>
                </div>
                
                <BriefDisplay 
                  brief={currentBrief} 
                  onRegenerate={handleRegenerate} 
                  onAccept={handleAcceptBrief}
                  isGenerating={isLoading} 
                  viewOnly={projects.some(p => p.brief.id === currentBrief.id && p.status === 'completed')}
                />
              </div>
            )}

          </main>
        )}

        <footer className="mt-auto pt-20 pb-6 w-full text-center">
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
             
             {/* Social Links */}
             <div className="flex gap-4">
                <a href="https://www.youtube.com/@Mahmoud_Design" target="_blank" rel="noopener noreferrer" className="p-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full transition-all border border-red-600/30">
                  <Youtube size={24} />
                </a>
                <a href="https://www.udemy.com/user/mahmoud-ahmed-1129/" target="_blank" rel="noopener noreferrer" className="p-3 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-full transition-all border border-purple-600/30">
                  <ExternalLink size={24} />
                </a>
                <a href="https://wa.me/201032116402" target="_blank" rel="noopener noreferrer" className="p-3 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-full transition-all border border-green-600/30">
                  <MessageCircle size={24} />
                </a>
             </div>

             <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  تم تصميم وتطوير المنصة بواسطة <span className="text-brand-400 font-bold">م. محمود أحمد</span> - مؤسس تيم جرافيكو
                </p>
                <p className="text-gray-500 text-xs">
                  هذا العمل صدقة جارية على روح والدي، نسألكم الدعاء له بالرحمة والمغفرة.
                </p>
             </div>
             
             <div className="w-12 h-1 bg-brand-900/50 rounded-full"></div>
             
             <p className="text-gray-600 text-xs font-mono">
              GRAPHICO BRIEF © {new Date().getFullYear()}
             </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Internal Auth Modal Component
const AuthModal: React.FC<{ onClose: () => void, onSubmit: (e: React.FormEvent, name: string) => void }> = ({ onClose, onSubmit }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
      <div className="relative bg-dark-900 border border-brand-500/30 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-brand-900/50 overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 blur-3xl rounded-full pointer-events-none -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-600/10 blur-3xl rounded-full pointer-events-none -ml-16 -mb-16"></div>

        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-xl mx-auto mb-4">
            G
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "مرحباً بعودتك!" : "انضم لمجتمع جرافيكو"}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLogin ? "سجل دخولك لمتابعة تحدياتك" : "أنشئ حسابك وابدأ رحلة الاحتراف"}
          </p>
        </div>

        <form onSubmit={(e) => onSubmit(e, name)} className="space-y-4">
           {!isLogin && (
             <div>
                <label className="block text-gray-400 text-xs font-bold mb-1 mr-1">الاسم</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                  placeholder="اسمك الكامل"
                />
             </div>
           )}
           <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 mr-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                placeholder="name@example.com"
              />
           </div>
           <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 mr-1">كلمة المرور</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                placeholder="••••••••"
              />
           </div>

           <button 
              type="submit" 
              className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-600/20 transition-all active:scale-95 mt-4"
           >
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
           </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-brand-400 hover:text-brand-300 font-bold underline"
            >
              {isLogin ? "سجل الآن" : "دخول"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;