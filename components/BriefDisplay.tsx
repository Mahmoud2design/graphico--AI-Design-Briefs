import React, { useState, useEffect } from 'react';
import { BriefData } from '../types';
import { Copy, RefreshCw, Check, Lightbulb, Type, Share2, Layers, Download, Play, Clock } from 'lucide-react';

interface BriefDisplayProps {
  brief: BriefData;
  onRegenerate: () => void;
  onAccept: (brief: BriefData) => void;
  isGenerating: boolean;
  viewOnly?: boolean; // If true, hide "Regenerate" and "Accept" (for dashboard view)
}

const BriefDisplay: React.FC<BriefDisplayProps> = ({ brief, onRegenerate, onAccept, isGenerating, viewOnly = false }) => {
  const [editableBrief, setEditableBrief] = useState<BriefData>(brief);
  const [isCopied, setIsCopied] = useState(false);
  
  // URL for the provided asset using Flux model for better quality and higher resolution
  const assetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(brief.providedAssetDescription)}?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${brief.id}`;

  useEffect(() => {
    setEditableBrief(brief);
  }, [brief]);

  const copyToClipboard = () => {
    const text = `
اسم المشروع: ${editableBrief.projectName}
الشركة: ${editableBrief.companyName}
المجال: ${editableBrief.industry}
----------------
المطلوب: ${editableBrief.requiredDeliverables.join(', ')}
النصوص (Copy): ${editableBrief.copywriting.join(' | ')}
----------------
رابط الموارد: ${assetUrl}
الموعد: ${editableBrief.deadlineHours} ساعة
    `;
    
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-20">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-dark-900/60 backdrop-blur-md p-4 rounded-xl border border-brand-800/30 gap-4">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 text-lg">
            G
          </span>
          {editableBrief.projectName}
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
           {!viewOnly && (
             <>
                <button 
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg transition-colors border border-dark-600 font-medium"
                >
                  <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                  <span className="hidden md:inline">تغيير</span>
                </button>
                
                <button 
                  onClick={() => onAccept(editableBrief)}
                  className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 font-bold"
                >
                  <Play size={18} fill="currentColor" />
                  ابدأ التحدي ({editableBrief.deadlineHours} ساعة)
                </button>
             </>
           )}
           {viewOnly && (
             <div className="flex items-center gap-2 text-brand-400 font-mono bg-brand-900/30 px-3 py-1 rounded border border-brand-500/30">
                <Clock size={16} />
                <span>الديدلاين: {editableBrief.deadlineHours}h</span>
             </div>
           )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Brief (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Core Info */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl -z-10 transition-all group-hover:bg-brand-500/10"></div>
            
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Layers className="text-brand-400" size={20} />
              <h3 className="text-lg font-bold text-white">تفاصيل المشروع</h3>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">عن الشركة</label>
                  <p className="text-gray-200 leading-relaxed bg-dark-950/30 p-3 rounded-lg border border-white/5 text-sm md:text-base">
                    {editableBrief.aboutCompany}
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">الهدف والمشكلة</label>
                  <p className="text-gray-200 leading-relaxed bg-dark-950/30 p-3 rounded-lg border border-white/5 text-sm md:text-base">
                    {editableBrief.projectGoal}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">الجمهور المستهدف</label>
                <div className="text-gray-300 bg-dark-950/30 p-3 rounded-lg border border-white/5">
                  {editableBrief.targetAudience}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Assets provided */}
          <div className="bg-gradient-to-r from-dark-900 to-dark-800 border border-brand-500/20 p-6 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Download className="text-green-400" size={20} />
                  <h3 className="text-lg font-bold text-white">ملفات العمل (Assets)</h3>
                </div>
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">متاح للاستخدام</span>
             </div>
             
             <div className="flex flex-col md:flex-row gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5">
                <img 
                  src={assetUrl} 
                  alt="Asset" 
                  className="w-32 h-32 object-cover rounded-lg border border-white/10"
                />
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-2">
                    <span className="text-brand-400 font-bold">صورة مطلوبة:</span> {editableBrief.providedAssetDescription}
                  </p>
                  <p className="text-xs text-gray-500">
                    العميل وفر هذه الصورة (أو الستايل) ويجب دمجها في التصميم بشكل أساسي.
                  </p>
                </div>
                <a 
                  href={assetUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 transition-colors"
                >
                  تحميل HD
                </a>
             </div>
          </div>

          {/* Card 3: Requirements & Style */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl">
             <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Check className="text-accent-400" size={20} />
              <h3 className="text-lg font-bold text-white">المتطلبات الفنية</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 block">المخرجات المطلوبة</label>
                <div className="flex flex-wrap gap-2">
                  {editableBrief.requiredDeliverables.map((item, idx) => (
                    <span key={idx} className="bg-brand-900/40 border border-brand-700/50 text-brand-100 px-3 py-1.5 rounded-md text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">الستايل المفضل</label>
                    <div className="text-gray-300 text-sm">{editableBrief.stylePreferences}</div>
                 </div>
                 <div>
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">الألوان المقترحة</label>
                    <div className="flex flex-wrap gap-2">
                      {editableBrief.suggestedColors.map((color, idx) => (
                        <span key={idx} className="w-6 h-6 rounded-full border border-white/20 shadow-sm" title={color} style={{backgroundColor: color.includes('#') ? color : '#333'}}></span>
                      ))}
                      <span className="text-xs text-gray-500 self-center">{editableBrief.suggestedColors.join(', ')}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Inspiration & Copy (1 col wide) */}
        <div className="space-y-6">
          
          {/* Reference/Moodboard Card */}
          <div className="bg-gradient-to-b from-dark-800 to-dark-900 border border-brand-800/30 p-6 rounded-2xl h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-400" size={20} />
              <h3 className="text-lg font-bold text-white">إلهام و References</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">ابحث عن هذه الكلمات في Pinterest أو Behance:</p>
            <ul className="space-y-3">
              {editableBrief.visualReferences.map((ref, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300 bg-black/20 p-3 rounded-lg hover:bg-black/40 transition-colors cursor-default">
                  <span className="text-brand-500 font-bold">#{i+1}</span>
                  {ref}
                </li>
              ))}
            </ul>
          </div>

          {/* Copywriting Card */}
          <div className="glass-panel p-6 rounded-2xl">
             <div className="flex items-center gap-2 mb-4">
              <Type className="text-pink-400" size={20} />
              <h3 className="text-lg font-bold text-white">نصوص التصميم (Copy)</h3>
            </div>
            <div className="space-y-3">
              {editableBrief.copywriting.map((text, i) => (
                <div key={i} className="bg-dark-950/50 border border-dark-700/50 p-3 rounded-lg relative group">
                  <p className="text-gray-200 text-sm font-medium pr-6">"{text}"</p>
                  <Copy 
                    size={14} 
                    className="absolute top-3 right-2 text-gray-600 cursor-pointer hover:text-white"
                    onClick={() => navigator.clipboard.writeText(text)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="glass-panel p-6 rounded-2xl">
             <div className="flex items-center gap-2 mb-4">
              <Share2 className="text-accent-400" size={20} />
              <h3 className="text-lg font-bold text-white">بيانات التواصل</h3>
            </div>
             <ul className="space-y-2">
                {editableBrief.contactDetails.map((contact, i) => (
                  <li key={i} className="text-sm text-gray-400 font-mono bg-black/20 px-3 py-2 rounded border border-white/5">
                    {contact}
                  </li>
                ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BriefDisplay;