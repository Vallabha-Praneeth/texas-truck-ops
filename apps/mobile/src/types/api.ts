export type UserRole = 'operator' | 'broker' | 'driver' | 'admin';

export type AuthUser = {
  id: string;
  phone: string;
  displayName: string;
  primaryRole: UserRole;
  email: string | null;
};

export type OtpResponse = {
  message: string;
  expiresIn: number;
};

export type AuthSessionResponse = {
  token: string;
  user: AuthUser;
};

export type UserProfile = {
  id: string;
  phone: string;
  email: string | null;
  displayName: string;
  primaryRole: UserRole;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  type: 'operator' | 'broker';
  contactPhone: string;
  contactEmail: string | null;
  taxId: string | null;
  createdAt: string;
};

export type OrganizationMembership = {
  id: string;
  orgId: string;
  userId: string;
  role: UserRole;
  org: {
    id: string;
    name: string;
    type: 'operator' | 'broker';
    contactPhone: string;
  } | null;
  createdAt: string;
};

export type UserMembershipsResponse = {
  memberships: OrganizationMembership[];
};

export type Truck = {
  id: string;
  orgId: string;
  nickname: string;
  plateNumber: string;
  screenSizeFt: string;
  baseRegion: string;
  createdAt: string;
};

export type Slot = {
  id: string;
  truckId: string;
  startAt: string;
  endAt: string;
  region: string;
  radiusMiles: number;
  repositionAllowed: boolean;
  maxRepositionMiles: number;
  notes: string | null;
  isBooked: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type OfferStatus =
  | 'pending'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'expired';

export type BookingStatus =
  | 'pending_deposit'
  | 'confirmed'
  | 'running'
  | 'awaiting_review'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type Offer = {
  id: string;
  requestId: string | null;
  slotId: string | null;
  createdBy: string;
  amountCents: number;
  currency: string;
  terms: Record<string, unknown> | null;
  status: OfferStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingSummary = {
  id: string;
  status: BookingStatus;
  amountCents: number;
  depositCents: number;
  createdAt: string;
  updatedAt: string;
  slot: {
    id: string;
    startAt: string;
    endAt: string;
    region: string;
    truck: {
      id: string;
      nickname: string | null;
      plateNumber: string | null;
    } | null;
  } | null;
  operatorOrg: {
    id: string;
    name: string;
  } | null;
};

export type BookingDetails = {
  id: string;
  slotId: string;
  acceptedOfferId: string | null;
  operatorOrgId: string;
  brokerUserId: string;
  driverUserId: string | null;
  status: BookingStatus;
  amountCents: number;
  depositCents: number;
  depositPaidAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestItem = {
  id: string;
  createdBy: string;
  region: string;
  title: string;
  description: string;
  preferredStartAt: string;
  preferredEndAt: string;
  budgetCents: number | null;
  minScreenWidthFt: string | null;
  status: 'open' | 'matched' | 'closed';
  createdAt: string;
};

export type RequestOfferSummary = {
  id: string;
  requestId: string | null;
  slotId: string | null;
  createdBy: string;
  amountCents: number;
  currency: string;
  terms: Record<string, unknown> | null;
  status: OfferStatus;
  expiresAt: string | null;
  createdAt: string;
  slot: {
    id: string;
    startAt: string;
    endAt: string;
    truck: {
      nickname: string | null;
    } | null;
  } | null;
};

export type RequestOffersResponse = {
  offers: RequestOfferSummary[];
  total: number;
};
