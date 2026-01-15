import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card3D } from "@/components/crm-ui/Card3D";
import { AnimatedBadge } from "@/components/crm-ui/AnimatedBadge";
import { 
  ThemedSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  StatCardSkeleton, 
  DashboardSkeleton 
} from "@/components/ui/themed-skeleton";
import { PageTransition } from "@/components/shared/PageTransition";
import { 
  Home, 
  Settings, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Crown, 
  Shield, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";

const DesignSystem = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("colors");

  const colors = [
    { name: "Primary", var: "--primary", class: "bg-primary", textClass: "text-primary-foreground" },
    { name: "Secondary", var: "--secondary", class: "bg-secondary", textClass: "text-secondary-foreground" },
    { name: "Accent", var: "--accent", class: "bg-accent", textClass: "text-accent-foreground" },
    { name: "Muted", var: "--muted", class: "bg-muted", textClass: "text-muted-foreground" },
    { name: "Destructive", var: "--destructive", class: "bg-destructive", textClass: "text-destructive-foreground" },
    { name: "Card", var: "--card", class: "bg-card border", textClass: "text-card-foreground" },
    { name: "Background", var: "--background", class: "bg-background border", textClass: "text-foreground" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold">Design System</h1>
                  <p className="text-sm text-muted-foreground">Component library & style guide</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="theme-toggle" className="text-sm">Dark Mode</Label>
                  <Switch
                    id="theme-toggle"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 flex-wrap">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
              <TabsTrigger value="icons">Icons</TabsTrigger>
            </TabsList>

            {/* Colors */}
            <TabsContent value="colors" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>Semantic colors used throughout the application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {colors.map((color) => (
                      <div key={color.name} className="space-y-2">
                        <div className={`h-20 rounded-lg ${color.class} ${color.textClass} flex items-center justify-center font-medium`}>
                          {color.name}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gradient Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-24 rounded-lg bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium">
                      Primary Gradient
                    </div>
                    <div className="h-24 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground font-medium">
                      Primary to Accent
                    </div>
                    <div className="h-24 rounded-lg bg-gradient-to-br from-primary/10 via-background to-accent/10 border flex items-center justify-center font-medium">
                      Subtle Background
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography */}
            <TabsContent value="typography" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Headings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h1 className="text-4xl font-bold">Heading 1 - Bold 4xl</h1>
                  <h2 className="text-3xl font-bold">Heading 2 - Bold 3xl</h2>
                  <h3 className="text-2xl font-semibold">Heading 3 - Semibold 2xl</h3>
                  <h4 className="text-xl font-semibold">Heading 4 - Semibold xl</h4>
                  <h5 className="text-lg font-medium">Heading 5 - Medium lg</h5>
                  <h6 className="text-base font-medium">Heading 6 - Medium base</h6>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Body Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">Large body text for introductions and key content.</p>
                  <p className="text-base">Regular body text for general content and descriptions.</p>
                  <p className="text-sm text-muted-foreground">Small muted text for secondary information and metadata.</p>
                  <p className="text-xs text-muted-foreground">Extra small text for captions and fine print.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Buttons */}
            <TabsContent value="buttons" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-4">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Settings className="h-4 w-4" /></Button>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button className="gap-2">
                      <Crown className="h-4 w-4" />
                      With Icon
                    </Button>
                    <Button disabled>Disabled</Button>
                    <Button className="bg-gradient-to-r from-primary to-primary/80">
                      Gradient Button
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cards */}
            <TabsContent value="cards" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Standard Card</CardTitle>
                    <CardDescription>Basic card component</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is a standard card with header and content sections.
                    </p>
                  </CardContent>
                </Card>

                <Card3D>
                  <CardHeader>
                    <CardTitle>3D Card</CardTitle>
                    <CardDescription>Interactive hover effects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Hover over this card to see the 3D tilt effect.
                    </p>
                  </CardContent>
                </Card3D>

                <Card3D glassEffect>
                  <CardHeader>
                    <CardTitle>Glass Card</CardTitle>
                    <CardDescription>With backdrop blur</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Glass morphism effect with blur backdrop.
                    </p>
                  </CardContent>
                </Card3D>
              </div>
            </TabsContent>

            {/* Forms */}
            <TabsContent value="forms" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Form Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" className="pl-10" placeholder="(555) 555-5555" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">Enable notifications</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges */}
            <TabsContent value="badges" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Badge Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <AnimatedBadge variant="success">Success</AnimatedBadge>
                    <AnimatedBadge variant="warning">Warning</AnimatedBadge>
                    <AnimatedBadge variant="danger">Danger</AnimatedBadge>
                    <AnimatedBadge variant="info">Info</AnimatedBadge>
                    <AnimatedBadge variant="default">Default</AnimatedBadge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skeletons */}
            <TabsContent value="skeletons" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Loading Skeletons</CardTitle>
                  <CardDescription>Green-themed skeleton loading states</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h4 className="font-medium mb-4">Basic Skeletons</h4>
                    <div className="space-y-4">
                      <ThemedSkeleton className="h-4 w-full" />
                      <ThemedSkeleton className="h-4 w-3/4" />
                      <ThemedSkeleton className="h-4 w-1/2" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Card Skeleton</h4>
                    <CardSkeleton className="max-w-md" />
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Stat Cards</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Table Skeleton</h4>
                    <TableSkeleton rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Icons */}
            <TabsContent value="icons" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Common Icons</CardTitle>
                  <CardDescription>Icons used throughout the application (Lucide React)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
                    {[
                      { icon: Home, name: "Home" },
                      { icon: User, name: "User" },
                      { icon: Settings, name: "Settings" },
                      { icon: Mail, name: "Mail" },
                      { icon: Phone, name: "Phone" },
                      { icon: MapPin, name: "MapPin" },
                      { icon: Crown, name: "Crown" },
                      { icon: Shield, name: "Shield" },
                      { icon: Zap, name: "Zap" },
                      { icon: CheckCircle2, name: "Success" },
                      { icon: AlertTriangle, name: "Warning" },
                      { icon: Info, name: "Info" },
                    ].map(({ icon: Icon, name }) => (
                      <div key={name} className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground">{name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default DesignSystem;
