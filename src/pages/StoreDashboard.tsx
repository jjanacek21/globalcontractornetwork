import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Award, Gift, ShoppingBag, LogOut, ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StoreMember {
  id: string;
  points_balance: number;
  total_points_earned: number;
  created_at: string;
}

interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function StoreDashboard() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<StoreMember | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/store/auth");
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("store_members")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (memberError || !memberData) {
        toast({
          title: "Not a member",
          description: "Please sign up for the rewards program",
          variant: "destructive",
        });
        navigate("/store/auth");
        return;
      }

      setMember(memberData);

      const { data: transactionsData } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("member_id", memberData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (transactionsData) {
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error("Error loading member data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingBag className="h-4 w-4" />;
      case "welcome_bonus":
      case "reward":
        return <Gift className="h-4 w-4" />;
      case "referral":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "redemption":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Rewards Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Points Balance Card */}
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Your Points Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-5xl font-bold text-primary">{member.points_balance}</p>
                  <p className="text-sm text-muted-foreground mt-1">Available Points</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Earned</p>
                    <p className="font-semibold">{member.total_points_earned} points</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-muted-foreground">Exchange Rate</p>
                    <p className="font-semibold">$1 = 10 points</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Browse Store
                </CardTitle>
                <CardDescription>Check out our latest merchandise</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/store")}
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Earn More Points
                </CardTitle>
                <CardDescription>Ways to increase your balance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Make purchases ($1 = 10 pts)</li>
                  <li>• Refer friends (coming soon)</li>
                  <li>• Special promotions</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your points transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Start shopping to earn points!
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-primary/10 ${getTransactionColor(transaction.transaction_type)}`}>
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description || transaction.transaction_type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.points > 0 ? 'text-primary' : 'text-destructive'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
