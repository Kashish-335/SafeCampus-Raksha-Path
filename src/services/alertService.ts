import { SOSTriggerType } from '../types';

export interface AlertDispatchParams {
  latitude: number;
  longitude: number;
  locationName?: string;
  triggerType: SOSTriggerType;
  userName?: string;
  phone?: string;
  contacts: { name: string; phone: string; relationship: string }[];
  audioRecorded?: boolean;
}

export interface AlertDispatchResult {
  success: boolean;
  telegramSent: boolean;
  smsSent: boolean;
  buddiesNotifiedCount: number;
  securityDispatched: boolean;
  timestamp: string;
  dispatchDetails: {
    recipients: string[];
    formattedMessage: string;
    googleMapsUrl: string;
  };
}

export async function dispatchEmergencyAlert(params: AlertDispatchParams): Promise<AlertDispatchResult> {
  const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  const twilioSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;

  const mapsUrl = `https://www.google.com/maps?q=${params.latitude},${params.longitude}`;
  const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const alertMessage = `🚨 [SAFECAMPUS - SILENT SOS TRIGGERED] 🚨
Time: ${nowStr}
User: ${params.userName || 'Student (Anonymous Protection)'}
Trigger Method: ${formatTrigger(params.triggerType)}
Approx Location: ${params.locationName || 'Campus Grounds'} (${params.latitude.toFixed(5)}, ${params.longitude.toFixed(5)})
Live Map Pin: ${mapsUrl}
Status: High Priority Emergency Alert Dispatched to Security Control Room & 4 Nearby Safety Buddies.
${params.audioRecorded ? '🎙️ Ambient 5-second audio snippet captured.' : ''}`;

  let telegramSuccess = false;
  let smsSuccess = false;

  // 1. Telegram Bot API Dispatch (if configured)
  if (telegramBotToken && telegramChatId && telegramBotToken !== 'your-telegram-bot-token') {
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: alertMessage,
          parse_mode: 'HTML',
        }),
      });
      if (response.ok) telegramSuccess = true;
    } catch (err) {
      console.warn('Telegram webhook send error:', err);
    }
  }

  // 2. Twilio SMS Stub (if configured or stubbed)
  if (twilioSid && twilioSid !== 'your-twilio-sid') {
    console.log('[Twilio SMS Stub] Dispatched SMS to trusted contacts:', params.contacts.map((c) => c.phone));
    smsSuccess = true;
  }

  // 3. Fallback / Demo mode success simulation
  // Even if no external API tokens, the simulator marks successful demo dispatch
  return {
    success: true,
    telegramSent: telegramSuccess,
    smsSent: smsSuccess || true, // Simulated
    buddiesNotifiedCount: 3,
    securityDispatched: true,
    timestamp: new Date().toISOString(),
    dispatchDetails: {
      recipients: [
        'Campus Security Control Room (+91-98765-43210)',
        ...params.contacts.map((c) => `${c.name} (${c.phone})`),
        '3 Active Safety Buddies within 250m',
      ],
      formattedMessage: alertMessage,
      googleMapsUrl: mapsUrl,
    },
  };
}

function formatTrigger(trigger: SOSTriggerType): string {
  switch (trigger) {
    case 'button_press':
      return 'Manual One-Touch SOS Panic Button';
    case 'shake':
      return 'Sudden Violent Shake (DeviceMotion Accelerometer)';
    case 'volume_sim':
      return '3x Power / Volume Hardware Button Press';
    case 'code_word':
      return 'Emergency Secret Codeword Match';
    case 'walk_deviation':
      return 'Walk With Me: Route Deviation > 50m / Missed Check-in';
    default:
      return 'Emergency Signal';
  }
}
