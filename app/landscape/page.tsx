import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const DOMAINS = [
  {
    name: "Design Intelligence (CAD)",
    color: "#2E6DB4",
    icon: "✏️",
    description:
      "Next-generation computer-aided design tools using AI-driven generative geometry, real-time collaboration, and cloud-native parametric modeling. These startups are redefining how engineers create, iterate, and optimize product designs.",
  },
  {
    name: "Extreme Analysis (CAE, CFD, FEA, QC)",
    color: "#8FB3E8",
    icon: "🔬",
    description:
      "Simulation and analysis platforms spanning computational fluid dynamics, finite element analysis, and quality control. GPU-accelerated solvers and AI surrogates are collapsing iteration cycles from days to minutes.",
  },
  {
    name: "Adaptive Manufacturing (AM, CAM, CNC)",
    color: "#2BBFB3",
    icon: "🏭",
    description:
      "Additive manufacturing, CNC optimization, and hybrid production systems. From metal 3D printing to AI-powered toolpath generation, these companies are bridging the digital-to-physical gap.",
  },
  {
    name: "Cognitive Thread (PLM, MBSE, DT)",
    color: "#D45500",
    icon: "🧬",
    description:
      "Product lifecycle management, model-based systems engineering, and digital thread platforms. The connective tissue of engineering data — linking requirements, models, and configurations across the enterprise.",
  },
  {
    name: "Factory Futures (MES, IIOT)",
    color: "#F4B400",
    icon: "⚙️",
    description:
      "Manufacturing execution systems and industrial IoT platforms enabling smart factory operations. Real-time production monitoring, predictive maintenance, and edge computing for the shop floor.",
  },
  {
    name: "Augmented Operations (MOM, CMMS, AR/VR, SLM)",
    color: "#F2B38B",
    icon: "🥽",
    description:
      "Operations management, maintenance systems, AR/VR-assisted workflows, and service lifecycle management. These tools close the loop between engineering intent and field reality.",
  },
  {
    name: "Streamlined Supply Chain (SCM)",
    color: "#D642A6",
    icon: "🔗",
    description:
      "Supply chain management platforms using AI for demand forecasting, supplier risk scoring, and logistics optimization. Critical infrastructure for resilient, data-driven procurement.",
  },
  {
    name: "Bleeding Edge BIM (AEC/BIM)",
    color: "#7EC8E3",
    icon: "🏗️",
    description:
      "Architecture, engineering, and construction technology — BIM authoring, clash detection, generative building design, and digital twin platforms for the built environment.",
  },
  {
    name: "SW+HW=Innovation (Robotics, Drones)",
    color: "#0B7A20",
    icon: "🤖",
    description:
      "Hardware-software convergence: autonomous robotics, drone platforms, sensor fusion, and embodied AI. Companies building the physical intelligence layer for industry.",
  },
  {
    name: "Knowledge Engineering (R&D, Learning)",
    color: "#7A3FD1",
    icon: "🎓",
    description:
      "Engineering education, R&D knowledge management, and AI-powered learning platforms. Accelerating how teams capture, share, and apply deep technical expertise.",
  },
]

export default function PublicLandscapePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ThreadMoat" width={160} height={42} className="h-10 w-auto" unoptimized />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/pricing">
              <Button size="sm">View Pricing</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="max-w-3xl mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Investment Landscape</h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            ThreadMoat maps the engineering software ecosystem across ten domains spanning design,
            simulation, manufacturing, operations, supply chain, AEC, robotics, and research systems.
            Each of our 550+ tracked startups is categorized within one primary investment domain.
          </p>
        </div>

        {/* Color legend */}
        <div className="flex flex-wrap gap-3 mb-10">
          {DOMAINS.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {d.name.replace(/\s*\(.*?\)\s*/g, "")}
              </span>
            </div>
          ))}
        </div>

        {/* Domain cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {DOMAINS.map((d) => (
            <Card key={d.name} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-1.5" style={{ backgroundColor: d.color }} />
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{d.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{d.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{d.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 pt-12 pb-8 text-center">
          <p className="text-muted-foreground max-w-lg">
            Subscribers get full analytics across all 10 domains — company scores, funding data, competitive
            positioning, and interactive visualizations for 600+ startups.
          </p>
          <div className="flex gap-3">
            <Link href="/pricing">
              <Button size="lg" className="gap-2">
                View Pricing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button asChild size="lg" variant="outline">
              <a href="mailto:fino@demystifyingplm.com">Schedule a Call</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ThreadMoat. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
