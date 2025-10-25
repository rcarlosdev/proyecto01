// src/types/interfaces.tsx
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

