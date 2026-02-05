 import { Clock, ChevronRight } from 'lucide-react';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { RiskBadge } from './RiskBadge';
 import { cn } from '@/lib/utils';
 import type { AnalysisResult } from '@/types/analysis';
 
 interface AnalysisHistoryProps {
   history: AnalysisResult[];
   selectedId?: string;
   onSelect: (result: AnalysisResult) => void;
 }
 
 export function AnalysisHistory({ history, selectedId, onSelect }: AnalysisHistoryProps) {
   if (history.length === 0) {
     return (
       <div className="glass-panel rounded-xl p-6">
         <div className="flex items-center gap-2 mb-4">
           <Clock className="h-5 w-5 text-primary" />
           <h2 className="text-lg font-semibold">Analysis History</h2>
         </div>
         <div className="text-center py-8 text-muted-foreground">
           <p>No analysis logs yet.</p>
           <p className="text-sm">Upload or record audio to begin.</p>
         </div>
       </div>
     );
   }
 
   return (
     <div className="glass-panel rounded-xl overflow-hidden">
       <div className="flex items-center gap-2 p-4 border-b border-border/50">
         <Clock className="h-5 w-5 text-primary" />
         <h2 className="text-lg font-semibold">Analysis History</h2>
         <span className="ml-auto text-sm text-muted-foreground">
           {history.length} record{history.length !== 1 ? 's' : ''}
         </span>
       </div>
 
       <ScrollArea className="h-[400px]">
         <div className="divide-y divide-border/50">
           {history.map((item) => (
             <button
               key={item.id}
               onClick={() => onSelect(item)}
               className={cn(
                 "w-full p-4 text-left transition-colors hover:bg-accent/50",
                 selectedId === item.id && "bg-accent"
               )}
             >
               <div className="flex items-start justify-between gap-2">
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium truncate">
                     {item.audioFileName || 'Live Recording'}
                   </p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {item.timestamp.toLocaleString()}
                   </p>
                   <p className="text-xs text-muted-foreground mt-1 truncate">
                     {item.detectedLanguage}
                   </p>
                 </div>
                 <div className="flex items-center gap-2 shrink-0">
                   <RiskBadge level={item.riskLevel} size="sm" showIcon={false} />
                   <ChevronRight className="h-4 w-4 text-muted-foreground" />
                 </div>
               </div>
             </button>
           ))}
         </div>
       </ScrollArea>
     </div>
   );
 }