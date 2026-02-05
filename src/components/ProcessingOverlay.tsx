 import { Shield, Radio } from 'lucide-react';
 
 interface ProcessingOverlayProps {
   stage: 'transcribing' | 'analyzing';
 }
 
 export function ProcessingOverlay({ stage }: ProcessingOverlayProps) {
   return (
     <div className="glass-panel rounded-xl p-8">
       <div className="flex flex-col items-center gap-6">
         {/* Radar Animation */}
         <div className="relative h-32 w-32">
           <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
           <div className="absolute inset-2 rounded-full border-2 border-primary/30" />
           <div className="absolute inset-4 rounded-full border-2 border-primary/40" />
           <div className="absolute inset-0 origin-center animate-radar-sweep">
             <div className="h-1/2 w-0.5 bg-gradient-to-b from-primary to-transparent mx-auto" />
           </div>
           <div className="absolute inset-0 flex items-center justify-center">
             {stage === 'transcribing' ? (
               <Radio className="h-8 w-8 text-primary animate-pulse" />
             ) : (
               <Shield className="h-8 w-8 text-primary animate-pulse" />
             )}
           </div>
         </div>
 
         <div className="text-center space-y-2">
           <h3 className="text-lg font-semibold">
             {stage === 'transcribing' ? 'Transcribing Audio...' : 'Analyzing Intent...'}
           </h3>
           <p className="text-sm text-muted-foreground max-w-xs">
             {stage === 'transcribing'
               ? 'Converting multilingual speech to text using AI models'
               : 'Performing contextual threat analysis using NLP'}
           </p>
         </div>
 
         {/* Scan Line */}
         <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
           <div className="h-full w-1/3 scan-line" />
         </div>
       </div>
     </div>
   );
 }