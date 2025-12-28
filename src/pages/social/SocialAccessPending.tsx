import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, Home, RefreshCw, UserPlus } from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

const SocialAccessPending = () => {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'no_profile'>('pending');
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we were redirected with no_profile reason
    const state = location.state as { reason?: string } | null;
    if (state?.reason === "no_profile") {
      setStatus("no_profile");
    } else {
      checkStatus();
    }
  }, [location.state]);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/contractor/auth");
      return;
    }

    const { data } = await supabase
      .from("contractor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      navigate("/join-network");
      return;
    }

    setProfile(data);

    if (data.verification_status === 'approved' && data.social_access_approved) {
      navigate("/social/feed");
    } else if (data.verification_status === 'rejected') {
      setStatus('rejected');
    } else {
      setStatus('pending');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img src={gcnLogo} alt="GCN" className="h-16 w-16 mx-auto rounded-xl mb-4" />
          <CardTitle className="text-2xl">Contractor Social Hub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'pending' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Access Pending</h3>
                <p className="text-muted-foreground mt-2">
                  Your contractor profile is being reviewed. Once approved, you'll have full access to the Contractor Social Hub.
                </p>
              </div>
              {profile && (
                <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-1">
                  <p><strong>Company:</strong> {profile.company_name}</p>
                  <p><strong>Trade:</strong> {profile.category}</p>
                  <p><strong>Status:</strong> {profile.verification_status || 'pending'}</p>
                </div>
              )}
            </div>
          )}

          {status === 'rejected' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Access Denied</h3>
                <p className="text-muted-foreground mt-2">
                  Unfortunately, your application was not approved. Please contact support for more information.
                </p>
              </div>
            </div>
          )}

          {status === 'no_profile' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Contractor Profile Required</h3>
                <p className="text-muted-foreground mt-2">
                  You need a contractor profile to access the Social Hub. Join the network to connect with other contractors!
                </p>
              </div>
              <Button onClick={() => navigate("/join-network")} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Become a Contractor
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/member/dashboard")}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={checkStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialAccessPending;
