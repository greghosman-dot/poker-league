import fastify from 'fastify';

let venues = [
  { id: 1, name: "The Rail Sports Pub", room: "The Poker Tour" },
  { id: 2, name: "The Tailgate Bar and Grill", room: "The Poker Tour" }
];

let promotions = [
  { id: 1, title: "Royal Flush Pot", description: "Win big on Royal Flush hands!", room: "The Poker Tour" }
];

let games = [
  { id: 1, venueId: 1, name: "Thursday Night Deepstack", day: "Thursday", time: "7:00 PM" }
];

export default async function adminRoutes(server: any) {
  server.post('/admin/login', async (request: any, reply: any) => {
    const { username, password } = request.body || {};
    if (username === 'super' && password === 'admin123') {
      return { success: true, token: 'super-admin-token', role: 'superuser' };
    }
    return reply.code(401).send({ error: 'Invalid credentials' });
  });

  server.get('/admin/venues', async () => venues);
  server.post('/admin/venues', async (request: any) => {
    const { name, room } = request.body;
    const newVenue = { id: Date.now(), name, room };
    venues.push(newVenue);
    return { success: true, venue: newVenue };
  });

  server.get('/admin/promotions', async () => promotions);
  server.post('/admin/promotions', async (request: any) => {
    const { title, description, room } = request.body;
    const newPromo = { id: Date.now(), title, description, room };
    promotions.push(newPromo);
    return { success: true, promotion: newPromo };
  });

  // Weekly Games
  server.get('/admin/games', async () => games);

  server.post('/admin/games', async (request: any) => {
    const { venueId, name, day, time } = request.body;
    const newGame = { id: Date.now(), venueId, name, day, time };
    games.push(newGame);
    return { success: true, game: newGame };
  });
}
