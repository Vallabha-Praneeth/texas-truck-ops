'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const phoneRegex = /^\+1[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Invalid phone number format. Must be +1 followed by 10 digits');
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send OTP');
      }

      setShowOtpInput(true);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid OTP');
      }

      const data = await response.json();

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard based on role
      const role = data.user.primaryRole;
      router.push(`/${role}`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">LED Billboard Marketplace</CardTitle>
          <CardDescription>
            {showOtpInput
              ? 'Enter the verification code sent to your phone'
              : 'Sign in with your phone number'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showOtpInput ? (
            // Phone Input Form
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  data-testid="phone-input"
                  type="tel"
                  placeholder="+15551234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: +1 followed by 10 digits
                </p>
              </div>

              {error && (
                <div
                  data-testid="error-message"
                  className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                data-testid="send-otp-button"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            // OTP Verification Form
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  data-testid="otp-input"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code
                </p>
              </div>

              {error && (
                <div
                  data-testid="error-message"
                  className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="submit"
                  data-testid="verify-button"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          )}

          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && showOtpInput && (
            <div className="mt-4 p-3 text-xs bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold mb-1">Development Mode</p>
              <p>Check your terminal logs for the OTP code</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
