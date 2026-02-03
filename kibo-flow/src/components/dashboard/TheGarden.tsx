import * as React from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DailyActivity {
  date: string;
  xp: number;
  problems: number;
  applications: number;
  assessments: number;
}

interface TheGardenProps {
  userId: string;
  activities?: DailyActivity[];
}

interface DayData {
  date: string;
  intensity: number;
  xp: number;
  problems: number;
  applications: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Fixed dimensions for consistent layout
const CELL_SIZE = 12; // 12px squares
const CELL_GAP = 3;
const DAY_LABEL_WIDTH = 32;
const WEEKS_COUNT = 53; // ~365 days

// Calculate fixed width for the heatmap grid
const GRID_WIDTH = WEEKS_COUNT * (CELL_SIZE + CELL_GAP) - CELL_GAP;
const TOTAL_WIDTH = DAY_LABEL_WIDTH + 8 + GRID_WIDTH; // 8px gap

function getIntensityLevel(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 15) return 1;
  if (xp < 40) return 2;
  if (xp < 80) return 3;
  return 4;
}

export const TheGarden: React.FC<TheGardenProps> = ({ userId, activities: propActivities }) => {
  const [activityData, setActivityData] = React.useState<DayData[]>([]);
  const [totalXP, setTotalXP] = React.useState(0);
  const [activeDays, setActiveDays] = React.useState(0);

  React.useEffect(() => {
    const processActivities = () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 364);

      const activityMap = new Map<string, DailyActivity>();
      let xpTotal = 0;
      let daysActive = 0;

      if (propActivities) {
        propActivities.forEach((activity) => {
          activityMap.set(activity.date, activity);
          xpTotal += activity.xp;
          if (activity.xp > 0) daysActive++;
        });
      }

      setTotalXP(xpTotal);
      setActiveDays(daysActive);

      const days: DayData[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        const dateStr = current.toISOString().split("T")[0];
        const activity = activityMap.get(dateStr);
        const xp = activity?.xp || 0;
        
        days.push({ 
          date: dateStr, 
          intensity: getIntensityLevel(xp),
          xp,
          problems: activity?.problems || 0,
          applications: activity?.applications || 0,
        });
        current.setDate(current.getDate() + 1);
      }

      setActivityData(days);
    };

    processActivities();
  }, [propActivities]);

  React.useEffect(() => {
    if (!propActivities && userId) {
      const fetchActivities = async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 364);

        const { data } = await supabase
          .from("daily_activities")
          .select("activity_date, xp_earned, problems_solved, applications_sent, assessments_completed")
          .eq("user_id", userId)
          .gte("activity_date", startDate.toISOString().split("T")[0])
          .lte("activity_date", endDate.toISOString().split("T")[0]);

        if (data) {
          const activities: DailyActivity[] = data.map(d => ({
            date: d.activity_date,
            xp: d.xp_earned,
            problems: d.problems_solved,
            applications: d.applications_sent,
            assessments: d.assessments_completed,
          }));

          const activityMap = new Map<string, DailyActivity>();
          let xpTotal = 0;
          let daysActive = 0;

          activities.forEach((activity) => {
            activityMap.set(activity.date, activity);
            xpTotal += activity.xp;
            if (activity.xp > 0) daysActive++;
          });

          setTotalXP(xpTotal);
          setActiveDays(daysActive);

          const days: DayData[] = [];
          const current = new Date(startDate);

          while (current <= endDate) {
            const dateStr = current.toISOString().split("T")[0];
            const activity = activityMap.get(dateStr);
            const xp = activity?.xp || 0;
            
            days.push({ 
              date: dateStr, 
              intensity: getIntensityLevel(xp),
              xp,
              problems: activity?.problems || 0,
              applications: activity?.applications || 0,
            });
            current.setDate(current.getDate() + 1);
          }

          setActivityData(days);
        }
      };

      fetchActivities();
    }
  }, [userId, propActivities]);

  // Group by weeks (columns)
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  if (activityData.length > 0) {
    const firstDay = new Date(activityData[0].date).getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", intensity: -1, xp: 0, problems: 0, applications: 0 });
    }
  }

  activityData.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 4: return "bg-emerald-500";
      case 3: return "bg-emerald-400";
      case 2: return "bg-emerald-300";
      case 1: return "bg-emerald-200";
      case 0: return "bg-muted";
      default: return "bg-transparent";
    }
  };

  // Get month labels with pixel positions
  const monthLabels: { label: string; left: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstValidDay = week.find(d => d.intensity >= 0);
    if (firstValidDay && firstValidDay.date) {
      const month = new Date(firstValidDay.date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ 
          label: MONTHS[month], 
          left: weekIndex * (CELL_SIZE + CELL_GAP) 
        });
        lastMonth = month;
      }
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 shadow-sm"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">The Garden</h2>
          <p className="text-sm text-muted-foreground">
            {activeDays} active days • {totalXP.toLocaleString()} XP earned this year
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-3 w-3 rounded-[3px]",
                  getIntensityColor(level)
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Scrollable container */}
      <ScrollArea className="w-full">
        <div style={{ width: TOTAL_WIDTH, minWidth: TOTAL_WIDTH }}>
          {/* Month labels row */}
          <div className="flex mb-2" style={{ height: 16 }}>
            <div style={{ width: DAY_LABEL_WIDTH, flexShrink: 0 }} />
            <div className="relative flex-1" style={{ marginLeft: 8 }}>
              {monthLabels.map((m, i) => (
                <span
                  key={`${m.label}-${i}`}
                  className="absolute text-[10px] font-medium text-muted-foreground whitespace-nowrap"
                  style={{ left: m.left }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid row */}
          <div className="flex" style={{ gap: 8 }}>
            {/* Day labels column */}
            <div 
              className="flex flex-col flex-shrink-0"
              style={{ width: DAY_LABEL_WIDTH, gap: CELL_GAP }}
            >
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    "text-[10px] font-medium text-muted-foreground flex items-center",
                    i % 2 === 0 ? "opacity-0" : ""
                  )}
                  style={{ height: CELL_SIZE }}
                >
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            <div className="flex" style={{ gap: CELL_GAP }}>
              {weeks.map((week, weekIndex) => (
                <div 
                  key={weekIndex} 
                  className="flex flex-col"
                  style={{ gap: CELL_GAP }}
                >
                  {week.map((day, dayIndex) => {
                    const formattedDate = day.date 
                      ? new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '';
                    
                    return (
                      <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                delay: 0.3 + weekIndex * 0.002,
                                duration: 0.15,
                                type: "spring",
                                stiffness: 400,
                              }}
                              className={cn(
                                "rounded-[3px] transition-colors",
                                day.intensity >= 0 ? getIntensityColor(day.intensity) : "bg-transparent",
                                day.intensity >= 0 && "hover:ring-1 hover:ring-primary/50 cursor-pointer"
                              )}
                              style={{ 
                                width: CELL_SIZE, 
                                height: CELL_SIZE,
                                minWidth: CELL_SIZE,
                                minHeight: CELL_SIZE
                              }}
                            />
                          </TooltipTrigger>
                          {day.intensity >= 0 && day.date && (
                            <TooltipContent side="top" className="text-xs">
                              <div className="font-medium">{formattedDate}</div>
                              {day.xp > 0 ? (
                                <div className="text-muted-foreground">
                                  {day.xp} XP • {day.problems} problems • {day.applications} apps
                                </div>
                              ) : (
                                <div className="text-muted-foreground">No activity</div>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </motion.div>
  );
};
