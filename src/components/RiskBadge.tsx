 import { cn } from '@/lib/utils';
 import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
 import type { RiskLevel } from '@/types/analysis';
 
 interface RiskBadgeProps {
   level: RiskLevel;
   showIcon?: boolean;
   size?: 'sm' | 'md' | 'lg';
 }
 
 const config = {
   low: {
     label: 'Low Risk',
     icon: CheckCircle,
     className: 'risk-badge-low',
   },
   medium: {
     label: 'Medium Risk',
     icon: AlertCircle,
     className: 'risk-badge-medium',
   },
   high: {
     label: 'High Risk',
     icon: AlertTriangle,
     className: 'risk-badge-high',
   },
 };
 
 const sizes = {
   sm: 'px-2 py-0.5 text-xs',
   md: 'px-3 py-1 text-sm',
   lg: 'px-4 py-2 text-base',
 };
 
 export function RiskBadge({ level, showIcon = true, size = 'md' }: RiskBadgeProps) {
   const { label, icon: Icon, className } = config[level];
   
   return (
     <span className={cn(
       'inline-flex items-center gap-1.5 rounded-full font-medium',
       className,
       sizes[size]
     )}>
       {showIcon && <Icon className={cn(
         size === 'sm' && 'h-3 w-3',
         size === 'md' && 'h-4 w-4',
         size === 'lg' && 'h-5 w-5'
       )} />}
       {label}
     </span>
   );
 }