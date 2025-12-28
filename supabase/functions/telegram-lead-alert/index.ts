import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  source: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  service?: string;
  urgency?: string;
  estimateLow?: number;
  estimateHigh?: number;
  notes?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
}

function formatLeadMessage(lead: LeadData): string {
  const timestamp = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short'
  });

  let emoji = '🔔';
  let priority = '';
  
  // Set emoji and priority based on source/urgency
  if (lead.source.toLowerCase().includes('emergency')) {
    emoji = '🚨';
    priority = '⚡ URGENT';
  } else if (lead.urgency === 'immediate') {
    emoji = '⏰';
    priority = '🔥 HOT LEAD';
  } else if (lead.appointmentDate) {
    emoji = '📅';
    priority = '✅ APPOINTMENT';
  }

  let message = `${emoji} <b>NEW LEAD ALERT!</b>\n`;
  message += `━━━━━━━━━━━━━━━\n`;
  
  if (priority) {
    message += `${priority}\n`;
  }
  
  message += `📋 <b>Source:</b> ${lead.source}\n`;
  message += `👤 <b>Name:</b> ${lead.name}\n`;
  
  if (lead.phone) {
    message += `📱 <b>Phone:</b> ${lead.phone}\n`;
  }
  
  if (lead.email) {
    message += `✉️ <b>Email:</b> ${lead.email}\n`;
  }
  
  if (lead.address) {
    message += `🏠 <b>Address:</b> ${lead.address}\n`;
  }
  
  if (lead.service) {
    message += `🔧 <b>Service:</b> ${lead.service}\n`;
  }
  
  if (lead.urgency) {
    message += `⏰ <b>Urgency:</b> ${lead.urgency}\n`;
  }

  if (lead.appointmentDate && lead.appointmentTime) {
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📅 <b>Appointment:</b>\n`;
    message += `   ${lead.appointmentDate} at ${lead.appointmentTime}\n`;
    if (lead.appointmentType) {
      message += `   Type: ${lead.appointmentType === 'zoom' ? '💻 Zoom' : '🏠 In-Person'}\n`;
    }
  }

  if (lead.estimateLow && lead.estimateHigh) {
    message += `━━━━━━━━━━━━━━━\n`;
    message += `💰 <b>Estimate:</b> $${lead.estimateLow.toLocaleString()} - $${lead.estimateHigh.toLocaleString()}\n`;
  }

  if (lead.notes) {
    message += `━━━━━━━━━━━━━━━\n`;
    message += `📝 <b>Notes:</b>\n${lead.notes.substring(0, 200)}${lead.notes.length > 200 ? '...' : ''}\n`;
  }

  message += `━━━━━━━━━━━━━━━\n`;
  message += `🕐 ${timestamp}`;

  return message;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData = await req.json() as LeadData;

    console.log('Received lead data:', JSON.stringify(leadData, null, 2));

    if (!leadData.name || !leadData.source) {
      throw new Error('Name and source are required');
    }

    const message = formatLeadMessage(leadData);
    console.log('Formatted message:', message);

    // Send via Telegram
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured');
      throw new Error('Telegram not configured');
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    console.log('Lead alert sent successfully via Telegram');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending lead alert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
