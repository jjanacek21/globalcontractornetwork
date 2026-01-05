import { useParams, useNavigate } from 'react-router-dom';
import { useQuoteDetail } from '@/hooks/useQuoteDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  DollarSign, 
  Home,
  MessageSquare,
  Send,
  Clock,
  Loader2,
  AlertCircle,
  FileText,
  Palette,
  Grid3X3,
  Ruler
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'new':
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    case 'contacted': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'scheduled': return 'bg-purple-500/10 text-purple-600 border-purple-200';
    case 'in_progress': return 'bg-orange-500/10 text-orange-600 border-orange-200';
    case 'completed': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

const STATUS_STEPS = ['Submitted', 'Contacted', 'Scheduled', 'In Progress', 'Completed'];

export default function QuoteDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { quote, communications, loading, error, addMessage } = useQuoteDetail(type || '', id || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const success = await addMessage(newMessage);
    if (success) {
      setNewMessage('');
      toast.success('Message sent');
    } else {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const getStatusStepIndex = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'pending': return 0;
      case 'contacted': return 1;
      case 'scheduled': return 2;
      case 'in_progress': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Quote Not Found</h2>
        <p className="text-muted-foreground">{error || 'The requested quote could not be found.'}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const currentStep = getStatusStepIndex(quote.status);
  const quoteTypeName = type === 'coating' ? 'Coating Quote' : type === 'window' ? 'Window Quote' : 'Contact Request';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quoteTypeName}</h1>
              <Badge className={getStatusColor(quote.status)}>
                {quote.status || 'Pending'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Submitted {quote.created_at ? format(new Date(quote.created_at), 'MMMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
              <div 
                className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
                style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((step, index) => (
                <div key={step} className="relative flex flex-col items-center z-10">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`mt-2 text-xs ${index <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-primary" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {'property_address' in quote && quote.property_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">{quote.property_address}</p>
                      {'city' in quote && quote.city && (
                        <p className="text-muted-foreground">
                          {quote.city}{quote.state ? `, ${quote.state}` : ''} {quote.zip_code || ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {'property_type' in quote && quote.property_type && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Property Type</p>
                      <p className="text-muted-foreground capitalize">{quote.property_type}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote Specific Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Quote Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Coating Quote Details */}
                  {type === 'coating' && 'coating_type' in quote && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Coating Type</p>
                        <p className="font-medium capitalize">{quote.coating_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Roof Type</p>
                        <p className="font-medium capitalize">{quote.roof_type}</p>
                      </div>
                      {quote.estimated_sqft && (
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Sq Ft</p>
                          <p className="font-medium">{quote.estimated_sqft.toLocaleString()} sq ft</p>
                        </div>
                      )}
                      {quote.roof_age && (
                        <div>
                          <p className="text-sm text-muted-foreground">Roof Age</p>
                          <p className="font-medium">{quote.roof_age}</p>
                        </div>
                      )}
                      {quote.roof_condition && (
                        <div>
                          <p className="text-sm text-muted-foreground">Roof Condition</p>
                          <p className="font-medium capitalize">{quote.roof_condition}</p>
                        </div>
                      )}
                      {quote.urgency && (
                        <div>
                          <p className="text-sm text-muted-foreground">Project Urgency</p>
                          <p className="font-medium capitalize">{quote.urgency}</p>
                        </div>
                      )}
                      {quote.appointment_date && (
                        <div className="sm:col-span-2">
                          <p className="text-sm text-muted-foreground">Scheduled Appointment</p>
                          <p className="font-medium">
                            {format(new Date(quote.appointment_date), 'MMMM d, yyyy')} at {quote.appointment_time}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Window Quote Details */}
                  {type === 'window' && 'total_windows' in quote && (
                    <>
                      {quote.total_windows && (
                        <div className="flex items-start gap-2">
                          <Grid3X3 className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm text-muted-foreground">Total Windows</p>
                            <p className="font-medium">{quote.total_windows} units</p>
                          </div>
                        </div>
                      )}
                      {quote.performance_level && (
                        <div className="flex items-start gap-2">
                          <Ruler className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm text-muted-foreground">Performance Level</p>
                            <p className="font-medium capitalize">{quote.performance_level}</p>
                          </div>
                        </div>
                      )}
                      {quote.interior_color && (
                        <div className="flex items-start gap-2">
                          <Palette className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm text-muted-foreground">Interior Color</p>
                            <p className="font-medium">{quote.interior_color}</p>
                          </div>
                        </div>
                      )}
                      {quote.exterior_color && (
                        <div className="flex items-start gap-2">
                          <Palette className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm text-muted-foreground">Exterior Color</p>
                            <p className="font-medium">{quote.exterior_color}</p>
                          </div>
                        </div>
                      )}
                      {quote.glass_type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Glass Type</p>
                          <p className="font-medium capitalize">{quote.glass_type}</p>
                        </div>
                      )}
                      {quote.grid_style && (
                        <div>
                          <p className="text-sm text-muted-foreground">Grid Style</p>
                          <p className="font-medium">{quote.grid_style}</p>
                        </div>
                      )}
                      {quote.existing_window_type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Existing Windows</p>
                          <p className="font-medium capitalize">{quote.existing_window_type}</p>
                        </div>
                      )}
                      {quote.financing_option && (
                        <div>
                          <p className="text-sm text-muted-foreground">Financing</p>
                          <p className="font-medium capitalize">{quote.financing_option}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Contact Request Details */}
                  {type === 'contact' && 'message' in quote && quote.message && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Message</p>
                      <p className="font-medium whitespace-pre-wrap">{quote.message}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {'notes' in quote && quote.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Additional Notes</p>
                    <p className="text-sm">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Communication History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Communication History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {communications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {communications.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.sender_type === 'homeowner'
                            ? 'bg-primary/10 ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium capitalize">
                            {msg.sender_type === 'homeowner' ? 'You' : msg.sender_type}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Send Message */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sending || !newMessage.trim()}
                    className="w-full"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Estimate */}
            {'estimate_low' in quote && (quote.estimate_low || quote.estimate_high) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Price Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {'discount_percent' in quote && quote.discount_percent && quote.discount_percent > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">
                          ${quote.estimate_low?.toLocaleString()} - ${quote.estimate_high?.toLocaleString()}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ${quote.discounted_price?.toLocaleString()}
                        </p>
                        <Badge className="mt-2 bg-green-500/10 text-green-600 border-green-200">
                          {quote.discount_percent}% Discount Applied
                        </Badge>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-primary">
                        ${quote.estimate_low?.toLocaleString()} - ${quote.estimate_high?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {quote.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-medium">{quote.name}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {quote.email}
                </div>
                {'phone' in quote && quote.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {quote.phone}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral Source */}
            {'referral_source' in quote && quote.referral_source && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Referral Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground capitalize">{quote.referral_source.replace(/_/g, ' ')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
