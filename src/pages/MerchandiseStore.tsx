import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Gift } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  available: boolean;
}

export default function MerchandiseStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    checkMembership();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("available", true).order("sort_order");
    setProducts(data || []);
  };

  const checkMembership = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: member } = await supabase
        .from("store_members")
        .select("points_balance")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (member) {
        setPointsBalance(member.points_balance);
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (profile) {
          setUserName(profile.first_name || "Member");
        }
      }
    }
  };

  const calculatePoints = (price: number) => {
    return Math.floor(price * 10);
  };

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category_id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <div className="relative h-[400px] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          {pointsBalance !== null ? (
            <div className="mb-6 flex items-center justify-center gap-3">
              <Award className="h-8 w-8" />
              <div className="text-left">
                <p className="text-sm opacity-90">Welcome back, {userName}!</p>
                <p className="text-2xl font-bold">{pointsBalance} Points</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate("/store/auth")}
                className="gap-2"
              >
                <Gift className="h-5 w-5" />
                Join Rewards Program - Get 100 Points Free!
              </Button>
            </div>
          )}
          <h1 className="text-5xl font-bold mb-4">GCN Merchandise</h1>
          <p className="text-xl">Premium gear for construction professionals</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
          >
            All Products
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="group cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-lg font-bold text-primary">${product.price}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Award className="h-3 w-3 text-primary" />
                  <p className="text-xs text-muted-foreground">Earn {calculatePoints(product.price)} pts</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products available at the moment
          </div>
        )}
      </main>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {selectedProduct?.image_url && (
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-2">${selectedProduct?.price}</p>
              <div className="flex items-center gap-2 mb-6 p-3 bg-primary/10 rounded-lg">
                <Award className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">
                  Earn {selectedProduct ? calculatePoints(selectedProduct.price) : 0} points with this purchase!
                </p>
              </div>
              <p className="text-muted-foreground mb-6">{selectedProduct?.description}</p>
              <Badge className="mb-4">Display Only</Badge>
              <Button className="w-full" size="lg">
                Contact to Order
              </Button>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Email us to place your order
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
