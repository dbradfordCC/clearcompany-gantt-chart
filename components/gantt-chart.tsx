"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download } from "lucide-react";
import Image from "next/image";

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
  originalDuration?: number;
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
        "Performance, Goals, Engagement",
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
      modules: ["LMS", "Performance, Goals, Engagement", "Compensation Management"],
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

    // ClearCare Pro — self-paced
    if (tierInfo.package === "ClearCare Pro") {
      const tasks: Task[] = [];

      tasks.push({
        id: "optional-setup",
        name: "Optional ClearCompany Setup Assistance",
        phase: "Initiation & Planning",
        start: 0,
        duration: 2,
        color: colors.castIron,
        isSelfPaced: false,
      });

      const moduleTypes = [
        "Recruiting",
        "Onboarding",
        "LMS",
        "Performance, Goals, Engagement",
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
          color: colors.castIron,
          isSelfPaced: true,
        });
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-setup`,
          name: "Setup",
          phase: "Execution",
          start: 0,
          duration: 1,
          color: colors.bronze,
          isSelfPaced: true,
        });
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-learning`,
          name: "Learning",
          phase: "Execution",
          start: 0,
          duration: 1,
          color: colors.verdigris,
          isSelfPaced: true,
        });
        tasks.push({
          id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, "-")}-testing`,
          name: "Testing",
          phase: "Execution",
          start: 0,
          duration: 1,
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
        color: colors.copper,
        isSelfPaced: true,
      });

      return tasks;
    }

    // ClearCare Advanced / Max
    const tasks: Task[] = [];
    let currentWeek = 0;
    const moduleDuration = tierInfo.weeksPerModule;
    const setupDuration = Math.max(1, Math.round(moduleDuration * 0.3));
    const integrationDuration = Math.max(1, Math.round(moduleDuration * 0.6));
    const dataImportDuration = Math.max(1, Math.round(moduleDuration * 0.5));
    const rolloutTrainingDuration = Math.max(1, Math.round(moduleDuration * 0.3));

    // Initiation & Planning
    tasks.push({
      id: "kickoff",
      name: "Project Kickoff",
      phase: "Initiation & Planning",
      start: currentWeek,
      duration: 1,
      color: colors.castIron,
      originalDuration: 1,
      originalStart: currentWeek,
    });
    tasks.push({
      id: "requirements",
      name: "Requirements Gathering",
      phase: "Initiation & Planning",
      start: currentWeek,
      duration: 2,
      color: colors.pewter,
      originalDuration: 2,
      originalStart: currentWeek,
    });
    currentWeek += 2;

    // Execution — modules
    for (let i = 0; i < modules.length; i++) {
      const moduleName = modules[i];
      if (i > 0) currentWeek -= 1; // 1-week overlap between modules

      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-implementation`,
        name: `${moduleName} Implementation`,
        phase: "Execution",
        start: currentWeek,
        duration: moduleDuration,
        color: colors.castIron,
        originalDuration: moduleDuration,
        originalStart: currentWeek,
      });
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-setup`,
        name: "Setup",
        phase: "Execution",
        start: currentWeek,
        duration: setupDuration,
        color: colors.bronze,
        originalDuration: setupDuration,
        originalStart: currentWeek,
      });

      const learningDuration = Math.max(1, Math.ceil(moduleDuration * 0.7));
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-learning`,
        name: "Learning",
        phase: "Execution",
        start: currentWeek,
        duration: learningDuration,
        color: colors.verdigris,
        originalDuration: learningDuration,
        originalStart: currentWeek,
      });

      const testingStart = currentWeek + learningDuration - 1;
      const testingDuration = Math.max(1, moduleDuration - (testingStart - currentWeek));
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-testing`,
        name: "Testing",
        phase: "Execution",
        start: testingStart,
        duration: testingDuration,
        color: colors.steel,
        originalDuration: testingDuration,
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
          color: colors.pewter,
          originalDuration: dataImportDuration,
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
            color: colors.alloy,
            originalDuration: integrationDuration,
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
          color: colors.alloy,
          originalDuration: integrationDuration,
          originalStart: integrationStart,
        });
      }

      currentWeek += moduleDuration;
    }

    // Launch
    tasks.push({
      id: "rollout-training",
      name: "Rollout Training",
      phase: "Launch",
      start: currentWeek,
      duration: rolloutTrainingDuration,
      color: colors.brass,
      originalDuration: rolloutTrainingDuration,
      originalStart: currentWeek,
    });
    currentWeek += rolloutTrainingDuration;

    tasks.push({
      id: "golive",
      name: "Go Live",
      phase: "Launch",
      start: currentWeek,
      duration: 1,
      color: colors.copper,
      originalDuration: 1,
      originalStart: currentWeek,
    });

    return tasks;
  }, [employeeCount, selectedProduct, tierInfo]);

  useEffect(() => {
    setTasks(generateTimeline());
  }, [generateTimeline]);

  const totalWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.max(...tasks.map((t) => t.start + t.duration));
  }, [tasks]);

  const totalWeeksDisplay = useMemo(() => {
    if (tierInfo.package === "ClearCare Pro") return "Client Self-Paced";
    return Math.ceil(totalWeeks);
  }, [totalWeeks, tierInfo.package]);

  const tasksByPhase = useMemo(() => {
    const phases: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!phases[task.phase]) phases[task.phase] = [];
      phases[task.phase].push(task);
    });
    return phases;
  }, [tasks]);

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  const phaseHeaderColor = (phase: string) => {
    if (phase === "Initiation & Planning") return colors.castIronLight;
    if (phase === "Launch") return colors.copper;
    return colors.castIron;
  };

  return (
    <div className="space-y-6">
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
            <Button
              onClick={exportPDF}
              className="flex items-center gap-2 print:hidden"
              style={{ backgroundColor: colors.castIron, color: colors.platinum }}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {/* Print-only logo at top of config page */}
          <div className="hidden print:flex justify-center pb-4 mb-4 border-b border-[#C3B497]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clearco-lockup.png" alt="ClearCo" style={{ height: 40 }} />
          </div>

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="company-name" className="text-sm font-medium text-[#37352A]">
                Company Name
              </Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="mt-1 border-[#C3B497] focus:ring-[#37352A] print:hidden"
              />
              <p className="hidden print:block mt-1 text-sm font-semibold text-[#37352A]">
                {companyName || "—"}
              </p>
            </div>

            {/* Employee Count */}
            <div>
              <Label htmlFor="employee-count" className="text-sm font-medium text-[#37352A]">
                Employee Count:{" "}
                <span className="font-semibold">
                  {employeeCount >= 4500 ? "4,500+" : employeeCount.toLocaleString()}
                </span>
              </Label>
              {/* Slider row — hidden in print */}
              <div className="flex items-center gap-4 mt-2 print:hidden">
                <Input
                  id="employee-count"
                  type="number"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-24 border-[#C3B497]"
                />
                <div className="flex-1">
                  <Slider
                    value={[employeeCount]}
                    onValueChange={([value]) => setEmployeeCount(value)}
                    max={4500}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Customer Tier + Package */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F4EBD7] rounded-lg p-3">
                <div className="text-xs text-[#697771]">Customer Segment</div>
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

            {/* Product Selection */}
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
        {/* Print-only logo header */}
        <div className="hidden print:flex justify-center py-3 border-b border-[#C3B497]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/clearco-lockup.png" alt="ClearCo" style={{ height: 40 }} />
        </div>

        <CardHeader style={{ backgroundColor: colors.castIron, color: colors.platinum }}>
          <CardTitle className="text-base font-semibold tracking-wide">
            ClearCo Implementation Timeline — {companyName || "Company Name"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
            <div key={phase}>
              {/* Phase header */}
              <div
                className="text-white px-4 py-2 text-xs font-bold uppercase tracking-widest phase-header"
                style={{ backgroundColor: phaseHeaderColor(phase) }}
              >
                {phase}
              </div>

              {/* Task rows */}
              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex border-b border-[#F4EBD7] hover:bg-[#FAF8F5] task-row items-stretch"
                >
                  {/* Task label — expands naturally with text */}
                  <div className="w-56 shrink-0 p-3 border-r border-[#F4EBD7] text-sm task-label-col flex items-center">
                    <div className="font-medium text-[#37352A] leading-snug">{task.name}</div>
                  </div>

                  {/* Bar area — matches label height, bar centered */}
                  <div className="flex-1 relative min-h-[44px]">
                    {task.isSelfPaced ? (
                      <div
                        className="absolute left-1 right-1 rounded flex items-center justify-center text-white text-xs font-medium opacity-90"
                        style={{ backgroundColor: task.color, top: "50%", transform: "translateY(-50%)", height: "28px" }}
                      >
                        Variable — Client Self-Paced
                      </div>
                    ) : (
                      <div
                        className="gantt-bar absolute rounded flex items-center justify-center text-white text-xs font-medium overflow-hidden"
                        style={{
                          backgroundColor: task.color,
                          left: `${(task.start / Math.max(30, totalWeeks * 1.15)) * 100}%`,
                          width: `${Math.max(2, (task.duration / Math.max(30, totalWeeks * 1.15)) * 100)}%`,
                          minWidth: "28px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          height: "28px",
                        }}
                      >
                        <span className="select-none px-1">
                          {task.duration === 1 ? "1 wk" : `${task.duration} wks`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
