import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  displayName: text('display_name'),
  email: text('email').unique(),
  phoneE164: text('phone_e164').unique(),
  role: text('role').default('player'),
  isDealerEligible: boolean('is_dealer_eligible').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  name: text('name'),
  status: text('status'),
  startsAt: timestamp('starts_at'),
});

console.log('Schema file created - thepokersignup version');
