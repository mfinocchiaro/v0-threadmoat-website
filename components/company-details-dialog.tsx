"use client";

import { Company, formatCurrency } from "@/lib/company-data";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, DollarSign, Calendar, Zap, TrendingUp, Shield } from "lucide-react";

interface CompanyDetailsDialogProps {
    company: Company | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CompanyDetailsDialog({ company, open, onOpenChange }: CompanyDetailsDialogProps) {
    if (!company) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {company.name}
                                <Badge variant="outline" className="text-base font-normal">
                                    {company.lifecyclePhase}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-base">
                                {company.discipline} • {company.hqLocation}
                            </DialogDescription>
                        </div>
                        {company.url && (
                            <a
                                href={company.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Visit Website
                            </a>
                        )}
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Overview</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="size-4 text-emerald-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Funding</p>
                                        <p className="font-semibold">{formatCurrency(company.totalFunding)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="size-4 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Headcount</p>
                                        <p className="font-semibold">{company.headcount}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-orange-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Founded</p>
                                        <p className="font-semibold">{company.founded}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="size-4 text-indigo-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-semibold truncate" title={company.hqLocation}>{company.country}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Performance</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                        <Zap className="size-4 text-yellow-500" />
                                        <span className="text-sm font-medium">Weighted Score</span>
                                    </div>
                                    <span className="font-bold text-lg">{(company.weightedScore || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                        <Shield className="size-4 text-purple-500" />
                                        <span className="text-sm font-medium">Competitive Moat</span>
                                    </div>
                                    <span className="font-bold">{(company.competitiveMoat || 0).toFixed(1)}/5.0</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="size-4 text-green-500" />
                                        <span className="text-sm font-medium">Market Opportunity</span>
                                    </div>
                                    <span className="font-bold">{(company.marketOpportunity || 0).toFixed(1)}/5.0</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Classifications</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Investment List</p>
                                    <Badge variant="secondary">{company.investmentList}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Industries Served</p>
                                    <div className="flex flex-wrap gap-1">
                                        {company.industriesServed?.map(ind => (
                                            <Badge key={ind} variant="outline">{ind}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
                                    <div className="flex flex-wrap gap-1">
                                        {company.tags?.map(tag => (
                                            <Badge key={tag} variant="outline" className="opacity-75">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Analysis Notes</h3>
                            <div className="text-sm text-muted-foreground space-y-2">
                                {company.strengths && (
                                    <div>
                                        <span className="font-medium text-foreground">Strengths:</span> {company.strengths}
                                    </div>
                                )}
                                {company.weaknesses && (
                                    <div>
                                        <span className="font-medium text-foreground">Weaknesses:</span> {company.weaknesses}
                                    </div>
                                )}
                                {!company.strengths && !company.weaknesses && (
                                    <p className="italic">No analysis notes available.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
