import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
    let service: SmsService;
    let configService: ConfigService;

    // Mock Twilio client
    const mockTwilioClient = {
        messages: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        // Mock ConfigService
        const mockConfigService = {
            get: jest.fn((key: string) => {
                switch (key) {
                    case 'TWILIO_ACCOUNT_SID':
                        return 'ACtest123';
                    case 'TWILIO_AUTH_TOKEN':
                        return 'test_auth_token';
                    case 'TWILIO_PHONE_NUMBER':
                        return '+15551234567';
                    case 'TWILIO_VERIFY_SERVICE_SID':
                        return undefined; // Use Programmable SMS by default
                    default:
                        return undefined;
                }
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SmsService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<SmsService>(SmsService);
        configService = module.get<ConfigService>(ConfigService);

        // Mock the Twilio client creation
        // In real implementation, we'd inject this as a dependency
        (service as any).twilioClient = mockTwilioClient;
        (service as any).fromPhoneNumber = '+15551234567';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendOtp', () => {
        it('should send SMS successfully', async () => {
            // Mock successful SMS send
            mockTwilioClient.messages.create.mockResolvedValue({
                sid: 'SM1234567890',
                status: 'queued',
                errorMessage: null,
            });

            const result = await service.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('SM1234567890');
            expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
                body: 'Your LED Billboard Marketplace verification code is: 123456. Valid for 10 minutes.',
                from: '+15551234567',
                to: '+15551234567',
            });
        });

        it('should handle Twilio API errors', async () => {
            // Mock Twilio error
            const twilioError = {
                code: 21211,
                message: 'Invalid phone number',
            };
            mockTwilioClient.messages.create.mockRejectedValue(twilioError);

            const result = await service.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid phone number');
        });

        it('should handle undelivered messages', async () => {
            // Mock undelivered message
            mockTwilioClient.messages.create.mockResolvedValue({
                sid: 'SM1234567890',
                status: 'failed',
                errorMessage: 'Failed to deliver message',
            });

            const result = await service.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to deliver message');
        });

        it('should handle network failures', async () => {
            // Mock network error
            mockTwilioClient.messages.create.mockRejectedValue(new Error('Network timeout'));

            const result = await service.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network timeout');
        });

        it('should handle invalid phone number format error', async () => {
            const twilioError = {
                code: 21614,
                message: 'Invalid "To" phone number',
            };
            mockTwilioClient.messages.create.mockRejectedValue(twilioError);

            const result = await service.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid "To" phone number');
        });

        it('should handle unverified phone number in test mode', async () => {
            const twilioError = {
                code: 21608,
                message: 'Phone number is not verified',
            };
            mockTwilioClient.messages.create.mockRejectedValue(twilioError);

            const result = await service.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Phone number is not verified (test mode)');
        });
    });

    describe('getMessageStatus', () => {
        it('should fetch message status successfully', async () => {
            // Mock Twilio messages.fetch
            const mockFetch = jest.fn().mockResolvedValue({
                status: 'delivered',
                errorCode: null,
                errorMessage: null,
                dateCreated: new Date('2024-01-01'),
                dateSent: new Date('2024-01-01'),
            });

            (service as any).twilioClient = {
                messages: jest.fn(() => ({
                    fetch: mockFetch,
                })),
            };

            const status = await service.getMessageStatus('SM1234567890');

            expect(status.status).toBe('delivered');
            expect(status.errorCode).toBeNull();
        });

        it('should handle errors when fetching message status', async () => {
            const mockFetch = jest.fn().mockRejectedValue(new Error('Message not found'));

            (service as any).twilioClient = {
                messages: jest.fn(() => ({
                    fetch: mockFetch,
                })),
            };

            await expect(service.getMessageStatus('SM_INVALID')).rejects.toThrow('Message not found');
        });
    });

    describe('test mode', () => {
        it('should log to console in test mode', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Create service in test mode
            process.env.TEST_MODE = 'true';
            const testService = new SmsService(configService);

            const result = await testService.sendOtp('+15551234567', '123456');

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('test-message-id');
            expect(consoleSpy).toHaveBeenCalledWith(
                '[TEST MODE] SMS OTP for +15551234567: 123456'
            );

            consoleSpy.mockRestore();
            delete process.env.TEST_MODE;
        });
    });
});
