import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: available } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true);

    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id, courses(*)")
      .eq("student_id", user.id);

    setAvailableCourses(available || []);
    setEnrolledCourses(enrollments?.map(e => e.courses).filter(Boolean) as Course[] || []);
    setLoading(false);
  };

  const handleEnroll = async (courseId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("course_enrollments")
      .insert({ course_id: courseId, student_id: user.id });

    if (!error) {
      loadCourses();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Student Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="my-courses">
          <TabsList>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            <TabsTrigger value="browse">Browse Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="my-courses" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">My Enrolled Courses</h2>
            {loading ? (
              <div className="text-center py-12">Loading courses...</div>
            ) : enrolledCourses.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                  <p className="text-muted-foreground">Browse available courses to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    {course.cover_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Clock className="h-4 w-4" />
                        <span>0% complete</span>
                      </div>
                      <Button className="w-full">Continue Learning</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="browse" className="mt-6">
            <h2 className="text-2xl font-bold mb-6">Available Courses</h2>
            {loading ? (
              <div className="text-center py-12">Loading courses...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCourses.map((course) => {
                  const isEnrolled = enrolledCourses.some(c => c.id === course.id);
                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      {course.cover_image_url && (
                        <div className="aspect-video overflow-hidden rounded-t-lg">
                          <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={() => handleEnroll(course.id)}
                          disabled={isEnrolled}
                        >
                          {isEnrolled ? "Enrolled" : "Enroll Now"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
