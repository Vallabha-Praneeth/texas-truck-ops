"use strict";
// Core domain types for the LED Billboard Marketplace
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = exports.OfferStatus = exports.BookingStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["OPERATOR"] = "operator";
    UserRole["BROKER"] = "broker";
    UserRole["DRIVER"] = "driver";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING_DEPOSIT"] = "pending_deposit";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["RUNNING"] = "running";
    BookingStatus["AWAITING_REVIEW"] = "awaiting_review";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["DISPUTED"] = "disputed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var OfferStatus;
(function (OfferStatus) {
    OfferStatus["PENDING"] = "pending";
    OfferStatus["COUNTERED"] = "countered";
    OfferStatus["ACCEPTED"] = "accepted";
    OfferStatus["REJECTED"] = "rejected";
    OfferStatus["EXPIRED"] = "expired";
})(OfferStatus || (exports.OfferStatus = OfferStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["PAYOUT"] = "payout";
    TransactionType["REFUND"] = "refund";
    TransactionType["FEE"] = "fee";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
//# sourceMappingURL=index.js.map