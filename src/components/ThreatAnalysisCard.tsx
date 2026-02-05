import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Shield, AlertCircle } from 'lucide-react';
import type { ThreatSeverity } from '@/services/threatScoringService';
import type { ThreatAnalysisRecord } from '@/services/offlineStorage';

interface ThreatAnalysisCardProps {
    analysis: ThreatAnalysisRecord;
}

export function ThreatAnalysisCard({ analysis }: ThreatAnalysisCardProps) {
    const getSeverityConfig = (severity: ThreatSeverity) => {
        switch (severity) {
            case 'SAFE':
                return {
                    icon: Shield,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    badgeVariant: 'default' as const,
                    label: 'SAFE'
                };
            case 'SUSPICIOUS':
                return {
                    icon: AlertCircle,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                    badgeVariant: 'secondary' as const,
                    label: 'SUSPICIOUS'
                };
            case 'HIGH_RISK':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    badgeVariant: 'destructive' as const,
                    label: 'HIGH RISK'
                };
        }
    };

    const config = getSeverityConfig(analysis.severity);
    const Icon = config.icon;

    return (
        <Card className={`p-6 ${config.bgColor} ${config.borderColor}`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${config.color}`} />
                        <div>
                            <h3 className="text-lg font-semibold">Threat Analysis</h3>
                            <p className="text-sm text-muted-foreground">
                                Session analyzed for threat indicators
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <Badge variant={config.badgeVariant} className="text-sm px-3 py-1">
                            {config.label}
                        </Badge>
                        <p className="text-2xl font-bold mt-1 {config.color}">
                            Score: {analysis.threatScore}
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Triggered Keywords */}
                {analysis.triggeredKeywords.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Triggered Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                            {analysis.triggeredKeywords.map((keyword, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {keyword.word}
                                    {keyword.count > 1 && (
                                        <span className="ml-1 text-muted-foreground">
                                            ×{keyword.count}
                                        </span>
                                    )}
                                    <span className="ml-1 text-muted-foreground">
                                        ({keyword.category})
                                    </span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Breakdown */}
                <div>
                    <h4 className="text-sm font-semibold mb-3">Category Breakdown</h4>
                    <div className="space-y-2">
                        {Object.entries(analysis.categoryBreakdown).map(([category, count]) => {
                            if (count === 0) return null;

                            const maxCount = Math.max(...Object.values(analysis.categoryBreakdown));
                            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                            return (
                                <div key={category} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="capitalize">
                                            {category.replace('_', ' ')}
                                        </span>
                                        <span className="font-medium">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Explanation */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">Why Flagged?</h4>
                    <div className="text-sm space-y-2">
                        <p className="leading-relaxed">{analysis.explanationText}</p>
                        {analysis.chunksInvolved > 0 && (
                            <p className="text-muted-foreground">
                                Detected across {analysis.chunksInvolved} audio segment
                                {analysis.chunksInvolved !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
