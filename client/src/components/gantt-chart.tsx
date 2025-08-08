import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import clearCompanyLogo from '@assets/ClearCompany_Main_RGB_1752703162426.png';
import clearCompanyBugLogo from '@assets/ClearCompany_Bug_RGB (1) (1)_1752703162427.png';

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
  originalDuration?: number;
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
  const [estimatedStartDate, setEstimatedStartDate] = useState<Date | undefined>(new Date());
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: 'ClearCare Advanced',
    package: 'ClearCare Advanced',
    customerTier: 'Mid-Market',
    moduleCheckIns: 4,
    weeksPerModule: 7
  });


  // Calculate week width based on available space to prevent horizontal scrolling
  const WEEK_WIDTH = 40; // Reduced from 60 to fit better

  // Brand colors based on your original design
  const colors = {
    primary: '#254677',           // Dark blue
    primaryLight: '#55BAEA',      // Light blue
    secondary: '#E6E651',         // Yellow
    secondaryAlt: '#822275',      // Purple
    primaryDark: '#1a325a',       // Darker blue variation
    primaryLighter: '#7dcbf2',    // Lighter blue variation
    secondaryDark: '#baba41',     // Darker yellow variation
    secondaryAltLight: '#a22f91', // Lighter purple variation
    dark: '#333333',              // Dark gray for text
    white: '#FFFFFF',             // White
    lightGray: '#F5F5F5'          // Light gray for backgrounds
  };

  // Define product mixes and their modules
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

  // Calculate tier based on employee count
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

  // Generate timeline based on configuration
  const generateTimeline = useCallback(() => {
    const selectedProductInfo = productMixes[selectedProduct as keyof typeof productMixes];
    const modules = selectedProductInfo.modules;
    const hasIntegration = selectedProductInfo.hasIntegration;
    
    // For ClearCare Pro (self-paced implementation)
    if (tierInfo.package === 'ClearCare Pro') {
      let tasks: Task[] = [];
      
      // Initiation & Planning Phase - just optional setup assistance
      tasks.push({
        id: 'optional-setup',
        name: 'Optional ClearCompany Setup Assistance',
        phase: 'Initiation & Planning',
        start: 0,
        duration: 2,
        color: colors.primaryDark,
        isSelfPaced: false
      });
      
      // Execution Phase - all modules with implementation, setup, learning, testing
      const moduleTypes = ['Recruiting', 'Onboarding', 'LMS', 'Performance/Goals/Engagement', 'Compensation Management'];
      
      for (const moduleType of moduleTypes) {
        // Only include modules that are part of the selected product
        if (modules.includes(moduleType)) {
          tasks.push({
            id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-implementation`,
            name: `${moduleType} Implementation`,
            phase: 'Execution',
            start: 0,
            duration: 1,
            color: colors.primaryDark,
            isSelfPaced: true,
            selfPacedLabel: 'Variable - Client Self-Paced'
          });
          
          // Add sub-tasks
          tasks.push({
            id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-setup`,
            name: 'Setup',
            phase: 'Execution',
            start: 0,
            duration: 1,
            color: colors.secondaryAlt,
            isSelfPaced: true,
            selfPacedLabel: 'Variable - Client Self-Paced'
          });
          
          tasks.push({
            id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-learning`,
            name: 'Learning',
            phase: 'Execution',
            start: 0,
            duration: 1,
            color: colors.secondaryDark,
            isSelfPaced: true,
            selfPacedLabel: 'Variable - Client Self-Paced'
          });
          
          tasks.push({
            id: `${moduleType.toLowerCase().replace(/[^a-z0-9]/g, '-')}-testing`,
            name: 'Testing',
            phase: 'Execution',
            start: 0,
            duration: 1,
            color: colors.primaryLight,
            isSelfPaced: true,
            selfPacedLabel: 'Variable - Client Self-Paced'
          });
        }
      }
      
      // Launch Phase - just Go Live
      tasks.push({
        id: 'golive',
        name: 'Go Live',
        phase: 'Launch',
        start: 0,
        duration: 1,
        color: colors.secondaryAlt,
        isSelfPaced: true,
        selfPacedLabel: 'Variable - Client Self-Paced'
      });
      
      return tasks;
    }
    
    // For ClearCare Advanced and Max
    let tasks: Task[] = [];
    let currentWeek = 0;
    
    // Calculate proportional durations based on service tier
    let moduleDuration = tierInfo.weeksPerModule;
    
    // Calculate proportional task durations based on the module duration
    let setupDuration = Math.max(1, Math.round(moduleDuration * 0.3)); // 30% of module duration
    let learningDuration = Math.max(1, Math.round(moduleDuration * 0.4)); // 40% of module duration
    let testingDuration = Math.max(1, Math.round(moduleDuration * 0.5)); // 50% of module duration
    let integrationDuration = Math.max(1, Math.round(moduleDuration * 0.6)); // 60% of module duration
    let dataImportDuration = Math.max(1, Math.round(moduleDuration * 0.5)); // 50% of module duration
    let rolloutTrainingDuration = Math.max(1, Math.round(moduleDuration * 0.3)); // 30% of module duration
    let goLiveDuration = 1; // Always 1 week
    
    // Initiation & Planning Phase
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
    
    // Execution Phase - add modules from the selected product
    for (let i = 0; i < modules.length; i++) {
      const moduleName = modules[i];
      
      // Start the next module 1 week before the previous module ends (overlap)
      if (i > 0) {
        currentWeek -= 1;
      }
      
      // Module implementation
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-implementation`,
        name: `${moduleName} Implementation`,
        phase: 'Execution',
        start: currentWeek,
        duration: moduleDuration,
        color: colors.primaryDark,
        originalDuration: moduleDuration,
        originalStart: currentWeek
      });
      
      // Module setup
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-setup`,
        name: 'Setup',
        phase: 'Execution',
        start: currentWeek,
        duration: setupDuration,
        color: colors.secondaryAlt,
        originalDuration: setupDuration,
        originalStart: currentWeek
      });
      
      // Module learning (covers most of module duration)
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-learning`,
        name: 'Learning',
        phase: 'Execution',
        start: currentWeek,
        duration: Math.max(1, Math.ceil(moduleDuration * 0.7)), // 70% of module duration
        color: colors.secondaryDark,
        originalDuration: Math.max(1, Math.ceil(moduleDuration * 0.7)),
        originalStart: currentWeek
      });
      
      // Module testing (overlaps learning by 1 week, fills rest of module)
      const testingStart = currentWeek + Math.max(1, Math.ceil(moduleDuration * 0.7)) - 1; // Overlap by 1 week
      const testingDuration = moduleDuration - (testingStart - currentWeek);
      tasks.push({
        id: `${moduleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-testing`,
        name: 'Testing',
        phase: 'Execution',
        start: testingStart,
        duration: Math.max(1, testingDuration),
        color: colors.primaryLight,
        originalDuration: Math.max(1, testingDuration),
        originalStart: testingStart
      });
      
      // Add historical data import for Recruiting module only
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
        
        // Add integration for ClearRecruit (ATS Only) only
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
      
      // Add integration for Onboarding module only
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
      
      // Move to next module
      currentWeek += moduleDuration;
    }
    
    // Launch Phase
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

  // Update tasks when configuration changes
  useEffect(() => {
    setTasks(generateTimeline());
  }, [generateTimeline]);

  // Calculate total weeks
  const totalWeeks = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.max(...tasks.map(task => task.start + task.duration));
  }, [tasks]);



  // Reset customizations
  const resetCustomizations = useCallback(() => {
    setTasks(generateTimeline());
  }, [generateTimeline]);

  // Export PDF
  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  // Generate week headers
  const weekHeaders = useMemo(() => {
    const weeks = [];
    for (let i = 1; i <= Math.max(25, totalWeeks); i++) {
      weeks.push(`Week ${i}`);
    }
    return weeks;
  }, [totalWeeks]);

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const phases: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!phases[task.phase]) {
        phases[task.phase] = [];
      }
      phases[task.phase].push(task);
    });
    return phases;
  }, [tasks]);



  const calculateEndDate = useCallback(() => {
    const startDate = new Date(2024, 0, 15); // Jan 15, 2024
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (totalWeeks * 7));
    return endDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }, [totalWeeks]);

  // Calculate the format for displaying total weeks
  const totalWeeksDisplay = useMemo(() => {
    if (tierInfo.package === 'ClearCare Pro') {
      return 'Client Self Paced';
    }
    return Math.ceil(totalWeeks);
  }, [totalWeeks, tierInfo.package]);

  return (
    <div className="space-y-8">
      {/* ClearCompany Logo centered at the top */}
      <div className="flex justify-center w-full mb-6">
        <img 
          src={clearCompanyLogo} 
          alt="ClearCompany Logo" 
          className="h-16 object-contain"
        />
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: colors.primary }}>
              Implementation Project Configuration
            </CardTitle>
            <Button onClick={exportPDF} className="no-print" style={{ backgroundColor: colors.primary }}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="employee-count">
                Employee Count: {employeeCount >= 4500 ? '4,500+' : employeeCount.toLocaleString()}
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="employee-count"
                  type="number"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-24"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Customer Tier</Label>
                <div className="text-lg font-semibold mt-1">{tierInfo.customerTier}</div>
              </div>
              <div>
                <Label>Package</Label>
                <div className="text-lg font-semibold mt-1">{tierInfo.package}</div>
              </div>
            </div>

            <div>
              <Label>Product Selection</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {Object.keys(productMixes).map(product => (
                  <div
                    key={product}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProduct === product
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
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
                        className="mr-3"
                      />
                      <span className="font-medium">{product}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Selected Product Modules</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {productMixes[selectedProduct as keyof typeof productMixes]?.modules.map(module => (
                  <span
                    key={module}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Estimated Duration Per Module</div>
                <div className="text-lg font-semibold">{tierInfo.weeksPerModule} weeks</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Modules</div>
                <div className="text-lg font-semibold">{productMixes[selectedProduct as keyof typeof productMixes]?.moduleCount || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Estimated Total</div>
                <div className="text-lg font-semibold">
                  {typeof totalWeeksDisplay === 'string' ? totalWeeksDisplay : `${totalWeeksDisplay} weeks`}
                </div>
              </div>
              <div>
                <Label htmlFor="start-date" className="text-sm text-gray-600">Estimated Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-semibold mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
              <div>
                <div className="text-sm text-gray-600">Estimated End Date</div>
                <div className="text-lg font-semibold">
                  {tierInfo.package === 'ClearCare Pro' ? 
                    "Client Self Paced" :
                    estimatedStartDate && typeof totalWeeksDisplay === 'number' ? 
                      (() => {
                        const endDate = new Date(estimatedStartDate);
                        endDate.setDate(endDate.getDate() + (totalWeeksDisplay * 7));
                        return format(endDate, "MMM dd, yyyy");
                      })() : 
                      "Select start date"
                  }
                </div>
              </div>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="gantt-container" ref={ganttContainerRef}>
        <CardHeader style={{ backgroundColor: colors.primary, color: 'white' }}>
          <CardTitle>ClearCo Implementation Gantt Chart for {companyName || 'Company Name'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">


          {/* Tasks by Phase */}
          {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
            <div key={phase}>
              {/* Phase Header */}
              <div 
                className="text-white p-3 font-semibold"
                style={{
                  backgroundColor: phase === 'Initiation & Planning' 
                    ? colors.primaryDark
                    : phase === 'Execution'
                    ? colors.primary
                    : phase === 'Launch'
                    ? colors.secondaryAlt
                    : colors.secondaryAlt
                }}
              >
                {phase}
              </div>

              {/* Phase Tasks */}
              {phaseTasks.map((task) => (
                <div key={task.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                  {/* Task Name */}
                  <div className="w-64 p-3 border-r border-gray-200 text-sm">
                    <div className="font-medium">{task.name}</div>
                  </div>

                  {/* Task Bar */}
                  <div className="flex-1 relative p-2" style={{ minHeight: '40px' }}>
                    {task.isSelfPaced ? (
                      // Self-paced bar (full width)
                      <div
                        className="h-6 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: task.color, width: '100%' }}
                      >
                        Self-Paced
                      </div>
                    ) : (
                      // Regular draggable bar
                      <div
                        className="gantt-bar h-6 rounded relative flex items-center justify-center text-white text-xs font-medium"
                        style={{
                          backgroundColor: task.color,
                          left: `${(task.start / Math.max(30, totalWeeks * 1.2)) * 100}%`,
                          width: `${Math.max(2, (task.duration / Math.max(30, totalWeeks * 1.2)) * 100)}%`,
                          minWidth: '25px',
                          fontSize: task.duration < 3 ? '10px' : '12px'
                        }}
                      >
                        {/* Task duration text */}
                        <span className="select-none">
                          {task.duration === 1 ? '1 wk' : `${task.duration} wks`}
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