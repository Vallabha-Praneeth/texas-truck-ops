import XCTest

final class LEDBillboardMarketplaceUITests: XCTestCase {
  private enum TestLane: String {
    case fastRegression = "FastRegression"
    case localAuthE2E = "LocalAuthE2E"
    case accessibility = "Accessibility"
  }

  private static let laneTests: [TestLane: Set<String>] = [
    .fastRegression: [
      "testLaunchShowsAuthEntryScreen",
      "testAuthEntryAccessibilityAudit",
      "testAuthEntryAcceptsPhoneInputHappyPath",
      "testSendOtpTransitionsToCodeEntryWhenUiTestBypassEnabled",
      "testPasswordLoginHappyPath",
    ],
    .localAuthE2E: [
      "testLocalRealOtpEndToEndWhenOptedIn",
      "testLocalRealOtpSessionPersistsAfterRelaunch",
      "testLocalRealOtpLogoutClearsSessionAfterRelaunch",
      "testLocalRealOtpInvalidCodeStaysUnauthenticated",
      "testLocalRealOtpDashboardSmokeAfterLogin",
      "testLocalRealOtpDashboardErrorStateWhenForcedByLaunchFlag",
      "testLocalRealOtpDashboardRetryShowsRetryRequestedState",
      "testLocalRealOtpDashboardRetryKeepsErrorVisibleWhenForcedByLaunchFlag",
      "testLocalRealOtpDashboardRetryRecoversAfterForcedErrorOnce",
      "testPasswordLoginHappyPath",
    ],
    .accessibility: [
      "testAuthEntryAccessibilityAudit",
      "testLocalRealOtpDashboardErrorStateAccessibilityAudit",
      "testLocalRealOtpDashboardHappyStateAccessibilityAudit",
      "testPasswordLoginHappyPath",
    ],
  ]

  private let testPhoneDigits = "8625918688"
  private let validOtp = "123456"
  private let invalidOtp = "654321"

  override func setUpWithError() throws {
    try skipIfCurrentTestIsOutsideSelectedLane()
    continueAfterFailure = false

    // Safety net: dismiss any "Open in <App>?" system alert that may appear
    // when the Expo dev-client triggers a URL-scheme routing dialog (e.g.
    // exp+com.ledbillboard.marketplace://) during dev-client initialisation.
    // Tapping Cancel is safe: it dismisses the sheet without routing the URL
    // to a different app, so the in-process app and its test assertions are
    // completely unaffected.  We explicitly do NOT tap "Open" to avoid
    // accidentally handing control to an external app mid-test.
    //
    // [D1] XCTestCase.addUIInterruptionMonitor(withDescription:handler:)
    //   https://developer.apple.com/documentation/xctest/xctestcase/1496273-adduiinterruptionmonitor
    addUIInterruptionMonitor(withDescription: "URL-scheme / Open-in system alert") { alert in
      let cancelButton = alert.buttons["Cancel"]
      guard cancelButton.exists else {
        return false   // not this kind of alert — let XCTest handle it normally
      }
      cancelButton.tap()
      return true      // handled; test continues
    }
  }

  private func skipIfCurrentTestIsOutsideSelectedLane() throws {
    let lane = selectedLane()
    guard let allowedTests = Self.laneTests[lane] else { return }

    let methodName = currentTestMethodName()
    if !allowedTests.contains(methodName) {
      throw XCTSkip("Test \(methodName) is not in lane \(lane.rawValue).")
    }
  }

  private func selectedLane() -> TestLane {
    let rawLane = ProcessInfo.processInfo.environment["XCODE_TEST_LANE"]
      ?? TestLane.fastRegression.rawValue
    return TestLane(rawValue: rawLane) ?? .fastRegression
  }

  private func currentTestMethodName() -> String {
    guard
      let range = name.range(
        of: #"test[A-Za-z0-9_]+"#,
        options: .regularExpression
      )
    else {
      return name
    }

    return String(name[range])
  }

  private func makeApp(
    fakeAuth: Bool = false,
    resetSession: Bool = false,
    additionalArguments: [String] = []
  ) -> XCUIApplication {
    let app = XCUIApplication()

    // Forward Metro host/port from the test-runner process (set via the
    // xctestplan environmentVariableEntries) to the app-under-test process.
    // AppDelegate.mm reads these values to set RCTBundleURLProvider.jsLocation
    // directly, bypassing the Expo dev-client interactive bundle picker and
    // eliminating the main trigger for "Open in <App>?" URL-routing dialogs.
    //
    // [D2] AppDelegate.mm getBundleURL — reads RCT_METRO_HOST / RCT_METRO_PORT
    //   from NSProcessInfo.processInfo.environment to set jsLocation.
    // [D3] XCUIApplication.launchEnvironment — env vars injected into the
    //   app-under-test process (distinct from the XCTest host process).
    //   https://developer.apple.com/documentation/xctest/xcuiapplication/1500477-launchenvironment
    let testEnv = ProcessInfo.processInfo.environment
    if let metroHost = testEnv["RCT_METRO_HOST"] {
      app.launchEnvironment["RCT_METRO_HOST"] = metroHost
    }
    if let metroPort = testEnv["RCT_METRO_PORT"] {
      app.launchEnvironment["RCT_METRO_PORT"] = metroPort
    }

    if fakeAuth {
      app.launchArguments += ["-UI_TEST_FAKE_AUTH", "YES"]
    }

    if resetSession {
      app.launchArguments += ["-UI_TEST_RESET_SESSION", "YES"]
    }

    app.launchArguments += additionalArguments
    return app
  }

  private func makeLocalAuthApp(
    resetSession: Bool = false,
    otpCode: String = "123456",
    additionalArguments: [String] = []
  ) -> XCUIApplication {
    makeApp(
      resetSession: resetSession,
      additionalArguments: [
        "-UI_TEST_PHONE_DIGITS",
        testPhoneDigits,
        "-UI_TEST_OTP_CODE",
        otpCode,
      ] + additionalArguments
    )
  }

  private func makePasswordAuthApp(
    resetSession: Bool = false,
    username: String = "operator@example.com",
    password: String = "password123",
    additionalArguments: [String] = []
  ) -> XCUIApplication {
    // fakeAuth: true so the password-login test is self-contained and does not
    // require a real API server.  The test verifies the UI flow (toggle to
    // password mode, pre-filled credentials, login button, dashboard screen);
    // the actual credential validation is covered by the localAuthE2E suite.
    makeApp(
      fakeAuth: true,
      resetSession: resetSession,
      additionalArguments: [
        "-UI_TEST_USERNAME",
        username,
        "-UI_TEST_PASSWORD",
        password,
      ] + additionalArguments
    )
  }

  private func element(_ app: XCUIApplication, id: String) -> XCUIElement {
    app.descendants(matching: .any)[id]
  }

  private func normalizedDigits(from value: Any?) -> String {
    let rawValue = value as? String ?? ""
    let digits = rawValue.replacingOccurrences(
      of: "[^0-9]",
      with: "",
      options: .regularExpression
    )
    return digits.hasPrefix("1") && digits.count == 11
      ? String(digits.dropFirst())
      : digits
  }

  private func typeDigitsReliably(
    _ digits: String,
    into element: XCUIElement,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    for digit in digits {
      let expectedCount = normalizedDigits(from: element.value).count + 1
      var didAcceptDigit = false

      for _ in 0..<3 {
        element.tap()
        element.typeText(String(digit))

        let acceptedDigit = NSPredicate { evaluated, _ in
          guard let field = evaluated as? XCUIElement else {
            return false
          }
          return self.normalizedDigits(from: field.value).count == expectedCount
        }

        let expectation = XCTNSPredicateExpectation(
          predicate: acceptedDigit,
          object: element
        )
        if XCTWaiter.wait(for: [expectation], timeout: 1) == .completed {
          didAcceptDigit = true
          break
        }
      }

      XCTAssertTrue(
        didAcceptDigit,
        "Failed to enter digit \(digit) into \(element)",
        file: file,
        line: line
      )
    }
  }

  private func assertDashboardReady(
    _ app: XCUIApplication,
    timeout: TimeInterval = 30,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    // Use descendants(matching: .any) rather than .otherElements because React
    // Native's SafeAreaView may not map to XCUIElementType.other in every
    // version of the runtime — .any matches regardless of element type.
    let dashboard = app.descendants(matching: .any)["operator-dashboard"]
    let dashboardReady = app.descendants(matching: .any)["operator-dashboard-ready"]
    let found = dashboard.waitForExistence(timeout: timeout)
      || dashboardReady.waitForExistence(timeout: timeout)
    XCTAssertTrue(
      found,
      "Dashboard did not appear. UI tree:\n\(app.debugDescription)",
      file: file,
      line: line
    )
  }

  private func enterPhoneAndSendOtp(
    _ app: XCUIApplication,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    let phoneInput = app.textFields["phone-input"]
    XCTAssertTrue(phoneInput.waitForExistence(timeout: 15), file: file, line: line)

    let prefilledPhonePredicate = NSPredicate { evaluated, _ in
      guard let field = evaluated as? XCUIElement else {
        return false
      }
      return self.normalizedDigits(from: field.value) == self.testPhoneDigits
    }
    let prefilledPhoneExpectation = XCTNSPredicateExpectation(
      predicate: prefilledPhonePredicate,
      object: phoneInput
    )
    _ = XCTWaiter.wait(for: [prefilledPhoneExpectation], timeout: 3)

    if normalizedDigits(from: phoneInput.value) != testPhoneDigits {
      phoneInput.tap()
      typeDigitsReliably(testPhoneDigits, into: phoneInput, file: file, line: line)
    }

    XCTAssertEqual(
      normalizedDigits(from: phoneInput.value),
      testPhoneDigits,
      file: file,
      line: line
    )

    let sendOtpButton = element(app, id: "send-otp-button")
    XCTAssertTrue(sendOtpButton.waitForExistence(timeout: 10), file: file, line: line)
    XCTAssertTrue(sendOtpButton.isEnabled, file: file, line: line)
    sendOtpButton.tap()
  }

  private func loginWithOtp(
    _ app: XCUIApplication,
    code: String = "123456",
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    enterPhoneAndSendOtp(app, file: file, line: line)

    let otpInput = app.textFields["otp-input"]
    let didShowOtpInput = otpInput.waitForExistence(timeout: 20)
    if !didShowOtpInput {
      let errorMessage = app.staticTexts["error-message"]
      let errorText = errorMessage.exists ? errorMessage.label : "none"
      let phoneInputExists = app.textFields["phone-input"].exists
      let sendOtpButtonExists = element(app, id: "send-otp-button").exists
      let dashboardExists = app.otherElements["operator-dashboard"].exists
      let dashboardReadyExists = app.otherElements["operator-dashboard-ready"].exists

      XCTFail(
        """
        otp-input did not appear after tapping Send OTP.
        error-message: \(errorText)
        phone-input exists: \(phoneInputExists)
        send-otp-button exists: \(sendOtpButtonExists)
        operator-dashboard exists: \(dashboardExists)
        operator-dashboard-ready exists: \(dashboardReadyExists)
        UI tree:
        \(app.debugDescription)
        """,
        file: file,
        line: line
      )
      return
    }
    if normalizedDigits(from: otpInput.value) != code {
      let prefilledOtpPredicate = NSPredicate { evaluated, _ in
        guard let field = evaluated as? XCUIElement else {
          return false
        }
        return self.normalizedDigits(from: field.value) == code
      }
      let prefilledOtpExpectation = XCTNSPredicateExpectation(
        predicate: prefilledOtpPredicate,
        object: otpInput
      )
      _ = XCTWaiter.wait(for: [prefilledOtpExpectation], timeout: 3)

    }
    if normalizedDigits(from: otpInput.value) != code {
      otpInput.tap()
      typeDigitsReliably(code, into: otpInput, file: file, line: line)
    }

    let verifyButton = element(app, id: "verify-button")
    XCTAssertTrue(verifyButton.waitForExistence(timeout: 10), file: file, line: line)
    XCTAssertTrue(verifyButton.isEnabled, file: file, line: line)
    verifyButton.tap()
  }

  private func loginWithPassword(
    _ app: XCUIApplication,
    username: String = "operator@example.com",
    password: String = "password123",
    usePrefilledCredentials: Bool = false,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    let togglePassword = element(app, id: "toggle-password")
    XCTAssertTrue(togglePassword.waitForExistence(timeout: 10), file: file, line: line)
    if togglePassword.isEnabled {
      togglePassword.tap()
    }

    let usernameInput = app.textFields["username-input"]
    XCTAssertTrue(usernameInput.waitForExistence(timeout: 10), file: file, line: line)
    if !usePrefilledCredentials {
      usernameInput.tap()
      usernameInput.typeText(username)
    }

    let passwordInput = app.secureTextFields["password-input"]
    XCTAssertTrue(passwordInput.waitForExistence(timeout: 10), file: file, line: line)
    if !usePrefilledCredentials {
      passwordInput.tap()
      passwordInput.typeText(password)
    }

    let loginButton = element(app, id: "password-login-button")
    XCTAssertTrue(loginButton.waitForExistence(timeout: 10), file: file, line: line)
    XCTAssertTrue(loginButton.isEnabled, file: file, line: line)
    loginButton.tap()
  }

  func testLaunchShowsAuthEntryScreen() throws {
    let app = makeApp(resetSession: true)
    app.launch()

    XCTAssertTrue(app.textFields["phone-input"].waitForExistence(timeout: 10))
    XCTAssertTrue(element(app, id: "send-otp-button").waitForExistence(timeout: 5))
    XCTAssertTrue(element(app, id: "toggle-otp").waitForExistence(timeout: 5))
    XCTAssertTrue(element(app, id: "toggle-password").waitForExistence(timeout: 5))
  }

  func testAuthEntryAccessibilityAudit() throws {
    let app = makeApp(resetSession: true)
    app.launch()

    XCTAssertTrue(app.textFields["phone-input"].waitForExistence(timeout: 10))

    if #available(iOS 17.0, *) {
      try app.performAccessibilityAudit()
    } else {
      throw XCTSkip("Automated accessibility audit requires iOS 17+.")
    }
  }

  func testAuthEntryAcceptsPhoneInputHappyPath() throws {
    let app = makeApp(
      resetSession: true,
      additionalArguments: ["-UI_TEST_PHONE_DIGITS", testPhoneDigits]
    )
    app.launch()

    let phoneInput = app.textFields["phone-input"]
    XCTAssertTrue(phoneInput.waitForExistence(timeout: 10))

    let prefilledPhonePredicate = NSPredicate { evaluated, _ in
      guard let field = evaluated as? XCUIElement else {
        return false
      }
      return self.normalizedDigits(from: field.value) == self.testPhoneDigits
    }
    let prefilledPhoneExpectation = XCTNSPredicateExpectation(
      predicate: prefilledPhonePredicate,
      object: phoneInput
    )
    XCTAssertEqual(
      XCTWaiter.wait(for: [prefilledPhoneExpectation], timeout: 5),
      .completed
    )
    XCTAssertEqual(normalizedDigits(from: phoneInput.value), testPhoneDigits)
  }

  func testSendOtpTransitionsToCodeEntryWhenUiTestBypassEnabled() throws {
    let app = makeApp(
      resetSession: true,
      additionalArguments: [
        "-UI_TEST_BYPASS_SEND_OTP",
        "YES",
        "-UI_TEST_PHONE_DIGITS",
        testPhoneDigits,
      ]
    )
    app.launch()

    enterPhoneAndSendOtp(app)

    XCTAssertTrue(app.textFields["otp-input"].waitForExistence(timeout: 10))
    XCTAssertTrue(element(app, id: "verify-button").waitForExistence(timeout: 5))
  }

  func testPasswordLoginHappyPath() throws {
    let app = makePasswordAuthApp(resetSession: true)
    app.launch()

    loginWithPassword(app, usePrefilledCredentials: true)
    assertDashboardReady(app)
  }

  func testLocalRealOtpEndToEndWhenOptedIn() throws {
    let app = makeLocalAuthApp(resetSession: true, otpCode: validOtp)
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)
  }

  func testLocalRealOtpSessionPersistsAfterRelaunch() throws {
    let app = makeLocalAuthApp(resetSession: true, otpCode: validOtp)
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)

    app.terminate()

    let relaunchedApp = makeApp()
    relaunchedApp.launch()
    assertDashboardReady(relaunchedApp)
  }

  func testLocalRealOtpLogoutClearsSessionAfterRelaunch() throws {
    let app = makeLocalAuthApp(resetSession: true, otpCode: validOtp)
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)

    let logoutButton = element(app, id: "logout-button")
    XCTAssertTrue(logoutButton.waitForExistence(timeout: 10))
    logoutButton.tap()

    XCTAssertTrue(app.textFields["phone-input"].waitForExistence(timeout: 10))
    XCTAssertTrue(element(app, id: "send-otp-button").waitForExistence(timeout: 5))

    app.terminate()

    let relaunchedApp = makeApp()
    relaunchedApp.launch()
    XCTAssertTrue(relaunchedApp.textFields["phone-input"].waitForExistence(timeout: 10))
    XCTAssertTrue(element(relaunchedApp, id: "send-otp-button").waitForExistence(timeout: 5))
    XCTAssertFalse(relaunchedApp.otherElements["operator-dashboard"].waitForExistence(timeout: 2))
  }

  func testLocalRealOtpInvalidCodeStaysUnauthenticated() throws {
    let app = makeLocalAuthApp(resetSession: true, otpCode: invalidOtp)
    app.launch()

    loginWithOtp(app, code: invalidOtp)

    let otpInput = app.textFields["otp-input"]
    let errorMessage = app.staticTexts["error-message"]
    XCTAssertTrue(
      otpInput.waitForExistence(timeout: 10) || errorMessage.waitForExistence(timeout: 10)
    )
    XCTAssertFalse(app.otherElements["operator-dashboard"].waitForExistence(timeout: 2))
  }

  func testLocalRealOtpDashboardSmokeAfterLogin() throws {
    let app = makeLocalAuthApp(resetSession: true, otpCode: validOtp)
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)

    let dashboardScroll = element(app, id: "operator-dashboard-scroll")
    XCTAssertTrue(dashboardScroll.waitForExistence(timeout: 10))
    dashboardScroll.swipeUp()
    XCTAssertTrue(element(app, id: "logout-button").waitForExistence(timeout: 5))
  }

  func testLocalRealOtpDashboardErrorStateWhenForcedByLaunchFlag() throws {
    let app = makeLocalAuthApp(
      resetSession: true,
      otpCode: validOtp,
      additionalArguments: ["-UI_TEST_FORCE_DASHBOARD_ERROR", "YES"]
    )
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)
    XCTAssertTrue(element(app, id: "operator-dashboard-error").waitForExistence(timeout: 10))
  }

  func testLocalRealOtpDashboardErrorStateAccessibilityAudit() throws {
    let app = makeLocalAuthApp(
      resetSession: true,
      otpCode: validOtp,
      additionalArguments: ["-UI_TEST_FORCE_DASHBOARD_ERROR", "YES"]
    )
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)
    XCTAssertTrue(element(app, id: "operator-dashboard-error").waitForExistence(timeout: 10))

    if #available(iOS 17.0, *) {
      try app.performAccessibilityAudit()
    } else {
      throw XCTSkip("Automated accessibility audit requires iOS 17+.")
    }
  }

  func testLocalRealOtpDashboardRetryShowsRetryRequestedState() throws {
    let app = makeLocalAuthApp(
      resetSession: true,
      otpCode: validOtp,
      additionalArguments: ["-UI_TEST_FORCE_DASHBOARD_ERROR", "YES"]
    )
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)

    let retryButton = element(app, id: "operator-dashboard-retry-button")
    XCTAssertTrue(retryButton.waitForExistence(timeout: 10))
    retryButton.tap()

    XCTAssertTrue(element(app, id: "operator-dashboard-retry-requested").waitForExistence(timeout: 10))
  }

  func testLocalRealOtpDashboardRetryKeepsErrorVisibleWhenForcedByLaunchFlag() throws {
    let app = makeLocalAuthApp(
      resetSession: true,
      otpCode: validOtp,
      additionalArguments: ["-UI_TEST_FORCE_DASHBOARD_ERROR", "YES"]
    )
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)

    let retryButton = element(app, id: "operator-dashboard-retry-button")
    XCTAssertTrue(retryButton.waitForExistence(timeout: 10))
    retryButton.tap()

    XCTAssertTrue(element(app, id: "operator-dashboard-retry-requested").waitForExistence(timeout: 10))
    XCTAssertTrue(element(app, id: "operator-dashboard-error").waitForExistence(timeout: 5))
  }

  func testLocalRealOtpDashboardRetryRecoversAfterForcedErrorOnce() throws {
    let app = makeLocalAuthApp(
      resetSession: true,
      otpCode: validOtp,
      additionalArguments: ["-UI_TEST_FORCE_DASHBOARD_ERROR_ONCE", "YES"]
    )
    app.launch()

    loginWithOtp(app, code: validOtp)
    assertDashboardReady(app)

    let dashboardError = element(app, id: "operator-dashboard-error")
    XCTAssertTrue(dashboardError.waitForExistence(timeout: 10))

    let retryButton = element(app, id: "operator-dashboard-retry-button")
    XCTAssertTrue(retryButton.waitForExistence(timeout: 10))
    retryButton.tap()

    expectation(
      for: NSPredicate(format: "exists == false"),
      evaluatedWith: dashboardError
    )
    waitForExpectations(timeout: 10)
    XCTAssertTrue(app.otherElements["operator-dashboard-ready"].waitForExistence(timeout: 5))
  }

  func testLocalRealOtpDashboardHappyStateAccessibilityAudit() throws {
    let app = makeLocalAuthApp(resetSession: true, otpCode: validOtp)
    app.launch()

    loginWithOtp(app, code: validOtp)
    XCTAssertTrue(app.otherElements["operator-dashboard-ready"].waitForExistence(timeout: 30))

    if #available(iOS 17.0, *) {
      try app.performAccessibilityAudit()
    } else {
      throw XCTSkip("Automated accessibility audit requires iOS 17+.")
    }
  }
}
