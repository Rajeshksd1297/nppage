import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

interface DashboardWelcomeProps {
  userName: string | null;
  subscriptionPlan: string;
  isPro: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
}

export function DashboardWelcome({ 
  userName, 
  subscriptionPlan, 
  isPro, 
  isOnTrial, 
  trialDaysLeft 
}: DashboardWelcomeProps) {
  const { theme, setTheme } = useTheme();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {userName || "Author"}! 👋
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={isPro ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {isPro && <Crown className="h-3 w-3" />}
                  {subscriptionPlan}
                </Badge>
                {isOnTrial && (
                  <Badge variant="outline" className="text-xs">
                    Trial: {trialDaysLeft} days left
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="gap-2"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}