import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon, RotateCcw, GripVertical } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { cn } from "@/lib/utils";
import clearCompanyLogo from '@assets/ClearCompany_Main_RGB_1752703162426.png';

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
  selfPacedLabel?: string;
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
  type: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  initialStart: number;
  initialDuration: number;
}

export default function GanttChart({
  employeeCount,
  setEmployeeCount,
  companyName,
  setCompanyName,
  selectedProduct,
  setSelectedProduct
}: GanttChartProps) {
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [estimatedStartDate, setEstimatedStartDate] = useState<Date | undefined>(new Date());
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  // Workload calculation state
  const [maxWorkload, setMaxWorkload] = useState(0);

  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: 'ClearCare Advanced',
    package: 'ClearCare Advanced',
    customerTier: 'Mid-Market',
    moduleCheckIns: 4,
    weeksPerModule: 7
  });

  // Brand colors
  const colors = {
    primary: '#254677',           
    primaryLight: '#55BAEA',      
    secondary: '#E6E651',         
    secondaryAlt: '#822275',      
    primaryDark: '#1a325a',       
    primaryLighter: '#7dcbf2',    
    secondaryDark: '#baba41',     
    secondaryAltLight: '#a22f91', 
    dark: '#333333',              
    white: '#FFFFFF',             
    lightGray: '#F5F5F5'          
  };

  const productMixes = {
    'ClearRecruit (ATS Only)': {
      name: 'ClearRecruit (ATS Only)',
      modules: ['Recruiting'],
      moduleCount: 1,
      hasIntegration: true
    },
    ClearRecruit: {
      name: 'ClearRecruit',
      modules: ['Recruiting', 'Onboarding'],
      moduleCount: 2,
      hasIntegration: false
    },
    ClearTalent: {
      name: 'ClearTalent',
      modules: ['Recruiting', 'Onboarding', 'LMS'],
      moduleCount: 3,
      hasIntegration: false
    },
    TotalTalent: {
      name: 'TotalTalent',
      modules: ['Recruiting', 'Onboarding', 'LMS', 'Performance/Goals/Engagement', 'Compensation Management'],
      moduleCount: 5,
      hasIntegration: false
    },
    ClearLearn: {
      name: 'ClearLearn',
      modules: ['LMS'],
      moduleCount: 1,
      hasIntegration: false
    },
    ClearGrow: {
      name: 'ClearGrow',
      modules: ['LMS', 'Performance/Goals/Engagement', 'Compensation Management'],
      moduleCount: 3,
      hasIntegration: false
    }
  };

  // Calculate tier
  useEffect(() => {
    let tier, packageName, checkIns, weeksPerModule, customerTier;
    
    if (employeeCount >= 200 && employeeCount <= 599) {
      tier = 'ClearCare Advanced';
      packageName = 'ClearCare Advanced';
      customerTier = 'Mid-Market';
      checkIns = 4;
      weeksPerModule = 5;
    } else if (employeeCount >= 600 && employeeCount <= 999) {
      tier = 'ClearCare Advanced';
      packageName = 'ClearCare Advanced';
      customerTier = 'Mid-Market';
      checkIns = 4;
      weeksPerModule = 7;
    } else if (employeeCount >= 1000 && employeeCount <= 1499) {
      tier = 'ClearCare Max';
      packageName = 'ClearCare Max';
      customerTier = 'Enterprise';
      checkIns = 6;
      weeksPerModule = 9;
    } else if (employeeCount >= 1500 && employeeCount <= 2000) {
      tier = 'ClearCare Max';
      packageName = 'ClearCare Max';
      customerTier = 'Enterprise';
      checkIns = 6;
      weeksPerModule = 11;
    } else if (employeeCount > 2000) {
      tier = 'Custom';
      packageName = 'Custom';
      customerTier = 'Enterprise';
      checkIns = 8;
      weeksPerModule = 13;
    } else {
      tier = 'ClearCare Pro';
      packageName = 'ClearCare Pro';
      customerTier = 'Small Business';
      checkIns = 0;
      weeksPerModule = 0;
    }
    
    setTierInfo({
      tier,
      package: packageName,
      customerTier,
      moduleCheckIns: checkIns,
      weeksPerModule
    });
  }, [employeeCount]);

  // Generate timeline (Base Logic)
  const generateTimeline = useCallback(() => {
    const selectedProductInfo = productMixes[selectedProduct as keyof typeof productMixes];
    const modules = selectedProductInfo.modules;
    const hasIntegration = selectedProductInfo.hasIntegration;
    
    if (tierInfo.package === 'ClearCare Pro') {
      let tasks: Task[] = [];
      tasks.push({
        id: 'optional-setup',
        name: 'Optional ClearCompany Setup Assistance',
        phase: 'Initiation & Planning',
        start: 0,
        duration: 2,
        originalDuration: 2,
        color: colors.primaryDark,
        isSelfPaced: false
      });
      
      return tasks;
    }
    
    let tasks: Task[] = [];
    let currentWeek = 0;
    let moduleDuration = tierInfo.weeksPerModule;
    
    let setupDuration = Math.max(1, Math.round(moduleDuration * 0.3));
    let integrationDuration = Math.max(1, Math.round(moduleDuration * 0.6));
    let dataImportDuration = Math.max(1, Math.round(moduleDuration * 0.5));
    let rolloutTrainingDuration = Math.max(1, Math.round(moduleDuration * 0.3));
    let goLiveDuration = 1;
    
    tasks.push({
      id: 'kickoff',
      name: 'Project Kickoff',
      phase: 'Initiation & Planning',
      start: currentWeek,
      duration: 1,
      color: colors.primaryDark,
      originalDuration: 1,
      originalStart: currentWeek
    });
    
    tasks.push({
      id: 'requirements',
      name: 'Requirements Gathering',
      phase: 'Initiation & Planning',
      start: currentWeek,
      duration: 2,
      color: colors.primaryLighter,
      originalDuration: 2,
      originalStart: currentWeek
    });
    
    currentWeek += 2;
    
    for (let i = 0; i < modules.length; i++) {
      const moduleName = modules[i];
      if (i > 0) currentWeek -= 1; 
      
      tasks.push({
        id: `${moduleName}-implementation`,
        name: `${moduleName} Implementation`,
        phase: 'Execution',
        start: currentWeek,
        duration: moduleDuration,
        color: colors.primaryDark,
        originalDuration: moduleDuration,
        originalStart: currentWeek
      });
      
      tasks.push({
        id: `${moduleName}-setup`,
        name: 'Setup',
        phase: 'Execution',
        start: currentWeek,
        duration: setupDuration,
        color: colors.secondaryAlt,
        originalDuration: setupDuration,
        originalStart: currentWeek
      });
      
      tasks.push({
        id: `${moduleName}-learning`,
        name: 'Learning',
        phase: 'Execution',
        start: currentWeek,
        duration: Math.max(1, Math.ceil(moduleDuration * 0.7)),
        color: colors.secondaryDark,
        originalDuration: Math.max(1, Math.ceil(moduleDuration * 0.7)),
        originalStart: currentWeek
      });
      
      const testingStart = currentWeek + Math.max(1, Math.ceil(moduleDuration * 0.7)) - 1;
      const testingLen = moduleDuration - (testingStart - currentWeek);
      tasks.push({
        id: `${moduleName}-testing`,
        name: 'Testing',
        phase: 'Execution',
        start: testingStart,
        duration: Math.max(1, testingLen),
        color: colors.primaryLight,
        originalDuration: Math.max(1, testingLen),
        originalStart: testingStart
      });
      
      if (moduleName === 'Recruiting') {
        const historyStart = currentWeek + moduleDuration - dataImportDuration;
        tasks.push({
          id: 'historical-data-import',
          name: 'Historical Data Import',
          phase: 'Execution',
          start: historyStart,
          duration: dataImportDuration,
          color: colors.secondaryAltLight,
          originalDuration: dataImportDuration,
          originalStart: historyStart
        });
        
        if (hasIntegration) {
          const integrationStart = currentWeek + moduleDuration - integrationDuration;
          tasks.push({
            id: 'recruiting-integration',
            name: 'Integration',
            phase: 'Execution',
            start: integrationStart,
            duration: integrationDuration,
            color: colors.primaryDark,
            originalDuration: integrationDuration,
            originalStart: integrationStart
          });
        }
      }
      
      if (moduleName === 'Onboarding') {
        const integrationStart = currentWeek + moduleDuration - integrationDuration;
        tasks.push({
          id: 'onboarding-integration',
          name: 'Integration',
          phase: 'Execution',
          start: integrationStart,
          duration: integrationDuration,
          color: colors.secondaryAltLight,
          originalDuration: integrationDuration,
          originalStart: integrationStart
        });
      }
      
      currentWeek += moduleDuration;
    }
    
    tasks.push({
      id: 'rollout-training',
      name: 'Rollout Training',
      phase: 'Launch',
      start: currentWeek,
      duration: rolloutTrainingDuration,
      color: colors.secondary,
      originalDuration: rolloutTrainingDuration,
      originalStart: currentWeek
    });
    
    currentWeek += rolloutTrainingDuration;
    
    tasks.push({
      id: 'golive',
      name: 'Go Live',
      phase: 'Launch',
      start: currentWeek,
      duration: goLiveDuration,
      color: colors.secondaryAlt,
      originalDuration: goLiveDuration,
      originalStart: currentWeek
    });
    
    return tasks;
  }, [employeeCount, selectedProduct, tierInfo, colors]);

  // Calculate Standard Total Weeks (Baseline)
  const standardTotalWeeks = useMemo(() => {
    const standardTasks = generateTimeline();
    if (standardTasks.length === 0) return 0;
    return Math.max(...standardTasks.map(t => t.start + t.duration));
  }, [generateTimeline]);

  // Initial load and reset
  useEffect(() => {
    if (!isCustomMode) {
      setTasks(generateTimeline());
    }
  }, [generateTimeline, isCustomMode]);

  const totalWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    // Calculate width with a small buffer, but prevent it from being too wide if tasks are short
    const maxTaskEnd = Math.max(...tasks.map(task => task.start + task.duration));
    // Ensure minimum of 12 weeks for display, add 2 week buffer
    return Math.max(12, Math.ceil(maxTaskEnd) + 2);
  }, [tasks]);

  // Current active timeline duration
  const currentDurationWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.ceil(Math.max(...tasks.map(task => task.start + task.duration)));
  }, [tasks]);

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-left' | 'resize-right') => {
    if (task.isSelfPaced) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsCustomMode(true);
    setDragState({
      taskId: task.id,
      type,
      startX: e.clientX,
      initialStart: task.start,
      initialDuration: task.duration
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const containerWidth = ganttContainerRef.current?.offsetWidth || 1000;
      const nameColumnWidth = 256; 
      const chartWidth = containerWidth - nameColumnWidth;
      // Dynamic pxPerWeek based on totalWeeks to allow scaling
      const pxPerWeek = chartWidth / totalWeeks;

      const deltaX = e.clientX - dragState.startX;
      const deltaWeeks = deltaX / pxPerWeek;

      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id !== dragState.taskId) return t;

        if (dragState.type === 'move') {
          // Move: Change start, maintain duration
          const rawNewStart = dragState.initialStart + deltaWeeks;
          const newStart = Math.max(0, Math.round(rawNewStart));
          return { ...t, start: newStart, isCustomized: true };
        } else if (dragState.type === 'resize-right') {
          // Resize Right: Change duration, maintain start
          const rawNewDuration = dragState.initialDuration + deltaWeeks;
          const newDuration = Math.max(1, Math.round(rawNewDuration));
          return { ...t, duration: newDuration, isCustomized: true };
        } else {
          // Resize Left: Change Start AND Duration to keep End fixed
          const rawNewStart = dragState.initialStart + deltaWeeks;
          const newStart = Math.max(0, Math.round(rawNewStart));
          
          // Max start cannot exceed original end minus 1 week (min duration 1)
          const originalEnd = dragState.initialStart + dragState.initialDuration;
          const clampedStart = Math.min(newStart, originalEnd - 1);
          
          const newDuration = originalEnd - clampedStart;
          
          return { ...t, start: clampedStart, duration: newDuration, isCustomized: true };
        }
      }));
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, totalWeeks]);

  // --- Implementation Effort Calculation ---
  
  const weeklyEffort = useMemo(() => {
    const effort: number[] = new Array(Math.ceil(totalWeeks)).fill(0);
    
    tasks.forEach(task => {
      if (task.isSelfPaced) return;

      const intensity = task.originalDuration / task.duration;
      
      for (let w = Math.floor(task.start); w < task.start + task.duration; w++) {
        if (w >= 0 && w < effort.length) {
          effort[w] += intensity;
        }
      }
    });
    
    setMaxWorkload(Math.max(...effort, 1));
    return effort;
  }, [tasks, totalWeeks]);

  const getEffortColor = (score: number) => {
    if (score < 2.0) return '#4ade80'; // Low
    if (score <= 3.5) return '#facc15'; // Standard
    return '#ef4444'; // High
  };

  const resetCustomizations = () => {
    setIsCustomMode(false);
    setTasks(generateTimeline());
  };

  const exportPDF = () => window.print();

  const tasksByPhase = useMemo(() => {
    const phases: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!phases[task.phase]) phases[task.phase] = [];
      phases[task.phase].push(task);
    });
    return phases;
  }, [tasks]);

  // Status Logic
  const getTimelineStatus = () => {
    if (!isCustomMode) return "Standard Timeline";
    if (currentDurationWeeks < standardTotalWeeks) return "Customized Expedited";
    if (currentDurationWeeks > standardTotalWeeks) return "Customized Lengthened";
    return "Customized";
  };

  const getTimelineStatusColor = () => {
    if (!isCustomMode) return "text-slate-600";
    if (currentDurationWeeks < standardTotalWeeks) return "text-orange-600";
    if (currentDurationWeeks > standardTotalWeeks) return "text-blue-600";
    return "text-slate-600";
  };

  return (
    <div className="space-y-8 select-none">
      {/* Print specific styles injected here to ensure robust printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 5mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .gantt-container { overflow: visible !important; width: 100% !important; box-shadow: none !important; border: none !important; }
          /* Ensure the chart fits horizontally */
          .w-64 { width: 180px !important; } /* Shrink sidebar slightly for print */
          .text-[10px] { font-size: 8px !important; } /* Smaller text for print */
          /* Fix for cut-off blocks */
          .flex-1 { overflow: visible !important; }
        }
      `}} />

      <div className="flex justify-center w-full mb-6">
        <img src={clearCompanyLogo} alt="ClearCompany Logo" className="h-16 object-contain" />
      </div>

      {/* Config Panel */}
      <Card className="no-print">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: colors.primary }}>Implementation Project Configuration</CardTitle>
            <div className="flex gap-2">
              {isCustomMode && (
                 <Button variant="outline" onClick={resetCustomizations} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                   <RotateCcw className="w-4 h-4 mr-2" />
                   Reset Timeline
                 </Button>
              )}
              <Button onClick={exportPDF} style={{ backgroundColor: colors.primary }}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Employee Count: {employeeCount.toLocaleString()}</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input type="number" value={employeeCount} onChange={(e) => setEmployeeCount(Number(e.target.value))} className="w-24" />
                  <Slider value={[employeeCount]} onValueChange={([v]) => setEmployeeCount(v)} max={4500} min={1} step={1} className="flex-1" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Product */}
               <div className="bg-slate-50 p-3 rounded border">
                 <Label className="text-xs text-slate-500">Product</Label>
                 <select 
                    className="w-full bg-transparent font-medium mt-1 outline-none"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                 >
                    {Object.keys(productMixes).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>

               {/* Est Start Date */}
               <div className="bg-slate-50 p-3 rounded border">
                 <Label className="text-xs text-slate-500">Est. Start Date</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left font-medium p-0 h-auto mt-1 hover:bg-transparent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      {estimatedStartDate ? format(estimatedStartDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={estimatedStartDate}
                      onSelect={setEstimatedStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
               </div>

               {/* Est End Date */}
               <div className="bg-slate-50 p-3 rounded border">
                 <Label className="text-xs text-slate-500">Est. End Date</Label>
                 <div className="mt-1">
                   <div className="font-medium">
                      {estimatedStartDate ? 
                        format(addWeeks(estimatedStartDate, currentDurationWeeks), "MMM dd, yyyy") 
                        : "N/A"
                      }
                   </div>
                   {isCustomMode && (
                     <div className={cn("text-xs font-bold mt-1", getTimelineStatusColor())}>
                       {getTimelineStatus()}
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {isCustomMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 flex items-start gap-2 animate-in fade-in">
                <div className="mt-0.5">ℹ️</div>
                <div>
                  <strong>Implementation Timeline has been customized:</strong> Task blocks are snapped to whole weeks. 
                  Check the "Implementation Effort" meter below to ensure workload remains feasible.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="gantt-container overflow-hidden" ref={ganttContainerRef}>
        <CardHeader style={{ backgroundColor: colors.primary, color: 'white' }} className="py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Timeline: {companyName}</CardTitle>
            <div className="text-sm opacity-80 font-mono">
               Total: {currentDurationWeeks} Weeks
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          {/* Weeks Grid Header */}
          <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
            <div className="w-64 shrink-0 p-3 border-r border-gray-200 font-semibold text-sm text-gray-600">Phase / Task</div>
            <div className="flex-1 relative h-10">
               {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                 <div 
                   key={i} 
                   className="absolute bottom-0 top-0 border-r border-gray-200 text-[10px] text-gray-400 flex items-end justify-center pb-1"
                   style={{ 
                     left: `${(i / totalWeeks) * 100}%`, 
                     width: `${(1 / totalWeeks) * 100}%` 
                   }}
                 >
                   {i + 1}
                 </div>
               ))}
            </div>
          </div>

          {/* Tasks */}
          {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
            <div key={phase}>
              <div 
                className="text-white px-3 py-1 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: phase === 'Initiation & Planning' ? colors.primaryDark :
                                   phase === 'Execution' ? colors.primary :
                                   colors.secondaryAlt
                }}
              >
                {phase}
              </div>

              {phaseTasks.map((task) => (
                <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
                  <div className="w-64 shrink-0 p-3 border-r border-gray-200 text-sm flex flex-col justify-center">
                    <div className="font-medium leading-tight">{task.name}</div>
                    {task.duration < task.originalDuration && (
                      <span className="text-[10px] text-orange-600 font-bold uppercase mt-1">Expedited</span>
                    )}
                    {task.duration > task.originalDuration && (
                      <span className="text-[10px] text-blue-600 font-bold uppercase mt-1">Lengthened</span>
                    )}
                  </div>

                  <div className="flex-1 relative h-12">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="absolute top-0 bottom-0 border-r border-gray-100"
                            style={{ left: `${(i / totalWeeks) * 100}%` }}
                          />
                        ))}
                    </div>

                    {task.isSelfPaced ? (
                      <div
                        className="absolute top-2 bottom-2 rounded flex items-center justify-center text-white text-xs font-medium opacity-80"
                        style={{ backgroundColor: task.color, left: '1%', right: '1%' }}
                      >
                        Self-Paced / Variable
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "gantt-bar absolute top-2 bottom-2 rounded shadow-sm flex items-center justify-between px-2 text-white text-xs font-medium overflow-hidden",
                          dragState?.taskId === task.id ? "z-30 ring-2 ring-offset-1 ring-black" : "z-10 group-hover:z-20"
                        )}
                        style={{
                          backgroundColor: task.color,
                          left: `${(task.start / totalWeeks) * 100}%`,
                          width: `${Math.max(0.5, (task.duration / totalWeeks) * 100)}%`,
                          cursor: 'grab'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                      >
                        <span className="truncate drop-shadow-md select-none">{task.duration}w</span>
                        
                        {/* Left Resize Handle */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-4 hover:bg-white/20 cursor-ew-resize flex items-center justify-center z-20"
                          onMouseDown={(e) => handleMouseDown(e, task, 'resize-left')}
                        >
                          <div className="w-0.5 h-3 bg-white/50 rounded-full" />
                        </div>

                        <GripVertical className="w-3 h-3 opacity-50 mx-auto absolute left-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* Right Resize Handle */}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-4 hover:bg-white/20 cursor-ew-resize flex items-center justify-center z-20"
                          onMouseDown={(e) => handleMouseDown(e, task, 'resize-right')}
                        >
                          <div className="w-0.5 h-3 bg-white/50 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Implementation Effort Heatmap */}
          {tierInfo.package !== 'ClearCare Pro' && (
            <div className="flex border-t-2 border-gray-200 mt-4 bg-gray-50 relative">
              <div className="w-64 shrink-0 p-3 border-r border-gray-200 text-sm font-bold text-gray-700 flex flex-col justify-center">
                Implementation Effort
                <span className="text-[10px] font-normal text-gray-500">Workload Intensity</span>
              </div>
              <div className="flex-1 relative h-16 flex items-end pb-6"> {/* Added padding bottom for numbers */}
                 {/* Heatmap Grid Lines */}
                 <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute top-0 bottom-0 border-r border-gray-200"
                        style={{ left: `${(i / totalWeeks) * 100}%` }}
                      >
                        {/* Week Number Label at bottom */}
                        <div className="absolute -bottom-5 -left-2 w-4 text-center text-[9px] text-gray-400">
                            {i + 1}
                        </div>
                      </div>
                    ))}
                 </div>

                 {weeklyEffort.map((load, i) => (
                   <div 
                     key={i}
                     className="absolute bottom-6 border-r border-white transition-all duration-300 group"
                     style={{ 
                       left: `${(i / totalWeeks) * 100}%`, 
                       width: `${(1 / totalWeeks) * 100}%`,
                       height: 'calc(100% - 24px)',
                       display: 'flex',
                       alignItems: 'flex-end'
                     }}
                   >
                      <div 
                        className="w-full rounded-t-sm transition-all hover:brightness-90"
                        style={{ 
                          // Scale height max to 4.0 intensity for visual
                          height: `${Math.min(100, (load / 4) * 100)}%`,
                          backgroundColor: getEffortColor(load),
                          opacity: 0.8
                        }}
                      />
                   </div>
                 ))}
                 
                 {/* Heatmap Key - Moved to Left */}
                 <div className="absolute top-1 left-2 flex gap-3 text-[10px] bg-white/80 p-1 rounded backdrop-blur-sm border border-gray-200 z-10">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#4ade80]"></div> Low (Lengthened)</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#facc15]"></div> Standard</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> High (Expedited)</div>
                 </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}