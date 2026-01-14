import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, Upload, Shield, Users, Star, Plus, X, FileText, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import gcnLogo from "@/assets/gcn-logo.jpg";

const STEPS = [
  { id: 1, title: "Company Info", description: "Basic company details" },
  { id: 2, title: "Credentials", description: "Licenses & insurance" },
  { id: 3, title: "References", description: "Client references" },
  { id: 4, title: "Portfolio", description: "Job photos" },
  { id: 5, title: "Account", description: "Admin account" },
];

const SERVICE_CATEGORIES = [
  "Roofing",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Painting",
  "Landscaping",
  "General Contractor",
  "Windows & Doors",
  "Flooring",
  "Kitchen & Bath",
  "Mold Remediation",
  "Water Damage",
  "Fire Restoration",
  "Tree Service",
  "Gutters",
  "Siding",
  "Solar",
  "Pool",
  "Fencing",
  "Concrete",
];

const REVENUE_RANGES = [
  { value: "under-100k", label: "Under $100K" },
  { value: "100k-500k", label: "$100K - $500K" },
  { value: "500k-1m", label: "$500K - $1M" },
  { value: "1m-5m", label: "$1M - $5M" },
  { value: "5m+", label: "$5M+" },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

interface Reference {
  name: string;
  email: string;
  phone: string;
  projectDescription: string;
}

interface JobPhoto {
  file: File | null;
  caption: string;
  projectType: string;
  previewUrl?: string;
}

interface License {
  number: string;
  state: string;
  expiration: string;
  file: File | null;
  fileName?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

const CompanyRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1: Company Info
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "FL",
    zip: "",
    phone: "",
    email: "",
    website: "",
    primaryCategory: "",
    servicesOffered: [] as string[],
    yearsInBusiness: "",
    yearlyRevenue: "",
    description: "",
  });

  // Step 2: Credentials - Multiple Licenses
  const [licenses, setLicenses] = useState<License[]>([
    { number: "", state: "FL", expiration: "", file: null }
  ]);
  
  const [insurance, setInsurance] = useState({
    provider: "",
    policyNumber: "",
    expiration: "",
    file: null as File | null,
    fileName: ""
  });
  
  const [hasCrew, setHasCrew] = useState(false);
  
  const [workersComp, setWorkersComp] = useState({
    provider: "",
    expiration: "",
    file: null as File | null,
    fileName: ""
  });
  
  const [certifications, setCertifications] = useState("");

  // Step 3: References
  const [references, setReferences] = useState<Reference[]>([
    { name: "", email: "", phone: "", projectDescription: "" },
    { name: "", email: "", phone: "", projectDescription: "" },
    { name: "", email: "", phone: "", projectDescription: "" },
  ]);

  // Step 4: Portfolio
  const [jobPhotos, setJobPhotos] = useState<JobPhoto[]>([
    { file: null, caption: "", projectType: "" },
    { file: null, caption: "", projectType: "" },
    { file: null, caption: "", projectType: "" },
    { file: null, caption: "", projectType: "" },
    { file: null, caption: "", projectType: "" },
  ]);

  // Step 5: Account
  const [accountInfo, setAccountInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // License handlers
  const addLicense = () => {
    if (licenses.length < 5) {
      setLicenses([...licenses, { number: "", state: "FL", expiration: "", file: null }]);
    }
  };

  const removeLicense = (index: number) => {
    if (licenses.length > 1) {
      setLicenses(licenses.filter((_, i) => i !== index));
    }
  };

  const updateLicense = (index: number, field: keyof License, value: string | File | null) => {
    setLicenses(prev => {
      const updated = [...prev];
      if (field === 'file' && value instanceof File) {
        updated[index] = { ...updated[index], file: value, fileName: value.name };
      } else if (field !== 'file') {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleCredentialFileUpload = (file: File | null, type: 'license' | 'insurance' | 'workersComp', licenseIndex?: number) => {
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File Too Large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ title: "Invalid File Type", description: "Please upload PDF, JPG, or PNG files only", variant: "destructive" });
      return;
    }
    
    if (type === 'license' && licenseIndex !== undefined) {
      updateLicense(licenseIndex, 'file', file);
    } else if (type === 'insurance') {
      setInsurance(prev => ({ ...prev, file, fileName: file.name }));
    } else if (type === 'workersComp') {
      setWorkersComp(prev => ({ ...prev, file, fileName: file.name }));
    }
  };

  const handleServiceToggle = (service: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }));
  };

  const handleReferenceChange = (index: number, field: keyof Reference, value: string) => {
    setReferences(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePhotoChange = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setJobPhotos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], file, previewUrl };
      return updated;
    });
  };

  const handlePhotoCaptionChange = (index: number, field: 'caption' | 'projectType', value: string) => {
    setJobPhotos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!companyInfo.name || !companyInfo.email || !companyInfo.phone || !companyInfo.primaryCategory) {
          toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        // Insurance is REQUIRED
        if (!insurance.provider || !insurance.expiration) {
          toast({ 
            title: "Insurance Required", 
            description: "Please provide insurance provider and expiration date to register", 
            variant: "destructive" 
          });
          return false;
        }
        // Workers comp is REQUIRED if hasCrew is checked
        if (hasCrew && (!workersComp.provider || !workersComp.expiration)) {
          toast({ 
            title: "Workers Comp Required", 
            description: "Since your company has crew, please provide workers compensation information", 
            variant: "destructive" 
          });
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        if (!accountInfo.firstName || !accountInfo.lastName || !accountInfo.email || !accountInfo.password) {
          toast({ title: "Missing Information", description: "Please fill in all required account fields", variant: "destructive" });
          return false;
        }
        if (accountInfo.password !== accountInfo.confirmPassword) {
          toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
          return false;
        }
        if (accountInfo.password.length < 6) {
          toast({ title: "Weak Password", description: "Password must be at least 6 characters", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const uploadCredentialDocument = async (file: File, userId: string, docType: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${docType}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('company-documents')
      .upload(fileName, file);
    
    if (error) {
      console.error(`Error uploading ${docType}:`, error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('company-documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    
    setLoading(true);
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountInfo.email,
        password: accountInfo.password,
        options: {
          data: {
            first_name: accountInfo.firstName,
            last_name: accountInfo.lastName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user account");

      // Wait for session to be established
      let session = authData.session;
      if (!session) {
        // If session not returned immediately, wait and get it
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
      }

      if (!session) {
        throw new Error("Session not established. Please try logging in after registration.");
      }

      // Verify the session is properly set before database operations
      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (!verifiedUser || verifiedUser.id !== authData.user.id) {
        throw new Error("Authentication verification failed. Please try again.");
      }

      // 2. Upload credential documents
      let insuranceDocUrl: string | null = null;
      let workersCompDocUrl: string | null = null;
      
      if (insurance.file) {
        insuranceDocUrl = await uploadCredentialDocument(insurance.file, authData.user.id, 'insurance');
      }
      
      if (workersComp.file) {
        workersCompDocUrl = await uploadCredentialDocument(workersComp.file, authData.user.id, 'workers-comp');
      }

      // 3. Upload license documents and build licenses array
      const licensesData = [];
      for (const license of licenses) {
        if (license.number) {
          let docUrl: string | null = null;
          if (license.file) {
            docUrl = await uploadCredentialDocument(license.file, authData.user.id, `license-${license.number}`);
          }
          licensesData.push({
            number: license.number,
            state: license.state,
            expiration: license.expiration || null,
            document_url: docUrl
          });
        }
      }

      // 4. Upload job photos
      const uploadedPhotos = [];
      for (const photo of jobPhotos) {
        if (photo.file) {
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `${authData.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('company-photos')
            .upload(fileName, photo.file);

          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('company-photos')
              .getPublicUrl(fileName);
            
            uploadedPhotos.push({
              url: publicUrl,
              caption: photo.caption,
              projectType: photo.projectType
            });
          }
        }
      }

      // 5. Format references
      const formattedReferences = references
        .filter(ref => ref.name && (ref.email || ref.phone))
        .map(ref => ({
          name: ref.name,
          email: ref.email,
          phone: ref.phone,
          projectDescription: ref.projectDescription
        }));

      // 6. Create company record
      const firstLicense = licensesData[0] || null;
      
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: companyInfo.name,
          address: companyInfo.address,
          city: companyInfo.city,
          state: companyInfo.state,
          zip_code: companyInfo.zip,
          phone: companyInfo.phone,
          email: companyInfo.email,
          website: companyInfo.website,
          primary_category: companyInfo.primaryCategory,
          services_offered: companyInfo.servicesOffered,
          years_in_business: companyInfo.yearsInBusiness ? parseInt(companyInfo.yearsInBusiness) : null,
          yearly_revenue_range: companyInfo.yearlyRevenue,
          description: companyInfo.description,
          // Legacy single license fields (from first license)
          license_number: firstLicense?.number || null,
          license_state: firstLicense?.state || null,
          license_expiration: firstLicense?.expiration || null,
          // New multiple licenses field
          licenses: licensesData.length > 0 ? licensesData : [],
          // Insurance
          insurance_provider: insurance.provider || null,
          insurance_policy_number: insurance.policyNumber || null,
          insurance_expiration: insurance.expiration || null,
          insurance_document_url: insuranceDocUrl,
          // Workers Comp
          workers_comp_provider: workersComp.provider || null,
          workers_comp_expiration: workersComp.expiration || null,
          workers_comp_document_url: workersCompDocUrl,
          has_crew: hasCrew,
          // Other fields
          certifications: certifications ? certifications.split(',').map(c => c.trim()) : [],
          client_references: formattedReferences,
          job_photos: uploadedPhotos,
          verification_status: "pending",
          created_by: authData.user.id
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 7. Create company_members record (as company_admin)
      const { error: memberError } = await supabase
        .from("company_members")
        .insert({
          company_id: companyData.id,
          user_id: authData.user.id,
          role: "company_admin",
          is_active: true
        });

      if (memberError) throw memberError;

      // 8. Create company_admins record
      const { error: adminError } = await supabase
        .from("company_admins")
        .insert({
          company_id: companyData.id,
          user_id: authData.user.id,
          is_super_admin: true
        });

      if (adminError) console.error("Failed to create company admin record:", adminError);

      // 9. Notify super admin
      try {
        await supabase.functions.invoke("notify-admin-signup", {
          body: {
            type: "company_registration",
            companyName: companyInfo.name,
            email: accountInfo.email,
            phone: accountInfo.phone,
            category: companyInfo.primaryCategory,
            firstName: accountInfo.firstName,
            lastName: accountInfo.lastName,
            verificationScore: companyData.verification_score
          }
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
      }

      setSuccess(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Company Registration Submitted!</h2>
              <p className="text-muted-foreground">
                Your company has been submitted for verification.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
              <h3 className="font-semibold">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Our team will review your company information and credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>We may contact your references to verify your work</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Once verified, you'll appear in our contractor directory with a verification badge</span>
                </li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              You can access your Company Admin Portal now to set up teams, add users, and manage your profile while awaiting verification.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/">Return Home</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/company/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">Company Registration</span>
            </div>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/join-network">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center ${step.id === currentStep ? 'text-primary' : step.id < currentStep ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 
                  ${step.id === currentStep ? 'border-primary bg-primary text-primary-foreground' : 
                    step.id < currentStep ? 'border-green-600 bg-green-600 text-white' : 
                    'border-muted-foreground'}`}
                >
                  {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select value={companyInfo.state} onValueChange={(v) => setCompanyInfo({ ...companyInfo, state: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={companyInfo.zip}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, zip: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryCategory">Primary Category *</Label>
                    <Select value={companyInfo.primaryCategory} onValueChange={(v) => setCompanyInfo({ ...companyInfo, primaryCategory: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsInBusiness">Years in Business</Label>
                    <Input
                      id="yearsInBusiness"
                      type="number"
                      min="0"
                      value={companyInfo.yearsInBusiness}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, yearsInBusiness: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearlyRevenue">Yearly Revenue</Label>
                    <Select value={companyInfo.yearlyRevenue} onValueChange={(v) => setCompanyInfo({ ...companyInfo, yearlyRevenue: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVENUE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Services Offered</Label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATEGORIES.map(service => (
                      <Button
                        key={service}
                        type="button"
                        variant={companyInfo.servicesOffered.includes(service) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleServiceToggle(service)}
                      >
                        {service}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    value={companyInfo.description}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                    placeholder="Tell us about your company..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Credentials */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Why provide credentials?
                  </p>
                  <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                    <li><strong>Insurance is REQUIRED</strong> to register as a business on GCN</li>
                    <li><strong>Workers Compensation is REQUIRED</strong> if your company has crew performing work on-site</li>
                    <li><strong>Contractor licenses are optional</strong> - you can use qualifiers if unlicensed, but having licenses improves your verification score</li>
                    <li>Uploading document copies speeds up the verification process</li>
                  </ul>
                </div>

                {/* Contractor Licenses Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Contractor License (Optional - helps verification score)</h3>
                    {licenses.length < 5 && (
                      <Button type="button" variant="outline" size="sm" onClick={addLicense}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add License
                      </Button>
                    )}
                  </div>
                  
                  {licenses.map((license, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">License {index + 1}</span>
                        {licenses.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeLicense(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>License Number</Label>
                          <Input
                            value={license.number}
                            onChange={(e) => updateLicense(index, 'number', e.target.value)}
                            placeholder="e.g., CBC1234567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Select value={license.state} onValueChange={(v) => updateLicense(index, 'state', v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Expiration Date</Label>
                          <Input
                            type="date"
                            value={license.expiration}
                            onChange={(e) => updateLicense(index, 'expiration', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Upload License (Optional)</Label>
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer flex-1">
                              <div className={`border-2 border-dashed rounded-lg p-2 text-center hover:bg-muted/50 transition-colors ${license.fileName ? 'border-green-500 bg-green-50' : ''}`}>
                                {license.fileName ? (
                                  <div className="flex items-center gap-2 text-sm text-green-700">
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate">{license.fileName}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Upload className="h-4 w-4" />
                                    <span>Upload</span>
                                  </div>
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => handleCredentialFileUpload(e.target.files?.[0] || null, 'license', index)}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Insurance Section - REQUIRED */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    Insurance <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-muted-foreground">(Required to register)</span>
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceProvider">Provider *</Label>
                      <Input
                        id="insuranceProvider"
                        value={insurance.provider}
                        onChange={(e) => setInsurance({ ...insurance, provider: e.target.value })}
                        placeholder="e.g., State Farm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                      <Input
                        id="insurancePolicyNumber"
                        value={insurance.policyNumber}
                        onChange={(e) => setInsurance({ ...insurance, policyNumber: e.target.value })}
                        placeholder="e.g., POL-123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceExpiration">Expiration Date *</Label>
                      <Input
                        id="insuranceExpiration"
                        type="date"
                        value={insurance.expiration}
                        onChange={(e) => setInsurance({ ...insurance, expiration: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Insurance Certificate (Optional - speeds verification)</Label>
                    <label className="cursor-pointer block">
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors ${insurance.fileName ? 'border-green-500 bg-green-50' : ''}`}>
                        {insurance.fileName ? (
                          <div className="flex items-center justify-center gap-2 text-green-700">
                            <FileText className="h-5 w-5" />
                            <span>{insurance.fileName}</span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to upload or drag and drop</p>
                            <p className="text-xs">PDF, JPG, PNG (max 10MB)</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleCredentialFileUpload(e.target.files?.[0] || null, 'insurance')}
                      />
                    </label>
                  </div>
                </div>

                {/* Workers Compensation Section */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold">Workers Compensation</h3>
                  
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="hasCrew" 
                      checked={hasCrew}
                      onCheckedChange={(checked) => setHasCrew(!!checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="hasCrew" className="font-medium cursor-pointer">
                        My company has crew that performs work on-site
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        If checked, workers compensation is required to register
                      </p>
                    </div>
                  </div>
                  
                  {(hasCrew || workersComp.provider || workersComp.expiration) && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="workersCompProvider">
                            Provider {hasCrew && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id="workersCompProvider"
                            value={workersComp.provider}
                            onChange={(e) => setWorkersComp({ ...workersComp, provider: e.target.value })}
                            placeholder="e.g., AIG"
                            required={hasCrew}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workersCompExpiration">
                            Expiration Date {hasCrew && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id="workersCompExpiration"
                            type="date"
                            value={workersComp.expiration}
                            onChange={(e) => setWorkersComp({ ...workersComp, expiration: e.target.value })}
                            required={hasCrew}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Upload Workers Comp Certificate (Optional)</Label>
                        <label className="cursor-pointer block">
                          <div className={`border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors ${workersComp.fileName ? 'border-green-500 bg-green-50' : ''}`}>
                            {workersComp.fileName ? (
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <FileText className="h-5 w-5" />
                                <span>{workersComp.fileName}</span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                <Upload className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Click to upload or drag and drop</p>
                                <p className="text-xs">PDF, JPG, PNG (max 10MB)</p>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleCredentialFileUpload(e.target.files?.[0] || null, 'workersComp')}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 border-t pt-6">
                  <Label htmlFor="certifications">Other Certifications</Label>
                  <Input
                    id="certifications"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="e.g., OSHA, EPA, GAF Master Elite (comma separated)"
                  />
                </div>
              </div>
            )}

            {/* Step 3: References */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Client References (3 recommended)</p>
                  <p className="text-muted-foreground">
                    Provide at least 3 client references for faster verification. We may contact them to verify your work quality.
                  </p>
                </div>

                {references.map((ref, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">Reference {index + 1}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={ref.name}
                          onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                          placeholder="Client name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={ref.email}
                          onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                          placeholder="client@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          value={ref.phone}
                          onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Project Description</Label>
                        <Input
                          value={ref.projectDescription}
                          onChange={(e) => handleReferenceChange(index, 'projectDescription', e.target.value)}
                          placeholder="e.g., Full roof replacement"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Portfolio */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Job Photos (5 recommended)</p>
                  <p className="text-muted-foreground">
                    Upload photos of your completed work to showcase your quality. This helps build trust with property owners.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobPhotos.map((photo, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {photo.previewUrl ? (
                          <img src={photo.previewUrl} alt={`Job ${index + 1}`} className="w-full h-full object-cover" />
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                            <Upload className="h-8 w-8" />
                            <span className="text-sm">Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && handlePhotoChange(index, e.target.files[0])}
                            />
                          </label>
                        )}
                      </div>
                      <Input
                        placeholder="Caption"
                        value={photo.caption}
                        onChange={(e) => handlePhotoCaptionChange(index, 'caption', e.target.value)}
                      />
                      <Select value={photo.projectType} onValueChange={(v) => handlePhotoCaptionChange(index, 'projectType', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Account */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Create Admin Account</p>
                  <p className="text-muted-foreground">
                    This will be the primary admin account for your company. You can add additional admins, managers, and representatives later.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={accountInfo.firstName}
                      onChange={(e) => setAccountInfo({ ...accountInfo, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={accountInfo.lastName}
                      onChange={(e) => setAccountInfo({ ...accountInfo, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="accountEmail">Email *</Label>
                    <Input
                      id="accountEmail"
                      type="email"
                      value={accountInfo.email}
                      onChange={(e) => setAccountInfo({ ...accountInfo, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountPhone">Phone</Label>
                    <Input
                      id="accountPhone"
                      type="tel"
                      value={accountInfo.phone}
                      onChange={(e) => setAccountInfo({ ...accountInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2" />
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={accountInfo.password}
                      onChange={(e) => setAccountInfo({ ...accountInfo, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={accountInfo.confirmPassword}
                      onChange={(e) => setAccountInfo({ ...accountInfo, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CompanyRegistration;
