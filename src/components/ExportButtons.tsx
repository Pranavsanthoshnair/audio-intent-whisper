import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportSessionAsJSON, exportSessionAsCSV } from '@/services/exportService';

interface ExportButtonsProps {
    sessionId: string;
    disabled?: boolean;
}

export function ExportButtons({ sessionId, disabled }: ExportButtonsProps) {
    const { toast } = useToast();

    const handleExportJSON = async () => {
        try {
            await exportSessionAsJSON(sessionId);
            toast({
                title: 'Export Successful',
                description: 'Session exported as JSON',
            });
        } catch (error) {
            toast({
                title: 'Export Failed',
                description: error instanceof Error ? error.message : 'Failed to export session',
                variant: 'destructive',
            });
        }
    };

    const handleExportCSV = async () => {
        try {
            await exportSessionAsCSV(sessionId);
            toast({
                title: 'Export Successful',
                description: 'Session exported as CSV',
            });
        } catch (error) {
            toast({
                title: 'Export Failed',
                description: error instanceof Error ? error.message : 'Failed to export session',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={handleExportJSON}
                disabled={disabled}
                variant="outline"
                className="gap-2 flex-1"
            >
                <Download className="w-4 h-4" />
                Export as JSON
            </Button>
            <Button
                onClick={handleExportCSV}
                disabled={disabled}
                variant="outline"
                className="gap-2 flex-1"
            >
                <Download className="w-4 h-4" />
                Export as CSV
            </Button>
        </div>
    );
}
