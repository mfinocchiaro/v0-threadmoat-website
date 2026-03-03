"use client";

import { Company } from "@/lib/company-data";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building2 } from "lucide-react";

interface HubDetailsDialogProps {
    hubName: string;
    companies: Company[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectCompany: (company: Company) => void;
}

export function HubDetailsDialog({ hubName, companies, open, onOpenChange, onSelectCompany }: HubDetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="size-5 text-blue-400" />
                        {hubName}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {companies.length} startups in this location
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="px-6 py-2 h-[400px]">
                    <div className="space-y-3 pb-6">
                        {[...companies].sort((a, b) => (b.totalFunding || 0) - (a.totalFunding || 0)).map((company) => (
                            <div
                                key={company.id}
                                className="group p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                                onClick={() => onSelectCompany(company)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1 flex-1 pr-2">
                                        {company.name}
                                    </h4>
                                    {company.totalFunding > 0 && (
                                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            ${(company.totalFunding / 1e6).toFixed(1)}M
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                                    {company.subsegment} • {company.startupLifecyclePhase}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] bg-transparent border-slate-700 hover:bg-slate-800 px-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectCompany(company);
                                        }}
                                    >
                                        View Details
                                    </Button>
                                    {company.url && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 size-6 p-0 text-slate-400 hover:text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(company.url, "_blank");
                                            }}
                                        >
                                            <ExternalLink className="size-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
