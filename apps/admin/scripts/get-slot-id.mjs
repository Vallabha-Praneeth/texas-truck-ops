#!/usr/bin/env node

/**
 * Helper script to fetch a valid slot ID from the database
 * Used by smoke test to get a real slot for creating offers
 */

import { db, availabilitySlots } from '@led-billboard/db';
import { desc } from 'drizzle-orm';

async function getSlotId() {
    try {
        const [slot] = await db
            .select({
                id: availabilitySlots.id,
            })
            .from(availabilitySlots)
            .orderBy(desc(availabilitySlots.createdAt))
            .limit(1);

        if (!slot) {
            console.error('ERROR: No slots found in database. Please create a slot first.');
            process.exit(1);
        }

        // Output just the ID for easy parsing
        console.log(slot.id);
        process.exit(0);
    } catch (error) {
        console.error('ERROR: Failed to fetch slot ID:', error);
        process.exit(1);
    }
}

getSlotId();
