import React from 'react';
import { DesignCategory } from '../types';
import { 
  PenTool, 
  Layout, 
  Smartphone, 
  Package, 
  Instagram, 
  MonitorPlay,
  Palette,
  Youtube,
  GraduationCap
} from 'lucide-react';

interface CategorySelectorProps {
  onSelect: (category: DesignCategory) => void;
  isLoading: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onSelect, isLoading }) => {
  const categories = [
    { id: DesignCategory.SocialMedia, icon: <Instagram className="w-7 h-7" />, label: "سوشيال ميديا" },
    { id: DesignCategory.YouTube, icon: <Youtube className="w-7 h-7" />, label: "يوتيوب Thumbnail" },
    { id: DesignCategory.Education, icon: <GraduationCap className="w-7 h-7" />, label: "دعاية تعليمية" },
    { id: DesignCategory.Advertising, icon: <MonitorPlay className="w-7 h-7" />, label: "إعلانات تجارية" },
    { id: DesignCategory.Logo, icon: <PenTool className="w-7 h-7" />, label: "تصميم شعار" },
    { id: DesignCategory.BrandIdentity, icon: <Palette className="w-7 h-7" />, label: "هوية بصرية" },
    { id: DesignCategory.UIUX, icon: <Smartphone className="w-7 h-7" />, label: "UI/UX" },
    { id: DesignCategory.Packaging, icon: <Package className="w-7 h-7" />, label: "تغليف منتجات" },
    { id: DesignCategory.Illustration, icon: <Layout className="w-7 h-7" />, label: "رسم رقمي" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mx-auto p-4">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          disabled={isLoading}
          className={`
            relative overflow-hidden
            flex flex-col items-center justify-center p-6 rounded-2xl border border-brand-800/50
            bg-dark-900/40 backdrop-blur-md
            hover:border-brand-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]
            active:scale-95
            transition-all duration-300 group
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Gradient Background Effect on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative mb-4 p-3 rounded-full bg-brand-900/50 text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 ring-1 ring-brand-700/50">
            {cat.icon}
          </div>
          <span className="relative text-gray-300 font-bold text-lg group-hover:text-white transition-colors">
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;