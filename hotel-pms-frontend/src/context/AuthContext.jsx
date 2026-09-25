import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const mockUsers = [
  { id: 1, name: 'Admin Principal', role: 'ADMIN', email: 'admin@hotel.com' },
  { id: 2, name: 'María Gómez (Recepción)', role: 'RECEPTIONIST', email: 'maria@hotel.com' },
  { id: 3, name: 'Carlos Ruiz (Limpieza)', role: 'HOUSEKEEPING', email: 'carlos@hotel.com' },
  { id: 4, name: 'Gerente General', role: 'MANAGER', email: 'gerente@hotel.com' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(mockUsers[1]); // Por defecto iniciamos como Recepcionista

  const switchUser = (role) => {
    const selectedUser = mockUsers.find(u => u.role === role);
    if (selectedUser) setUser(selectedUser);
  };

  return (
    <AuthContext.Provider value={{ user, switchUser, mockUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);