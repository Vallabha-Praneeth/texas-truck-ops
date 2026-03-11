import XCTest

final class LEDBillboardMarketplaceTests: XCTestCase {
  override func setUpWithError() throws {
    let lane = ProcessInfo.processInfo.environment["XCODE_TEST_LANE"] ?? "FastRegression"
    if lane != "FastRegression" {
      throw XCTSkip("Unit tests run only in FastRegression lane.")
    }
  }

  func testNormalizeUSPhoneInputFormatsNationalNumber() {
    XCTAssertEqual(
      normalizeUSPhoneInput("5551234567"),
      "+15551234567"
    )
  }

  func testPhoneValidationRejectsAlphabeticJunkInput() {
    let normalized = normalizeUSPhoneInput("abc-def")
    XCTAssertEqual(normalized, "+1")
    XCTAssertFalse(isValidUSPhoneInput(normalized))
  }

  private func normalizeUSPhoneInput(_ value: String) -> String {
    let digits = value.filter(\.isNumber)
    let nationalNumber: Substring

    if digits.hasPrefix("1") {
      nationalNumber = digits.dropFirst()
    } else {
      nationalNumber = Substring(digits)
    }

    return "+1" + String(nationalNumber.prefix(10))
  }

  private func isValidUSPhoneInput(_ value: String) -> Bool {
    value.range(of: #"^\+1\d{10}$"#, options: .regularExpression) != nil
  }
}
