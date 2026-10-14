import { Given } from '@cucumber/cucumber';
import { execSync } from 'child_process';

function resetDatabase() {
  execSync('npx prisma migrate reset --force', { stdio: 'pipe' });
}

function seedDatabase() {
  execSync('npx prisma db seed', { stdio: 'pipe' });
}

Given('I use seed data', () => {
  resetDatabase();
  seedDatabase();
});

Given('I use an empty database', () => {
  resetDatabase();
});

Given(
  'the database is migrated and seeded {int} more times',
  (times: number) => {
    for (let i = 0; i < times; i++) {
      execSync('npm run database:migrate', { stdio: 'pipe' });
      execSync('npm run database:seed', { stdio: 'pipe' });
    }
  },
);
