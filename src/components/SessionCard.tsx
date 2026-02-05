import React from 'react';
import { FileAudio, Clock, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Session } from '@/services/offlineStorage';

interface SessionCardProps {
    session: Session;
    hasAudio: boolean;
}

export function SessionCard({ session, hasAudio }: SessionCardProps) {
    const getStatusColor = (status: Session['status']) => {
        switch (status) {
            case 'initialized':
                return 'bg-blue-500';
            case 'audio_attached':
                return 'bg-green-500';
            case 'processing':
                return 'bg-yellow-500';
            case 'completed':
                return 'bg-green-600';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: Session['status']) => {
        switch (status) {
            case 'initialized':
                return 'Initialized';
            case 'audio_attached':
                return 'Audio Attached';
            case 'processing':
                return 'Processing';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
            default:
                return status;
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Active Session</h3>
                        <p className="text-sm text-muted-foreground font-mono mt-1">
                            {session.sessionId}
                        </p>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                        {getStatusLabel(session.status)}
                    </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Input Mode</p>
                            <p className="text-sm font-medium capitalize">{session.inputMode}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <FileAudio className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Audio Status</p>
                            <p className="text-sm font-medium">
                                {hasAudio ? (
                                    <span className="text-green-600 dark:text-green-400">Attached</span>
                                ) : (
                                    <span className="text-muted-foreground">Not Attached</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 col-span-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium">
                                {new Date(session.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
