import { Report, ReportCategory, AIClassificationResult } from '../types';

interface ClassificationInput {
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  existingReports: Report[];
}

export async function classifyReport(input: ClassificationInput): Promise<AIClassificationResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your-gemini-api-key-here' && apiKey.length > 10) {
    try {
      const geminiResult = await callGeminiAPI(apiKey, input);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn('Gemini API call failed, using rule-based NLP fallback:', err);
    }
  }

  // Fallback to rule-based keyword & proximity NLP classifier
  return ruleBasedClassifier(input);
}

// Fallback Rule-Based NLP Classifier
function ruleBasedClassifier(input: {
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  existingReports: Report[];
}): AIClassificationResult {
  const text = `${input.title} ${input.description} ${input.locationName}`.toLowerCase();

  // 1. Category Detection
  let category: ReportCategory = 'other';
  let urgency = 3;
  let assigned_department = 'Estate Office';
  let recommended_action = 'Review report and dispatch campus staff.';

  if (
    text.includes('harass') ||
    text.includes('catcall') ||
    text.includes('stalk') ||
    text.includes('follow') ||
    text.includes('peep') ||
    text.includes('grope') ||
    text.includes('drone') ||
    text.includes('photo') ||
    text.includes('inappropriate') ||
    text.includes('creepy')
  ) {
    category = 'harassment';
    urgency = 5;
    assigned_department = 'ICC / Campus Security Lead';
    recommended_action = 'Escalate immediately to ICC and deploy female guard patrol to the flagged area.';
  } else if (
    text.includes('ragging') ||
    text.includes('freshers') ||
    text.includes('seniors') ||
    text.includes('intimidat') ||
    text.includes('summon')
  ) {
    category = 'ragging_concern';
    urgency = 5;
    assigned_department = 'Anti-Ragging Squad';
    recommended_action = 'Raid hostel premises and notify Proctorial Board.';
  } else if (
    text.includes('light') ||
    text.includes('dark') ||
    text.includes('lamp') ||
    text.includes('blackout') ||
    text.includes('flicker') ||
    text.includes('bulb') ||
    text.includes('unlit')
  ) {
    category = 'broken_lighting';
    urgency = text.includes('blackout') || text.includes('pitch') ? 4 : 3;
    assigned_department = 'Electrical Maintenance Dept';
    recommended_action = 'Replace burnt fixture with solar-backup LED light within 24h.';
  } else if (
    text.includes('cctv') ||
    text.includes('camera') ||
    text.includes('blindspot') ||
    text.includes('blind spot') ||
    text.includes('lens')
  ) {
    category = 'cctv_blindspot';
    urgency = 3;
    assigned_department = 'Campus IT & Security Surveillance';
    recommended_action = 'Re-align camera angle and check DVR recording stream.';
  } else if (
    text.includes('mess') ||
    text.includes('food') ||
    text.includes('water') ||
    text.includes('cooler') ||
    text.includes('washroom') ||
    text.includes('toilet') ||
    text.includes('leak') ||
    text.includes('heater') ||
    text.includes('hostel')
  ) {
    category = 'hostel_mess_water';
    urgency = text.includes('contaminat') || text.includes('spark') ? 4 : 2;
    assigned_department = 'Hostel Warden & Facilities';
    recommended_action = 'Inspect sanitation / electrical plumbing issue on site.';
  } else if (
    text.includes('faint') ||
    text.includes('blood') ||
    text.includes('injur') ||
    text.includes('medic') ||
    text.includes('ambulance') ||
    text.includes('first aid')
  ) {
    category = 'medical_emergency';
    urgency = 5;
    assigned_department = 'Campus Health Center';
    recommended_action = 'Dispatch paramedic van and notify hostel resident doctor.';
  } else if (
    text.includes('manhole') ||
    text.includes('dog') ||
    text.includes('pothole') ||
    text.includes('wire') ||
    text.includes('fence') ||
    text.includes('path') ||
    text.includes('branch')
  ) {
    category = 'unsafe_pathway';
    urgency = text.includes('manhole') || text.includes('wire') ? 4 : 3;
    assigned_department = 'Civil Estate & Maintenance';
    recommended_action = 'Barricade danger zone and execute physical repair.';
  } else if (
    text.includes('liquor') ||
    text.includes('alcohol') ||
    text.includes('thief') ||
    text.includes('theft') ||
    text.includes('loiter') ||
    text.includes('suspicious') ||
    text.includes('unauthorized')
  ) {
    category = 'suspicious_activity';
    urgency = 4;
    assigned_department = 'Campus Security Control Room';
    recommended_action = 'Increase roving patrol and verify identity cards.';
  }

  // 2. Duplicate Detection (within 200m and same category)
  let is_duplicate = false;
  let duplicate_id: string | undefined;

  for (const prev of input.existingReports) {
    if (prev.category === category || prev.location_name.toLowerCase().includes(input.locationName.toLowerCase())) {
      const dist = calculateDistance(input.lat, input.lng, prev.latitude, prev.longitude);
      if (dist < 0.25) {
        // within 250 meters
        is_duplicate = true;
        duplicate_id = prev.id;
        break;
      }
    }
  }

  const summary = `${urgency >= 4 ? 'Urgent: ' : ''}${input.title.slice(0, 60)}${
    input.locationName ? ` near ${input.locationName}` : ''
  }`;

  return {
    category,
    urgency,
    summary,
    is_duplicate,
    duplicate_id,
    rationale: `Classified via Campus Safety NLP Engine based on keywords matching '${category}' and spatial hazard score.`,
    recommended_action,
    assigned_department,
  };
}

// Optional Gemini 1.5/2.0 API Fetch
async function callGeminiAPI(apiKey: string, input: ClassificationInput): Promise<AIClassificationResult | null> {
  const prompt = `You are the AI Safety Dispatcher for SafeCampus (Raksha Path). Analyze the following campus incident report:
Title: "${input.title}"
Description: "${input.description}"
Location: "${input.locationName}" (lat: ${input.lat}, lng: ${input.lng})

Return a strictly valid JSON object with:
{
  "category": one of ["harassment", "broken_lighting", "cctv_blindspot", "suspicious_activity", "ragging_concern", "hostel_mess_water", "unsafe_pathway", "medical_emergency", "other"],
  "urgency": number from 1 to 5 (5 is critical threat to safety, 1 is minor cosmetic),
  "summary": a crisp one-line executive summary (max 90 characters),
  "assigned_department": one of ["ICC / Campus Security Lead", "Anti-Ragging Squad", "Electrical Maintenance Dept", "Campus Security Control Room", "Hostel Warden & Facilities", "Campus Health Center", "Civil Estate & Maintenance"],
  "recommended_action": clear 1-sentence recommended operational fix,
  "rationale": 1 sentence explaining why this urgency and category were selected
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) return null;

  const parsed = JSON.parse(textContent);

  // Check duplicate
  let is_duplicate = false;
  let duplicate_id: string | undefined;
  for (const prev of input.existingReports) {
    if (prev.category === parsed.category) {
      const dist = calculateDistance(input.lat, input.lng, prev.latitude, prev.longitude);
      if (dist < 0.25) {
        is_duplicate = true;
        duplicate_id = prev.id;
        break;
      }
    }
  }

  return {
    category: parsed.category || 'other',
    urgency: Number(parsed.urgency) || 3,
    summary: parsed.summary || input.title,
    is_duplicate,
    duplicate_id,
    rationale: parsed.rationale || 'AI Analyzed using Gemini 1.5 Flash.',
    recommended_action: parsed.recommended_action || 'Inspect and assign.',
    assigned_department: parsed.assigned_department || 'Campus Security',
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
