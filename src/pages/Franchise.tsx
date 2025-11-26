import { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Rocket } from "lucide-react";

export default function Franchise() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real app, you'd save this to a database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Thanks for your interest!",
      description: "We'll notify you when franchise opportunities become available.",
    });
    
    setEmail("");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Rocket className="h-24 w-24 text-primary mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl font-bold mb-6">Franchise Opportunities</h1>
          <p className="text-xl text-muted-foreground mb-12">
            We're building something special. Be the first to know when franchise opportunities become available.
          </p>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Notified</CardTitle>
              <CardDescription>
                Leave your email and we'll reach out when we're ready to expand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-left">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Notify Me"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Proven System</h3>
              <p className="text-muted-foreground">
                Leverage our tested business model and processes
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Full Support</h3>
              <p className="text-muted-foreground">
                Comprehensive training and ongoing assistance
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Growing Market</h3>
              <p className="text-muted-foreground">
                Tap into the booming construction industry
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
