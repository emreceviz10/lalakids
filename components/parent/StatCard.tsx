import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color: 'blue' | 'orange' | 'yellow';
}

const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
};

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-center gap-4">
                <div className={cn(
                    'p-3 rounded-xl',
                    colorMap[color]
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                        {value}
                    </p>
                </div>
            </div>
        </Card>
    );
}
