import fastify from 'fastify';

export default async function userRoutes(server: any) {
  server.post('/users/register', async (request: any, reply: any) => {
    const { displayName, email, phone } = request.body || {};

    // Simple success for now
    return { 
      success: true, 
      message: 'User registered successfully (simulated)',
      user: { id: 1, displayName, email, phone }
    };
  });
}
