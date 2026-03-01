'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

type SlotFormData = {
  truckId: string;
  startAt: string;
  endAt: string;
  region: string;
  radiusMiles: number;
  repositionAllowed: boolean;
  maxRepositionMiles: number;
  notes: string;
};

type EditableSlot = {
  id: string;
  truckId: string;
  startAt: string;
  endAt: string;
  region: string;
  radiusMiles: number;
  repositionAllowed: boolean;
  maxRepositionMiles: number;
  notes?: string | null;
};

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  truckId?: string;
  slotToEdit?: EditableSlot | null;
}

const DEFAULT_FORM_DATA: SlotFormData = {
  truckId: '',
  startAt: '',
  endAt: '',
  region: 'DFW',
  radiusMiles: 50,
  repositionAllowed: false,
  maxRepositionMiles: 0,
  notes: '',
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

function buildFormData(slotToEdit?: EditableSlot | null, truckId?: string): SlotFormData {
  if (!slotToEdit) {
    return {
      ...DEFAULT_FORM_DATA,
      truckId: truckId ?? '',
    };
  }

  return {
    truckId: slotToEdit.truckId,
    startAt: toDateTimeLocal(slotToEdit.startAt),
    endAt: toDateTimeLocal(slotToEdit.endAt),
    region: slotToEdit.region,
    radiusMiles: slotToEdit.radiusMiles,
    repositionAllowed: slotToEdit.repositionAllowed,
    maxRepositionMiles: slotToEdit.maxRepositionMiles,
    notes: slotToEdit.notes ?? '',
  };
}

export function CreateSlotModal({
  isOpen,
  onClose,
  onSuccess,
  truckId,
  slotToEdit,
}: CreateSlotModalProps) {
  const isEditMode = Boolean(slotToEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SlotFormData>(
    buildFormData(slotToEdit, truckId)
  );

  const title = useMemo(
    () => (isEditMode ? 'Edit Availability Slot' : 'Create Availability Slot'),
    [isEditMode]
  );

  const description = useMemo(
    () =>
      isEditMode
        ? 'Update this slot to match your current availability.'
        : 'Add a new availability slot for your truck.',
    [isEditMode]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError('');
    setFormData(buildFormData(slotToEdit, truckId));
  }, [isOpen, slotToEdit, truckId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = isEditMode ? `${API_URL}/slots/${slotToEdit?.id}` : `${API_URL}/slots`;
      const method = isEditMode ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        maxRepositionMiles: formData.repositionAllowed ? formData.maxRepositionMiles : 0,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        const message = data?.error?.message || data?.message || 'Failed to save slot';
        throw new Error(message);
      }

      onSuccess();
      onClose();
      setFormData(buildFormData(null, truckId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="truckId">Truck ID *</Label>
              <Input
                id="truckId"
                data-testid="slot-truckId"
                value={formData.truckId}
                onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
                placeholder="Enter truck UUID"
                required
                disabled={loading || isEditMode}
              />
              <p className="text-xs text-muted-foreground">
                {isEditMode
                  ? 'Truck cannot be changed while editing a slot.'
                  : 'You can find this in your truck list.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <select
                id="region"
                data-testid="slot-region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full rounded border p-2"
                required
                disabled={loading}
              >
                <option value="DFW">Dallas-Fort Worth</option>
                <option value="Houston">Houston</option>
                <option value="Austin">Austin</option>
                <option value="San Antonio">San Antonio</option>
                <option value="El Paso">El Paso</option>
                <option value="RGV">Rio Grande Valley</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">Start Date & Time *</Label>
                <Input
                  id="startAt"
                  data-testid="slot-startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">End Date & Time *</Label>
                <Input
                  id="endAt"
                  data-testid="slot-endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiusMiles">Operating Radius (miles) *</Label>
              <Input
                id="radiusMiles"
                data-testid="slot-radiusMiles"
                type="number"
                min="1"
                max="500"
                value={formData.radiusMiles}
                onChange={(e) =>
                  setFormData({ ...formData, radiusMiles: Number(e.target.value) || 1 })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  id="repositionAllowed"
                  data-testid="slot-repositionAllowed"
                  type="checkbox"
                  checked={formData.repositionAllowed}
                  onChange={(e) =>
                    setFormData({ ...formData, repositionAllowed: e.target.checked })
                  }
                  disabled={loading}
                />
                <Label htmlFor="repositionAllowed">Allow repositioning</Label>
              </div>
            </div>

            {formData.repositionAllowed && (
              <div className="space-y-2">
                <Label htmlFor="maxRepositionMiles">Max Reposition Distance (miles)</Label>
                <Input
                  id="maxRepositionMiles"
                  data-testid="slot-maxRepositionMiles"
                  type="number"
                  min="0"
                  max="500"
                  value={formData.maxRepositionMiles}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxRepositionMiles: Number(e.target.value) || 0,
                    })
                  }
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                data-testid="slot-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[100px] w-full rounded border p-2"
                placeholder="Any additional details about this availability slot..."
                disabled={loading}
              />
            </div>

            {error && (
              <div
                data-testid="error-message"
                className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" data-testid="create-slot-submit" disabled={loading}>
                {loading ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Slot' : 'Create Slot'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
