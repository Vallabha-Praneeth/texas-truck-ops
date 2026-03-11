#import "RNLaunchArguments.h"
#import <React/RCTBridge.h>

@implementation RNLaunchArguments

RCT_EXPORT_MODULE()

// constantsToExport is called once when the bridge initialises.
// We scan the process launch arguments for consecutive pairs
//   -UI_TEST_<KEY>  <value>
// and expose them as { UI_TEST_<KEY>: "<value>" }.
//
// Example:
//   app.launchArguments = ["-UI_TEST_RESET_SESSION", "YES"]
//   → NativeModules.RNLaunchArguments.UI_TEST_RESET_SESSION === "YES"
- (NSDictionary *)constantsToExport
{
  NSArray<NSString *> *args = [[NSProcessInfo processInfo] arguments];
  NSMutableDictionary *constants = [NSMutableDictionary dictionary];

  for (NSUInteger i = 1; i + 1 < args.count; i++) {
    NSString *arg = args[i];
    if ([arg hasPrefix:@"-UI_TEST_"]) {
      // Strip the leading dash to get the key name.
      NSString *key = [arg substringFromIndex:1];
      constants[key] = args[i + 1];
      i++; // skip the value so it isn't treated as a new key
    }
  }

  return constants;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
