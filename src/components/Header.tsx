 import { Shield, AlertTriangle } from 'lucide-react';
 
 export function Header() {
   return (
     <header className="glass-panel border-b border-border/50 px-6 py-4">
       <div className="max-w-7xl mx-auto flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="relative">
             <Shield className="h-8 w-8 text-primary" />
             <div className="absolute -top-1 -right-1 h-3 w-3 bg-risk-low rounded-full border-2 border-background" />
           </div>
           <div>
             <h1 className="text-xl font-bold tracking-tight">
               Multilingual Audio Threat Detection
             </h1>
             <p className="text-xs text-muted-foreground">
               AI-Powered Intent Analysis System
             </p>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-risk-medium/10 border border-risk-medium/30">
            <AlertTriangle className="h-4 w-4 text-risk-medium" />
            <span className="text-xs font-medium text-risk-medium">
               Academic / Research Use Only
             </span>
           </div>
         </div>
       </div>
     </header>
   );
 }