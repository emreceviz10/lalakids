import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface ChildSelectorProps {
    childProfiles: Child[];
    activeChildId: string;
    onSelectChild: (childId: string) => void;
    onAddChild?: () => void;
}

export function ChildSelector({ childProfiles, activeChildId, onSelectChild, onAddChild }: ChildSelectorProps) {
    if (childProfiles.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex w-max space-x-2 p-1">
                    <Tabs value={activeChildId} onValueChange={onSelectChild} className="w-full">
                        <TabsList className="bg-transparent h-auto p-0 gap-2">
                            {childProfiles.map((child) => {
                                const displayName = child.display_name || child.first_name;
                                const isActive = child.id === activeChildId;

                                return (
                                    <TabsTrigger
                                        key={child.id}
                                        value={child.id}
                                        onClick={() => {
                                            console.log('Clicked child:', displayName);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg cursor-pointer border-2 border-transparent hover:border-primary/20",
                                            !isActive && "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                        )}
                                    >
                                        <Avatar className="size-8 rounded-full ring-2 ring-white/20">
                                            {child.avatar_url && !child.avatar_url.includes('undefined') ? (
                                                <AvatarImage
                                                    src={child.avatar_url}
                                                    alt={displayName}
                                                    onError={(e) => {
                                                        console.error('Avatar failed to load:', child.avatar_url);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : null}
                                            <AvatarFallback className={cn(
                                                "text-xs font-bold",
                                                isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                            )}>
                                                {displayName[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{displayName}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>

                    {onAddChild && (
                        <button
                            onClick={onAddChild}
                            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-primary hover:text-primary whitespace-nowrap bg-transparent"
                        >
                            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </div>
                            <span>Çocuk Ekle</span>
                        </button>
                    )}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
