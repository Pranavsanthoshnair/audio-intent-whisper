 export type RiskLevel = 'low' | 'medium' | 'high';
 
 export interface AnalysisResult {
   id: string;
   originalText: string;
   detectedLanguage: string;
   englishTranslation: string;
   riskLevel: RiskLevel;
   confidenceScore: number;
   analysisDetails: string;
   timestamp: Date;
   audioFileName?: string;
 }
 
 export interface AnalysisLog {
   id: string;
   result: AnalysisResult;
   createdAt: Date;
 }