"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const redis_module_1 = require("./redis/redis.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const bookings_module_1 = require("./bookings/bookings.module");
const offers_module_1 = require("./offers/offers.module");
const requests_module_1 = require("./requests/requests.module");
const organizations_module_1 = require("./organizations/organizations.module");
const trucks_module_1 = require("./trucks/trucks.module");
const slots_module_1 = require("./slots/slots.module");
const realtime_module_1 = require("./realtime/realtime.module");
const drivers_module_1 = require("./drivers/drivers.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            redis_module_1.RedisModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            bookings_module_1.BookingsModule,
            offers_module_1.OffersModule,
            requests_module_1.RequestsModule,
            organizations_module_1.OrganizationsModule,
            trucks_module_1.TrucksModule,
            slots_module_1.SlotsModule,
            realtime_module_1.RealtimeModule,
            drivers_module_1.DriversModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map