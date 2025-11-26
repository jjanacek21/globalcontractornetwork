import { Link } from "react-router-dom";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, TrendingUp, Award } from "lucide-react";

export default function MarketingConsulting() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <section className="relative bg-gradient-to-br from-primary to-primary/60 text-primary-foreground py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Learn from Experience</h1>
            <p className="text-xl mb-8">
              Over a decade of construction industry marketing, sales, and business growth expertise
            </p>
            <Link to="/learning">
              <Button size="lg" variant="secondary">
                Explore Learning Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">My Story</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              I've spent the last 10+ years building successful construction businesses from the ground up. 
              Starting as a storm chaser with a pickup truck and a ladder, I learned every aspect of the 
              roofing and construction industry through hands-on experience.
            </p>
            <p>
              Through trial, error, and relentless dedication, I discovered the marketing strategies and 
              sales techniques that actually work in this industry. I've helped dozens of contractors 
              transform their businesses from struggling startups to thriving enterprises.
            </p>
            <p>
              Now, I'm sharing everything I've learned through our Learning Platform and consulting services.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Storm Chasing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Territory selection, canvassing strategies, and closing techniques that convert leads
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Team Building</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Recruiting, training, and managing high-performing sales teams
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Digital Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  SEO, social media, and advertising strategies specific to construction
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Business Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Scaling operations, managing cash flow, and building sustainable businesses
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our Learning Platform today and get access to courses, resources, and a community 
            of construction professionals committed to growth.
          </p>
          <Link to="/learning">
            <Button size="lg">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
