import fastify from 'fastify';

export default async function authRoutes(server: any) {
  server.post('/auth/otp/request', async (request: any, reply: any) => {
    // TODO: Send OTP (email or phone)
    return { success: true, message: 'OTP sent (simulated)' };
  });

  server.post('/auth/otp/verify', async (request: any, reply: any) => {
    // TODO: Verify OTP and create session
    return { success: true, token: 'demo-token' };
  });
}
