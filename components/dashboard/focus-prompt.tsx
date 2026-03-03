"use client";

import { Focus } from "lucide-react";

interface FocusPromptProps {
    label: string;
    description?: string;
}

export function FocusPrompt({ label, description }: FocusPromptProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-2">
                <Focus className="size-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Click "{label}" to unlock these insights</p>
            {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
        </div>
    );
}
