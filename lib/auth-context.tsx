"use client";

import { createContext, useContext, useState, useEffect, ReactNode, FC } from "react";
import { supabase } from "./supabase";

export interface User {
  id: string;
  email: string;
  name: string;
  city?: string;
  createdAt?: string;
  isActive?: boolean;
  icon?: string;
  phone?: string;
  address?: string;
  dashboardSettings?: {
    showDeliveryInfo: boolean;
    showRecentOrders: boolean;
    showCart: boolean;
    showMap: boolean;
    displayLayout: "grid" | "list";
  };
  preferences?: {
    emailNotifications: boolean;
    promotions: boolean;
    marketing: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  allUsers: User[];
  register: (email: string, password: string, name: string, city?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  adminLogin: (email: string, password: string) => { success: boolean; error?: string };
  adminLogout: () => void;
  deleteUser: (userId: string) => void;
  updateUserProfile: (user: User) => void;
  loadUserFromSupabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@shoe-otah.com";
const ADMIN_PASSWORD_KEY = "admin_password";
const DEFAULT_ADMIN_PASSWORD = "admin@shoe123";
const STORAGE_KEY = "auth_user";
const ADMIN_KEY = "auth_admin";
const ALL_USERS_KEY = "all_users";
const SESSION_TOKEN_KEY = "session_token";

// Simple hash function for passwords (not cryptographically secure, but functional)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "hash_" + Math.abs(hash).toString(36);
}

// Initialize admin password synchronously at module load time
if (typeof window !== "undefined") {
  const storedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);
  if (!storedPassword) {
    localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_ADMIN_PASSWORD);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load user data from Supabase if session exists
  const loadUserFromSupabase = async () => {
    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (sessionToken) {
        // Query Supabase for user with this session
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", sessionToken)
          .single();

        if (data && !error) {
          const userData: User = {
            id: data.id,
            email: data.email,
            name: data.name,
            city: data.city,
            createdAt: data.createdAt,
            isActive: data.isActive,
          };
          setUser(userData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Error loading user from Supabase:", error);
    }
  };

  // Hydrate from localStorage on mount and load from Supabase
  useEffect(() => {
    const hydrate = async () => {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      const isAdminStored = localStorage.getItem(ADMIN_KEY);
      const storedAllUsers = localStorage.getItem(ALL_USERS_KEY);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user:", e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      if (storedAllUsers) {
        try {
          setAllUsers(JSON.parse(storedAllUsers));
        } catch (e) {
          console.error("Failed to parse all users:", e);
        }
      }

      if (isAdminStored === "true") {
        setIsAdmin(true);
      }

      // Try to load from Supabase
      await loadUserFromSupabase();

      setIsHydrated(true);
    };

    hydrate();
  }, []);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Register function - creates new user account in Supabase
  const register = async (
    email: string,
    password: string,
    name: string,
    city?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Validation
    if (!email || !password || !name) {
      return { success: false, error: "All fields are required" };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: "Invalid email format" };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    try {
      // Check if email already exists in Supabase
      const { data: existingUser, error: queryError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (queryError && queryError.code !== "PGRST116") {
        console.error("Query error:", queryError);
      }

      if (existingUser) {
        return { success: false, error: "Email already registered" };
      }

      // Hash password
      const hashedPassword = simpleHash(password + email); // Add salt with email

      // Create new user in Supabase
      const newUserId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const { data, error } = await supabase.from("users").insert([
        {
          id: newUserId,
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          city: city || null,
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        return { success: false, error: "Failed to register. Please try again." };
      }

      // Set local user session
      const userData: User = {
        id: newUserId,
        email: email.toLowerCase(),
        name,
        city,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(SESSION_TOKEN_KEY, newUserId);

      // Update local allUsers list for fallback
      const updated = [...allUsers, userData];
      setAllUsers(updated);
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  // Login function - verifies credentials from Supabase
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: "Invalid email format" };
    }

    try {
      // Query Supabase for user with matching email
      const { data: foundUser, error: queryError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (queryError && queryError.code !== "PGRST116") {
        console.error("Query error:", queryError);
      }

      if (!foundUser) {
        return { success: false, error: "Account not found. Please register first" };
      }

      // Hash the provided password with same salt
      const hashedInput = simpleHash(password + email);

      // Verify password matches
      if (foundUser.password !== hashedInput) {
        return { success: false, error: "Incorrect password" };
      }

      // Create user session
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        city: foundUser.city,
        createdAt: foundUser.createdAt,
        isActive: foundUser.isActive,
      };

      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(SESSION_TOKEN_KEY, foundUser.id); // Store session token

      // Update local allUsers list for fallback
      const userIndex = allUsers.findIndex((u) => u.id === foundUser.id);
      let updated;
      if (userIndex >= 0) {
        updated = [...allUsers];
        updated[userIndex] = userData;
      } else {
        updated = [...allUsers, userData];
      }
      setAllUsers(updated);
      localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  };

  const adminLogin = (email: string, password: string): { success: boolean; error?: string } => {
    // Admin must use the admin email
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return { success: false, error: "Invalid admin email" };
    }

    // Get stored admin password
    const storedAdminPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);

    // If no admin password set yet, this is first admin setup
    if (!storedAdminPassword) {
      return { success: false, error: "Admin account not configured. Please set admin password first." };
    }

    // Verify admin password
    if (password !== storedAdminPassword) {
      return { success: false, error: "Incorrect admin password" };
    }

    // Create admin user session
    const adminUser: User = {
      id: "admin-001",
      email: ADMIN_EMAIL,
      name: "Administrator",
      createdAt: new Date().toISOString(),
    };

    setUser(adminUser);
    setIsAdmin(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
    localStorage.setItem(ADMIN_KEY, "true");

    return { success: true };
  };

  const adminLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_KEY);
  };

  const deleteUser = (userId: string) => {
    const updated = allUsers.filter((u) => u.id !== userId);
    setAllUsers(updated);
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updated));
  };

  const updateUserProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

    // Also update in allUsers list
    const updatedAllUsers = allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setAllUsers(updatedAllUsers);
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(updatedAllUsers));
  };

  if (!isHydrated) {
    return <div>{children}</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        allUsers,
        register,
        login,
        logout,
        adminLogin,
        adminLogout,
        deleteUser,
        updateUserProfile,
        loadUserFromSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  // Return a safe default if auth context is not available
  if (context === undefined) {
    return {
      user: null,
      isLoggedIn: false,
      isAdmin: false,
      allUsers: [],
      register: async () => ({ success: false, error: "Auth context not available" }),
      login: async () => ({ success: false, error: "Auth context not available" }),
      logout: () => {},
      adminLogin: () => ({ success: false, error: "Auth context not available" }),
      adminLogout: () => {},
      deleteUser: () => {},
      updateUserProfile: () => {},
      loadUserFromSupabase: async () => {},
    };
  }

  return context;
}
