import { GenericContainer } from "testcontainers";
import { exec as _exec } from "child_process";
import { promisify } from "util";

const exec = promisify(_exec);

export type TestDb = {
  stop: () => Promise<void>;
  url: string;
};

export async function startTestDb(): Promise<TestDb> {
  // Start Postgres test container using GenericContainer
  const builder: any = new GenericContainer("postgres:15-alpine");
  const container = await builder
    .withEnvironment({
      POSTGRES_DB: "testdb",
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
    })
    .withExposedPorts(5432)
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(5432);
  const user = "test";
  const pass = "test";
  const db = "testdb";

  const url = `postgresql://${user}:${pass}@${host}:${port}/${db}`;

  // Use prisma migrate deploy to apply migrations to the test DB
  await exec("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    cwd: process.cwd(),
    timeout: 120000,
  });

  return {
    stop: async () => {
      await container.stop();
    },
    url,
  };
}
