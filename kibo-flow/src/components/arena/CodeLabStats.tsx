import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, Code2, Trophy, Target, Zap, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CodeLabStats {
  totalSubmissions: number;
  acceptedCount: number;
  totalXPEarned: number;
  acceptanceRate: number;
  problemsSolved: number;
  languageBreakdown: Record<string, number>;
}

interface CodeLabStatsProps {
  userId: string;
}

export const CodeLabStats: React.FC<CodeLabStatsProps> = ({ userId }) => {
  const [stats, setStats] = React.useState<CodeLabStats>({
    totalSubmissions: 0,
    acceptedCount: 0,
    totalXPEarned: 0,
    acceptanceRate: 0,
    problemsSolved: 0,
    languageBreakdown: {},
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      try {
        // Fetch all submissions
        const { data: submissions, error } = await supabase
          .from("submissions")
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;

        if (submissions) {
          const totalSubmissions = submissions.length;
          const acceptedSubmissions = submissions.filter(s => s.status === "accepted");
          const acceptedCount = acceptedSubmissions.length;
          
          // Unique problems solved
          const uniqueProblems = new Set(acceptedSubmissions.map(s => s.problem_id));
          const problemsSolved = uniqueProblems.size;
          
          // Calculate XP (estimate based on difficulty - actual comes from profile)
          const totalXPEarned = acceptedCount * 25; // Average XP per problem
          
          // Acceptance rate
          const acceptanceRate = totalSubmissions > 0 
            ? Math.round((acceptedCount / totalSubmissions) * 100)
            : 0;
          
          // Language breakdown
          const languageBreakdown: Record<string, number> = {};
          submissions.forEach(s => {
            languageBreakdown[s.language] = (languageBreakdown[s.language] || 0) + 1;
          });

          setStats({
            totalSubmissions,
            acceptedCount,
            totalXPEarned,
            acceptanceRate,
            problemsSolved,
            languageBreakdown,
          });
        }
      } catch (error) {
        console.error("Error fetching Code Lab stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Realtime subscription for stats updates
    const channel = supabase
      .channel(`codelab-stats:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-12 bg-muted/50 rounded animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Submissions",
      value: stats.totalSubmissions,
      icon: Code2,
      color: "text-primary",
    },
    {
      label: "Accepted",
      value: stats.acceptedCount,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      label: "Problems Solved",
      value: stats.problemsSolved,
      icon: Target,
      color: "text-blue-500",
    },
    {
      label: "Acceptance Rate",
      value: `${stats.acceptanceRate}%`,
      icon: BarChart3,
      color: stats.acceptanceRate >= 50 ? "text-success" : stats.acceptanceRate >= 30 ? "text-warning" : "text-destructive",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Language Breakdown */}
      {Object.keys(stats.languageBreakdown).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Language Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.languageBreakdown).map(([lang, count]) => (
              <Badge key={lang} variant="secondary" className="text-xs">
                {lang}: {count} submission{count !== 1 ? "s" : ""}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
};
