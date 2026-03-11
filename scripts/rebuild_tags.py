#!/usr/bin/env python3
"""
rebuild_tags.py — Fix ThreadMoat tag data: parse Python list literals,
consolidate near-duplicates, normalize taxonomy, write clean CSV.

Root problem: tags are stored as Python list literals like "['SaaS', 'B2B']"
instead of plain "SaaS, B2B". This caused clean_tags.py to see 1974 fragmented
"tags" (e.g. "['SaaS'" and "'B2B']") instead of ~120 real ones.

Usage:
  python3 scripts/rebuild_tags.py             # dry-run (show changes, no write)
  python3 scripts/rebuild_tags.py --apply     # write cleaned CSV
  python3 scripts/rebuild_tags.py --report    # write report to .tag_clean_checkpoints/
"""

import argparse
import ast
import csv
import json
import shutil
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────

ROOT            = Path(__file__).parent.parent
CSV_PATH        = ROOT / "public/data/Startups-Grid view.csv"
CHECKPOINT_DIR  = Path(__file__).parent / ".tag_clean_checkpoints"

CAT_COL  = "Category/Function Tags"
OP_COL   = "Operating Model Tags"
DIFF_COL = "Differentiation Tags"

# ─── Tag Parser ───────────────────────────────────────────────────────────────

def parse_tags(raw: str) -> list[str]:
    """Parse Python list literal or plain comma-separated tags."""
    if not raw or not raw.strip():
        return []
    s = raw.strip()
    # Strip outer double-quotes (CSV artifact)
    if s.startswith('"') and s.endswith('"'):
        s = s[1:-1]
    # Try to parse as Python literal: ['tag1', 'tag2'] or 'tag'
    if s.startswith('[') or (s.startswith("'") and s.endswith("'")):
        try:
            result = ast.literal_eval(s)
            if isinstance(result, list):
                return [str(t).strip() for t in result if str(t).strip()]
            elif isinstance(result, str):
                return [result.strip()]
        except Exception:
            pass
    # Fallback: plain comma-separated
    return [t.strip().strip("'\"[]") for t in s.split(',') if t.strip().strip("'\"[]")]


# ─── Canonical Taxonomy ────────────────────────────────────────────────────────
# Structure: { 'input tag (lowercase)': ('Canonical Tag', 'column') }
# column: 'category' | 'operating_model' | 'differentiation' | 'drop'
# 'drop' = remove from all columns (noise / too vague)

TAXONOMY: dict[str, tuple[str, str]] = {

    # ═══════════════════════════════════════════════════════
    # CATEGORY / FUNCTION TAGS
    # What the product does (functional domain)
    # ═══════════════════════════════════════════════════════

    # Simulation
    "simulation":                           ("Simulation", "category"),
    "simulation software":                  ("Simulation", "category"),
    "simulation ai":                        ("Simulation", "category"),
    "cae":                                  ("CAE", "category"),
    "cae workflows":                        ("CAE", "category"),
    "fea":                                  ("CAE", "category"),
    "fea/fem":                              ("CAE", "category"),
    "cfd":                                  ("CFD", "category"),
    "multiphysics simulation":              ("Simulation", "category"),
    "physics-based simulation":             ("Simulation", "category"),
    "simulation acceleration":              ("Simulation", "category"),

    # CAD / Design
    "cad":                                  ("CAD", "category"),
    "cloud cad":                            ("Cloud CAD", "category"),
    "collaborative cad":                    ("Cloud CAD", "category"),
    "cad collaboration":                    ("Cloud CAD", "category"),
    "cad automation":                       ("Design Automation", "category"),
    "cad workflows":                        ("CAD", "category"),
    "ai cad workflow":                      ("AI for Design", "category"),
    "ai-native cad workflow":               ("AI for Design", "category"),
    "3d design tools":                      ("CAD", "category"),
    "3d modeling":                          ("CAD", "category"),
    "nurbs":                                ("CAD", "category"),
    "parametric modeling":                  ("CAD", "category"),

    # Generative
    "generative cad":                       ("Generative CAD", "category"),
    "generative design":                    ("Generative CAD", "category"),
    "generative modeling":                  ("Generative CAD", "category"),
    "generative ai":                        ("Generative AI", "category"),
    "text-to-cad":                          ("Text-to-CAD", "category"),
    "ai 3d generation":                     ("Text-to-CAD", "category"),
    "3d generation":                        ("Text-to-CAD", "category"),
    "ai for design":                        ("AI for Design", "category"),
    "design automation":                    ("Design Automation", "category"),

    # Digital Twin
    "digital twin":                         ("Digital Twin", "category"),
    "digital twins":                        ("Digital Twin", "category"),
    "digital twin visualization":           ("Digital Twin", "category"),
    "generative twins":                     ("Digital Twin", "category"),
    "digital engineering platform":         ("Digital Twin", "category"),

    # Manufacturing
    "manufacturing software":               ("Manufacturing Software", "category"),
    "manufacturing ai":                     ("Manufacturing AI", "category"),
    "manufacturing intelligence":           ("Manufacturing Analytics", "category"),
    "manufacturing analytics":              ("Manufacturing Analytics", "category"),
    "manufacturing tech":                   ("Manufacturing Software", "category"),
    "manufacturing process and software":   ("Manufacturing Software", "category"),
    "advanced manufacturing":               ("Advanced Manufacturing", "category"),
    "digital manufacturing":                ("Digital Manufacturing", "category"),
    "cnc automation":                       ("CNC Automation", "category"),
    "manufacturing cnc automation":         ("CNC Automation", "category"),
    "manufacturing automation":             ("Automation", "category"),
    "factory operations":                   ("Factory Operations", "category"),
    "smart factory":                        ("Smart Factory", "category"),
    "connected manufacturing":              ("Smart Factory", "category"),
    "autonomous factory":                   ("Smart Factory", "category"),
    "mes":                                  ("MES", "category"),
    "mes & mom":                            ("MES", "category"),
    "shop floor":                           ("MES", "category"),
    "erp":                                  ("ERP", "category"),
    "industrial operations":                ("Industrial Operations", "category"),

    # AI for Industry
    "ai for industry 4.0":                  ("AI for Industry 4.0", "category"),
    "industrial ai":                        ("Industrial AI", "category"),
    "industrial ai assistant":              ("Industrial AI", "category"),
    "industrial software":                  ("Industrial Software", "category"),
    "iiot":                                 ("Industrial IoT", "category"),
    "industrial iot":                       ("Industrial IoT", "category"),
    "iot":                                  ("Industrial IoT", "category"),
    "edge ai":                              ("Industrial IoT", "category"),

    # Engineering Software
    "engineering software":                 ("Engineering Software", "category"),
    "engineering ai":                       ("Engineering Software", "category"),
    "engineering analysis":                 ("Engineering Analysis", "category"),
    "engineering productivity":             ("Engineering Software", "category"),
    "engineering collaboration":            ("Collaboration", "category"),
    "engineering data management":          ("PLM", "category"),
    "complex hardware product development": ("Engineering Software", "category"),

    # PLM / PDM
    "plm":                                  ("PLM", "category"),
    "pdm":                                  ("PLM", "category"),
    "bom":                                  ("BOM Management", "category"),
    "bom management":                       ("BOM Management", "category"),
    "mbse":                                 ("MBSE", "category"),
    "requirements":                         ("Requirements Management", "category"),
    "requirements management":              ("Requirements Management", "category"),
    "digital thread":                       ("Digital Thread", "category"),

    # Additive / 3D Printing
    "additive manufacturing 3d printing":   ("Additive Manufacturing", "category"),
    "additive manufacturing":               ("Additive Manufacturing", "category"),
    "3d printing innovation":               ("Additive Manufacturing", "category"),
    "3d printing":                          ("Additive Manufacturing", "category"),
    "am qualification":                     ("Additive Manufacturing", "category"),

    # Robotics / Automation
    "robotics":                             ("Robotics", "category"),
    "automation":                           ("Automation", "category"),
    "workflow automation":                  ("Workflow Automation", "category"),
    "process automation":                   ("Workflow Automation", "category"),
    "workflow":                             ("Workflow Automation", "category"),
    "rpa":                                  ("Workflow Automation", "category"),

    # Analytics / Data
    "analytics":                            ("Analytics", "category"),
    "data analytics":                       ("Analytics", "category"),
    "manufacturing analytics":              ("Manufacturing Analytics", "category"),
    "traceability":                         ("Traceability", "category"),
    "supply chain":                         ("Supply Chain", "category"),
    "supply chain management":              ("Supply Chain", "category"),
    "procurement":                          ("Supply Chain", "category"),
    "quoting":                              ("Quoting & Estimation", "category"),
    "rfq":                                  ("Quoting & Estimation", "category"),
    "cost estimation":                      ("Quoting & Estimation", "category"),
    "costing":                              ("Quoting & Estimation", "category"),

    # Construction / AEC
    "construction platform":                ("Construction Tech", "category"),
    "construction ops":                     ("Construction Tech", "category"),
    "construction planning":                ("Construction Tech", "category"),
    "construction monitoring":              ("Construction Tech", "category"),
    "bim":                                  ("BIM", "category"),
    "bim data and rules engine":            ("BIM", "category"),
    "bim tool development":                 ("BIM", "category"),
    "aec":                                  ("AEC", "category"),
    "aeco":                                 ("AEC", "category"),
    "aec cad":                              ("AEC", "category"),

    # Collaboration / Review
    "collaboration":                        ("Collaboration", "category"),
    "collaboration platform":               ("Collaboration", "category"),
    "design review":                        ("Design Review", "category"),

    # Quality / Inspection
    "quality control":                      ("Quality & Inspection", "category"),
    "computer vision qc":                   ("Quality & Inspection", "category"),
    "inspection":                           ("Quality & Inspection", "category"),
    "metrology":                            ("Quality & Inspection", "category"),
    "vision inspection":                    ("Quality & Inspection", "category"),

    # AI Platforms / Copilots
    "ai copilot":                           ("AI Copilot", "category"),
    "ai platform":                          ("AI Platform", "category"),
    "ai driven optimization":               ("AI Platform", "category"),
    "ai for r&d":                           ("AI for R&D", "category"),

    # Materials / Sustainability
    "materials":                            ("Materials", "category"),
    "materials science":                    ("Materials", "category"),
    "sustainability":                       ("Sustainability", "category"),
    "decarbonization":                      ("Sustainability", "category"),
    "compliance":                           ("Compliance", "category"),
    "regulatory compliance":                ("Compliance", "category"),

    # Immersive / AR/VR
    "ar/vr":                                ("AR/VR", "category"),
    "immersive design":                     ("AR/VR", "category"),
    "xr":                                   ("AR/VR", "category"),
    "vr":                                   ("AR/VR", "category"),

    # Hardware
    "hardware":                             ("Hardware", "category"),

    # No-code
    "no-code":                              ("No-code Platform", "category"),
    "low-code":                             ("No-code Platform", "category"),
    "configurators":                        ("No-code Platform", "category"),

    # Creator / 3D Tools
    "creator tools":                        ("3D Creator Tools", "category"),

    # ═══════════════════════════════════════════════════════
    # OPERATING MODEL TAGS
    # How the business operates (go-to-market + delivery)
    # ═══════════════════════════════════════════════════════

    "b2b":                                  ("B2B", "operating_model"),
    "b2b saas":                             ("B2B SaaS", "operating_model"),
    "b2c":                                  ("B2C", "operating_model"),
    "enterprise":                           ("Enterprise", "operating_model"),
    "enterprise saas":                      ("Enterprise SaaS", "operating_model"),
    "enterprise sales":                     ("Enterprise Sales", "operating_model"),
    "smb":                                  ("SMB", "operating_model"),
    "saas":                                 ("SaaS", "operating_model"),
    "cloud saas":                           ("SaaS", "operating_model"),   # consolidate
    "vertical saas":                        ("Vertical SaaS", "operating_model"),
    "platform":                             ("Platform", "operating_model"),
    "platform play":                        ("Platform", "operating_model"),   # consolidate
    "horizontal platform":                  ("Platform", "operating_model"),
    "cloud-native":                         ("Cloud-native", "operating_model"),
    "cloud":                                ("Cloud-native", "operating_model"),   # consolidate
    "cloud + edge hybrid":                  ("Hybrid", "operating_model"),
    "hybrid":                               ("Hybrid", "operating_model"),
    "on-premise":                           ("On-premise", "operating_model"),
    "api-first":                            ("API-first", "operating_model"),
    "subscription":                         ("Subscription", "operating_model"),
    "usage-based":                          ("Usage-based", "operating_model"),
    "perpetual license":                    ("Perpetual License", "operating_model"),
    "freemium":                             ("Freemium", "operating_model"),
    "product-led growth":                   ("Product-led Growth", "operating_model"),
    "self-service":                         ("Self-Service", "operating_model"),
    "open-source":                          ("Open Source", "operating_model"),
    "community-driven":                     ("Community-driven", "operating_model"),
    "partner-led":                          ("Partner-led", "operating_model"),
    "direct sales":                         ("Direct Sales", "operating_model"),
    "sales-led":                            ("Direct Sales", "operating_model"),   # consolidate
    "channel":                              ("Channel", "operating_model"),
    "marketplace":                          ("Marketplace", "operating_model"),
    "oem":                                  ("OEM", "operating_model"),
    "white-label":                          ("White-label", "operating_model"),
    "edge computing":                       ("Edge Deployment", "operating_model"),
    "edge deployment":                      ("Edge Deployment", "operating_model"),
    "hw plus sw":                           ("HW+SW", "operating_model"),
    "hw+sw":                                ("HW+SW", "operating_model"),
    "industry-specific":                    ("Vertical Focus", "operating_model"),
    "plugins for cam software":             ("Plugin", "category"),  # interface type → category
    "software":                             ("drop", "drop"),   # too generic
    "no code platform":                     ("Self-Service", "operating_model"),

    # ═══════════════════════════════════════════════════════
    # DIFFERENTIATION TAGS
    # Why they are unique (competitive moat)
    # ═══════════════════════════════════════════════════════

    # AI/ML differentiators
    "ai automation":                        ("AI-powered Automation", "differentiation"),
    "ai-powered data automation":           ("AI-powered Automation", "differentiation"),
    "deep automation":                      ("AI-powered Automation", "differentiation"),
    "agentic automation":                   ("Agentic Automation", "differentiation"),
    "workflow embedded agents":             ("Agentic Automation", "differentiation"),
    "ai-native":                            ("AI-native Architecture", "differentiation"),
    "ai-first":                             ("AI-native Architecture", "differentiation"),
    "early ai-native cad":                  ("AI-native Architecture", "differentiation"),
    "ai-native cad workflow":               ("AI-native Architecture", "differentiation"),
    "proprietary models":                   ("Proprietary AI Models", "differentiation"),
    "proprietary ai backplane":             ("Proprietary AI Models", "differentiation"),
    "manufacturing focus models":           ("Manufacturing-grade AI Models", "differentiation"),
    "industrial ai templates":              ("Industrial AI Templates", "differentiation"),
    "deep ai modeling":                     ("Proprietary AI Models", "differentiation"),
    "production trained vision models":     ("Manufacturing-grade AI Models", "differentiation"),
    "physics-informed ai":                  ("Physics-informed AI", "differentiation"),
    "physics informed ai":                  ("Physics-informed AI", "differentiation"),
    "physics grounded ml":                  ("Physics-informed AI", "differentiation"),
    "hybrid ai physics models":             ("Physics-informed AI", "differentiation"),
    "ai driven optimization":               ("AI-driven Optimization", "differentiation"),
    "ai-driven design generation":          ("AI-driven Design Generation", "differentiation"),
    "generative modeling":                  ("Generative Modeling", "differentiation"),
    "generative twins":                     ("Generative Modeling", "differentiation"),
    "ai for r&d":                           ("AI for R&D", "differentiation"),
    "ai enabled platform":                  ("AI-native Architecture", "differentiation"),
    "ai toolpath optimization":             ("AI Toolpath Optimization", "differentiation"),
    "strong proprietary datasets":          ("Proprietary Datasets", "differentiation"),
    "materials science foundation":         ("Proprietary Datasets", "differentiation"),

    # Simulation differentiators
    "simulation-driven design":             ("Simulation-Driven Design", "differentiation"),
    "high-fidelity solutions":              ("High-fidelity Simulation", "differentiation"),
    "high fidelity simulations":            ("High-fidelity Simulation", "differentiation"),
    "cloud-native simulation":              ("Cloud-native Simulation", "differentiation"),
    "fullstack ai plus simulation":         ("Simulation-Driven Design", "differentiation"),

    # Real-time capabilities
    "real-time integration":                ("Real-time Integration", "differentiation"),
    "real-time collaboration":              ("Real-time Collaboration", "differentiation"),
    "real time analysis":                   ("Real-time Analytics", "differentiation"),
    "real-time workflow guidance":          ("Real-time Workflow Guidance", "differentiation"),
    "real-time progress visualization":     ("Real-time Monitoring", "differentiation"),
    "real-time monitoring":                 ("Real-time Monitoring", "differentiation"),
    "real-time 3d creation":               ("Real-time 3D Creation", "differentiation"),
    "real time physical process optimization edge ai": ("Real-time Edge AI", "differentiation"),

    # Workflow differentiators
    "workflow automation":                  ("Workflow Automation", "category"),   # move to category
    "workflow efficiency":                  ("Workflow Efficiency", "differentiation"),
    "browser-based workflow":               ("Browser-based", "category"),
    "cloud-native workflow":                ("Cloud-native Workflow", "differentiation"),
    "flexible cloud-native setup":          ("Cloud-native Workflow", "differentiation"),
    "fast concept-to-manufacturing loop":   ("Fast Concept-to-Manufacturing", "differentiation"),
    "no-code workflows":                    ("No-code Workflows", "differentiation"),
    "no-code builder for mes":             ("No-code Workflows", "differentiation"),
    "modular toolbox":                      ("Modular Architecture", "differentiation"),
    "domain-specific workflows and templates": ("Domain-specific Workflows", "differentiation"),
    "automated process flow mapping":       ("Domain-specific Workflows", "differentiation"),

    # Deployment differentiators
    "fast deployment":                      ("Fast Deployment", "differentiation"),
    "rapid deployment":                     ("Fast Deployment", "differentiation"),
    "fast adoption":                        ("Fast Deployment", "differentiation"),
    "ease of use":                          ("Ease of Use", "differentiation"),
    "simple ux":                            ("Ease of Use", "differentiation"),

    # Integration / interoperability
    "integration with existing engineering tools": ("Deep Integrations", "differentiation"),
    "strong integrations":                  ("Deep Integrations", "differentiation"),
    "integration depth":                    ("Deep Integrations", "differentiation"),

    # Data / Knowledge
    "single-source-of-truth":              ("Single Source of Truth", "differentiation"),
    "contextualized industrial data graph": ("Industrial Knowledge Graph", "differentiation"),
    "industrial grade data orchestration":  ("Industrial Knowledge Graph", "differentiation"),
    "digital thread":                       ("Digital Thread", "differentiation"),
    "collaborative intelligence":           ("Collaborative Intelligence", "differentiation"),

    # Domain expertise
    "deep domain expertise":                ("Deep Domain Expertise", "differentiation"),
    "aerospace-grade complexity":           ("Aerospace-grade Capability", "differentiation"),
    "deep learning cnc ops amrc partnership": ("Deep Domain Expertise", "differentiation"),
    "industrial-grade edge stack":          ("Industrial-grade Edge", "differentiation"),
    "industrialized deployments":           ("Industrial-grade Edge", "differentiation"),
    "industrial-scale rendering":           ("Industrial-grade Edge", "differentiation"),

    # Business / IP
    "patented process":                     ("Patented Technology", "differentiation"),
    "open source":                          ("Open Source", "differentiation"),
    "vendor-neutral":                       ("Vendor-neutral", "differentiation"),

    # Product-specific differentiators
    "production software":                  ("drop", "drop"),   # too vague
    "hardware engineering":                 ("Hardware Engineering Focus", "differentiation"),
    "sensor integration":                   ("Hardware Engineering Focus", "differentiation"),
    "turnkey solutions":                    ("Turnkey Deployment", "differentiation"),
    "collaborative bom":                    ("Collaborative BOM", "differentiation"),
    "cloud-first requirements trace graph": ("Requirements Traceability", "differentiation"),
    "downstream collaboration":             ("Downstream Collaboration", "differentiation"),
    "rules driven data quality in bim":     ("Rules-driven BIM", "differentiation"),
    "regulatory compliance focus (csrd, ghg, eu taxonomy)": ("ESG/Regulatory Compliance", "differentiation"),
    "compliance orientation":               ("ESG/Regulatory Compliance", "differentiation"),
    "operational optimization":             ("Operational Optimization", "differentiation"),
    "operations optimization":              ("Operational Optimization", "differentiation"),

    # Manufacturing-specific
    "mes & mom":                            ("MES", "category"),   # move to category
    "design automation":                    ("Design Automation", "category"),   # move to category
    "digital twins":                        ("Digital Twin", "category"),   # move to category

    # Drop — too vague / generic / not useful as tags
    "production software":                  ("drop", "drop"),
    "software":                             ("drop", "drop"),
    "ai platform":                          ("AI Platform", "category"),
    "collaborative intelligence":           ("Collaborative Intelligence", "differentiation"),
    "high speed workflow":                  ("Workflow Efficiency", "differentiation"),
    "100-fold speed":                       ("High-fidelity Simulation", "differentiation"),
    "high performance turbomachinery optimization": ("Deep Domain Expertise", "differentiation"),
    "ai models":                            ("Proprietary AI Models", "differentiation"),
    "fast rfq workflows":                   ("Fast Concept-to-Manufacturing", "differentiation"),

    # ── Extended taxonomy: tags used 3-14 times ────────────────────────────────

    # Agentic / AI agents
    "agentic ai":                           ("Agentic AI", "category"),
    "ai agents":                            ("Agentic AI", "category"),
    "agentic engineering":                  ("Agentic AI", "category"),
    "agentic workflow":                     ("Agentic Automation", "differentiation"),
    "agentic workflow layer for requirements": ("Agentic Automation", "differentiation"),
    "workflow embedding":                   ("Agentic Automation", "differentiation"),
    "ai agents for verification":           ("Agentic Automation", "differentiation"),
    "workflow from programming to runtime": ("Agentic Automation", "differentiation"),
    "collaborative process-to-code translation": ("Agentic Automation", "differentiation"),
    "llm-powered":                          ("AI-native Architecture", "differentiation"),
    "code-first workflows":                 ("AI-native Architecture", "differentiation"),
    "ai native workflow":                   ("AI-native Architecture", "differentiation"),
    "ai native stack":                      ("AI-native Architecture", "differentiation"),
    "generative engine":                    ("Generative AI", "category"),

    # Physics / Scientific AI
    "physics-based modeling plus ai":       ("Physics-informed AI", "differentiation"),
    "physics-based ai for manufacturing":   ("Physics-informed AI", "differentiation"),
    "physics ai":                           ("Physics-informed AI", "differentiation"),
    "physics grounded models":              ("Physics-informed AI", "differentiation"),
    "physics based optimization":           ("Physics-informed AI", "differentiation"),
    "ml assisted physics":                  ("Physics-informed AI", "differentiation"),
    "simulation llms":                      ("Physics-informed AI", "differentiation"),
    "scientific ai":                        ("Physics-informed AI", "differentiation"),
    "physical ai + scientific ai":          ("Physics-informed AI", "differentiation"),
    "multi-physics models":                 ("Physics-informed AI", "differentiation"),
    "fullstack ai plus simulation":         ("Simulation-Driven Design", "differentiation"),

    # Manufacturing categories
    "factory automation stack":             ("Factory Operations", "category"),
    "manufacturing productivity":           ("Manufacturing Software", "category"),
    "am-native workflows":                  ("Additive Manufacturing", "category"),
    "cnc":                                  ("CNC Automation", "category"),
    "cnc optimization":                     ("CNC Automation", "category"),
    "additive & subtractive machining":     ("Additive Manufacturing", "category"),
    "generative am":                        ("Additive Manufacturing", "category"),
    "dfam":                                 ("Additive Manufacturing", "category"),
    "metal l-pbf":                          ("Additive Manufacturing", "category"),
    "metal forming":                        ("Advanced Manufacturing", "category"),
    "mes & mom":                            ("MES", "category"),
    "manufacturing execution system":       ("MES", "category"),
    "oee":                                  ("Manufacturing Analytics", "category"),
    "closed-loop automation":               ("Automation", "category"),
    "closed-loop lab automation":           ("Automation", "category"),
    "lab automation loop":                  ("Automation", "category"),
    "genai-powered plc tooling":            ("Automation", "category"),
    "workflow orchestration":               ("Workflow Automation", "category"),
    "workflow tools":                       ("Workflow Automation", "category"),
    "vertical workflow automation":         ("Workflow Automation", "category"),
    "end to end workflow":                  ("Workflow Automation", "category"),

    # Robotics
    "robotic assembly":                     ("Robotics", "category"),
    "unified robotics dev stack":           ("Robotics", "category"),
    "autonomy stack":                       ("Robotics", "category"),

    # CAD / Design categories
    "mechanical cad":                       ("CAD", "category"),
    "implicit modeling":                    ("CAD", "category"),
    "voxel based modeling":                 ("CAD", "category"),
    "procedural modeling":                  ("CAD", "category"),
    "feature recognition":                  ("CAD", "category"),
    "concept design":                       ("CAD", "category"),
    "industrial design":                    ("CAD", "category"),
    "modeling and drafting":                ("CAD", "category"),
    "engineering modeling":                 ("CAD", "category"),
    "3d model-based coordination":          ("Collaboration", "category"),
    "real time browser cad":               ("Cloud CAD", "category"),
    "design optimization":                  ("Design Automation", "category"),
    "design space exploration":             ("Design Automation", "category"),
    "generativedesign":                     ("Generative CAD", "category"),
    "text prompt-based geometry":           ("Text-to-CAD", "category"),
    "text-to-cad generation":              ("Text-to-CAD", "category"),
    "cae plugin workflow":                  ("CAE", "category"),
    "ai for systems engineering":           ("Engineering Software", "category"),
    "engineering intelligence":             ("Engineering Software", "category"),
    "dfm":                                  ("Design for Manufacturing", "differentiation"),
    "design for manufacturing":             ("Design for Manufacturing", "differentiation"),
    "manufacturability focus":              ("Design for Manufacturing", "differentiation"),

    # PLM / Data
    "product lifecycle management":         ("PLM", "category"),
    "hardware plm":                         ("PLM", "category"),
    "r&d data management":                  ("PLM", "category"),
    "cad/plm enablement":                   ("PLM", "category"),
    "digital thread integration":           ("Digital Thread", "differentiation"),
    "cad to digital twin":                  ("Digital Thread", "differentiation"),
    "unified engineering data model":       ("Single Source of Truth", "differentiation"),
    "digital twin platform":                ("Digital Twin", "category"),
    "ai-generated twin":                    ("Digital Twin", "category"),

    # Analytics / Data
    "operational intelligence":             ("Analytics", "category"),
    "predictive analytics":                 ("Analytics", "category"),
    "prescriptive analytics":               ("Analytics", "category"),
    "ai analytics":                         ("Analytics", "category"),
    "data infrastructure":                  ("Analytics", "category"),
    "industrial dataops":                   ("Analytics", "category"),
    "knowledge management":                 ("Analytics", "category"),
    "domain specific analytics engine":     ("Manufacturing Analytics", "category"),
    "progress tracking":                    ("Analytics", "category"),
    "unified data layer":                   ("Industrial Knowledge Graph", "differentiation"),
    "high performance graph db":            ("Industrial Knowledge Graph", "differentiation"),
    "knowledge graph":                      ("Industrial Knowledge Graph", "differentiation"),
    "secure data fabric":                   ("Industrial Knowledge Graph", "differentiation"),
    "unified namespace":                    ("Industrial Knowledge Graph", "differentiation"),
    "unified namespace foundation":         ("Industrial Knowledge Graph", "differentiation"),
    "governed data backbone framing for multi-site manufacturers": ("Industrial Knowledge Graph", "differentiation"),
    "contextualized industrial data graph":  ("Industrial Knowledge Graph", "differentiation"),
    "industrial grade data orchestration":   ("Industrial Knowledge Graph", "differentiation"),

    # Quality / Inspection
    "quality assurance":                    ("Quality & Inspection", "category"),
    "defect detection":                     ("Quality & Inspection", "category"),
    "quality inspection":                   ("Quality & Inspection", "category"),
    "quality intelligence":                 ("Quality & Inspection", "category"),
    "vision ai":                            ("Quality & Inspection", "category"),
    "visual ai":                            ("Quality & Inspection", "category"),
    "ai driven qa":                         ("Quality & Inspection", "category"),
    "ot cybersecurity":                     ("OT Security", "category"),
    "security native architecture":         ("OT Security", "differentiation"),
    "defense grade security":               ("OT Security", "differentiation"),

    # Sustainability / ESG
    "esg reporting":                        ("Sustainability", "category"),
    "esg reporting (lowercase)":            ("Sustainability", "category"),
    "centralized esg and carbon data platform": ("Sustainability", "category"),
    "environmental":                        ("Sustainability", "category"),
    "climate tech":                         ("Sustainability", "category"),
    "energy management":                    ("Sustainability", "category"),
    "regulatory compliance focus (csrd, ghg, eu taxonomy)": ("ESG/Regulatory Compliance", "differentiation"),
    "regulatory readiness":                 ("ESG/Regulatory Compliance", "differentiation"),
    "fda alignment":                        ("ESG/Regulatory Compliance", "differentiation"),

    # AR/VR
    "native vr modeling":                   ("AR/VR", "category"),
    "hands-on vr modeling":                 ("AR/VR", "category"),
    "xr visualization":                     ("AR/VR", "category"),
    "xr-first communication layer":         ("AR/VR", "category"),
    "vr modeling":                          ("AR/VR", "category"),
    "freeform spatial ideation":            ("AR/VR", "category"),
    "industrial 3d visualization":          ("AR/VR", "category"),
    "cross platform xr":                    ("AR/VR", "category"),
    "multi user xr design":                 ("AR/VR", "category"),
    "real‑time 2d/3d integration and immersive vr": ("AR/VR", "category"),
    "real-time 2d/3d integration and immersive vr": ("AR/VR", "category"),
    "industrial-scale rendering":           ("AR/VR", "category"),
    "high-performance 3d streaming":        ("AR/VR", "category"),

    # Supply Chain / Procurement
    "supply chain automation":              ("Supply Chain", "category"),
    "procurement digitalization":           ("Supply Chain", "category"),
    "procurement saas":                     ("Supply Chain", "category"),
    "integrated supplier marketplace":      ("Supply Chain", "category"),
    "ai-enabled supply chain platform":     ("Supply Chain", "category"),
    "supplier graph ai":                    ("Supply Chain", "category"),
    "instant quote workflow":              ("Quoting & Estimation", "category"),

    # Construction / AEC extras
    "location-centric construction platform": ("Construction Tech", "category"),
    "facilities":                           ("Construction Tech", "category"),
    "3d model-based coordination":          ("Construction Tech", "category"),
    "unified dfma plus mbse plus plm stack purpose-built for construction": ("Construction Tech", "category"),

    # EDA / Electronics
    "eda":                                  ("EDA", "category"),
    "deep electronics domain models":       ("EDA", "category"),
    "semiconductor. eda. chip design":      ("EDA", "category"),
    "software-defined electronics":         ("EDA", "category"),
    "reinforcement learning for pcb":       ("EDA", "category"),
    "high-speed pcb specialization":        ("Deep Domain Expertise", "differentiation"),

    # Training / Education
    "training":                             ("Training & Education", "category"),
    "stem training":                        ("Training & Education", "category"),
    "outcome based training":              ("Training & Education", "category"),

    # Asset Management / Predictive
    "predictive maintenance":               ("Predictive Maintenance", "category"),
    "asset health":                         ("Predictive Maintenance", "category"),
    "industrial monitoring":               ("Industrial IoT", "category"),
    "asset management":                    ("Asset Management", "category"),

    # Quantum
    "quantum platforms":                    ("Quantum Computing", "category"),

    # Aerospace/Defense
    "defense focus":                        ("Dedicated to A&D", "differentiation"),

    # Project Management
    "project management":                   ("Project Management", "category"),
    "digital docs":                         ("Document Management", "category"),

    # Materials
    "materials informatics":                ("Materials", "category"),

    # Operating model extras
    "services":                             ("Services", "operating_model"),
    "engineering saas":                     ("B2B SaaS", "operating_model"),
    "vertical workflow focus":              ("Vertical Focus", "operating_model"),
    "vertical focus":                       ("Vertical Focus", "operating_model"),
    "edge-to-cloud architecture focus":     ("Hybrid", "operating_model"),
    "enterprise scale":                     ("Enterprise", "operating_model"),
    "low-code platform":                    ("Self-Service", "operating_model"),
    "partner ecosystem":                    ("Partner-led", "operating_model"),
    "open core":                            ("Open Source", "operating_model"),
    "devops":                               ("API-first", "operating_model"),
    "embedded distribution":               ("OEM", "operating_model"),
    "ai-powered site management":          ("drop", "drop"),  # too specific/unclear

    # Differentiation extras
    "optimization":                         ("AI-driven Optimization", "differentiation"),
    "autonomous optimization":              ("AI-powered Automation", "differentiation"),
    "closed loop optimization":             ("AI-powered Automation", "differentiation"),
    "ai model automation":                  ("AI-powered Automation", "differentiation"),
    "real time ai":                         ("AI-powered Automation", "differentiation"),
    "real-time scenario optimization":      ("AI-powered Automation", "differentiation"),
    "real-time metrics":                    ("Real-time Monitoring", "differentiation"),
    "live feedback":                        ("Real-time Monitoring", "differentiation"),
    "ot data":                              ("Real-time Monitoring", "differentiation"),
    "industrial ai templates":              ("Industrial AI Templates", "differentiation"),
    "domain specific models":              ("Manufacturing-grade AI Models", "differentiation"),
    "domain trained service AI":            ("Manufacturing-grade AI Models", "differentiation"),
    "proprietary data flywheel":            ("Proprietary Datasets", "differentiation"),
    "proprietary experimental data":        ("Proprietary Datasets", "differentiation"),
    "proprietary data model":              ("Proprietary Datasets", "differentiation"),
    "high granularity data":               ("Proprietary Datasets", "differentiation"),
    "algorithmic core":                    ("Proprietary AI Models", "differentiation"),
    "academic ip moat":                    ("Patented Technology", "differentiation"),
    "ip driven":                           ("Patented Technology", "differentiation"),
    "high-throughput search and patented approach claims": ("Patented Technology", "differentiation"),
    "open data standards":                 ("Open Data Standards", "differentiation"),
    "openusd support":                     ("Open Data Standards", "differentiation"),
    "platform-agnostic":                   ("Vendor-neutral", "differentiation"),
    "plm-agnostic deployment":             ("Vendor-neutral", "differentiation"),
    "open systems philosophy":             ("Vendor-neutral", "differentiation"),
    "device/network agnostic":             ("Vendor-neutral", "differentiation"),
    "enterprise integrations":             ("Deep Integrations", "differentiation"),
    "plm integration":                     ("Deep Integrations", "differentiation"),
    "erp integration":                     ("Deep Integrations", "differentiation"),
    "model validation and oem integration depth": ("Deep Integrations", "differentiation"),
    "multi-format cad ingestion":          ("Deep Integrations", "differentiation"),
    "clinical workflow integration":       ("Deep Integrations", "differentiation"),
    "operational data integration":        ("Deep Integrations", "differentiation"),
    "developer-first apis":               ("API-first", "differentiation"),
    "git native workflow":                 ("Developer-First", "differentiation"),
    "workflow acceleration":              ("Workflow Efficiency", "differentiation"),
    "worker productivity":                ("Workflow Efficiency", "differentiation"),
    "productivity amplification":         ("Workflow Efficiency", "differentiation"),
    "workflow coverage and configurability": ("Modular Architecture", "differentiation"),
    "browser native viewer":              ("Browser-based", "category"),
    "cloud fea rapid browser onboarding": ("Browser-based", "category"),
    "real time browser cad":              ("Browser-based", "category"),
    "high-performance 3d streaming":      ("Browser-based", "differentiation"),
    "modern ux":                          ("Ease of Use", "differentiation"),
    "extreme ease-of-use":                ("Ease of Use", "differentiation"),
    "operator-centric ux":               ("Ease of Use", "differentiation"),
    "field first ux":                    ("Ease of Use", "differentiation"),
    "fast time to value":                ("Fast Deployment", "differentiation"),
    "early-stage design acceleration":   ("Fast Deployment", "differentiation"),
    "performance-optimized algorithms":  ("High-fidelity Simulation", "differentiation"),
    "unified access to multiple simulators and compute": ("High-fidelity Simulation", "differentiation"),
    "high-res with fast ai workflows":   ("High-fidelity Simulation", "differentiation"),
    "robust inspection in harsh environments": ("Industrial-grade Edge", "differentiation"),
    "strong edge performance":           ("Industrial-grade Edge", "differentiation"),
    "plug-and-play edge platform plus managed hyperconverged nodes": ("Industrial-grade Edge", "differentiation"),
    "industrial-grade edge stack":       ("Industrial-grade Edge", "differentiation"),
    "deep domain expertise":             ("Deep Domain Expertise", "differentiation"),
    "engineering expertise to tools":    ("Deep Domain Expertise", "differentiation"),
    "high-certification manufacturing and process depth": ("Deep Domain Expertise", "differentiation"),
    "high-speed pcb specialization":     ("Deep Domain Expertise", "differentiation"),
    "domain expert founders":            ("drop", "drop"),   # team attribute
    "founder industrial background":     ("drop", "drop"),   # team attribute
    "serial founder track record":       ("drop", "drop"),   # team attribute
    "instructor credibility and curriculum quality": ("drop", "drop"),   # eval language
    "performance and usability wedge if proven": ("drop", "drop"),   # eval language
    "mesh-quality wedge for industrial and hard-surface assets": ("drop", "drop"),  # eval language
    "defensible theory and validation datasets if proven": ("drop", "drop"),   # eval language
    "new computing paradigm vs incremental silicon": ("drop", "drop"),   # too specific
    "complete it/ot and network identity bridge across wireless": ("drop", "drop"),  # too specific
    "cloud-native automation that outputs build-ready designs and scales across project types": ("drop", "drop"),  # sentence
    "unified dfma plus mbse plus plm stack purpose-built for construction": ("Construction Tech", "category"),
    "connect/integrate/analyze anywhere": ("drop", "drop"),  # marketing copy
    "process integrity":                 ("drop", "drop"),   # vague
    "validation":                        ("drop", "drop"),   # too vague
    "3d":                                ("drop", "drop"),   # too vague
    "search":                            ("drop", "drop"),   # too vague
    "massive data scale":                ("drop", "drop"),   # vague
    "product development":               ("drop", "drop"),   # too vague
    "custom solutions":                  ("drop", "drop"),   # too vague
    "knowledge and risk-alignment":      ("drop", "drop"),   # vague
    "ocr":                               ("drop", "drop"),   # too specific feature
    "game-engine-ready output":          ("drop", "drop"),   # too specific feature
    "ai-guided formulation pipeline plus strategic backing": ("drop", "drop"),  # eval language
    "architecture level innovation":     ("drop", "drop"),   # vague
    "unique sda platform":               ("drop", "drop"),   # acronym, unclear
    "field-driven design":               ("drop", "drop"),   # vague
    "report-by-exception approach":      ("drop", "drop"),   # too specific
    "proven methods":                    ("drop", "drop"),   # vague
    "lightweight plm alternative":       ("drop", "drop"),   # positioning language
    "copilot-like design assistance":    ("AI Copilot Interface", "differentiation"),
    "ai assistant":                      ("AI Copilot", "category"),
    "hardware focused ai assistant":     ("AI Copilot", "category"),
    "esg reporting":                     ("Sustainability", "category"),
    "data sovereignty":                  ("Open Data Standards", "differentiation"),
    # Stragglers that pass-through at 3+ usage
    "hardware manufacturing":            ("Hardware", "category"),
    "enterprise collaboration":          ("Collaboration", "category"),
    "collaboration and performance":     ("Collaboration", "category"),
    "enterprise ai":                     ("AI Platform", "category"),
    "estimation":                        ("Quoting & Estimation", "category"),
    "workflow fit for aec users rather than cfd experts": ("Ease of Use", "differentiation"),
    "domain trained service ai":         ("Manufacturing-grade AI Models", "differentiation"),
    "process integrity":                 ("drop", "drop"),
    "am qualification":                  ("Additive Manufacturing", "category"),
    "autonomous factory":                ("Smart Factory", "category"),
    "automation specification":          ("Automation", "category"),
    "batch execution":                   ("Automation", "category"),
    "cat tooling":                       ("CAE", "category"),
    "control software":                  ("Automation", "category"),
    "controls engineering":              ("Automation", "category"),
    "ai-eda":                            ("EDA", "category"),
    "buyer supplier workflows":          ("Supply Chain", "category"),
    "automotive r&d":                    ("Engineering Software", "category"),
    "automotive r&d optimization":       ("Engineering Software", "category"),
    "conformal cooling":                 ("Additive Manufacturing", "category"),
    "cold plates":                       ("Additive Manufacturing", "category"),
    "context modeling":                  ("Digital Twin", "category"),
    "simulation-driven design":          ("Simulation-Driven Design", "differentiation"),
    "ai copilot interface":              ("AI Copilot", "category"),
    "product development":               ("drop", "drop"),
    "physics-based modeling plus ai":    ("Physics-informed AI", "differentiation"),
    "developer-first":                   ("Developer-First", "differentiation"),
    "design for manufacturing":          ("Design for Manufacturing", "differentiation"),
}

# ─── Normalization Logic ───────────────────────────────────────────────────────

# Tags used < this many times across the database are dropped as noise
DROP_THRESHOLD = 3

# Pre-computed usage counts (set at runtime by main())
_TAG_USAGE: dict[str, int] = {}


def normalize_tag(tag: str) -> tuple[str | None, str | None]:
    """
    Returns (canonical_tag, target_column) or (None, None) to drop.
    Looks up lowercase version; if not found and usage < DROP_THRESHOLD, drops.
    """
    key = tag.strip().lower()
    if key in TAXONOMY:
        canonical, col = TAXONOMY[key]
        if col == "drop":
            return None, None
        return canonical, col
    # Not in map — keep only if used enough times
    if _TAG_USAGE.get(tag, 0) < DROP_THRESHOLD:
        return None, None   # drop low-frequency noise
    return tag.strip(), None   # None column = keep in current column


def rebuild_row(row: dict) -> tuple[dict, list[str]]:
    """Rebuild tag columns for one row. Returns (new_row, change_log)."""
    new_row = dict(row)
    changes = []

    new_cats  = []
    new_ops   = []
    new_diffs = []

    for col_name, target_list in [
        (CAT_COL,  new_cats),
        (OP_COL,   new_ops),
        (DIFF_COL, new_diffs),
    ]:
        raw_tags = parse_tags(row.get(col_name, ''))
        for tag in raw_tags:
            canonical, target_col = normalize_tag(tag)
            if canonical is None:
                changes.append(f"  DROP   [{col_name[:4]}] {tag!r}")
                continue

            # Route to correct column
            if target_col == "category":
                dest = new_cats
            elif target_col == "operating_model":
                dest = new_ops
            elif target_col == "differentiation":
                dest = new_diffs
            else:
                # keep in current column
                dest = target_list

            if canonical not in dest:
                dest.append(canonical)
                if canonical != tag or dest is not target_list:
                    orig_col = {id(new_cats): "cat", id(new_ops): "op", id(new_diffs): "diff"}
                    dest_name = {id(new_cats): "cat", id(new_ops): "op", id(new_diffs): "diff"}
                    if canonical != tag:
                        changes.append(f"  RENAME [{col_name[:4]}] {tag!r} → {canonical!r}")
                    if dest is not target_list:
                        changes.append(f"  MOVE   {tag!r} → {['cat','op','diff'][0] if dest is new_cats else ['cat','op','diff'][1] if dest is new_ops else 'diff'}")

    new_row[CAT_COL]  = ", ".join(new_cats)
    new_row[OP_COL]   = ", ".join(new_ops)
    new_row[DIFF_COL] = ", ".join(new_diffs)

    return new_row, changes


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Rebuild ThreadMoat tag taxonomy")
    parser.add_argument("--apply",  action="store_true", help="Write cleaned CSV (default: dry-run)")
    parser.add_argument("--report", action="store_true", help="Write detailed report to checkpoint dir")
    args = parser.parse_args()

    CHECKPOINT_DIR.mkdir(exist_ok=True)

    # Load CSV
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = list(reader.fieldnames or [])
    print(f"Loaded {len(rows)} companies from {CSV_PATH.name}")

    # Pre-run: collect all true unique tags
    before_cats  = Counter()
    before_ops   = Counter()
    before_diffs = Counter()
    for row in rows:
        for t in parse_tags(row.get(CAT_COL, '')):
            before_cats[t] += 1
        for t in parse_tags(row.get(OP_COL, '')):
            before_ops[t] += 1
        for t in parse_tags(row.get(DIFF_COL, '')):
            before_diffs[t] += 1

    print(f"\nBEFORE: {len(before_cats)} category, {len(before_ops)} op-model, {len(before_diffs)} diff tags")

    # Build global usage counts so normalize_tag can drop low-frequency noise
    global _TAG_USAGE
    for col_ctr in [before_cats, before_ops, before_diffs]:
        for tag, count in col_ctr.items():
            _TAG_USAGE[tag] = _TAG_USAGE.get(tag, 0) + count

    # Rebuild all rows
    new_rows = []
    all_changes = []
    unknown_tags: dict[str, list[str]] = defaultdict(list)  # tag → [company, ...]

    for row in rows:
        new_row, changes = rebuild_row(row)
        new_rows.append(new_row)
        company = row.get('Company', '?')
        if changes:
            all_changes.append((company, changes))

        # Collect unmapped tags (pass-through)
        for col_name in [CAT_COL, OP_COL, DIFF_COL]:
            for tag in parse_tags(row.get(col_name, '')):
                key = tag.strip().lower()
                if key not in TAXONOMY:
                    unknown_tags[tag].append(company)

    # Post-run: collect final unique tags
    after_cats  = Counter()
    after_ops   = Counter()
    after_diffs = Counter()
    for row in new_rows:
        for t in row.get(CAT_COL, '').split(', ') if row.get(CAT_COL) else []:
            if t: after_cats[t] += 1
        for t in row.get(OP_COL, '').split(', ') if row.get(OP_COL) else []:
            if t: after_ops[t] += 1
        for t in row.get(DIFF_COL, '').split(', ') if row.get(DIFF_COL) else []:
            if t: after_diffs[t] += 1

    print(f"AFTER:  {len(after_cats)} category, {len(after_ops)} op-model, {len(after_diffs)} diff tags")
    print(f"\nCompanies with changes: {len(all_changes)} / {len(rows)}")
    print(f"Unmapped tags (pass-through): {len(unknown_tags)}")

    # Show top unmapped tags
    unmapped_sorted = sorted(unknown_tags.items(), key=lambda x: -len(x[1]))
    print(f"\nTop 30 unmapped tags (add to TAXONOMY if needed):")
    for tag, companies in unmapped_sorted[:30]:
        print(f"  [{len(companies):3d}] {tag!r}")

    # Show final tag vocabulary
    print(f"\n─── FINAL CATEGORY TAGS ({len(after_cats)}) ───")
    for tag, count in sorted(after_cats.items(), key=lambda x: -x[1]):
        print(f"  [{count:3d}] {tag}")

    print(f"\n─── FINAL OPERATING MODEL TAGS ({len(after_ops)}) ───")
    for tag, count in sorted(after_ops.items(), key=lambda x: -x[1]):
        print(f"  [{count:3d}] {tag}")

    print(f"\n─── FINAL DIFFERENTIATION TAGS ({len(after_diffs)}) ───")
    for tag, count in sorted(after_diffs.items(), key=lambda x: -x[1]):
        print(f"  [{count:3d}] {tag}")

    if args.report:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        rpt_path = CHECKPOINT_DIR / f"rebuild_report_{ts}.txt"
        with open(rpt_path, 'w') as f:
            f.write(f"ThreadMoat Tag Rebuild Report — {ts}\n")
            f.write(f"Companies changed: {len(all_changes)}/{len(rows)}\n\n")

            f.write(f"\n=== UNMAPPED TAGS ({len(unknown_tags)}) ===\n")
            for tag, companies in unmapped_sorted:
                f.write(f"  [{len(companies):3d}] {tag!r}\n")

            f.write(f"\n=== FINAL CATEGORY TAGS ===\n")
            for tag, count in sorted(after_cats.items(), key=lambda x: -x[1]):
                f.write(f"  [{count:3d}] {tag}\n")

            f.write(f"\n=== FINAL OPERATING MODEL TAGS ===\n")
            for tag, count in sorted(after_ops.items(), key=lambda x: -x[1]):
                f.write(f"  [{count:3d}] {tag}\n")

            f.write(f"\n=== FINAL DIFFERENTIATION TAGS ===\n")
            for tag, count in sorted(after_diffs.items(), key=lambda x: -x[1]):
                f.write(f"  [{count:3d}] {tag}\n")

            f.write(f"\n=== PER-COMPANY CHANGES ===\n")
            for company, changes in all_changes:
                f.write(f"\n{company}\n")
                for c in changes:
                    f.write(f"  {c}\n")

        print(f"\nReport saved → {rpt_path}")

    if not args.apply:
        print(f"\nDry run — pass --apply to write CSV.")
        return

    # Backup + write
    ts     = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = CSV_PATH.with_name(f"Startups-Grid view.BACKUP_{ts}.csv")
    shutil.copy2(CSV_PATH, backup)
    print(f"\nBackup → {backup.name}")

    with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)

    print(f"CSV written → {CSV_PATH.name}")


if __name__ == "__main__":
    main()
