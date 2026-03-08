// Canonical Investment List color palette — matches Airtable field colors
// All charts MUST use these for consistency.

export const INVESTMENT_LIST_COLORS: Record<string, string> = {
    "Design Intelligence (CAD)":                         "#2E6DB4", // Dark Blue
    "Extreme Analysis (CAE, CFD, FEA, QC)":              "#8FB3E8", // Light Blue
    "Adaptive Manufacturing (AM, CAM, CNC)":             "#2BBFB3", // Deep Teal
    "Cognitive Thread (PLM, MBSE, DT)":                  "#D45500", // Burnt Orange
    "Factory Futures (MES, IIOT)":                       "#F4B400", // Golden Yellow
    "Augmented Operations (MOM, CMMS, AR/VR, SLM)":     "#F2B38B", // Soft Orange / Peach
    "Streamlined Supply Chain (SCM)":                    "#D642A6", // Magenta
    "Bleeding Edge BIM (AEC/BIM)":                       "#7EC8E3", // Cyan
    "SW+HW=Innovation (Robotics, Drones)":               "#0B7A20", // Green
    "Knowledge Engineering (R&D, Learning)":             "#7A3FD1", // Purple
};

// Ordered palette array for d3.scaleOrdinal usage
export const INVESTMENT_COLOR_PALETTE = Object.values(INVESTMENT_LIST_COLORS);

const KEYWORD_MAP: [string[], string][] = [
    [["design", "cad"],                      "Design Intelligence (CAD)"],
    [["extreme", "cae", "cfd", "fea"],       "Extreme Analysis (CAE, CFD, FEA, QC)"],
    [["adaptive", "cam", "cnc", "manufacturing"], "Adaptive Manufacturing (AM, CAM, CNC)"],
    [["cognitive", "plm", "mbse"],           "Cognitive Thread (PLM, MBSE, DT)"],
    [["factory", "mes", "iiot"],             "Factory Futures (MES, IIOT)"],
    [["augmented", "mom", "mro", "slm"],     "Augmented Operations (MOM, CMMS, AR/VR, SLM)"],
    [["supply chain", "scm"],                "Streamlined Supply Chain (SCM)"],
    [["bim", "aec"],                         "Bleeding Edge BIM (AEC/BIM)"],
    [["innovation", "robotics", "drones"],   "SW+HW=Innovation (Robotics, Drones)"],
    [["knowledge", "education", "k12", "learning", "r&d"], "Knowledge Engineering (R&D, Learning)"],
];

const DEFAULT_COLOR = "#64748b";

/** Get the canonical color for any investmentList string. */
export function getInvestmentColor(investmentList: string): string {
    if (!investmentList) return DEFAULT_COLOR;
    if (INVESTMENT_LIST_COLORS[investmentList]) return INVESTMENT_LIST_COLORS[investmentList];

    const lower = investmentList.toLowerCase();
    for (const [keywords, canonical] of KEYWORD_MAP) {
        if (keywords.some(kw => lower.includes(kw))) {
            return INVESTMENT_LIST_COLORS[canonical];
        }
    }
    return DEFAULT_COLOR;
}
