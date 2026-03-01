'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

type DashboardUser = {
  id: string;
  displayName: string;
};

type Slot = {
  id: string;
  region: string;
  startAt: string;
  endAt: string;
  radiusMiles: number;
  isBooked?: boolean;
};

type RequestItem = {
  id: string;
  region: string;
  title: string;
  description: string;
  preferredStartAt: string;
  preferredEndAt: string;
  budgetCents?: number | null;
  status: string;
};

type Offer = {
  id: string;
  amountCents: number;
  status: string;
  slotId?: string | null;
  requestId?: string | null;
  createdAt: string;
};

type RequestOffer = {
  id: string;
  amountCents: number;
  status: string;
  slot: {
    id: string;
    startAt: string;
    truck: {
      nickname: string | null;
    } | null;
  } | null;
};

type RequestFormState = {
  title: string;
  description: string;
  region: string;
  preferredStartAt: string;
  preferredEndAt: string;
  budgetUsd: string;
};

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseUsdToCents(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.round(parsed * 100);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function getApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data?.error?.message || data?.message || fallback;
  } catch {
    return fallback;
  }
}

const EMPTY_REQUEST_FORM: RequestFormState = {
  title: '',
  description: '',
  region: 'DFW',
  preferredStartAt: '',
  preferredEndAt: '',
  budgetUsd: '',
};

export default function BrokerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');

  const [slots, setSlots] = useState<Slot[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestModalMode, setRequestModalMode] = useState<'create' | 'edit'>('create');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState<RequestFormState>(EMPTY_REQUEST_FORM);
  const [savingRequest, setSavingRequest] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [requestOffers, setRequestOffers] = useState<RequestOffer[]>([]);

  const [slotFilters, setSlotFilters] = useState({
    region: '',
    startAt: '',
    endAt: '',
  });
  const [searchingSlots, setSearchingSlots] = useState(false);

  const visibleSlots = useMemo(
    () => slots.filter((slot) => !slot.isBooked),
    [slots]
  );

  const resetRequestForm = () => {
    setRequestForm(EMPTY_REQUEST_FORM);
    setEditingRequestId(null);
    setRequestModalMode('create');
  };

  const fetchData = async (token: string, slotQuery?: URLSearchParams) => {
    try {
      setPageError('');
      setActionError('');

      const slotUrl = slotQuery
        ? `${API_URL}/slots/search?${slotQuery.toString()}`
        : `${API_URL}/slots/search`;

      const [slotsRes, offersRes, requestsRes] = await Promise.all([
        fetch(slotUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/offers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const failed: string[] = [];

      if (slotsRes.ok) {
        setSlots((await slotsRes.json()) as Slot[]);
      } else {
        failed.push('slots');
      }

      if (offersRes.ok) {
        setMyOffers((await offersRes.json()) as Offer[]);
      } else {
        failed.push('offers');
      }

      if (requestsRes.ok) {
        setRequests((await requestsRes.json()) as RequestItem[]);
      } else {
        failed.push('requests');
      }

      if (failed.length > 0) {
        setPageError(`Some broker data failed to load: ${failed.join(', ')}`);
      }
    } catch (error: unknown) {
      setPageError(getErrorMessage(error, 'Failed to fetch broker data'));
    } finally {
      setLoading(false);
      setSearchingSlots(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData) as DashboardUser;
    setUser(parsedUser);
    fetchData(token);
  }, [router]);

  const openCreateRequestModal = () => {
    resetRequestForm();
    setIsRequestModalOpen(true);
  };

  const openEditRequestModal = (request: RequestItem) => {
    setRequestModalMode('edit');
    setEditingRequestId(request.id);
    setRequestForm({
      title: request.title,
      description: request.description,
      region: request.region,
      preferredStartAt: toDateTimeLocal(request.preferredStartAt),
      preferredEndAt: toDateTimeLocal(request.preferredEndAt),
      budgetUsd: request.budgetCents ? String(request.budgetCents / 100) : '',
    });
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    resetRequestForm();
  };

  const validateRequestForm = (): string | null => {
    if (!requestForm.title.trim()) return 'Title is required';
    if (!requestForm.description.trim()) return 'Description is required';
    if (!requestForm.preferredStartAt) return 'Start date is required';
    if (!requestForm.preferredEndAt) return 'End date is required';

    const start = new Date(requestForm.preferredStartAt);
    const end = new Date(requestForm.preferredEndAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Invalid start/end date';
    }

    if (end <= start) {
      return 'End date must be after start date';
    }

    return null;
  };

  const handleSaveRequest = async () => {
    const validationError = validateRequestForm();
    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSavingRequest(true);
      setActionError('');
      const token = localStorage.getItem('token');
      const payload = {
        title: requestForm.title.trim(),
        description: requestForm.description.trim(),
        region: requestForm.region.trim(),
        preferredStartAt: new Date(requestForm.preferredStartAt).toISOString(),
        preferredEndAt: new Date(requestForm.preferredEndAt).toISOString(),
        budgetCents: parseUsdToCents(requestForm.budgetUsd),
      };

      const endpoint =
        requestModalMode === 'create'
          ? `${API_URL}/requests`
          : `${API_URL}/requests/${editingRequestId}`;
      const method = requestModalMode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await getApiError(response, 'Failed to save request');
        throw new Error(message);
      }

      closeRequestModal();
      if (token) {
        await fetchData(token);
      }
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Failed to save request'));
    } finally {
      setSavingRequest(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Delete this request?')) {
      return;
    }

    try {
      setActionError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await getApiError(response, 'Failed to delete request');
        throw new Error(message);
      }

      if (token) {
        await fetchData(token);
      }
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Failed to delete request'));
    }
  };

  const handleLoadRequestOffers = async (request: RequestItem) => {
    setSelectedRequest(request);

    try {
      setActionError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/requests/${request.id}/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const message = await getApiError(response, 'Failed to load request offers');
        throw new Error(message);
      }

      const data = (await response.json()) as { offers: RequestOffer[] };
      setRequestOffers(data.offers || []);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Failed to load request offers'));
      setRequestOffers([]);
    }
  };

  const handleMakeOfferOnSlot = async () => {
    if (!selectedSlot || !offerAmount.trim()) {
      setActionError('Offer amount is required');
      return;
    }

    const amountCents = parseUsdToCents(offerAmount);
    if (!amountCents) {
      setActionError('Offer amount must be greater than 0');
      return;
    }

    try {
      setSubmittingOffer(true);
      setActionError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          amountCents,
        }),
      });

      if (!response.ok) {
        const message = await getApiError(response, 'Failed to submit offer');
        throw new Error(message);
      }

      setSelectedSlot(null);
      setOfferAmount('');
      if (token) {
        await fetchData(token);
      }
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Failed to submit offer'));
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleSearchSlots = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const params = new URLSearchParams();
    if (slotFilters.region.trim()) params.set('region', slotFilters.region.trim());
    if (slotFilters.startAt.trim()) {
      params.set('startAt', new Date(slotFilters.startAt).toISOString());
    }
    if (slotFilters.endAt.trim()) {
      params.set('endAt', new Date(slotFilters.endAt).toISOString());
    }

    setSearchingSlots(true);
    await fetchData(token, params);
  };

  const handleResetSlotSearch = async () => {
    setSlotFilters({ region: '', startAt: '', endAt: '' });
    const token = localStorage.getItem('token');
    if (token) {
      setSearchingSlots(true);
      await fetchData(token);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="broker-dashboard">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Broker Dashboard</h1>
            {user && <p className="text-sm text-gray-600">Welcome, {user.displayName}</p>}
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {(pageError || actionError) && (
          <div
            data-testid="broker-error"
            className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError || pageError}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card data-testid="kpi-card">
            <CardHeader>
              <CardDescription>Active Requests</CardDescription>
              <CardTitle className="text-3xl">{requests.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card data-testid="kpi-card">
            <CardHeader>
              <CardDescription>Available Slots</CardDescription>
              <CardTitle className="text-3xl">{visibleSlots.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card data-testid="kpi-card">
            <CardHeader>
              <CardDescription>My Offers Sent</CardDescription>
              <CardTitle className="text-3xl">{myOffers.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="slots">Available Slots</TabsTrigger>
            <TabsTrigger value="offers">My Sent Offers</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Requests</h2>
              <Dialog
                open={isRequestModalOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    closeRequestModal();
                    return;
                  }

                  if (requestModalMode === 'create') {
                    openCreateRequestModal();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={openCreateRequestModal}
                    data-testid="create-request-button"
                  >
                    Create Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {requestModalMode === 'create' ? 'Create New Request' : 'Edit Request'}
                    </DialogTitle>
                    <DialogDescription>
                      {requestModalMode === 'create'
                        ? 'Post a request for LED trucks.'
                        : 'Update your request details.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        data-testid="request-title"
                        value={requestForm.title}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, title: e.target.value })
                        }
                        placeholder="Summer Campaign"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        data-testid="request-region"
                        value={requestForm.region}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, region: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start">Start Date</Label>
                      <Input
                        id="start"
                        data-testid="request-start"
                        type="datetime-local"
                        value={requestForm.preferredStartAt}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            preferredStartAt: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end">End Date</Label>
                      <Input
                        id="end"
                        data-testid="request-end"
                        type="datetime-local"
                        value={requestForm.preferredEndAt}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, preferredEndAt: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget">Budget (USD)</Label>
                      <Input
                        id="budget"
                        data-testid="request-budget"
                        type="number"
                        value={requestForm.budgetUsd}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, budgetUsd: e.target.value })
                        }
                        placeholder="5000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        data-testid="request-description"
                        value={requestForm.description}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleSaveRequest}
                      data-testid="save-request-button"
                      disabled={savingRequest}
                    >
                      {savingRequest
                        ? requestModalMode === 'create'
                          ? 'Posting...'
                          : 'Saving...'
                        : requestModalMode === 'create'
                          ? 'Post Request'
                          : 'Save Request'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {requests.length === 0 ? (
                <p
                  className="py-8 text-center text-muted-foreground"
                  data-testid="request-empty-state"
                >
                  No requests posted yet.
                </p>
              ) : (
                requests.map((request) => (
                  <Card key={request.id} data-testid="request-card" className="transition-colors hover:bg-slate-50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className="text-left"
                          data-testid="view-request-offers-button"
                          onClick={() => handleLoadRequestOffers(request)}
                        >
                          <CardTitle>{request.title}</CardTitle>
                          <CardDescription>{request.region}</CardDescription>
                        </button>
                        <div className="text-right">
                          <p className="font-semibold">{request.status.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.preferredStartAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2 text-sm">{request.description}</p>
                      {request.budgetCents && (
                        <p className="text-sm font-medium">Budget: ${(request.budgetCents / 100).toFixed(2)}</p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid="edit-request-button"
                          onClick={() => openEditRequestModal(request)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid="delete-request-button"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="slots">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Marketplace Search</CardTitle>
                <CardDescription>Filter available slots by region and window.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="slot-search-region">Region</Label>
                    <Input
                      id="slot-search-region"
                      data-testid="slot-search-region"
                      placeholder="DFW"
                      value={slotFilters.region}
                      onChange={(e) =>
                        setSlotFilters({ ...slotFilters, region: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slot-search-start">Start After</Label>
                    <Input
                      id="slot-search-start"
                      data-testid="slot-search-start"
                      type="datetime-local"
                      value={slotFilters.startAt}
                      onChange={(e) =>
                        setSlotFilters({ ...slotFilters, startAt: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slot-search-end">End Before</Label>
                    <Input
                      id="slot-search-end"
                      data-testid="slot-search-end"
                      type="datetime-local"
                      value={slotFilters.endAt}
                      onChange={(e) =>
                        setSlotFilters({ ...slotFilters, endAt: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleSearchSlots}
                    disabled={searchingSlots}
                    data-testid="slot-search-submit"
                  >
                    {searchingSlots ? 'Searching...' : 'Search Slots'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetSlotSearch}
                    disabled={searchingSlots}
                    data-testid="slot-search-reset"
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Slots</CardTitle>
                <CardDescription>
                  Browse and make offers on available billboard slots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {visibleSlots.length === 0 ? (
                  <p
                    className="py-8 text-center text-muted-foreground"
                    data-testid="slot-empty-state"
                  >
                    No slots available.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {visibleSlots.map((slot) => (
                      <div key={slot.id} data-testid="slot-card" className="rounded-lg border p-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-lg font-semibold">{slot.region}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(slot.startAt).toLocaleString()} →{' '}
                              {new Date(slot.endAt).toLocaleString()}
                            </p>
                            <p className="text-sm">Radius: {slot.radiusMiles} miles</p>
                          </div>
                          <Button
                            data-testid="make-offer-button"
                            onClick={() => setSelectedSlot(slot)}
                          >
                            Make Offer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <CardTitle>My Offers</CardTitle>
                <CardDescription>Track lifecycle of submitted offers.</CardDescription>
              </CardHeader>
              <CardContent>
                {myOffers.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground" data-testid="offers-empty-state">
                    No offers yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myOffers.map((offer) => (
                      <div key={offer.id} className="rounded-lg border p-4" data-testid="offer-card">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">${(offer.amountCents / 100).toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Status: <span className="capitalize">{offer.status}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(offer.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`rounded px-2 py-1 text-xs ${
                              offer.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : offer.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : offer.status === 'countered'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {offer.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {selectedSlot && (
        <Dialog open={Boolean(selectedSlot)} onOpenChange={(open) => !open && setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Offer on Slot</DialogTitle>
              <DialogDescription>
                {selectedSlot.region} - {new Date(selectedSlot.startAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="offer-amount">Offer Amount ($)</Label>
                <Input
                  id="offer-amount"
                  data-testid="offer-amount"
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="1000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSlot(null)}>
                Cancel
              </Button>
              <Button
                data-testid="submit-offer-button"
                onClick={handleMakeOfferOnSlot}
                disabled={submittingOffer}
              >
                {submittingOffer ? 'Submitting...' : 'Submit Offer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedRequest && (
        <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Offers for: {selectedRequest.title}</DialogTitle>
              <DialogDescription>Review offers from operators.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto">
              {requestOffers.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground" data-testid="request-offers-empty">
                  No offers received yet.
                </p>
              ) : (
                requestOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between rounded-lg border p-4" data-testid="request-offer-card">
                    <div>
                      <p className="text-lg font-bold">${(offer.amountCents / 100).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        From: {offer.slot?.truck?.nickname || 'Unknown Truck'}
                      </p>
                      {offer.slot && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(offer.slot.startAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`mb-2 inline-block rounded px-2 py-1 text-xs ${
                          offer.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : offer.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
