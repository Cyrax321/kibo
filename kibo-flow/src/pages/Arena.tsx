import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Code2, Play, Send, ChevronRight, Clock, CheckCircle2, XCircle, Tag, Building2, Gamepad2, FileCode2, History, Trophy, Target, BarChart3 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import CodePlayground from "@/components/arena/CodePlayground";
import { SubmissionHistory } from "@/components/arena/SubmissionHistory";
import { SubmissionHistoryFull } from "@/components/arena/SubmissionHistoryFull";
import { CodeLabStats } from "@/components/arena/CodeLabStats";
import { executeCode, runTestCases } from "@/lib/pistonExecutor";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  company_tags: string[];
  topic_tags: string[];
  starter_code: Record<string, string>;
  sample_cases: { input: string; output: string }[];
  test_cases: { input: string; output: string }[];
  constraints: string | null;
  editorial_content: string | null;
}

// Sample problems for demo
const DEMO_PROBLEMS: Problem[] = [
  {
    id: "demo-1",
    title: "Two Sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Input Format:**
First line: space-separated integers (the array)
Second line: target integer

**Output Format:**
Two space-separated indices

**Example 1:**
\`\`\`
Input:
2 7 11 15
9
Output: 0 1
\`\`\`

**Example 2:**
\`\`\`
Input:
3 2 4
6
Output: 1 2
\`\`\``,
    difficulty: "easy",
    company_tags: ["Google", "Amazon", "Meta"],
    topic_tags: ["Array", "Hash Table"],
    starter_code: {
      javascript: `// Read input from stdin
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

let lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  const nums = lines[0].split(' ').map(Number);
  const target = parseInt(lines[1]);
  
  // Your solution here
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        console.log(i, j);
        return;
      }
    }
  }
});`,
      python: `# Read input
nums = list(map(int, input().split()))
target = int(input())

# Your solution here
for i in range(len(nums)):
    for j in range(i + 1, len(nums)):
        if nums[i] + nums[j] == target:
            print(i, j)
            break
    else:
        continue
    break`,
    },
    sample_cases: [
      { input: "2 7 11 15\n9", output: "0 1" },
      { input: "3 2 4\n6", output: "1 2" },
    ],
    test_cases: [
      { input: "2 7 11 15\n9", output: "0 1" },
      { input: "3 2 4\n6", output: "1 2" },
      { input: "3 3\n6", output: "0 1" },
    ],
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
    editorial_content: null,
  },
  {
    id: "demo-2",
    title: "Valid Parentheses",
    description: `Given a string \`s\` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Input Format:**
A single line containing the string

**Output Format:**
"true" or "false"

**Example 1:**
\`\`\`
Input: ()
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: ()[]{}
Output: true
\`\`\`

**Example 3:**
\`\`\`
Input: (]
Output: false
\`\`\``,
    difficulty: "easy",
    company_tags: ["Amazon", "Microsoft", "Apple"],
    topic_tags: ["String", "Stack"],
    starter_code: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (s) => {
  // Your solution here
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if ('({['.includes(char)) {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) {
        console.log('false');
        return;
      }
    }
  }
  console.log(stack.length === 0 ? 'true' : 'false');
});`,
      python: `s = input()

# Your solution here
stack = []
mapping = {')': '(', '}': '{', ']': '['}

for char in s:
    if char in '({[':
        stack.append(char)
    else:
        if not stack or stack.pop() != mapping[char]:
            print('false')
            exit()

print('true' if not stack else 'false')`,
    },
    sample_cases: [
      { input: "()", output: "true" },
      { input: "()[]{}", output: "true" },
      { input: "(]", output: "false" },
    ],
    test_cases: [
      { input: "()", output: "true" },
      { input: "()[]{}", output: "true" },
      { input: "(]", output: "false" },
      { input: "([)]", output: "false" },
      { input: "{[]}", output: "true" },
    ],
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    editorial_content: null,
  },
  {
    id: "demo-3",
    title: "FizzBuzz",
    description: `Given an integer \`n\`, return a list where for each number from 1 to n:
- If divisible by 3, output "Fizz"
- If divisible by 5, output "Buzz"
- If divisible by both 3 and 5, output "FizzBuzz"
- Otherwise, output the number

**Input Format:**
A single integer n

**Output Format:**
n lines, each containing the FizzBuzz result

**Example:**
\`\`\`
Input: 5
Output:
1
2
Fizz
4
Buzz
\`\`\``,
    difficulty: "easy",
    company_tags: ["Amazon", "Apple", "Bloomberg"],
    topic_tags: ["Math", "String"],
    starter_code: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (line) => {
  const n = parseInt(line);
  
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) console.log('FizzBuzz');
    else if (i % 3 === 0) console.log('Fizz');
    else if (i % 5 === 0) console.log('Buzz');
    else console.log(i);
  }
});`,
      python: `n = int(input())

for i in range(1, n + 1):
    if i % 15 == 0:
        print('FizzBuzz')
    elif i % 3 == 0:
        print('Fizz')
    elif i % 5 == 0:
        print('Buzz')
    else:
        print(i)`,
    },
    sample_cases: [
      { input: "5", output: "1\n2\nFizz\n4\nBuzz" },
      { input: "3", output: "1\n2\nFizz" },
    ],
    test_cases: [
      { input: "5", output: "1\n2\nFizz\n4\nBuzz" },
      { input: "3", output: "1\n2\nFizz" },
      { input: "15", output: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" },
    ],
    constraints: "1 <= n <= 10^4",
    editorial_content: null,
  },
  {
    id: "demo-4",
    title: "Maximum Subarray",
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.

**Input Format:**
Space-separated integers

**Output Format:**
A single integer (the maximum sum)

**Example 1:**
\`\`\`
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

**Example 2:**
\`\`\`
Input: 1
Output: 1
\`\`\``,
    difficulty: "medium",
    company_tags: ["Google", "Microsoft", "LinkedIn"],
    topic_tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    starter_code: {
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (line) => {
  const nums = line.split(' ').map(Number);
  
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  console.log(maxSum);
});`,
      python: `nums = list(map(int, input().split()))

max_sum = current_sum = nums[0]

for num in nums[1:]:
    current_sum = max(num, current_sum + num)
    max_sum = max(max_sum, current_sum)

print(max_sum)`,
    },
    sample_cases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", output: "6" },
      { input: "1", output: "1" },
    ],
    test_cases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", output: "6" },
      { input: "1", output: "1" },
      { input: "5 4 -1 7 8", output: "23" },
    ],
    constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
    editorial_content: null,
  },
];

interface ProblemCardProps {
  problem: Problem;
  onClick: () => void;
  attemptCount?: number;
  bestStatus?: string;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onClick, attemptCount = 0, bestStatus }) => {
  const difficultyColor = {
    easy: "text-success bg-success/10",
    medium: "text-warning bg-warning/10",
    hard: "text-destructive bg-destructive/10",
  }[problem.difficulty];

  const isSolved = bestStatus === "accepted";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className={cn(
        "p-4 hover:shadow-md transition-shadow",
        isSolved && "border-success/50 bg-success/5"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isSolved && <CheckCircle2 className="h-4 w-4 text-success" />}
              <h3 className="font-semibold text-foreground">{problem.title}</h3>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {problem.topic_tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {problem.company_tags.slice(0, 2).join(", ")}
            </div>
            {attemptCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {attemptCount} attempt{attemptCount !== 1 ? "s" : ""}
                </Badge>
                {isSolved && (
                  <Badge variant="default" className="text-xs bg-success">
                    Solved
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Badge className={cn("text-xs capitalize", difficultyColor)}>
            {problem.difficulty}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
};

const Arena: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [user, setUser] = React.useState<any>(null);
  const [problems] = React.useState<Problem[]>(DEMO_PROBLEMS);
  const [selectedProblem, setSelectedProblem] = React.useState<Problem | null>(null);
  const [code, setCode] = React.useState("");
  const [language, setLanguage] = React.useState("javascript");
  const [consoleOutput, setConsoleOutput] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("description");
  const [mainTab, setMainTab] = React.useState("problems");
  
  // Problem attempt tracking
  const [problemAttempts, setProblemAttempts] = React.useState<Record<string, { count: number; bestStatus: string }>>({});

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      fetchProblemAttempts(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  // Fetch attempt counts for each problem
  const fetchProblemAttempts = async (userId: string) => {
    const { data: submissions } = await supabase
      .from("submissions")
      .select("problem_id, status")
      .eq("user_id", userId);

    if (submissions) {
      const attempts: Record<string, { count: number; bestStatus: string }> = {};
      submissions.forEach((sub) => {
        if (!attempts[sub.problem_id]) {
          attempts[sub.problem_id] = { count: 0, bestStatus: "" };
        }
        attempts[sub.problem_id].count++;
        if (sub.status === "accepted") {
          attempts[sub.problem_id].bestStatus = "accepted";
        } else if (!attempts[sub.problem_id].bestStatus) {
          attempts[sub.problem_id].bestStatus = sub.status;
        }
      });
      setProblemAttempts(attempts);
    }
  };

  // Realtime subscription for attempts
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`problem-attempts:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProblemAttempts(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  React.useEffect(() => {
    const problemId = searchParams.get("problem");
    if (problemId) {
      const problem = problems.find(p => p.id === problemId);
      if (problem) {
        setSelectedProblem(problem);
        setCode(problem.starter_code[language] || "");
      }
    }
  }, [searchParams, problems, language]);

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setSearchParams({ problem: problem.id });
    setCode(problem.starter_code[language] || "");
    setConsoleOutput([]);
    setActiveTab("description");
  };

  const handleRunCode = async () => {
    if (!selectedProblem) return;
    setIsRunning(true);
    setConsoleOutput(["⏳ Running sample test cases with Piston API..."]);

    try {
      const { results, allPassed, runtime } = await runTestCases(
        code,
        language,
        selectedProblem.sample_cases
      );

      const output: string[] = [
        `Executed in ${runtime}ms`,
        "",
      ];

      results.forEach((result, i) => {
        if (result.passed) {
          output.push(`✅ Sample Case ${i + 1}: Passed`);
          output.push(`   Input: ${result.input}`);
          output.push(`   Output: ${result.actual}`);
        } else {
          output.push(`❌ Sample Case ${i + 1}: Failed`);
          output.push(`   Input: ${result.input}`);
          output.push(`   Expected: ${result.expected}`);
          output.push(`   Got: ${result.actual || result.error || "No output"}`);
        }
        output.push("");
      });

      if (allPassed) {
        output.push("🎯 All sample cases passed! Try submitting.");
      } else {
        output.push("⚠️ Some sample cases failed. Review your solution.");
      }

      setConsoleOutput(output);
    } catch (error: any) {
      setConsoleOutput([`❌ Error: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setIsRunning(true);
    setConsoleOutput(["⏳ Submitting solution...", "Running against all test cases..."]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please log in to submit", variant: "destructive" });
        setIsRunning(false);
        return;
      }

      const { results, allPassed, runtime } = await runTestCases(
        code,
        language,
        selectedProblem.test_cases
      );

      const output: string[] = [];
      let passedCount = 0;

      results.forEach((result, i) => {
        if (result.passed) {
          passedCount++;
          output.push(`✅ Test Case ${i + 1}: Passed`);
        } else {
          output.push(`❌ Test Case ${i + 1}: Failed`);
          output.push(`   Input: ${result.input}`);
          output.push(`   Expected: ${result.expected}`);
          output.push(`   Got: ${result.actual || result.error || "No output"}`);
        }
      });

      output.unshift(`Results: ${passedCount}/${results.length} passed (${runtime}ms)`, "");

      // Save submission to database
      const submissionStatus = allPassed ? "accepted" : "wrong_answer";
      const { error: submissionError } = await supabase.from("submissions").insert([{
        user_id: session.user.id,
        problem_id: selectedProblem.id,
        code,
        language,
        status: submissionStatus,
        runtime_ms: runtime,
        test_results: results as any,
      }]);

      if (submissionError) {
        console.error("Failed to save submission:", submissionError);
      }

      if (allPassed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8b5cf6", "#10b981"],
        });
        output.push("");
        output.push("🎉 Accepted! All test cases passed.");
        output.push("+100 XP earned");
        
        // Award XP via gamification
        const difficulty = selectedProblem.difficulty as 'easy' | 'medium' | 'hard';
        const { data: xpResult } = await supabase.rpc("record_problem_solved", {
          p_user_id: session.user.id,
          p_difficulty: difficulty,
        });
        
        toast({ title: "🎉 Accepted!", description: `+${xpResult?.[0]?.xp_gained || 100} XP earned` });
      } else {
        output.push("");
        output.push(`❌ Wrong Answer: ${passedCount}/${results.length} test cases passed.`);
        toast({ title: "Wrong Answer", description: "Keep trying!", variant: "destructive" });
      }

      setConsoleOutput(output);
    } catch (error: any) {
      setConsoleOutput([`❌ Error: ${error.message}`]);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  // Problem list view (with tabs)
  if (!selectedProblem) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Code Lab</h1>
              <p className="text-muted-foreground text-sm">Master algorithms and ace your technical interviews</p>
            </div>
          </div>

          {/* Stats */}
          {user?.id && <CodeLabStats userId={user.id} />}

          {/* Tabs */}
          <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="problems" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Problems
              </TabsTrigger>
              <TabsTrigger value="playground" className="gap-2">
                <FileCode2 className="h-4 w-4" />
                Playground
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Problems Tab */}
            <TabsContent value="problems" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {problems.map((problem) => {
                  const attempts = problemAttempts[problem.id];
                  return (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      onClick={() => handleSelectProblem(problem)}
                      attemptCount={attempts?.count || 0}
                      bestStatus={attempts?.bestStatus}
                    />
                  );
                })}
              </div>
            </TabsContent>

            {/* Playground Tab */}
            <TabsContent value="playground" className="h-[calc(100vh-20rem)]">
              <div className="h-full border rounded-xl overflow-hidden">
                <CodePlayground />
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              {user?.id && (
                <SubmissionHistoryFull
                  userId={user.id}
                  onViewCode={(code, lang) => {
                    setCode(code);
                    setLanguage(lang);
                    toast({ title: "Code Loaded", description: "Code has been loaded into memory. Select a problem to use it." });
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // IDE view
  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProblem(null)}>
            Code Lab
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{selectedProblem.title}</span>
          <Badge className={cn(
            "ml-2 text-xs capitalize",
            {
              easy: "text-success bg-success/10",
              medium: "text-warning bg-warning/10",
              hard: "text-destructive bg-destructive/10",
            }[selectedProblem.difficulty]
          )}>
            {selectedProblem.difficulty}
          </Badge>
        </div>

        {/* Main IDE Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Problem Description */}
          <div className="w-1/2 border-r border-border overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full justify-start border-b rounded-none px-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="editorial" disabled={!selectedProblem.editorial_content}>
                  Editorial
                </TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="p-4 prose prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap text-sm text-foreground"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedProblem.description
                      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      .replace(/```([^`]+)```/g, '<pre class="bg-muted p-2 rounded text-xs overflow-x-auto">$1</pre>')
                  }}
                />
                
                {selectedProblem.constraints && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm mb-2">Constraints:</h4>
                    <pre className="text-xs bg-muted p-2 rounded">{selectedProblem.constraints}</pre>
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-2">Companies:</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedProblem.company_tags.map((company) => (
                      <Badge key={company} variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="editorial" className="p-4">
                <p className="text-muted-foreground">Editorial will be unlocked after solving.</p>
              </TabsContent>

              <TabsContent value="submissions" className="p-4">
                <SubmissionHistory 
                  userId={user?.id || ""} 
                  problemId={selectedProblem.id}
                  onViewCode={(code, lang) => {
                    setCode(code);
                    setLanguage(lang);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="w-1/2 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            {/* Console */}
            <div className="h-40 border-t border-border bg-muted/50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
                <span className="text-sm font-medium">Console</span>
              </div>
              <div className="p-4 font-mono text-xs overflow-y-auto h-[calc(100%-2.5rem)]">
                {consoleOutput.map((line, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      line.startsWith("[Pass]") && "text-success",
                      line.startsWith("[Fail]") && "text-destructive"
                    )}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-card">
              <Button variant="outline" onClick={handleRunCode} disabled={isRunning}>
                <Play className="h-4 w-4 mr-2" />
                Run
              </Button>
              <Button onClick={handleSubmit} disabled={isRunning}>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Arena;
