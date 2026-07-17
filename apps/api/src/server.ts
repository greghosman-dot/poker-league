import fastify from 'fastify';
import authRoutes from './modules/auth.js';
import userRoutes from './modules/users.js';
import adminRoutes from './modules/admin.js';

const server = fastify({ logger: true });

// Enable CORS
server.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  done();
});

server.get('/health', async () => ({ status: 'ok', app: 'thepokersignup' }));

authRoutes(server);
userRoutes(server);
adminRoutes(server);

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
    console.log('🚀 thepokersignup API is running');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
