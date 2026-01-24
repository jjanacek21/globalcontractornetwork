import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Users, 
  MessageCircle, 
  Image, 
  Bell, 
  Home,
  Trophy,
  Briefcase
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

const SocialComingSoon = () => {
  const navigate = useNavigate();

  const upcomingFeatures = [
    { icon: Users, text: "Network with verified contractors" },
    { icon: MessageCircle, text: "Direct messaging & group chats" },
    { icon: Image, text: "Share project photos & wins" },
    { icon: Bell, text: "Industry news & updates" },
    { icon: Trophy, text: "Leaderboards & achievements" },
    { icon: Briefcase, text: "Find subcontractors & partners" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-2">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg">
              <img src={gcnLogo} alt="GCN" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Contractor Social Hub
          </CardTitle>
          <div className="flex justify-center mt-3">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          {/* Rocket Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <Rocket className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          
          {/* Description */}
          <p className="text-center text-muted-foreground leading-relaxed">
            We're building something amazing! The Contractor Social Hub will let you 
            connect with fellow contractors, share project updates, and grow your professional network.
          </p>
          
          {/* Feature Preview List */}
          <div className="bg-muted/50 rounded-xl p-5 space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              What's Coming
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={() => navigate('/member/dashboard')} 
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              We'll notify you when the Social Hub launches!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialComingSoon;
