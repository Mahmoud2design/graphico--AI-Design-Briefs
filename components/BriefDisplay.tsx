
import React, { useState, useEffect } from 'react';
import { BriefData, ClientType, DesignCategory } from '../types';
import { Copy, RefreshCw, Check, Lightbulb, Type, Layers, Download, Play, Paintbrush, Globe, MapPin, Image as ImageIcon, Search } from 'lucide-react';

interface BriefDisplayProps {
  brief: BriefData;
  onRegenerate: () => void;
  onAccept: (brief: BriefData) => void;
  isGenerating: boolean;
  viewOnly?: boolean; 
  category?: DesignCategory; // To determine aspect ratio
}

const BriefDisplay: React.FC<BriefDisplayProps> = ({ brief, onRegenerate, onAccept, isGenerating, viewOnly = false, category }) => {
  const [editableBrief, setEditableBrief] = useState<BriefData>(brief);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Determine text direction based on client type
  const isForeign = brief.clientType === ClientType.Foreign;
  const dir = isForeign ? 'ltr' : 'rtl';
  const textAlign = isForeign ? 'text-left' : 'text-right';

  // Determine Aspect Ratio based on content
  // We use standard HD/Square resolutions that AI models support well without compressing
  const isLandscape = [
    DesignCategory.YouTube, 
    DesignCategory.Football, 
    DesignCategory.Advertising, 
    DesignCategory.Education
  ].includes(category as DesignCategory) || brief.industry.toLowerCase().includes('youtube') || brief.industry.toLowerCase().includes('video');

  // Use "Sweet Spot" resolutions for Flux/SDXL to ensure sharpness and reduce compression artifacts
  const imgWidth = isLandscape ? 1280 : 1024;
  const imgHeight = isLandscape ? 720 : 1024;

  // Enhanced Prompt for Raw/Stock feel
  // Removed "8k" or "4k" to prevent generator from compressing huge files. 
  // "High quality" and "Raw photo" are sufficient for the model.
  const qualityPrompt = `raw photo, ${brief.providedAssetDescription}, best quality, highly detailed, sharp focus, professional photography, uncompressed`;
  
  // Using specific dimensions and flux model
  const assetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(qualityPrompt)}?model=flux&width=${imgWidth}&height=${imgHeight}&nologo=true&seed=${brief.id}`;
  
  // Alternative Unsplash Search URL (Real Stock Photos)
  const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(brief.visualReferences[0] || brief.industry)}`;

  useEffect(() => {
    setEditableBrief(brief);
  }, [brief]);

  const copyToClipboard = () => {
    const text = `
Project: ${editableBrief.projectName}
Client: ${editableBrief.companyName}
Industry: ${editableBrief.industry}
----------------
Story: ${editableBrief.contentSummary}
----------------
Deliverables: ${editableBrief.requiredDeliverables.join(', ')}
Copy: ${editableBrief.copywriting.join(' | ')}
----------------
Asset URL: ${assetUrl}
Deadline: ${editableBrief.deadlineHours}h
    `;
    
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(assetUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Name the downloaded file
      link.download = `Graphico-Asset-${brief.id.substring(0, 8)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed, opening in new tab", error);
      window.open(assetUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-20 ${textAlign}`} dir={dir}>
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-dark-900/60 backdrop-blur-md p-4 rounded-xl border border-brand-800/30 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 text-xl font-bold text-white">
            {brief.projectName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{editableBrief.projectName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className={`text-xs px-2 py-0.5 rounded border ${isForeign ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'} flex items-center gap-1`}>
                 {isForeign ? <Globe size={12}/> : <MapPin size={12}/>}
                 {isForeign ? 'Global Client' : 'Local Client'}
               </span>
               <span className="text-xs text-gray-400">| {editableBrief.companyName}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg transition-colors border border-dark-600 font-medium"
            >
              {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
           {!viewOnly && (
             <>
                <button 
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-lg transition-colors border border-dark-600 font-medium"
                >
                  <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
                  <span className="hidden md:inline">{isForeign ? 'Regenerate' : 'تغيير'}</span>
                </button>
                
                <button 
                  onClick={() => onAccept(editableBrief)}
                  className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all shadow-lg shadow-green-600/20 hover:scale-105 active:scale-95 font-bold"
                >
                  <Play size={18} fill="currentColor" />
                  {isForeign ? 'Accept Challenge' : 'ابدأ التحدي'} ({editableBrief.deadlineHours}h)
                </button>
             </>
           )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Core Info */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Layers className="text-brand-400" size={20} />
              <h3 className="text-lg font-bold text-white">{isForeign ? 'Project Details' : 'تفاصيل المشروع'}</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">{isForeign ? 'About' : 'عن الشركة'}</label>
                <p className="text-gray-200 leading-relaxed bg-dark-950/30 p-4 rounded-lg border border-white/5">
                  {editableBrief.aboutCompany}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">{isForeign ? 'Goal' : 'الهدف'}</label>
                  <p className="text-gray-200 bg-dark-950/30 p-3 rounded-lg border border-white/5 text-sm">
                    {editableBrief.projectGoal}
                  </p>
                </div>
                 <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">{isForeign ? 'Audience' : 'الجمهور'}</label>
                  <p className="text-gray-200 bg-dark-950/30 p-3 rounded-lg border border-white/5 text-sm">
                    {editableBrief.targetAudience}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Creative Direction / Story */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl border-brand-500/30 bg-gradient-to-br from-brand-900/20 to-transparent">
             <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
              <Paintbrush className="text-yellow-400" size={20} />
              <h3 className="text-lg font-bold text-white">{isForeign ? 'Creative Direction' : 'التوجه الإبداعي'}</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                  {isForeign ? 'Content Story / Scenario' : 'قصة المحتوى / السيناريو'}
                </label>
                <p className="text-white leading-relaxed text-lg font-medium bg-black/20 p-4 rounded-xl border-l-4 border-yellow-500">
                  {editableBrief.contentSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="bg-gradient-to-r from-dark-900 to-dark-800 border border-brand-500/20 p-6 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-green-400" size={20} />
                  <h3 className="text-lg font-bold text-white">{isForeign ? 'Project Assets' : 'ملفات العمل'}</h3>
                </div>
                <div className="flex gap-2">
                   <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 flex items-center gap-1">
                     HQ {isLandscape ? '16:9' : '1:1'}
                   </span>
                </div>
             </div>
             
             <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className={`relative w-full ${isLandscape ? 'aspect-video' : 'aspect-square md:w-3/4 md:mx-auto'} rounded-lg overflow-hidden border border-white/10 bg-dark-950 flex items-center justify-center`}>
                    <img 
                      src={assetUrl} 
                      alt="Asset" 
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                </div>
                
                <p className="text-gray-300 text-sm">
                  <span className="text-brand-400 font-bold">{isForeign ? 'Description:' : 'الوصف:'}</span> {editableBrief.providedAssetDescription}
                </p>

                <div className="flex flex-col md:flex-row gap-3 w-full">
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex-1 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg shadow-lg hover:shadow-brand-500/20 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> جاري التحميل...
                      </>
                    ) : (
                      <>
                        <Download size={18} /> {isForeign ? 'Download AI Asset (HQ)' : 'تحميل صورة الـ AI (جودة عالية)'}
                      </>
                    )}
                  </button>
                  
                  <a 
                    href={unsplashUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-dark-800 hover:bg-white/10 text-gray-300 hover:text-white text-sm rounded-lg border border-white/10 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Search size={18} /> {isForeign ? 'Search Real Stock Photos' : 'بحث عن صور حقيقية (Unsplash)'}
                  </a>
                </div>
             </div>
          </div>
        </div>

        {/* SIDE COLUMN */}
        <div className="space-y-6">
          {/* Inspiration */}
          <div className="bg-gradient-to-b from-dark-800 to-dark-900 border border-brand-800/30 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-400" size={20} />
              <h3 className="text-lg font-bold text-white">{isForeign ? 'Inspiration Keywords' : 'كلمات البحث'}</h3>
            </div>
            <ul className="space-y-2">
              {editableBrief.visualReferences.map((ref, i) => (
                <li key={i} className="text-sm text-gray-300 bg-black/20 p-2 rounded hover:text-brand-300">
                  #{ref}
                </li>
              ))}
            </ul>
          </div>

          {/* Copywriting */}
          <div className="glass-panel p-6 rounded-2xl">
             <div className="flex items-center gap-2 mb-4">
              <Type className="text-pink-400" size={20} />
              <h3 className="text-lg font-bold text-white">{isForeign ? 'Copy / Text' : 'النصوص'}</h3>
            </div>
            <div className="space-y-3">
              {editableBrief.copywriting.map((text, i) => (
                <div key={i} className="bg-dark-950/50 border border-dark-700/50 p-3 rounded-lg relative group">
                  <p className="text-gray-200 text-sm font-medium pr-6 select-all">{text}</p>
                </div>
              ))}
            </div>
          </div>

           {/* Tech Specs */}
          <div className="glass-panel p-6 rounded-2xl">
             <div className="flex items-center gap-2 mb-4">
              <Check className="text-accent-400" size={20} />
              <h3 className="text-lg font-bold text-white">{isForeign ? 'Requirements' : 'المتطلبات'}</h3>
            </div>
             <div className="flex flex-wrap gap-2 mb-4">
                {editableBrief.requiredDeliverables.map((item, idx) => (
                  <span key={idx} className="bg-brand-900/40 border border-brand-700/50 text-brand-100 px-3 py-1 rounded text-xs">
                    {item}
                  </span>
                ))}
            </div>
             <div className="space-y-2">
               <p className="text-xs text-gray-400 uppercase font-bold">{isForeign ? 'Style' : 'الستايل'}</p>
               <p className="text-sm text-gray-300">{editableBrief.stylePreferences}</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BriefDisplay;
