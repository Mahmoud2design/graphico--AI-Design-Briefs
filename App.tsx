
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Target, LayoutDashboard, LogIn, LogOut, Rocket, Youtube, ExternalLink, MessageCircle, X, Globe, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import CategorySelector from './components/CategorySelector';
import BriefDisplay from './components/BriefDisplay';
import Dashboard from './components/Dashboard';
import { generateDesignBrief } from './services/geminiService';
import * as storage from './services/storageService';
import { DesignCategory, BriefData, INDUSTRIES, EDUCATION_INDUSTRIES, YOUTUBE_INDUSTRIES, FOOTBALL_INDUSTRIES, COLLAGE_INDUSTRIES, Project, User, Difficulty, ClientType } from './types';

const App: React.FC = () => {
  // --- State ---
  // Initialize User from Storage immediately to prevent flicker
  const [user, setUser] = useState<User | null>(() => storage.getSession());
  
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState<'category' | 'industry' | 'upload-style' | 'result'>('category');
  const [selectedCategory, setSelectedCategory] = useState<DesignCategory | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Beginner);
  const [clientType, setClientType] = useState<ClientType>(ClientType.Local);
  const [currentBrief, setCurrentBrief] = useState<BriefData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remixImage, setRemixImage] = useState<string | null>(null);
  
  // Initialize Projects lazily based on the logged-in user
  const [projects, setProjects] = useState<Project[]>([]);
  // Flag to ensure we don't overwrite storage with empty array on initial load
  const [isProjectsLoaded, setIsProjectsLoaded] = useState(false);

  // Whenever user changes, load their projects
  useEffect(() => {
    if (user) {
      const userProjects = storage.getUserProjects(user.email);
      setProjects(userProjects);
      setIsProjectsLoaded(true);
    } else {
      setProjects([]);
      setIsProjectsLoaded(false);
    }
  }, [user]);

  // Whenever projects change, save them (ONLY if user is logged in AND projects have been loaded)
  useEffect(() => {
    if (user && isProjectsLoaded) {
      storage.saveUserProjects(user.email, projects);
    }
  }, [projects, user, isProjectsLoaded]);

  const handleLoginSubmit = (e: React.FormEvent, name: string, email: string) => {
    e.preventDefault();
    
    // 1. Try to find existing user
    let loggedUser = storage.loginUser(email);
    
    // 2. If not found, register new one
    if (!loggedUser) {
      const newUser: User = {
        name: name || "مصمم جرافيكو",
        email: email,
        avatar: "",
        level: "مستوى 1",
        xp: 0
      };
      loggedUser = storage.registerUser(newUser);
    }

    // 3. Save Session
    storage.saveSession(loggedUser);
    setUser(loggedUser);
    
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    storage.clearSession();
    setUser(null);
    setProjects([]); // Clear projects from view
    setIsProjectsLoaded(false);
    setStep('category');
    setActiveTab('home');
  };

  const handleCategorySelect = (category: DesignCategory) => {
    setSelectedCategory(category);
    if (category === DesignCategory.Remix) {
      setStep('upload-style');
    } else {
      setStep('industry');
    }
  };

  const handleGenerate = async (industry?: string) => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    setError(null);
    if (industry) setSelectedIndustry(industry);
    
    try {
      const data = await generateDesignBrief(
        selectedCategory, 
        difficulty,
        clientType,
        industry === "عشوائي" ? undefined : industry,
        remixImage ? remixImage.split(',')[1] : undefined // Pass base64 without prefix if remix
      );
      setCurrentBrief(data);
      setStep('result');
    } catch (err) {
      setError("حدث خطأ أثناء توليد البرييف. يرجى المحاولة مرة أخرى.");
      console.error(err);
      if (selectedCategory === DesignCategory.Remix) {
        setStep('upload-style');
      } else {
        setStep('industry');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemixUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setRemixImage(reader.result as string);
    };
  };

  const handleStartRemix = () => {
    if (remixImage) {
      handleGenerate();
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

    // State update triggers the useEffect that saves to storage
    setProjects(prev => [newProject, ...prev]);
    setActiveTab('dashboard');
    setStep('category');
    setCurrentBrief(null);
    setRemixImage(null);
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const handleBackToStart = () => {
    setCurrentBrief(null);
    setSelectedCategory(null);
    setSelectedIndustry("");
    setRemixImage(null);
    setStep('category');
    setError(null);
  };

  const getIndustryList = () => {
    if (selectedCategory === DesignCategory.Education) return EDUCATION_INDUSTRIES;
    if (selectedCategory === DesignCategory.YouTube) return YOUTUBE_INDUSTRIES;
    if (selectedCategory === DesignCategory.Football) return FOOTBALL_INDUSTRIES;
    if (selectedCategory === DesignCategory.Collage) return COLLAGE_INDUSTRIES;
    return INDUSTRIES;
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-brand-500/30 selection:text-brand-200">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
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
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
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

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} onSubmit={handleLoginSubmit} />
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 flex flex-col items-center min-h-[calc(100vh-80px)]">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && user && (
          <Dashboard 
            projects={projects} 
            onUpdateProject={handleUpdateProject} 
            onViewBrief={(project) => {
              setCurrentBrief(project.brief);
              setActiveTab('home');
              setStep('result');
              // Ensure we know the category for display purposes if possible, fallback to UIUX default for aspect ratio
              setSelectedCategory(DesignCategory.UIUX); 
            }}
          />
        )}

        {/* WIZARD */}
        {activeTab === 'home' && (
          <main className="w-full flex flex-col items-center max-w-6xl">
            
            {error && (
              <div className="w-full max-w-lg bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8 text-center backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Step 1: Settings & Category */}
            {step === 'category' && (
              <div className="w-full flex flex-col items-center animate-fade-in-up">
                
                {/* Toggles Container */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  {/* Difficulty Toggle */}
                  <div className="flex bg-dark-900/50 p-1 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setDifficulty(Difficulty.Beginner)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${difficulty === Difficulty.Beginner ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      مبتدئ
                    </button>
                    <button 
                      onClick={() => setDifficulty(Difficulty.Professional)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${difficulty === Difficulty.Professional ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      محترف
                    </button>
                  </div>

                  {/* Client Type Toggle */}
                  <div className="flex bg-dark-900/50 p-1 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setClientType(ClientType.Local)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${clientType === ClientType.Local ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <MapPin size={14}/> محلي (عربي)
                    </button>
                    <button 
                      onClick={() => setClientType(ClientType.Foreign)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${clientType === ClientType.Foreign ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Globe size={14}/> دولي (English)
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm">1</span>
                  اختر نوع التصميم
                </h3>
                <CategorySelector onSelect={handleCategorySelect} isLoading={false} />
              </div>
            )}

            {/* Step 2: Industry (Context) */}
            {step === 'industry' && (
              <div className="w-full max-w-3xl animate-fade-in-up">
                <div className="flex items-center justify-center mb-8 relative">
                   <button onClick={() => setStep('category')} className="absolute right-0 text-gray-500 hover:text-white transition-colors p-2">
                      <ArrowRight />
                   </button>
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm">2</span>
                    تحديد المجال (Context)
                  </h3>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-dark-900/40 rounded-3xl border border-brand-500/20 backdrop-blur-xl">
                    <div className="w-16 h-16 border-4 border-brand-900 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                    <p className="text-white font-bold text-lg">
                      {clientType === ClientType.Foreign ? 'Generating International Brief...' : 'جاري كتابة البرييف...'}
                    </p>
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
                          {clientType === ClientType.Foreign ? 'Random Niche' : 'مجال عشوائي'}
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 (Alternative): Upload Style Remix */}
            {step === 'upload-style' && (
              <div className="w-full max-w-2xl animate-fade-in-up text-center">
                 <div className="flex items-center justify-center mb-8 relative">
                   <button onClick={() => setStep('category')} className="absolute right-0 text-gray-500 hover:text-white transition-colors p-2">
                      <ArrowRight />
                   </button>
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm">2</span>
                    محاكاة ستايل (Remix Campaign)
                  </h3>
                </div>

                <div className="bg-dark-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
                  <p className="text-gray-300 mb-6">
                    ارفع صورة لتصميم يعجبك (من بنترست أو غيره)، وسيقوم الذكاء الاصطناعي بتحليل الستايل وإنشاء مشروع جديد تماماً بنفس الروح الفنية.
                  </p>
                  
                  <div className="border-2 border-dashed border-brand-500/30 rounded-2xl p-8 hover:bg-brand-900/10 transition-colors mb-6">
                     {remixImage ? (
                       <div className="relative">
                         <img src={remixImage} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                         <button 
                          onClick={() => setRemixImage(null)}
                          className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow"
                         >
                           <X size={16} />
                         </button>
                       </div>
                     ) : (
                       <label className="cursor-pointer flex flex-col items-center gap-4">
                         <div className="w-16 h-16 bg-brand-900/50 rounded-full flex items-center justify-center text-brand-400">
                           <ImageIcon size={32} />
                         </div>
                         <span className="text-brand-300 font-bold text-lg">اضغط لرفع صورة مرجعية</span>
                         <span className="text-gray-500 text-sm">JPG, PNG allowed</span>
                         <input type="file" accept="image/*" className="hidden" onChange={handleRemixUpload} />
                       </label>
                     )}
                  </div>

                  <button
                    onClick={handleStartRemix}
                    disabled={!remixImage || isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!remixImage || isLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white shadow-lg hover:shadow-brand-500/30'}`}
                  >
                     {isLoading ? 'جاري تحليل الستايل...' : 'إنشاء الحملة (Remix)'}
                     {!isLoading && <Sparkles size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Result */}
            {step === 'result' && currentBrief && (
              <div className="w-full animate-fade-in-up">
                <div className="flex justify-start w-full max-w-6xl mx-auto mb-6">
                  <button 
                    onClick={handleBackToStart}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-4 py-2 rounded-lg hover:bg-white/5"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>العودة</span>
                  </button>
                </div>
                
                <BriefDisplay 
                  brief={currentBrief} 
                  onRegenerate={handleRegenerate} 
                  onAccept={handleAcceptBrief}
                  isGenerating={isLoading} 
                  viewOnly={projects.some(p => p.brief.id === currentBrief.id && p.status === 'completed')}
                  category={selectedCategory!}
                />
              </div>
            )}

          </main>
        )}

        <footer className="mt-auto pt-20 pb-6 w-full text-center">
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
             <div className="flex gap-4">
                <a href="https://www.youtube.com/@Mahmoud_Design" target="_blank" rel="noopener noreferrer" className="p-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-full transition-all border border-red-600/30"><Youtube size={24} /></a>
                <a href="https://www.udemy.com/user/mahmoud-ahmed-1129/" target="_blank" rel="noopener noreferrer" className="p-3 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-full transition-all border border-purple-600/30"><ExternalLink size={24} /></a>
                <a href="https://wa.me/201032116402" target="_blank" rel="noopener noreferrer" className="p-3 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-full transition-all border border-green-600/30"><MessageCircle size={24} /></a>
             </div>
             <p className="text-gray-400 text-sm">Designed by Eng. Mahmoud Ahmed</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

const AuthModal: React.FC<{ onClose: () => void, onSubmit: (e: React.FormEvent, name: string, email: string) => void }> = ({ onClose, onSubmit }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
      <div className="relative bg-dark-900 border border-brand-500/30 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-brand-900/50">
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLogin ? "تسجيل دخول" : "حساب جديد"}</h2>
        <form onSubmit={(e) => onSubmit(e, name, email)} className="space-y-4">
           {!isLogin && (
             <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="الاسم" />
           )}
           <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="البريد الإلكتروني" />
           <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none" placeholder="كلمة المرور" />
           <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold mt-4">{isLogin ? "دخول" : "إنشاء"}</button>
        </form>
        <div className="mt-4 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-brand-400 underline text-sm">{isLogin ? "ليس لديك حساب؟" : "لديك حساب؟"}</button>
        </div>
      </div>
    </div>
  );
}

export default App;
