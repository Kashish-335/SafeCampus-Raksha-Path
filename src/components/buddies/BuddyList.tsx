import React, { useState } from 'react';
import { Users, Shield, HeartHandshake, Phone, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { SafetyBuddy, EmergencyContact } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface BuddyListProps {
  buddies: SafetyBuddy[];
}

export const BuddyList: React.FC<BuddyListProps> = ({ buddies }) => {
  const { user, updateEmergencyContacts, toggleBuddyVolunteer } = useAuth();
  const { showToast } = useToast();

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Friend');
  const [showAddContact, setShowAddContact] = useState(false);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: `ec-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactRel,
      is_primary: user.emergency_contacts.length === 0,
    };

    updateEmergencyContacts([...user.emergency_contacts, newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
    showToast('Emergency contact added successfully.', 'success');
  };

  const handleRemoveContact = (id: string) => {
    const updated = user.emergency_contacts.filter((c) => c.id !== id);
    updateEmergencyContacts(updated);
    showToast('Contact removed.', 'info');
  };

  return (
    <div className="space-y-5">
      {/* Volunteer Buddy Program Opt-In Card */}
      <div className="bg-gradient-to-r from-purple-950 via-brand-950 to-slate-900 rounded-2xl border border-purple-800/40 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-md">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Safety Buddies Volunteer Network
              </h3>
              <p className="text-sm text-slate-300 font-medium mt-0.5">
                Opt-in peer escort network providing fast nearby student response.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              toggleBuddyVolunteer();
              showToast(
                user.is_buddy_volunteer
                  ? 'Opted out of Safety Buddy responder alerts.'
                  : 'Joined Safety Buddy volunteer squad! You will receive approximate nearby alerts.',
                'success'
              );
            }}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-bold transition border shadow-sm self-start sm:self-auto ${
              user.is_buddy_volunteer
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600/70'
                : 'bg-brand-600 text-white border-brand-500 hover:bg-brand-500'
            }`}
          >
            {user.is_buddy_volunteer ? '✓ Active Volunteer' : 'Join Volunteer Squad'}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-purple-200 mt-3 font-medium">
          🔒 <strong>Privacy Preserved:</strong> Exact coordinates are never broadcast to peers until an emergency SOS is accepted.
        </p>
      </div>

      {/* Nearby Active Safety Buddies */}
      <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Nearby Verified Buddies ({buddies.filter((b) => b.is_available).length} Active)
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
            Within 350m
          </span>
        </div>

        <div className="space-y-3">
          {buddies.map((buddy) => (
            <div
              key={buddy.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl">{buddy.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-white">{buddy.name}</span>
                    {buddy.is_verified && (
                      <span className="text-xs bg-brand-950 text-brand-300 px-2 py-0.5 rounded-md border border-brand-800 font-semibold">
                        Verified Student
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                    ~{buddy.distance_m}m away • {buddy.is_available ? 'Available' : 'In Class'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    buddy.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                  }`}
                  title={buddy.is_available ? 'Available' : 'Busy'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts Manager */}
      <div className="bg-safecampus-card rounded-2xl border border-safecampus-border p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-rose-400" />
              Trusted Emergency Contacts
            </h3>
            <p className="text-sm text-slate-300 font-medium mt-0.5">
              Notified immediately during Silent SOS and Walk With Me triggers.
            </p>
          </div>
          <button
            onClick={() => setShowAddContact((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>

        {/* Add Contact Sub-form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="p-4 bg-slate-900 rounded-xl border border-slate-800 mb-4 space-y-3 text-sm">
            <input
              type="text"
              placeholder="Full Name (e.g. Hostel Warden / Parent)"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (+91...)"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              required
            />
            <div className="flex gap-2.5 pt-1">
              <button
                type="submit"
                className="flex-1 min-h-[42px] py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-sm transition"
              >
                Save Contact
              </button>
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {user.emergency_contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-white font-bold">{contact.name}</strong>
                  <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-medium">
                    {contact.relationship}
                  </span>
                  {contact.is_primary && (
                    <span className="text-xs text-emerald-400 font-bold">Primary</span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">{contact.phone}</div>
              </div>

              {user.emergency_contacts.length > 1 && (
                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="text-slate-400 hover:text-rose-400 p-1.5 transition"
                  title="Remove contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
