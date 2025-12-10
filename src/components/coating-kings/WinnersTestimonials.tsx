import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Trophy, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Winner {
  id: string;
  name: string;
  discount_percent: number;
  testimonial_text: string | null;
  created_at: string;
}

// Fallback testimonials when no real winners exist
const SAMPLE_TESTIMONIALS = [
  {
    id: "1",
    name: "Maria G.",
    discount_percent: 25,
    testimonial_text: "I couldn't believe I won 25% off! The coating job was amazing and saved us thousands. Highly recommend spinning the wheel!",
    created_at: "2024-12-01",
  },
  {
    id: "2",
    name: "Robert T.",
    discount_percent: 15,
    testimonial_text: "The spin wheel made getting a quote fun! My 15% discount meant I could afford the premium silicone coating. Great experience!",
    created_at: "2024-11-28",
  },
  {
    id: "3",
    name: "Sandra L.",
    discount_percent: 50,
    testimonial_text: "50% OFF! I was shocked when I landed on it. Coating Kings delivered exceptional quality work. My roof looks brand new!",
    created_at: "2024-11-25",
  },
  {
    id: "4",
    name: "Carlos M.",
    discount_percent: 10,
    testimonial_text: "Even a 10% discount made a difference on my commercial building. Fast, professional, and the coating is holding up great!",
    created_at: "2024-11-20",
  },
];

export const WinnersTestimonials = () => {
  const [winners, setWinners] = useState<Winner[]>(SAMPLE_TESTIMONIALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const { data, error } = await supabase
          .from("coating_leads")
          .select("id, name, discount_percent, testimonial_text, created_at")
          .eq("show_as_winner", true)
          .not("testimonial_text", "is", null)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data && data.length > 0) {
          setWinners(data);
        }
      } catch (error) {
        console.error("Error fetching winners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  const getDiscountColor = (percent: number) => {
    if (percent >= 75) return "text-red-500";
    if (percent >= 50) return "text-purple-500";
    if (percent >= 25) return "text-yellow-500";
    return "text-primary";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Recent Winners & Testimonials</h3>
      </div>
      
      <div className="grid gap-4">
        {winners.slice(0, 4).map((winner) => (
          <Card key={winner.id} className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm italic text-muted-foreground">
                    "{winner.testimonial_text}"
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold">{winner.name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={`font-bold ${getDiscountColor(winner.discount_percent)}`}>
                      Won {winner.discount_percent}% OFF
                    </span>
                    <div className="flex ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
