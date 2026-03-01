"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const index_1 = require("./index");
const drizzle_orm_1 = require("drizzle-orm");
async function seed() {
    console.log('🌱 Seeding database...');
    // 1. Create test operator organization
    console.log('Creating organization...');
    const [operatorOrg] = await index_1.db
        .insert(index_1.orgs)
        .values({
        name: 'Texas LED Trucks Inc.',
        type: 'operator',
        contactPhone: '+15551234567',
        contactEmail: 'operator@texasledtrucks.com',
        taxId: 'TX-123456789',
    })
        .onConflictDoNothing()
        .returning();
    if (!operatorOrg) {
        console.log('Organization already exists, fetching...');
        const [existingOrg] = await index_1.db
            .select()
            .from(index_1.orgs)
            .where((0, drizzle_orm_1.eq)(index_1.orgs.contactPhone, '+15551234567'))
            .limit(1);
        if (!existingOrg) {
            throw new Error('Could not find or create organization');
        }
        // Use existing org
        await seedWithOrg(existingOrg.id);
    }
    else {
        await seedWithOrg(operatorOrg.id);
    }
    console.log('✅ Seed completed successfully!');
}
async function seedWithOrg(orgId) {
    // 2. Create test operator user
    console.log('Creating operator user...');
    const [operatorUser] = await index_1.db
        .insert(index_1.users)
        .values({
        phone: '+15551234567',
        email: 'operator@test.com',
        displayName: 'Test Operator',
        primaryRole: 'operator',
    })
        .onConflictDoNothing()
        .returning();
    if (operatorUser) {
        // 3. Link user to organization
        console.log('Linking user to organization...');
        await index_1.db
            .insert(index_1.orgMembers)
            .values({
            orgId: orgId,
            userId: operatorUser.id,
            role: 'operator',
        })
            .onConflictDoNothing();
    }
    // 4. Create test trucks
    console.log('Creating trucks...');
    const [truck1] = await index_1.db
        .insert(index_1.trucks)
        .values({
        orgId: orgId,
        nickname: 'DFW Thunder',
        plateNumber: 'TX-LED-001',
        screenSizeFt: '10x20',
        baseRegion: 'Dallas-Fort Worth',
        verified: true,
    })
        .onConflictDoNothing()
        .returning();
    const [truck2] = await index_1.db
        .insert(index_1.trucks)
        .values({
        orgId: orgId,
        nickname: 'Houston Flash',
        plateNumber: 'TX-LED-002',
        screenSizeFt: '12x24',
        baseRegion: 'Houston',
        verified: true,
    })
        .onConflictDoNothing()
        .returning();
    // Get trucks if they already exist
    let finalTruck1 = truck1;
    let finalTruck2 = truck2;
    if (!truck1) {
        const [existing] = await index_1.db
            .select()
            .from(index_1.trucks)
            .where((0, drizzle_orm_1.eq)(index_1.trucks.plateNumber, 'TX-LED-001'))
            .limit(1);
        finalTruck1 = existing;
    }
    if (!truck2) {
        const [existing] = await index_1.db
            .select()
            .from(index_1.trucks)
            .where((0, drizzle_orm_1.eq)(index_1.trucks.plateNumber, 'TX-LED-002'))
            .limit(1);
        finalTruck2 = existing;
    }
    // 5. Create test availability slots
    if (finalTruck1) {
        console.log('Creating slots for DFW Thunder...');
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await index_1.db
            .insert(index_1.availabilitySlots)
            .values([
            {
                truckId: finalTruck1.id,
                startAt: tomorrow,
                endAt: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
                region: 'DFW',
                radiusMiles: 50,
                repositionAllowed: true,
                maxRepositionMiles: 100,
                notes: 'Available for morning events',
                isBooked: false,
            },
            {
                truckId: finalTruck1.id,
                startAt: nextWeek,
                endAt: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000),
                region: 'DFW',
                radiusMiles: 75,
                repositionAllowed: false,
                maxRepositionMiles: 0,
                notes: 'Full day availability',
                isBooked: false,
            },
        ])
            .onConflictDoNothing();
    }
    if (finalTruck2) {
        console.log('Creating slots for Houston Flash...');
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        await index_1.db
            .insert(index_1.availabilitySlots)
            .values({
            truckId: finalTruck2.id,
            startAt: twoDaysFromNow,
            endAt: new Date(twoDaysFromNow.getTime() + 6 * 60 * 60 * 1000),
            region: 'Houston',
            radiusMiles: 60,
            repositionAllowed: true,
            maxRepositionMiles: 50,
            notes: 'Available in Houston metro area',
            isBooked: false,
        })
            .onConflictDoNothing();
    }
    console.log('📊 Seed summary:');
    console.log('- Organization: Texas LED Trucks Inc.');
    console.log('- User: +15551234567 (operator@test.com)');
    console.log('- Trucks: DFW Thunder, Houston Flash');
    console.log('- Slots: 3 availability slots created');
}
// Run seed
seed()
    .then(async () => {
    await (0, index_1.closeDb)();
    process.exit(0);
})
    .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    await (0, index_1.closeDb)();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map