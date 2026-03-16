'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Booking = {
  id: string;
  status: string;
};

interface ProofApprovalsBadgeProps {
  className?: string;
}

/**
 * Badge component showing count of bookings awaiting proof review
 * Fetches count on mount and displays red badge if > 0
 */
export function ProofApprovalsBadge({ className = '' }: ProofApprovalsBadgeProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const bookings = (await response.json()) as Booking[];
          const awaitingReview = bookings.filter((b) => b.status === 'awaiting_review');
          setCount(awaitingReview.length);
        }
      } catch (error) {
        // Silent fail - badge just won't show
        console.error('Failed to fetch proof approvals count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading || count === 0) {
    return null;
  }

  return (
    <span
      className={`ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white ${className}`}
      data-testid="proof-approvals-badge"
    >
      {count}
    </span>
  );
}
