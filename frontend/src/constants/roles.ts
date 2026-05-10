export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  HOD: 'HOD',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  FINANCE: 'FINANCE',
  LIBRARIAN: 'LIBRARIAN',
} as const;

export type UserRole = keyof typeof ROLES;
