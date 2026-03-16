'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Proof = {
  id: string;
  bookingId: string;
  imageUrl: string;
  latitude: string | null;
  longitude: string | null;
  capturedAt: string;
  notes: string | null;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

type Booking = {
  id: string;
  brokerId: string;
  operatorId: string | null;
  slotId: string;
  amountCents: number;
  status: string;
  depositPaidAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  driverUserId: string | null;
};

type BookingWithProofs = Booking & {
  proofs: Proof[];
};

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

export default function ProofApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<BookingWithProofs[]>([]);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Proof | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchBookings(token);
  }, [router]);

  const fetchBookings = async (token: string) => {
    try {
      setLoading(true);
      setError('');

      // Get all bookings
      const bookingsRes = await fetch(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!bookingsRes.ok) {
        const message = await getApiError(bookingsRes, 'Failed to fetch bookings');
        throw new Error(message);
      }

      const allBookings = (await bookingsRes.json()) as Booking[];

      // Filter bookings with status 'awaiting_review'
      const awaitingReview = allBookings.filter((b) => b.status === 'awaiting_review');

      // Fetch proofs for each booking
      const bookingsWithProofs = await Promise.all(
        awaitingReview.map(async (booking) => {
          try {
            const proofsRes = await fetch(`${API_URL}/proofs/booking/${booking.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (proofsRes.ok) {
              const proofs = (await proofsRes.json()) as Proof[];
              return { ...booking, proofs };
            }

            return { ...booking, proofs: [] };
          } catch {
            return { ...booking, proofs: [] };
          }
        })
      );

      setBookings(bookingsWithProofs);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to load proof approvals'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proof: Proof, booking: Booking) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await fetch(`${API_URL}/proofs/${proof.id}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const message = await getApiError(response, 'Failed to approve proof');
        throw new Error(message);
      }

      // Refresh bookings
      await fetchBookings(token);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to approve proof'));
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (proof: Proof, booking: Booking) => {
    setSelectedProof(proof);
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedProof || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await fetch(`${API_URL}/proofs/${selectedProof.id}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });

      if (!response.ok) {
        const message = await getApiError(response, 'Failed to reject proof');
        throw new Error(message);
      }

      setShowRejectModal(false);
      setSelectedProof(null);
      setSelectedBooking(null);
      setRejectionReason('');

      // Refresh bookings
      await fetchBookings(token);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to reject proof'));
    } finally {
      setProcessing(false);
    }
  };

  const openImageModal = (proof: Proof) => {
    setSelectedImage(proof);
    setShowImageModal(true);
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
    <div className="min-h-screen bg-slate-50" data-testid="proof-approvals-page">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Proof Approvals</h1>
            <p className="text-sm text-gray-600">Review and approve proof of performance submissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/broker')}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div
            data-testid="proof-error"
            className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                {bookings.length === 0
                  ? 'No bookings awaiting review'
                  : `${bookings.length} booking${bookings.length === 1 ? '' : 's'} awaiting review`}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground" data-testid="empty-state">
                No proofs pending approval. All bookings are up to date.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} data-testid="booking-card" className="overflow-hidden">
                <CardHeader className="bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Booking #{booking.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Amount: ${(booking.amountCents / 100).toFixed(2)} • Status: {booking.status}
                      </CardDescription>
                    </div>
                    <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                      Awaiting Review
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {booking.proofs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No proofs uploaded yet</p>
                  ) : (
                    <div className="space-y-4">
                      {booking.proofs.map((proof) => (
                        <div
                          key={proof.id}
                          data-testid="proof-item"
                          className="rounded-lg border bg-white p-4"
                        >
                          <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">
                            {/* Image Thumbnail */}
                            <button
                              onClick={() => openImageModal(proof)}
                              className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-100 transition-transform hover:scale-105"
                              data-testid="proof-image"
                            >
                              <img
                                src={proof.imageUrl}
                                alt="Proof of performance"
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all hover:bg-black/10">
                                <span className="text-xs font-medium text-white opacity-0 transition-opacity hover:opacity-100">
                                  Click to enlarge
                                </span>
                              </div>
                            </button>

                            {/* Metadata */}
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Captured At</p>
                                <p className="text-sm">
                                  {new Date(proof.capturedAt).toLocaleString()}
                                </p>
                              </div>
                              {(proof.latitude || proof.longitude) && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">GPS Location</p>
                                  <p className="text-sm font-mono">
                                    {proof.latitude}, {proof.longitude}
                                  </p>
                                  {proof.latitude && proof.longitude && (
                                    <a
                                      href={`https://www.google.com/maps?q=${proof.latitude},${proof.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      View on Google Maps
                                    </a>
                                  )}
                                </div>
                              )}
                              {proof.notes && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Driver Notes</p>
                                  <p className="text-sm">{proof.notes}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Status</p>
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                    proof.status === 'pending_review'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : proof.status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {proof.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            {proof.status === 'pending_review' && (
                              <div className="flex flex-col gap-2 md:items-start">
                                <Button
                                  onClick={() => handleApprove(proof, booking)}
                                  disabled={processing}
                                  className="bg-green-600 hover:bg-green-700"
                                  data-testid="approve-button"
                                >
                                  {processing ? 'Approving...' : 'Approve'}
                                </Button>
                                <Button
                                  onClick={() => openRejectModal(proof, booking)}
                                  disabled={processing}
                                  variant="destructive"
                                  data-testid="reject-button"
                                >
                                  Reject
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
            ))}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proof</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this proof. The driver will be able to see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                data-testid="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Image is blurry, GPS location is incorrect, billboard not visible..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              variant="destructive"
              data-testid="confirm-reject-button"
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Proof Image</DialogTitle>
            {selectedImage && (
              <DialogDescription>
                Captured on {new Date(selectedImage.capturedAt).toLocaleString()}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
                <img
                  src={selectedImage.imageUrl}
                  alt="Proof of performance"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
                {(selectedImage.latitude || selectedImage.longitude) && (
                  <div>
                    <p className="font-medium text-muted-foreground">GPS Coordinates</p>
                    <p className="font-mono">{selectedImage.latitude}, {selectedImage.longitude}</p>
                    {selectedImage.latitude && selectedImage.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedImage.latitude},${selectedImage.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View on Google Maps
                      </a>
                    )}
                  </div>
                )}
                {selectedImage.notes && (
                  <div>
                    <p className="font-medium text-muted-foreground">Driver Notes</p>
                    <p>{selectedImage.notes}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-muted-foreground">Timestamp</p>
                  <p>{new Date(selectedImage.capturedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
