export const articles = [
  {
    id: '5e1f0a2b-0001-4000-8000-000000000001',
    title: 'Hello, world: why I started this blog',
    content:
      'I want a place to write down what I learn while building software. ' +
      'Notes are easier to remember when someone else could read them, so this blog is my notebook made public.',
    publishedAt: new Date('2025-01-10T09:00:00.000Z'),
  },
  {
    id: '5e1f0a2b-0002-4000-8000-000000000002',
    title: 'My first month with Docker',
    content:
      'Everything in this project runs in containers, including npm. ' +
      'It felt strange for a week and then I stopped caring about which Node.js version is on my laptop.',
    publishedAt: new Date('2025-02-14T12:30:00.000Z'),
  },
  {
    id: '5e1f0a2b-0004-4000-8000-000000000004',
    title: 'Reads and writes are different jobs',
    content:
      'CQRS splits the code that changes data from the code that only reads it. ' +
      'Each query gets its own class and its own handler, so a read never has to know about a write.',
    publishedAt: new Date('2025-03-20T18:00:00.000Z'),
  },
  {
    id: '5e1f0a2b-0003-4000-8000-000000000003',
    title: 'A migration is a file with SQL',
    content:
      'Prisma turns schema changes into SQL files and applies them in order. ' +
      'An applied migration is never edited, a new one is added instead.',
    publishedAt: new Date('2025-03-20T18:00:00.000Z'),
  },
  {
    id: '5e1f0a2b-0005-4000-8000-000000000005',
    title: 'Scenarios are documentation that runs',
    content:
      'A Gherkin scenario describes behaviour in plain words and then checks it against the running app. ' +
      'When the words and the app disagree, the test fails.',
    publishedAt: new Date('2025-04-02T08:15:00.000Z'),
  },
];
