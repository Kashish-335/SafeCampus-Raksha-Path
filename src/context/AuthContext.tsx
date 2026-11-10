import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USER, ADMIN_USER } from '../services/mockData';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAnonymous: boolean;
  isAdmin: boolean;
  setIsAnonymous: (val: boolean) => void;
  loginAsStudent: () => void;
  loginAsAdmin: () => void;
  updateEmergencyContacts: (contacts: UserProfile['emergency_contacts']) => void;
  toggleBuddyVolunteer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('safecampus_user_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USER;
      }
    }
    return INITIAL_USER;
  });

  const [isAnonymous, setIsAnonymous] = useState<boolean>(true); // Anonymous ON by default

  useEffect(() => {
    localStorage.setItem('safecampus_user_v1', JSON.stringify(user));
  }, [user]);

  const loginAsStudent = () => {
    setUser(INITIAL_USER);
  };

  const loginAsAdmin = () => {
    setUser(ADMIN_USER);
  };

  const updateEmergencyContacts = (contacts: UserProfile['emergency_contacts']) => {
    setUser((prev) => ({ ...prev, emergency_contacts: contacts }));
  };

  const toggleBuddyVolunteer = () => {
    setUser((prev) => ({ ...prev, is_buddy_volunteer: !prev.is_buddy_volunteer }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        isAnonymous,
        isAdmin: user.role === 'admin',
        setIsAnonymous,
        loginAsStudent,
        loginAsAdmin,
        updateEmergencyContacts,
        toggleBuddyVolunteer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
