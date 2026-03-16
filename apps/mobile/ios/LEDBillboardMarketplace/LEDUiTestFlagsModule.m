#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface LEDUiTestFlagsModule : NSObject <RCTBridgeModule>
@end

@implementation LEDUiTestFlagsModule

RCT_EXPORT_MODULE(LEDUiTestFlags)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSMutableDictionary<NSString *, id> *flags = [NSMutableDictionary dictionary];

  NSArray<NSString *> *booleanKeys = @[
    @"UI_TEST_FAKE_AUTH",
    @"UI_TEST_RESET_SESSION",
    @"UI_TEST_BYPASS_SEND_OTP",
    @"UI_TEST_FORCE_DASHBOARD_ERROR",
    @"UI_TEST_FORCE_DASHBOARD_ERROR_ONCE"
  ];

  for (NSString *key in booleanKeys) {
    if ([defaults objectForKey:key] != nil) {
      flags[key] = @([defaults boolForKey:key]);
    }
  }

  NSArray<NSString *> *stringKeys = @[
    @"UI_TEST_PHONE_DIGITS",
    @"UI_TEST_OTP_CODE",
    @"UI_TEST_USERNAME",
    @"UI_TEST_PASSWORD",
    @"XCODE_TEST_LANE"
  ];

  for (NSString *key in stringKeys) {
    NSString *value = [defaults stringForKey:key];
    if (value.length > 0) {
      flags[key] = value;
    }
  }

  return flags;
}

@end
