#import <React/RCTBridgeModule.h>

/// A React Native bridge module that exposes iOS launch arguments whose names
/// begin with "UI_TEST_" as read-only JS constants.
///
/// Usage from JavaScript:
///   import { NativeModules } from 'react-native';
///   const value = NativeModules.RNLaunchArguments?.UI_TEST_RESET_SESSION; // "YES" | undefined
///
/// The values are available at startup and never change, so they are exported
/// via constantsToExport rather than as callable methods.
@interface RNLaunchArguments : NSObject <RCTBridgeModule>
@end
