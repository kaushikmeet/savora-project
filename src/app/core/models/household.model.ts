
export type HouseholdRole = 'OWNER' | 'MEMBER';

export type MembershipStatus =
  | 'ACTIVE'
  | 'INVITED'
  | 'REMOVED';

  export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'REVOKED';

export interface Household {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  pinCode?: string | null;
  city?: string | null;
  state?: string | null;
  countryCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  household: Household;

  role: HouseholdRole;
  status: MembershipStatus;

  invitedEmail?: string | null;
  invitationTokenHash?: string | null;
  invitationExpiresAt?: string | null;
  joinedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;

  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
  };
}

export interface CreateHouseholdRequest {
  name: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
}

export interface HouseholdResponse {
  household: Household;
  members: HouseholdMember[];
}

export interface HouseholdInvitationResponse {
  id: string;
  householdId: string;
  email: string;
  status: InvitationStatus;
  invitedByUserId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
}