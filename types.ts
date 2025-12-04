export interface BriefData {
  id: string; // Unique ID for tracking
  projectName: string;
  companyName: string;
  industry: string;
  aboutCompany: string;
  targetAudience: string;
  projectGoal: string;
  requiredDeliverables: string[];
  stylePreferences: string;
  suggestedColors: string[];
  deadlineHours: number; // Duration in hours
  // New Fields
  copywriting: string[]; 
  contactDetails: string[]; 
  visualReferences: string[];
  providedAssetDescription: string; // Description for the AI image to be used in design
}

export enum DesignCategory {
  Logo = 'تصميم شعار',
  BrandIdentity = 'هوية بصرية',
  UIUX = 'واجهة وتجربة مستخدم',
  SocialMedia = 'سوشيال ميديا',
  Packaging = 'عبوات وتغليف',
  Illustration = 'رسم رقمي',
  Advertising = 'حملة إعلانية',
  YouTube = 'صورة مصغرة يوتيوب',
  Education = 'دعاية تعليمية/مدرسين'
}

export enum Difficulty {
  Beginner = 'مبتدئ',
  Professional = 'محترف'
}

export const INDUSTRIES = [
  "مطاعم وكافيهات",
  "تكنولوجيا وبرمجة",
  "عقارات وهندسة",
  "أزياء وموضة",
  "صحة ورياضة",
  "مستحضرات تجميل",
  "سياحة وسفر",
  "خدمات مالية",
  "متجر إلكتروني (E-commerce)"
];

export const EDUCATION_INDUSTRIES = [
  "دروس تقوية (رياضيات/علوم)",
  "تعليم لغات (إنجليزي/ألماني)",
  "تحفيظ قرآن كريم",
  "تأسيس أطفال (Kindergarten)",
  "دورات برمجة وجرافيك",
  "مدرب لياقة بدنية (Personal Trainer)",
  "تعليم موسيقى ورسم",
  "منصات تعليمية أونلاين"
];

export const YOUTUBE_INDUSTRIES = [
  "Gaming (ألعاب فيديو)",
  "Vlog (يوميات وسفر)",
  "مراجعات تقنية (Tech Review)",
  "قصص ووثائقيات",
  "طبخ ووصفات",
  "بودكاست ومقابلات",
  "تحليل رياضي وكروي",
  "محتوى تعليمي وتثقيفي"
];

export interface Project {
  id: string;
  brief: BriefData;
  startTime: number;
  status: 'active' | 'completed' | 'expired';
  feedback?: Feedback;
  userImage?: string; // Base64 or URL
}

export interface Feedback {
  score: number; // 1-10
  strengths: string[];
  weaknesses: string[];
  advice: string;
  isSuccess: boolean;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  level: string;
  xp: number;
}