import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Phone, Mail, Globe, MessageSquare, Star, Building2, Trash2, CheckCircle } from 'lucide-react';
import { FavoriteContractor } from '@/hooks/useFavoriteContractors';

interface FavoriteContractorsListProps {
  favorites: FavoriteContractor[];
  loading: boolean;
  onRemove: (contractorId: string) => void;
  onMessage: (contractorId: string) => void;
}

export function FavoriteContractorsList({ 
  favorites, 
  loading, 
  onRemove,
  onMessage 
}: FavoriteContractorsListProps) {
  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            My Contractors
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          My Contractors
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {favorites.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved contractors yet</p>
            <p className="text-sm mt-1">Save contractors you like for quick access</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="p-4 rounded-lg bg-muted/30 border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={favorite.contractor?.logo_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {favorite.contractor?.company_name}
                      </h4>
                      {favorite.contractor?.is_verified && (
                        <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {favorite.contractor?.category}
                    </p>
                    
                    {favorite.contractor?.average_rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-yellow-600">
                          {favorite.contractor.average_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(favorite.contractor_id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMessage(favorite.contractor_id)}
                    className="flex-1"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  
                  {favorite.contractor?.phone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-muted-foreground hover:text-green-600"
                    >
                      <a href={`tel:${favorite.contractor.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  
                  {favorite.contractor?.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-muted-foreground hover:text-blue-600"
                    >
                      <a href={`mailto:${favorite.contractor.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  
                  {favorite.contractor?.website && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="text-muted-foreground hover:text-purple-600"
                    >
                      <a href={favorite.contractor.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
