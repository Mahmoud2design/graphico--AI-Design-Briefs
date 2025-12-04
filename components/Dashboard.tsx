import React, { useState, useEffect } from 'react';
import { Project, Feedback } from '../types';
import { Clock, CheckCircle, Upload, AlertCircle, Play, Star, XCircle } from 'lucide-react';
import { evaluateSubmission } from '../services/geminiService';
import BriefDisplay from './BriefDisplay';

interface DashboardProps {
  projects: Project[];
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onViewBrief: (project: Project) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onUpdateProject, onViewBrief }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Timer Component logic inline for simplicity
  const ProjectTimer = ({ startTime, durationHours }: { startTime: number, durationHours: number }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        const deadline = startTime + (durationHours * 60 * 60 * 1000);
        const now = Date.now();
        const diff = deadline - now;

        if (diff <= 0) {
          setTimeLeft("انتهى الوقت");
          setIsExpired(true);
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [startTime, durationHours]);

    return (
      <div className={`font-mono text-lg font-bold ${isExpired ? 'text-red-500' : 'text-accent-400'}`}>
        {timeLeft}
      </div>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, project: Project) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      // Remove data URL prefix for API
      const base64Data = base64.split(',')[1];
      
      setIsAnalyzing(true);
      setSelectedProject(project); // Ensure we are focused on this
      
      try {
        const feedback = await evaluateSubmission(project.brief, base64Data);
        onUpdateProject(project.id, { 
          status: 'completed', 
          feedback,
          userImage: base64
        });
        // Select the updated project with feedback to show modal
        setSelectedProject({ ...project, status: 'completed', feedback, userImage: base64 });
        setShowFeedbackModal(true);
      } catch (err) {
        console.error("Evaluation failed", err);
        alert("حدث خطأ أثناء تحليل الصورة. حاول مرة أخرى.");
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in-up pb-20">
      <h2 className="text-3xl font-black text-white mb-8 border-r-4 border-brand-500 pr-4">لوحة التحكم</h2>

      {/* Active Projects Section */}
      <section className="mb-12">
        <h3 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
          <Clock className="text-brand-400" /> المشاريع الجارية
        </h3>
        
        {activeProjects.length === 0 ? (
          <div className="bg-dark-900/40 border border-white/5 rounded-xl p-8 text-center text-gray-500">
            لا توجد مشاريع جارية حالياً. اذهب واختر تحدياً جديداً!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {activeProjects.map(project => (
              <div key={project.id} className="bg-dark-800 border border-brand-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white">{project.brief.projectName}</h4>
                    <span className="text-xs text-brand-300 bg-brand-900/50 px-2 py-1 rounded mt-1 inline-block">
                      {project.brief.industry}
                    </span>
                  </div>
                  <ProjectTimer startTime={project.startTime} durationHours={project.brief.deadlineHours} />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => onViewBrief(project)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    عرض التفاصيل
                  </button>
                  <label className={`flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isAnalyzing && selectedProject?.id === project.id ? (
                      "جاري التحليل..."
                    ) : (
                      <>
                        <Upload size={16} /> تسليم العمل
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, project)} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Projects Section */}
      <section>
        <h3 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-400" /> سجل الإنجازات
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedProjects.map(project => (
            <div key={project.id} className="bg-dark-900/60 border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition-colors">
              <div className="relative aspect-video bg-black/50 rounded-lg mb-4 overflow-hidden border border-white/5">
                {project.userImage && (
                  <img src={project.userImage} alt="Submission" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  {project.feedback?.score}/10
                </div>
              </div>
              <h4 className="font-bold text-white mb-1">{project.brief.projectName}</h4>
              <button 
                onClick={() => { setSelectedProject(project); setShowFeedbackModal(true); }}
                className="text-sm text-brand-400 hover:text-brand-300 underline mt-2"
              >
                عرض تقييم Mentor AI
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedProject && selectedProject.feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-dark-900 border border-brand-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 relative shadow-2xl shadow-brand-900/50">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white"
            >
              <XCircle size={28} />
            </button>

            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4 border-4 ${selectedProject.feedback.isSuccess ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-red-500 text-red-400 bg-red-900/20'}`}>
                {selectedProject.feedback.score}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {selectedProject.feedback.isSuccess ? "عمل رائع يا بطل! 🚀" : "محاولة جيدة، لكن تحتاج تحسين 🛠️"}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 p-4 rounded-xl border-r-4 border-brand-500">
                <h4 className="text-brand-300 font-bold mb-2">💡 نصيحة المينتور:</h4>
                <p className="text-gray-200 leading-relaxed">{selectedProject.feedback.advice}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                   <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2"><CheckCircle size={16}/> نقاط القوة</h4>
                   <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                     {selectedProject.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                   </ul>
                </div>
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                   <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2"><AlertCircle size={16}/> تحتاج تحسين</h4>
                   <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                     {selectedProject.feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                   </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-bold transition-colors"
              >
                استمر في الإبداع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;