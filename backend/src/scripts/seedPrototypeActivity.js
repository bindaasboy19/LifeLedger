import '../config/env.js';
import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { seedPrototypeActivity } from '../services/prototypeSeedService.js';

const run = async () => {
  await connectMongo();
  const result = await seedPrototypeActivity({ actorUid: 'admin_1' });

  // eslint-disable-next-line no-console
  console.log('Prototype activity seeded:', result);
};

run()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Prototype seeding failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
