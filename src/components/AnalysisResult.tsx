 import { Globe, FileText, AlertTriangle, BarChart3 } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Progress } from '@/components/ui/progress';
 import { RiskBadge } from './RiskBadge';
 import { cn } from '@/lib/utils';
 import type { AnalysisResult as AnalysisResultType } from '@/types/analysis';
 
 interface AnalysisResultProps {
   result: AnalysisResultType;
 }
 
 export function AnalysisResult({ result }: AnalysisResultProps) {
   const isHighRisk = result.riskLevel === 'high';
 
   return (
     <div className={cn(
       "glass-panel rounded-xl overflow-hidden",
       isHighRisk && "ring-2 ring-risk-high/50 animate-pulse-glow"
     )}>
       {/* High Risk Alert Banner */}
       {isHighRisk && (
         <div className="bg-risk-high/20 border-b border-risk-high/30 px-6 py-3 flex items-center gap-3">
           <AlertTriangle className="h-5 w-5 text-risk-high animate-pulse" />
           <span className="font-semibold text-risk-high">
             ⚠️ High Risk Threat Detected - Human Review Required
           </span>
         </div>
       )}
 
       <div className="p-6 space-y-6">
         {/* Header with Risk Level */}
         <div className="flex items-start justify-between">
           <div>
             <h2 className="text-lg font-semibold mb-1">Analysis Result</h2>
             <p className="text-sm text-muted-foreground">
               {result.timestamp.toLocaleString()}
             </p>
           </div>
           <RiskBadge level={result.riskLevel} size="lg" />
         </div>
 
         {/* Confidence Score */}
         <div className="space-y-2">
           <div className="flex items-center justify-between text-sm">
             <span className="flex items-center gap-2">
               <BarChart3 className="h-4 w-4 text-primary" />
               Confidence Score
             </span>
             <span className="font-mono font-bold">{(result.confidenceScore * 100).toFixed(1)}%</span>
           </div>
           <Progress value={result.confidenceScore * 100} className="h-2" />
         </div>
 
         <div className="grid md:grid-cols-2 gap-4">
           {/* Detected Language */}
           <Card className="bg-secondary/50 border-border/50">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm flex items-center gap-2">
                 <Globe className="h-4 w-4 text-primary" />
                 Detected Language
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-lg font-semibold">{result.detectedLanguage}</p>
             </CardContent>
           </Card>
 
           {/* Audio File */}
           {result.audioFileName && (
             <Card className="bg-secondary/50 border-border/50">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <FileText className="h-4 w-4 text-primary" />
                   Source File
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-lg font-semibold truncate">{result.audioFileName}</p>
               </CardContent>
             </Card>
           )}
         </div>
 
         {/* Original Transcription */}
         <div className="space-y-2">
           <h3 className="text-sm font-medium text-muted-foreground">Original Transcription</h3>
           <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
             {result.originalText || "No text detected"}
           </div>
         </div>
 
         {/* English Translation */}
         <div className="space-y-2">
           <h3 className="text-sm font-medium text-muted-foreground">English Translation</h3>
           <div className="bg-muted/50 rounded-lg p-4">
             {result.englishTranslation || "N/A"}
           </div>
         </div>
 
         {/* Analysis Details */}
         <div className="space-y-2">
           <h3 className="text-sm font-medium text-muted-foreground">AI Analysis</h3>
           <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
             {result.analysisDetails}
           </div>
         </div>
       </div>
     </div>
   );
 }