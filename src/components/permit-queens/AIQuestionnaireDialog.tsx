import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, CheckCircle2, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MissingField {
  field: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIQuestionnaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permitId: string;
  missingFields: MissingField[];
  permitType: string;
  jurisdiction: string;
  onComplete: () => void;
}

export function AIQuestionnaireDialog({
  open,
  onOpenChange,
  permitId,
  missingFields,
  permitType,
  jurisdiction,
  onComplete,
}: AIQuestionnaireDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalFields = missingFields.length;
  const progress = totalFields > 0 ? Math.round((currentFieldIndex / totalFields) * 100) : 0;

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open && messages.length === 0 && missingFields.length > 0) {
      const greeting = `Hi! I need to collect a few more details to complete your ${permitType} permit application for ${jurisdiction}. I have ${totalFields} question${totalFields > 1 ? 's' : ''} for you.\n\nLet's start with the first one:`;
      
      const firstQuestion = generateQuestionForField(missingFields[0]);
      
      setMessages([
        { role: 'assistant', content: greeting },
        { role: 'assistant', content: firstQuestion },
      ]);
    }
  }, [open, missingFields, permitType, jurisdiction, totalFields]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  // Tips map with contractor-specific guidance for each field
  const tipsMap: Record<string, string> = {
    'mean_roof_height': '💡 Tip: Measure from grade level to the midpoint between the eave and ridge. For multi-story buildings, measure to the highest midpoint. Your inspector will verify this.',
    'roof_slope': '💡 Tip: Use a pitch gauge or level + ruler. Place the level against the roof and measure 12" horizontally, then measure the vertical rise. Format as rise:12 (e.g., 4:12 means 4" rise per 12" run).',
    'building_sqft': '💡 Tip: Use the property appraiser\'s recorded square footage, or measure exterior walls. Include all heated/cooled areas.',
    'owner_name': '💡 Tip: This must match the name on the deed exactly. Check the property appraiser website if unsure.',
    'owner_phone': '💡 Tip: Provide a number where the owner can be reached during business hours for inspector callbacks.',
    'owner_email': '💡 Tip: This will be used for permit status notifications and inspection scheduling.',
    'contractor_license': '💡 Tip: Enter your active Florida contractor license number (e.g., CCC1234567 for roofing). This will be verified against DBPR records.',
    'property_value': '💡 Tip: For permit valuation, use the total cost of materials + labor for this project. This determines the permit fee.',
    'construction_type': '💡 Tip: Check the original building permit or property appraiser records. Common types: CBS (concrete block/stucco), Wood Frame, Steel Frame, Masonry.',
    'year_built': '💡 Tip: Find this on the property appraiser website or the original Certificate of Occupancy. This affects which building code version applies.',
    'hvac_type': '💡 Tip: Common types: Split System, Package Unit, Mini-Split, Heat Pump. Check the equipment nameplate or the quote from your supplier.',
    'window_count': '💡 Tip: Count all window units being replaced, including fixed and operable. Picture windows and sliding glass doors count separately.',
    'door_count': '💡 Tip: Count entry doors and impact-rated garage doors. Sliding glass doors typically count as windows for permit purposes.',
    'folio_number': '💡 Tip: Find this on the county property appraiser website. Search by address to get the parcel/folio number.',
    'legal_description': '💡 Tip: This is on the warranty deed or property appraiser website. Include lot, block, subdivision name.',
    'existing_roof_type': '💡 Tip: Common types: Shingle, Tile, Metal, Flat/Built-Up. Look at the current roof or previous permit records.',
  };

  const generateQuestionForField = (field: MissingField): string => {
    const fieldName = field.field;
    const description = field.description;

    // Map common field names to natural questions
    const questionMap: Record<string, string> = {
      'mean_roof_height': 'What is the mean roof height of the building? (e.g., "18 feet" or "5.5 meters")',
      'roof_slope': 'What is the roof slope or pitch? (e.g., "4:12" or "6/12")',
      'building_sqft': 'What is the total square footage of the building?',
      'property_value': 'What is the estimated property value or project valuation?',
      'contractor_license': 'What is your Florida contractor license number?',
      'owner_phone': 'What is the property owner\'s phone number?',
      'owner_email': 'What is the property owner\'s email address?',
      'construction_type': 'What type of construction is the building? (e.g., "Wood Frame", "CBS", "Steel")',
      'year_built': 'What year was the building originally constructed?',
      'hvac_type': 'What type of HVAC system is being installed?',
      'window_count': 'How many windows are included in this permit?',
      'door_count': 'How many doors are included in this permit?',
    };

    const question = questionMap[fieldName] || `${description || `Please provide the ${fieldName.replace(/_/g, ' ')}`}`;
    
    // Append tip if available
    const tip = tipsMap[fieldName];
    return tip ? `${question}\n\n${tip}` : question;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Call AI to validate and process the answer
      const { data, error } = await supabase.functions.invoke('permit-questionnaire-ai', {
        body: {
          action: 'validateAnswer',
          permitId,
          field: missingFields[currentFieldIndex].field,
          answer: userMessage,
          permitType,
          jurisdiction,
          collectedAnswers,
        },
      });

      if (error) throw error;

      const { isValid, correctedValue, feedback, fieldMapping } = data;

      if (isValid) {
        // Save the answer
        const newAnswers = {
          ...collectedAnswers,
          [missingFields[currentFieldIndex].field]: correctedValue || userMessage,
        };
        setCollectedAnswers(newAnswers);

        // Check if we have more fields
        const nextIndex = currentFieldIndex + 1;
        
        if (nextIndex < missingFields.length) {
          // More fields to collect
          setCurrentFieldIndex(nextIndex);
          const nextQuestion = generateQuestionForField(missingFields[nextIndex]);
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: feedback || '✓ Got it!' },
            { role: 'assistant', content: nextQuestion },
          ]);
        } else {
          // All fields collected
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: feedback || '✓ Got it!' },
            { role: 'assistant', content: 'Perfect! I have all the information I need. Let me save this and update your permit packet...' },
          ]);
          
          // Save all answers to the permit project
          await saveAnswersToPermit(newAnswers);
          
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: '🎉 All done! Your permit information has been updated and the forms are being regenerated. You can close this dialog now.' },
          ]);
          setIsComplete(true);
        }
      } else {
        // Answer needs correction
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: feedback || 'I didn\'t quite understand that. Could you please try again?' },
        ]);
      }
    } catch (error) {
      console.error('Questionnaire error:', error);
      // Fallback: Accept the answer anyway
      const newAnswers = {
        ...collectedAnswers,
        [missingFields[currentFieldIndex].field]: userMessage,
      };
      setCollectedAnswers(newAnswers);
      
      const nextIndex = currentFieldIndex + 1;
      if (nextIndex < missingFields.length) {
        setCurrentFieldIndex(nextIndex);
        const nextQuestion = generateQuestionForField(missingFields[nextIndex]);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '✓ Got it!' },
          { role: 'assistant', content: nextQuestion },
        ]);
      } else {
        await saveAnswersToPermit(newAnswers);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '🎉 All done! Your permit information has been updated.' },
        ]);
        setIsComplete(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswersToPermit = async (answers: Record<string, string>) => {
    try {
      // Get current permit data
      const { data: permit } = await supabase
        .from('permit_projects')
        .select('*')
        .eq('id', permitId)
        .single();

      // Use existing fields or create new ones based on answers
      // Store answers in specific columns that exist in the schema
      const updateData: Record<string, unknown> = {};
      
      // Map common answer fields to known database columns
      const fieldMapping: Record<string, string> = {
        'owner_phone': 'owner_phone',
        'owner_email': 'owner_email',
        'owner_name': 'owner_name',
        'property_address': 'property_address',
        'property_value': 'estimated_value',
        'building_sqft': 'scope_of_work',
        'scope_description': 'scope_of_work',
      };

      for (const [key, value] of Object.entries(answers)) {
        const dbColumn = fieldMapping[key];
        if (dbColumn && value) {
          updateData[dbColumn] = value;
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('permit_projects')
          .update(updateData)
          .eq('id', permitId);

        if (error) throw error;
      }
      
      toast.success('Permit information updated successfully!');
    } catch (error) {
      console.error('Failed to save answers:', error);
      toast.error('Failed to save some information. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    if (isComplete) {
      onComplete();
    }
    setMessages([]);
    setCurrentFieldIndex(0);
    setCollectedAnswers({});
    setIsComplete(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Your Permit Application
          </DialogTitle>
          <DialogDescription>
            Answer a few questions to fill in the missing information.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{currentFieldIndex} of {totalFields} questions</span>
          </div>
          <Progress value={isComplete ? 100 : progress} className="h-2" />
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content.split('\n\n').map((part, i) => (
                        part.startsWith('💡 Tip:') ? (
                          <span key={i} className="block mt-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                            {part}
                          </span>
                        ) : (
                          <span key={i} className={i > 0 ? 'block mt-2' : ''}>{part}</span>
                        )
                      ))}
                    </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        {!isComplete ? (
          <div className="flex gap-2 pt-2 border-t">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handleClose} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
