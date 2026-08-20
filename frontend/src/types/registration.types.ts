export type RegistrationStatus = 'REGISTERED' | 'WAITLISTED' | 'CANCELLED';
export interface Registration { id: string; seminarId: string; status: RegistrationStatus; attendanceStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN'; registrationReference: string; qrToken?: string; }
