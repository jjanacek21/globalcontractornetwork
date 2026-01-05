-- Add RLS policies for users to view their own leads

-- coating_leads: Allow users to view their own leads
CREATE POLICY "Users can view own coating leads"
ON coating_leads FOR SELECT
USING (
  auth.uid() = user_id 
  OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- window_leads: Allow users to view their own leads  
CREATE POLICY "Users can view own window leads"
ON window_leads FOR SELECT
USING (
  auth.uid() = user_id 
  OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- contact_requests: Allow users to view their own requests
CREATE POLICY "Users can view own contact requests"
ON contact_requests FOR SELECT
USING (
  auth.uid() = user_id 
  OR email_normalized = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Create homeowner_notifications table
CREATE TABLE public.homeowner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('quote_status_change', 'new_message', 'appointment_reminder', 'estimate_ready')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_table TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.homeowner_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.homeowner_notifications
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
ON public.homeowner_notifications
FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications (using security definer function)
CREATE POLICY "System can insert notifications"
ON public.homeowner_notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_homeowner_notifications_user_read 
ON public.homeowner_notifications(user_id, is_read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.homeowner_notifications;

-- Create function to notify on status change
CREATE OR REPLACE FUNCTION public.notify_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed and user_id exists
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.homeowner_notifications (user_id, type, title, message, related_table, related_id)
    VALUES (
      NEW.user_id,
      'quote_status_change',
      'Quote Status Updated',
      'Your quote request status changed to: ' || COALESCE(NEW.status, 'updated'),
      TG_TABLE_NAME,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers to all lead tables
CREATE TRIGGER coating_lead_status_change
AFTER UPDATE ON public.coating_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_status_change();

CREATE TRIGGER window_lead_status_change
AFTER UPDATE ON public.window_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_status_change();

CREATE TRIGGER contact_request_status_change
AFTER UPDATE ON public.contact_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_lead_status_change();