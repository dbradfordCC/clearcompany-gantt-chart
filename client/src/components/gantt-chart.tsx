import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon, RotateCcw, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
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
  originalDuration: number; // Required for workload calculation
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
  type: 'move' | 'resize';
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

  // Generate timeline
  const generateTimeline = useCallback(() => {
    const selectedProductInfo = productMixes[selectedProduct as keyof typeof productMixes];
    const modules = selectedProductInfo.modules;
    const hasIntegration = selectedProductInfo.hasIntegration;
    
    // For ClearCare Pro (self-paced)
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
      
      // ... (Rest of self-paced logic kept simplified for brevity, usually handled as full width bars)
      // For the interactive part, we focus primarily on the calculated timeline below
      return tasks;
    }
    
    // For Standard Implementation
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
      if (i > 0) currentWeek -= 1; // Overlap
      
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

  // Initial load and reset
  useEffect(() => {
    if (!isCustomMode) {
      setTasks(generateTimeline());
    }
  }, [generateTimeline, isCustomMode]);

  const totalWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    // Add buffer for drag operations
    return Math.max(20, Math.ceil(Math.max(...tasks.map(task => task.start + task.duration)) + 2));
  }, [tasks]);

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent, task: Task, type: 'move' | 'resize') => {
    if (task.isSelfPaced) return; // Disable dragging for self-paced placeholder bars
    
    e.preventDefault();
    e.stopPropagation();
    setIsCustomMode(true); // Switch to custom mode so auto-generation stops overwriting
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
      const nameColumnWidth = 256; // w-64 is 16rem = 256px
      const chartWidth = containerWidth - nameColumnWidth;
      // Determine pixels per week. Total weeks logic ensures we have space.
      // In the render, we use percentages. 
      // 100% width = totalWeeks. 
      // So 1 week = chartWidth / totalWeeks pixels.
      const pxPerWeek = chartWidth / Math.max(30, totalWeeks * 1.2);

      const deltaX = e.clientX - dragState.startX;
      const deltaWeeks = deltaX / pxPerWeek;

      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id !== dragState.taskId) return t;

        if (dragState.type === 'move') {
          // Move: Change start, keep duration
          const newStart = Math.max(0, dragState.initialStart + deltaWeeks);
          return { ...t, start: newStart, isCustomized: true };
        } else {
          // Resize: Change duration, keep start
          const newDuration = Math.max(1, dragState.initialDuration + deltaWeeks);
          return { ...t, duration: newDuration, isCustomized: true };
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

  // --- Workload / Velocity Calculation ---
  
  const weeklyWorkload = useMemo(() => {
    const workload: number[] = new Array(Math.ceil(totalWeeks)).fill(0);
    
    tasks.forEach(task => {
      if (task.isSelfPaced) return;

      // Calculate Intensity Multiplier
      // If a task was 5 weeks and is now 2.5 weeks, intensity is 2.0 (Double the work per week)
      const intensity = task.originalDuration / task.duration;
      
      // Distribute this intensity across the active weeks
      for (let w = Math.floor(task.start); w < task.start + task.duration; w++) {
        if (w >= 0 && w < workload.length) {
          // We add overlapping portions. Simple box integration.
          // If a task starts at 1.5 and ends at 2.5, week 1 gets 0.5 intensity, week 2 gets 0.5.
          // For simplicity in this UI, we'll just add the full intensity to the integer weeks it touches 
          // or use a simplified center-point logic.
          // Let's use simplified: Add intensity to every integer week covered.
          workload[w] += intensity;
        }
      }
    });
    
    setMaxWorkload(Math.max(...workload, 1));
    return workload;
  }, [tasks, totalWeeks]);

  const getWorkloadColor = (score: number) => {
    // Base normalization around 2.5 concurrent streams being "High"
    const normalized = score / 3.5; 
    if (normalized < 0.3) return '#4ade80'; // Green
    if (normalized < 0.6) return '#facc15'; // Yellow
    if (normalized < 0.8) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  };

  const resetCustomizations = () => {
    setIsCustomMode(false);
    setTasks(generateTimeline());
  };

  const exportPDF = () => window.print();

  // Group tasks
  const tasksByPhase = useMemo(() => {
    const phases: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!phases[task.phase]) phases[task.phase] = [];
      phases[task.phase].push(task);
    });
    return phases;
  }, [tasks]);

  const totalWeeksDisplay = tierInfo.package === 'ClearCare Pro' ? 'Client Self Paced' : Math.ceil(totalWeeks);

  return (
    <div className="space-y-8 select-none"> {/* Prevent text selection while dragging */}
      <div className="flex justify-center w-full mb-6">
        <img src={clearCompanyLogo} alt="ClearCompany Logo" className="h-16 object-contain" />
      </div>

      {/* Config Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: colors.primary }}>Implementation Project Configuration</CardTitle>
            <div className="flex gap-2">
              {isCustomMode && (
                 <Button variant="outline" onClick={resetCustomizations} className="no-print text-orange-600 border-orange-200 hover:bg-orange-50">
                   <RotateCcw className="w-4 h-4 mr-2" />
                   Reset Timeline
                 </Button>
              )}
              <Button onClick={exportPDF} className="no-print" style={{ backgroundColor: colors.primary }}>
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
               <div className="bg-slate-50 p-3 rounded border">
                 <Label className="text-xs text-slate-500">Package Tier</Label>
                 <div className="font-medium mt-1">{tierInfo.package}</div>
               </div>
               <div className="bg-slate-50 p-3 rounded border">
                 <Label className="text-xs text-slate-500">Est. End Date</Label>
                 <div className="font-medium mt-1">
                    {estimatedStartDate && typeof totalWeeksDisplay === 'number' ? format(new Date(new Date(estimatedStartDate).setDate(estimatedStartDate.getDate() + (totalWeeksDisplay * 7))), "MMM dd, yyyy") : "N/A"}
                 </div>
               </div>
            </div>

            {/* Velocity Meter Explanation */}
            {isCustomMode && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-800 flex items-start gap-2 animate-in fade-in">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <strong>Custom Mode Active:</strong> You are manually adjusting timelines. 
                  Compressing tasks or running them concurrently increases implementation intensity. 
                  Check the "Implementation Velocity" heat map below the chart.
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
            <div className="text-sm opacity-80">
              {typeof totalWeeksDisplay === 'number' ? `${Math.ceil(totalWeeksDisplay)} Weeks` : totalWeeksDisplay}
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
                     left: `${(i / Math.max(30, totalWeeks * 1.2)) * 100}%`, 
                     width: `${(1 / Math.max(30, totalWeeks * 1.2)) * 100}%` 
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
                    {task.isCustomized && <span className="text-[10px] text-orange-500 font-medium">Customized</span>}
                  </div>

                  <div className="flex-1 relative h-12">
                    {/* Week grid lines background for row */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        {Array.from({ length: Math.ceil(totalWeeks) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="absolute top-0 bottom-0 border-r border-gray-100"
                            style={{ left: `${(i / Math.max(30, totalWeeks * 1.2)) * 100}%` }}
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
                          left: `${(task.start / Math.max(30, totalWeeks * 1.2)) * 100}%`,
                          width: `${Math.max(0.5, (task.duration / Math.max(30, totalWeeks * 1.2)) * 100)}%`,
                          cursor: 'grab'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                      >
                        <span className="truncate drop-shadow-md">{task.duration.toFixed(1)}w</span>
                        
                        {/* Drag Handle Icon (visual only) */}
                        <GripVertical className="w-3 h-3 opacity-50 mx-auto absolute left-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* Resize Handle */}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-4 hover:bg-white/20 cursor-ew-resize flex items-center justify-center"
                          onMouseDown={(e) => handleMouseDown(e, task, 'resize')}
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

          {/* Workload Heatmap */}
          {tierInfo.package !== 'ClearCare Pro' && (
            <div className="flex border-t-2 border-gray-200 mt-4 bg-gray-50">
              <div className="w-64 shrink-0 p-3 border-r border-gray-200 text-sm font-bold text-gray-700 flex flex-col justify-center">
                Implementation Velocity
                <span className="text-[10px] font-normal text-gray-500">Est. Intensity / Workload</span>
              </div>
              <div className="flex-1 relative h-16 flex items-end pb-0">
                 {weeklyWorkload.map((load, i) => (
                   <div 
                     key={i}
                     className="absolute bottom-0 border-r border-white transition-all duration-300 group"
                     style={{ 
                       left: `${(i / Math.max(30, totalWeeks * 1.2)) * 100}%`, 
                       width: `${(1 / Math.max(30, totalWeeks * 1.2)) * 100}%`,
                       height: '100%',
                       display: 'flex',
                       alignItems: 'flex-end'
                     }}
                   >
                      {/* The Heatmap Bar */}
                      <div 
                        className="w-full rounded-t-sm transition-all hover:brightness-90"
                        style={{ 
                          height: `${Math.min(100, (load / 3.5) * 100)}%`,
                          backgroundColor: getWorkloadColor(load),
                          opacity: 0.8
                        }}
                      />
                      
                      {/* Tooltip for score */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">
                         Score: {load.toFixed(1)}
                      </div>
                   </div>
                 ))}
                 
                 {/* Legend for Heatmap overlay */}
                 <div className="absolute top-1 right-2 flex gap-3 text-[10px] bg-white/80 p-1 rounded backdrop-blur-sm border border-gray-200">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#4ade80]"></div> Normal</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#facc15]"></div> Elevated</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Intense</div>
                 </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}