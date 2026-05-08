"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GanttChartProps {
  employeeCount: number;
  setEmployeeCount: (count: number) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  selectedProduct: string;
  setSelectedProduct: (product: string) => void;
}

interface Task {
  id: string;
  name: string;
  phase: string;
  start: number;
  duration: number;
  color: string;
  isCustomized?: boolean;
  originalDuration: number;
  originalStart?: number;
  isSelfPaced?: boolean;
}

interface TierInfo {
  tier: string;
  package: string;
  customerTier: string;
  moduleCheckIns: number;
  weeksPerModule: number;
}

interface DragState {
  taskId: string;
  type: "move" | "resize-left" | "resize-right";
  startX: number;
  initialStart: number;
  initialDuration: number;
}

// ClearCo brand palette
const colors = {
  castIron: "#37352A",
  castIronLight: "#4a4740",
  platinum: "#FAF8F5",
  copper: "#FF7A52",
  alloy: "#FFA680",
  bronze: "#6C3A2A",
  verdigris: "#9EB4AB",
  steel: "#697771",
  pewter: "#A1B4BA",
  whiteGold: "#F4EBD7",
  brass: "#C3B497",
  white: "#FFFFFF",
};

export default function GanttChart({
  employeeCount,
  setEmployeeCount,
  companyName,
  setCompanyName,
  selectedProduct,
  setSelectedProduct,
}: GanttChartProps) {
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: "ClearCare Advanced",
    package: "ClearCare Advanced",
    customerTier: "Mid-Market",
    moduleCheckIns: 4,
    weeksPerModule: 7,
  });

  const productMixes = {
    "ClearRecruit (ATS Only)": {
      name: "ClearRecruit (ATS Only)",
      modules: ["Recruiting"],
      moduleCount: 1,
      hasIntegration: true,
    },
    ClearRecruit: {
      name: "ClearRecruit",
      modules: ["Recruiting", "Onboarding"],
      moduleCount: 2,
      hasIntegration: false,
    },
    ClearTalent: {
      name: "ClearTalent",
      modules: ["Recruiting", "Onboarding", "LMS"],
      moduleCount: 3,
      hasIntegration: false,
    },
    TotalTalent: {
      name: "TotalTalent",
      modules: [
        "Recruiting",
        "Onboarding",
        "LMS",
        "Performance/Goals/Engagement",
        "Compensation Management",
      ],
      moduleCount: 5,
      hasIntegration: false,
    },
    ClearLearn: {
      name: "ClearLearn",
      modules: ["LMS"],
      moduleCount: 1,
      hasIntegration: false,
    },
    ClearGrow: {
      name: "ClearGrow",
      modules: ["LMS", "Performance/Goals/Engagement", "Compensation Management"],
      moduleCount: 3,
      hasIntegration: false,
    },
  };

  // Tier calculation — Pro: 1–249, Advanced starts at 250
  useEffect(() => {
    let tier, packageName, checkIns, weeksPerModule, customerTier;

    if (employeeCount >= 250 && employeeCount <= 599) {
      tier = "ClearCare Advanced";
      packageName = "ClearCare Advanced";
      customerTier = "Mid-Market";
      checkIns = 4;
      weeksPerModule = 5;
    } else if (employeeCount >= 600 && employeeCount <= 999) {
      tier = "ClearCare Advanced";
      packageName = "ClearCare Advanced";
      customerTier = "Mid-Market";
      checkIns = 4;
      weeksPerModule = 7;
    } else if (employeeCount >= 1000 && employeeCount <= 1499) {
      tier = "ClearCare Max";
      packageName = "ClearCare Max";
      customerTier = "Enterprise";
      checkIns = 6;
      weeksPerModule = 9;
    } else if (employeeCount >= 1500 && employeeCount <= 2000) {
      tier = "ClearCare Max";
      packageName = "ClearCare Max";
      customerTier = "Enterprise";
      checkIns = 6;
      weeksPerModule = 11;
    } else if (employeeCount > 2000) {
      tier = "Custom";
      packageName = "Custom";
      customerTier = "Enterprise";
      checkIns = 8;
      weeksPerModule = 13;
    } else {
      // 1–249: ClearCare Pro
      tier = "ClearCare Pro";
      packageName = "ClearCare Pro";
      customerTier = "Small Business";
      checkIns = 0;
      weeksPerModule = 0;
    }

    setTierInfo({ tier, package: packageName, customerTier, moduleCheckIns: checkIns, weeksPerModule });
  }, [employeeCount]);

  const generateTimeline = useCallback(() => {
    const selectedProductInfo = productMixes[selectedProduct as keyof typeof productMixes];
    const modules = selectedProductInfo.modules;
    const hasIntegration = selectedProductInfo.hasIntegration;

    if (tierInfo.package === "ClearCare Pro") {
      const tasks: Task[] = [];
      tasks.push({
        id: "optional-setup",
        name: "Optional ClearCompany Setup Assistance",
        phase: "Initiation & Planning",
        start: 0,
        duration: 2,
        originalDuration: 2,
        color: colors.castIron,
        isSelfPaced: false,
      });

      const moduleTypes = [
        "Recruiting",
        "Onboarding",
        "LMS",
        "Performance/Goals/Engagement",
        "Compensation Management",
      ];
      for (const moduleType of moduleTypes) {
        if (!modules.includes(moduleType)) continue;
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-implementation`,
          name: `${moduleType} Implementation`,
          phase: "Execution",
          start: 0,
          duration: 1,
          originalDuration: 1,
          color: colors.castIron,
          isSelfPaced: true,
        });
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-setup`,
          name: "Setup",
          phase: "Execution",
          start: 0,
          duration: 1,
          originalDuration: 1,
          color: colors.bronze,
          isSelfPaced: true,
        });
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-learning`,
          name: "Learning",
          phase: "Execution",
          start: 0,
          duration: 1,
          originalDuration: 1,
          color: colors.verdigris,
          isSelfPaced: true,
        });
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-testing`,
          name: "Testing",
          phase: "Execution",
          start: 0,
          duration: 1,
          originalDuration: 1,
          color: colors.steel,
          isSelfPaced: true,
        });
      }

      tasks.push({
        id: "golive",
        name: "Go Live",
        phase: "Launch",
        start: 0,
        duration: 1,
        originalDuration: 1,
        color: colors.copper,
        isSelfPaced: true,
      });
      return tasks;
    }

    // Advanced / Max
    const tasks: Task[] = [];
    let currentWeek = 0;
    const moduleDuration = tierInfo.weeksPerModule;
    const setupDuration = Math.max(1, Math.round(moduleDuration * 0.3));
    const integrationDuration = Math.max(1, Math.round(moduleDuration * 0.6));
    const dataImportDuration = Math.max(1, Math.round(moduleDuration * 0.5));
    const rolloutTrainingDuration = Math.max(1, Math.round(moduleDuration * 0.3));

    tasks.push({
      id: "kickoff",
      name: "Project Kickoff",
      phase: "Initiation & Planning",
      start: currentWeek,
      duration: 1,
      originalDuration: 1,
      color: colors.castIron,
      originalStart: currentWeek,
    });
    tasks.push({
      id: "requirements",
      name: "Requirements Gathering",
      phase: "Initiation & Planning",
      start: currentWeek,
      duration: 2,
      originalDuration: 2,
      color: colors.pewter,
      originalStart: currentWeek,
    });
    currentWeek += 2;

    const moduleEndWeeks: number[] = [];

    for (let i = 0; i < modules.length; i++) {
      const moduleName = modules[i];
      if (i > 0) currentWeek -= 1;

      tasks.push({
        id: `${moduleName}-implementation`,
        name: `${moduleName} Implementation`,
        phase: "Execution",
        start: currentWeek,
        duration: moduleDuration,
        originalDuration: moduleDuration,
        color: colors.castIron,
        originalStart: currentWeek,
      });
      tasks.push({
        id: `${moduleName}-setup`,
        name: "Setup",
        phase: "Execution",
        start: currentWeek,
        duration: setupDuration,
        originalDuration: setupDuration,
        color: colors.bronze,
        originalStart: currentWeek,
      });

      const learningDuration = Math.max(1, Math.ceil(moduleDuration * 0.7));
      tasks.push({
        id: `${moduleName}-learning`,
        name: "Learning",
        phase: "Execution",
        start: currentWeek,
        duration: learningDuration,
        originalDuration: learningDuration,
        color: colors.verdigris,
        originalStart: currentWeek,
      });

      const testingStart = currentWeek + learningDuration - 1;
      const testingLen = Math.max(1, moduleDuration - (testingStart - currentWeek));
      tasks.push({
        id: `${moduleName}-testing`,
        name: "Testing",
        phase: "Execution",
        start: testingStart,
        duration: testingLen,
        originalDuration: testingLen,
        color: colors.steel,
        originalStart: testingStart,
      });

      if (moduleName === "Recruiting") {
        const historyStart = currentWeek + moduleDuration - dataImportDuration;
        tasks.push({
          id: "historical-data-import",
          name: "Historical Data Import",
          phase: "Execution",
          start: historyStart,
          duration: dataImportDuration,
          originalDuration: dataImportDuration,
          color: colors.pewter,
          originalStart: historyStart,
        });
        if (hasIntegration) {
          const integrationStart = currentWeek + moduleDuration - integrationDuration;
          tasks.push({
            id: "recruiting-integration",
            name: "Integration",
            phase: "Execution",
            start: integrationStart,
            duration: integrationDuration,
            originalDuration: integrationDuration,
            color: colors.alloy,
            originalStart: integrationStart,
          });
        }
      }

      if (moduleName === "Onboarding") {
        const integrationStart = currentWeek + moduleDuration - integrationDuration;
        tasks.push({
          id: "onboarding-integration",
          name: "Integration",
          phase: "Execution",
          start: integrationStart,
          duration: integrationDuration,
          originalDuration: integrationDuration,
          color: colors.alloy,
          originalStart: integrationStart,
        });
      }

      currentWeek += moduleDuration;
      moduleEndWeeks.push(currentWeek);
    }

    // Launch — per-module rollout + go-live
    for (let i = 0; i < modules.length; i++) {
      const moduleName = modules[i];
      const rolloutStart = moduleEndWeeks[i];
      tasks.push({
        id: `${moduleName}-rollout`,
        name: `${moduleName} Rollout Training`,
        phase: "Launch",
        start: rolloutStart,
        duration: rolloutTrainingDuration,
        originalDuration: rolloutTrainingDuration,
        color: colors.brass,
        originalStart: rolloutStart,
      });
      tasks.push({
        id: `${moduleName}-golive`,
        name: `${moduleName} Go Live`,
        phase: "Launch",
        start: rolloutStart + rolloutTrainingDuration,
        duration: 1,
        originalDuration: 1,
        color: colors.copper,
        originalStart: rolloutStart + rolloutTrainingDuration,
      });
    }

    return tasks;
  }, [employeeCount, selectedProduct, tierInfo]);

  const standardTotalWeeks = useMemo(() => {
    const standardTasks = generateTimeline();
    if (standardTasks.length === 0) return 0;
    return Math.max(...standardTasks.map((t) => t.start + t.duration));
  }, [generateTimeline]);

  useEffect(() => {
    if (!isCustomMode) {
      setTasks(generateTimeline());
    }
  }, [generateTimeline, isCustomMode]);

  const totalWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.max(12, Math.ceil(Math.max(...tasks.map((t) => t.start + t.duration))) + 2);
  }, [tasks]);

  const currentDurationWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.ceil(Math.max(...tasks.map((t) => t.start + t.duration)));
  }, [tasks]);

  const totalWeeksDisplay = useMemo(() => {
    if (tierInfo.package === "ClearCare Pro") return "Client Self-Paced";
    return currentDurationWeeks;
  }, [currentDurationWeeks, tierInfo.package]);

  // --- Drag & Drop Handlers ---

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setIsCustomMode(true);
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    task: Task,
    type: "move" | "resize-left" | "resize-right"
  ) => {
    if (task.isSelfPaced) return;
    e.preventDefault();
    e.stopPropagation();
    setIsCustomMode(true);
    setDragState({
      taskId: task.id,
      type,
      startX: e.clientX,
      initialStart: task.start,
      initialDuration: task.duration,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;
      const containerWidth = ganttContainerRef.current?.offsetWidth || 1000;
      const nameColumnWidth = 224;
      const chartWidth = containerWidth - nameColumnWidth;
      const pxPerWeek = chartWidth / totalWeeks;
      const deltaWeeks = (e.clientX - dragState.startX) / pxPerWeek;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== dragState.taskId) return t;
          if (dragState.type === "move") {
            return { ...t, start: Math.max(0, Math.round(dragState.initialStart + deltaWeeks)), isCustomized: true };
          } else if (dragState.type === "resize-right") {
            return { ...t, duration: Math.max(1, Math.round(dragState.initialDuration + deltaWeeks)), isCustomized: true };
          } else {
            const newStart = Math.max(0, Math.round(dragState.initialStart + deltaWeeks));
            const originalEnd = dragState.initialStart + dragState.initialDuration;
            const clampedStart = Math.min(newStart, originalEnd - 1);
            return { ...t, start: clampedStart, duration: originalEnd - clampedStart, isCustomized: true };
          }
        })
      );
    };
    const handleMouseUp = () => setDragState(null);
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, totalWeeks]);

  // Client Module Teams — concurrent implementation streams per week
  const weeklyClientTeams = useMemo(() => {
    const teams: number[] = new Array(Math.ceil(totalWeeks)).fill(0);
    for (let i = 0; i < teams.length; i++) {
      const active = tasks.filter(
        (t) => t.name.includes("Implementation") && t.start <= i && t.start + t.duration > i
      ).length;
      teams[i] = active > 0 ? active : 0;
    }
    return teams;
  }, [tasks, totalWeeks]);

  const tasksByPhase = useMemo(() => {
    const phases: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!phases[task.phase]) phases[task.phase] = [];
      phases[task.phase].push(task);
    });
    return phases;
  }, [tasks]);

  const resetCustomizations = () => {
    setIsCustomMode(false);
    setTasks(generateTimeline());
  };

  const exportPDF = () => window.print();

  const getTimelineStatus = () => {
    if (!isCustomMode) return null;
    if (currentDurationWeeks < standardTotalWeeks) return { label: "Customized — Expedited", color: "text-[#FF7A52]" };
    if (currentDurationWeeks > standardTotalWeeks) return { label: "Customized — Lengthened", color: "text-[#9EB4AB]" };
    return { label: "Customized", color: "text-[#697771]" };
  };
  const timelineStatus = getTimelineStatus();

  const phaseHeaderColor = (phase: string) => {
    if (phase === "Initiation & Planning") return colors.castIronLight;
    if (phase === "Launch") return colors.copper;
    return colors.castIron;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Logo — screen only */}
      <div className="flex justify-center w-full mb-4 print:hidden">
        <Image
          src="/clearco-lockup.png"
          alt="ClearCo"
          width={220}
          height={60}
          className="object-contain"
          priority
        />
      </div>

      {/* Config Panel — visible on screen AND print (page 1) */}
      <Card className="config-card border-[#C3B497] shadow-sm">
        <CardHeader className="border-b border-[#F4EBD7]">
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: colors.castIron }} className="text-lg font-semibold">
              Implementation Project Configuration
            </CardTitle>
            <div className="flex gap-2 print:hidden">
              {isCustomMode && (
                <Button
                  variant="outline"
                  onClick={resetCustomizations}
                  className="border-[#FF7A52] text-[#FF7A52] hover:bg-[#FFF0EB]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Timeline
                </Button>
              )}
              <Button
                onClick={exportPDF}
                style={{ backgroundColor: colors.castIron, color: colors.platinum }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {/* Print-only logo at top of config page */}
          <div className="hidden print:flex justify-center pb-4 mb-4 border-b border-[#C3B497]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clearco-lockup.png" alt="ClearCo" style={{ height: 40 }} />
          </div>

          <div className="space-y-6">
            {/* Company + Employee side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <Label className="text-sm font-medium text-[#37352A]">Company Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 border-[#C3B497] print:hidden"
                />
                <p className="hidden print:block mt-1 text-sm font-semibold text-[#37352A]">
                  {companyName || "—"}
                </p>
              </div>

              {/* Employee Count */}
              <div>
                <Label className="text-sm font-medium text-[#37352A]">
                  Employee Count:{" "}
                  <span className="font-semibold">{employeeCount.toLocaleString()}</span>
                </Label>
                {/* Slider row — hidden in print */}
                <div className="flex items-center gap-4 mt-2 print:hidden">
                  <Input
                    type="number"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(Number(e.target.value))}
                    className="w-24 border-[#C3B497]"
                  />
                  <Slider
                    value={[employeeCount]}
                    onValueChange={([v]) => setEmployeeCount(v)}
                    max={4500}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Customer Tier + Package */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F4EBD7] rounded-lg p-3">
                <div className="text-xs text-[#697771]">Customer Tier</div>
                <div className="text-base font-semibold text-[#37352A] mt-0.5">
                  {tierInfo.customerTier}
                </div>
              </div>
              <div className="bg-[#F4EBD7] rounded-lg p-3">
                <div className="text-xs text-[#697771]">Package</div>
                <div className="text-base font-semibold text-[#37352A] mt-0.5">
                  {tierInfo.package}
                </div>
              </div>
            </div>

            {/* Timeline Status (custom mode only) */}
            {timelineStatus && (
              <div className="bg-[#F4EBD7] border border-[#C3B497] rounded-md p-3 text-sm text-[#37352A] flex items-center gap-2 print:hidden">
                <span className={cn("font-semibold", timelineStatus.color)}>
                  {timelineStatus.label}
                </span>
                <span className="text-[#697771]">— drag bars to adjust, or reset to standard.</span>
              </div>
            )}

            {/* Product Selection — box layout */}
            <div>
              <Label className="text-sm font-medium text-[#37352A]">Product Selection</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {Object.keys(productMixes).map((product) => (
                  <div
                    key={product}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProduct === product
                        ? "border-[#37352A] bg-[#F4EBD7]"
                        : "border-[#C3B497] hover:border-[#9EB4AB]"
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="product-selection"
                        value={product}
                        checked={selectedProduct === product}
                        onChange={() => setSelectedProduct(product)}
                        className="mr-3 accent-[#37352A]"
                      />
                      <span className="font-medium text-sm text-[#37352A]">{product}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Modules */}
            <div>
              <Label className="text-sm font-medium text-[#37352A]">Selected Modules</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {productMixes[selectedProduct as keyof typeof productMixes]?.modules.map(
                  (module) => (
                    <span
                      key={module}
                      className="px-3 py-1 rounded-full text-sm font-medium text-[#37352A]"
                      style={{ backgroundColor: colors.whiteGold }}
                    >
                      {module}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Estimated Project Total — full width */}
            <div
              className="rounded-lg p-5 project-summary-bar"
              style={{ backgroundColor: colors.castIron }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[#FAF8F5]">
                <div>
                  <div className="text-xs opacity-70 uppercase tracking-wide">
                    Estimated Duration Per Module
                  </div>
                  <div className="text-xl font-semibold mt-1">
                    {tierInfo.package === "ClearCare Pro"
                      ? "Self-Paced"
                      : `${tierInfo.weeksPerModule} weeks`}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70 uppercase tracking-wide">Total Modules</div>
                  <div className="text-xl font-semibold mt-1">
                    {productMixes[selectedProduct as keyof typeof productMixes]?.moduleCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs opacity-70 uppercase tracking-wide">
                    Estimated Project Total (Including Kickoff and Wrap Up)
                  </div>
                  <div className="text-xl font-semibold mt-1">
                    {typeof totalWeeksDisplay === "string"
                      ? totalWeeksDisplay
                      : `${totalWeeksDisplay} weeks`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart — starts on page 2 in print */}
      <Card
        className="gantt-container overflow-hidden border-[#C3B497] shadow-sm"
        ref={ganttContainerRef}
      >
        {/* Print-only logo */}
        <div className="hidden print:flex justify-center py-3 border-b border-[#C3B497]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clearco-lockup.png" alt="ClearCo" style={{ height: 40 }} />
        </div>

        <CardHeader
          style={{ backgroundColor: colors.castIron, color: colors.platinum }}
          className="py-3"
        >
          <CardTitle className="text-base font-semibold tracking-wide">
            ClearCo Implementation Timeline — {companyName || "Company Name"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 relative">
          {/* Week header */}
          <div className="flex border-b border-[#C3B497] bg-[#F4EBD7] sticky top-0 z-20 print:hidden">
            <div className="w-56 shrink-0 p-3 border-r border-[#C3B497] font-semibold text-xs text-[#697771]">
              Phase / Task
            </div>
            <div className="flex-1 relative h-10">
              {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 top-0 border-r border-[#C3B497] text-[10px] text-[#A1B4BA] flex items-end justify-center pb-1"
                  style={{
                    left: `${(i / totalWeeks) * 100}%`,
                    width: `${(1 / totalWeeks) * 100}%`,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by Phase */}
          {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
            <div key={phase}>
              <div
                className="text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest phase-header"
                style={{ backgroundColor: phaseHeaderColor(phase) }}
              >
                {phase}
              </div>

              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex border-b border-[#F4EBD7] hover:bg-[#FAF8F5] transition-colors group task-row"
                >
                  <div className="w-56 shrink-0 p-3 border-r border-[#F4EBD7] text-sm flex flex-col justify-center task-label-col">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-medium text-[#37352A] leading-snug break-words">
                        {task.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#FFF0EB] text-[#A1B4BA] hover:text-[#FF7A52] rounded transition-all print:hidden shrink-0"
                        title="Remove task"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {task.duration < task.originalDuration && (
                      <span className="text-[10px] text-[#FF7A52] font-bold uppercase mt-0.5">
                        Expedited
                      </span>
                    )}
                    {task.duration > task.originalDuration && (
                      <span className="text-[10px] text-[#9EB4AB] font-bold uppercase mt-0.5">
                        Lengthened
                      </span>
                    )}
                  </div>

                  <div className="flex-1 relative h-12">
                    {/* Grid lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-r border-[#F4EBD7]"
                          style={{ left: `${(i / totalWeeks) * 100}%` }}
                        />
                      ))}
                    </div>

                    {task.isSelfPaced ? (
                      <div
                        className="absolute top-2 bottom-2 rounded flex items-center justify-center text-white text-xs font-medium opacity-80"
                        style={{ backgroundColor: task.color, left: "1%", right: "1%" }}
                      >
                        Variable — Client Self-Paced
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "gantt-bar absolute top-2 bottom-2 rounded shadow-sm flex items-center justify-between px-2 text-white text-xs font-medium overflow-hidden transition-shadow",
                          dragState?.taskId === task.id
                            ? "z-30 ring-2 ring-offset-1 ring-[#37352A]"
                            : "z-10 group-hover:z-20"
                        )}
                        style={{
                          backgroundColor: task.color,
                          left: `${(task.start / totalWeeks) * 100}%`,
                          width: `${Math.max(0.5, (task.duration / totalWeeks) * 100)}%`,
                          cursor: "grab",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, task, "move")}
                      >
                        <span className="truncate drop-shadow-sm select-none">
                          {task.duration}w
                        </span>
                        <div
                          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-20"
                          onMouseDown={(e) => handleMouseDown(e, task, "resize-left")}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-20"
                          onMouseDown={(e) => handleMouseDown(e, task, "resize-right")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Client Module Team(s) Recommended for concurrent work */}
          {tierInfo.package !== "ClearCare Pro" && (
            <div className="flex border-t border-[#C3B497] bg-white relative page-break-inside-avoid">
              <div className="w-56 shrink-0 p-3 border-r border-[#C3B497] text-sm font-bold text-[#37352A] flex flex-col justify-center task-label-col">
                Client Module Team(s) Recommended
                <span className="text-[10px] font-normal text-[#697771] mt-0.5">
                  for concurrent work
                </span>
              </div>
              <div className="flex-1 relative h-12 flex items-center">
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-[#F4EBD7]"
                      style={{ left: `${(i / totalWeeks) * 100}%` }}
                    />
                  ))}
                </div>
                {weeklyClientTeams.map((count, i) =>
                  count > 0 ? (
                    <div
                      key={i}
                      className="absolute text-xs font-bold text-[#37352A] flex justify-center items-center"
                      style={{
                        left: `${(i / totalWeeks) * 100}%`,
                        width: `${(1 / totalWeeks) * 100}%`,
                        height: "100%",
                      }}
                    >
                      {count}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
