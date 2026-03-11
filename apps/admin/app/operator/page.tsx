'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateSlotModal } from '@/components/CreateSlotModal';
import { RealtimeEventsPanel } from '@/components/RealtimeEventsPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

type DashboardUser = {
  id: string;
  phone: string;
  displayName: string;
  primaryRole: string;
};

type Slot = {
  id: string;
  truckId: string;
  startAt: string;
  endAt: string;
  region: string;
  radiusMiles: number;
  repositionAllowed: boolean;
  maxRepositionMiles: number;
  notes?: string | null;
  isBooked: boolean;
};

type Offer = {
  id: string;
  slotId?: string | null;
  amountCents: number;
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
};

type Truck = {
  id: string;
  nickname: string;
  plateNumber: string;
  screenSizeFt: string;
  baseRegion: string;
};

type BookingSummary = {
  id: string;
  status: string;
  amountCents: number;
  depositCents: number;
  createdAt: string;
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
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function extractApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data?.error?.message || data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function OperatorDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');

  const [slots, setSlots] = useState<Slot[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<Slot | null>(null);

  const slotsSectionRef = useRef<HTMLDivElement | null>(null);
  const offersSectionRef = useRef<HTMLDivElement | null>(null);
  const trucksSectionRef = useRef<HTMLDivElement | null>(null);
  const walletSectionRef = useRef<HTMLDivElement | null>(null);

  const fetchDashboardData = useCallback(async (token: string) => {
    setPageError('');
    setActionError('');

    try {
      const [slotsRes, offersRes, trucksRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/slots/search`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/offers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/trucks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const failedResources: string[] = [];

      if (slotsRes.ok) {
        const slotsData = (await slotsRes.json()) as Slot[];
        setSlots(slotsData);
      } else {
        failedResources.push('slots');
      }

      if (offersRes.ok) {
        const offersData = (await offersRes.json()) as Offer[];
        setOffers(offersData);
      } else {
        failedResources.push('offers');
      }

      if (trucksRes.ok) {
        const trucksData = (await trucksRes.json()) as Truck[];
        setTrucks(trucksData);
      } else {
        failedResources.push('trucks');
      }

      if (bookingsRes.ok) {
        const bookingsData = (await bookingsRes.json()) as BookingSummary[];
        setBookings(bookingsData);
      } else if (bookingsRes.status === 404) {
        // Backward compatible when older API build is running.
        setBookings([]);
      } else {
        failedResources.push('bookings');
      }

      if (failedResources.length > 0) {
        setPageError(`Some dashboard data failed to load: ${failedResources.join(', ')}`);
      }
    } catch (error: unknown) {
      setPageError(getErrorMessage(error, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRealtimeEvent = useCallback(
    (message: { event: string }) => {
      if (message.event === 'realtime:keepalive') {
        return;
      }

      const refreshEvents = new Set([
        'booking:created',
        'booking:status_changed',
        'driver:location_updated',
      ]);

      if (!refreshEvents.has(message.event)) {
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        fetchDashboardData(token);
      }
    },
    [fetchDashboardData]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData) as DashboardUser;
    setUser(parsedUser);
    fetchDashboardData(token);
  }, [fetchDashboardData, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      setActionError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await extractApiError(response, 'Failed to delete slot');
        throw new Error(message);
      }

      if (token) {
        fetchDashboardData(token);
      }
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Failed to delete slot'));
    }
  };

  const handleOfferStatusUpdate = async (offerId: string, status: 'accepted' | 'rejected') => {
    try {
      setActionError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/offers/${offerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const message = await extractApiError(
          response,
          `Failed to ${status === 'accepted' ? 'accept' : 'reject'} offer`
        );
        throw new Error(message);
      }

      if (token) {
        fetchDashboardData(token);
      }
    } catch (error: unknown) {
      setActionError(
        getErrorMessage(
          error,
          `Failed to ${status === 'accepted' ? 'accept' : 'reject'} offer`
        )
      );
    }
  };

  const handleSlotSaved = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchDashboardData(token);
    }
  };

  const openCreateSlotModal = () => {
    setSlotToEdit(null);
    setShowCreateModal(true);
  };

  const openEditSlotModal = (slot: Slot) => {
    setSlotToEdit(slot);
    setShowCreateModal(true);
  };

  const closeSlotModal = () => {
    setShowCreateModal(false);
    setSlotToEdit(null);
  };

  const activeSlots = useMemo(() => slots.filter((slot) => !slot.isBooked).length, [slots]);
  const pendingOffers = useMemo(
    () => offers.filter((offer) => offer.status === 'pending').length,
    [offers]
  );
  const totalBookings = bookings.length;

  const thisMonthRevenueCents = useMemo(() => {
    const now = new Date();

    return bookings
      .filter((booking) => {
        const createdAt = new Date(booking.createdAt);
        return (
          createdAt.getFullYear() === now.getFullYear() &&
          createdAt.getMonth() === now.getMonth() &&
          booking.status !== 'cancelled'
        );
      })
      .reduce((total, booking) => total + booking.amountCents, 0);
  }, [bookings]);

  const pendingOffersList = offers.filter((offer) => offer.status === 'pending');

  const scrollToSection = (ref: { current: HTMLDivElement | null }) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="operator-dashboard" className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
            {user && (
              <p className="text-sm text-gray-600">
                Welcome, {user.displayName} ({user.phone})
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {(pageError || actionError) && (
          <div
            data-testid="dashboard-error"
            className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError || pageError}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card data-testid="kpi-card">
            <CardHeader className="pb-3">
              <CardDescription>Active Slots</CardDescription>
              <CardTitle className="text-3xl" data-testid="kpi-value">
                {activeSlots}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="kpi-card">
            <CardHeader className="pb-3">
              <CardDescription>Pending Offers</CardDescription>
              <CardTitle className="text-3xl" data-testid="kpi-value">
                {pendingOffers}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="kpi-card">
            <CardHeader className="pb-3">
              <CardDescription>Total Bookings</CardDescription>
              <CardTitle className="text-3xl" data-testid="kpi-value">
                {totalBookings}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card data-testid="kpi-card">
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl" data-testid="kpi-value">
                ${(thisMonthRevenueCents / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="mb-8" ref={slotsSectionRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Availability Slots</CardTitle>
                <CardDescription>Manage your truck availability</CardDescription>
              </div>
              <Button data-testid="add-slot-button" onClick={openCreateSlotModal}>
                + Add Slot
              </Button>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No availability slots yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create your first slot to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      data-testid="slot-card"
                      className="rounded-lg border p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <p className="text-lg font-semibold">{slot.region}</p>
                            <span
                              className={`rounded px-2 py-1 text-xs ${
                                slot.isBooked
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {slot.isBooked ? 'Booked' : 'Available'}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              📅 {new Date(slot.startAt).toLocaleString()} →{' '}
                              {new Date(slot.endAt).toLocaleString()}
                            </p>
                            <p>📍 Radius: {slot.radiusMiles} miles</p>
                            {slot.repositionAllowed && (
                              <p>🚚 Repositioning: Up to {slot.maxRepositionMiles} miles</p>
                            )}
                            {slot.notes && <p className="italic">💬 {slot.notes}</p>}
                          </div>
                        </div>
                        {!slot.isBooked && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="edit-slot-button"
                              onClick={() => openEditSlotModal(slot)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="delete-slot-button"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8" ref={offersSectionRef}>
          <Card>
            <CardHeader>
              <CardTitle>Pending Offers</CardTitle>
              <CardDescription>Review and respond to broker offers.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOffersList.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground" data-testid="empty-pending-offers">
                  No pending offers right now.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingOffersList.map((offer) => (
                    <div key={offer.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-semibold">${(offer.amountCents / 100).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Slot: {offer.slotId || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(offer.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid="reject-offer-button"
                            onClick={() => handleOfferStatusUpdate(offer.id, 'rejected')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            data-testid="accept-offer-button"
                            onClick={() => handleOfferStatusUpdate(offer.id, 'accepted')}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8" ref={trucksSectionRef}>
          <Card>
            <CardHeader>
              <CardTitle>Your Trucks</CardTitle>
              <CardDescription>Truck inventory visible for current operator account.</CardDescription>
            </CardHeader>
            <CardContent>
              {trucks.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground" data-testid="empty-trucks">
                  No trucks registered yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {trucks.map((truck) => (
                    <div key={truck.id} className="rounded border p-3 text-sm" data-testid="truck-card">
                      <p className="font-semibold">{truck.nickname}</p>
                      <p className="text-muted-foreground">
                        Plate: {truck.plateNumber} • Screen: {truck.screenSizeFt} • Region: {truck.baseRegion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mb-8" ref={walletSectionRef}>
          <Card>
            <CardHeader>
              <CardTitle>Bookings & Wallet Snapshot</CardTitle>
              <CardDescription>Recent booking visibility with payout-oriented totals.</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground" data-testid="empty-bookings">
                  No bookings yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 8).map((booking) => (
                    <div key={booking.id} className="rounded border p-4" data-testid="booking-card">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">Booking #{booking.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            Status: <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                          </p>
                          {booking.slot && (
                            <p className="text-sm text-muted-foreground">
                              {booking.slot.region} • {new Date(booking.slot.startAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(booking.amountCents / 100).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Deposit ${(booking.depositCents / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Button
                variant="outline"
                className="h-24"
                onClick={() => scrollToSection(trucksSectionRef)}
              >
                <div className="text-center">
                  <div className="mb-1 text-2xl">🚛</div>
                  <div className="text-sm">Manage Trucks</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24"
                onClick={() => scrollToSection(offersSectionRef)}
              >
                <div className="text-center">
                  <div className="mb-1 text-2xl">💬</div>
                  <div className="text-sm">View Offers</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24"
                onClick={() => scrollToSection(slotsSectionRef)}
              >
                <div className="text-center">
                  <div className="mb-1 text-2xl">📅</div>
                  <div className="text-sm">Calendar</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-24"
                onClick={() => scrollToSection(walletSectionRef)}
              >
                <div className="text-center">
                  <div className="mb-1 text-2xl">💰</div>
                  <div className="text-sm">Wallet</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <RealtimeEventsPanel onEvent={handleRealtimeEvent} />
        </div>
      </main>

      <CreateSlotModal
        isOpen={showCreateModal}
        onClose={closeSlotModal}
        onSuccess={handleSlotSaved}
        slotToEdit={slotToEdit}
      />
    </div>
  );
}
