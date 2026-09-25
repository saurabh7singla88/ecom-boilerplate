/// <reference path="./.sst/platform/config.d.ts" />

/**
 * All AWS infrastructure. One CloudFront distribution (the Router) serves everything:
 *   /api/*    → Api Lambda (Function URL)
 *   /admin/*  → Admin static site (S3)
 *   /*        → Storefront (Next.js via OpenNext)
 * Nothing here has an hourly cost; see docs/architecture.md for the cost breakdown.
 */
export default $config({
  app(input) {
    return {
      name: "ecom-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: { aws: { region: "ap-south-1" } },
    };
  },
  async run() {
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const logging = { retention: "2 weeks" } as const;

    const router = new sst.aws.Router("Router");

    // Background work: the API emits events, one subscriber Lambda dispatches them.
    const eventsDlq = new sst.aws.Queue("EventsDlq");
    const events = new sst.aws.Queue("Events", {
      visibilityTimeout: "2 minutes",
      dlq: { queue: eventsDlq.arn, retry: 3 },
    });
    events.subscribe(
      {
        handler: "apps/api/src/subscribers/lambda.handler",
        timeout: "60 seconds",
        memory: "512 MB",
        logging,
        environment: { DATABASE_URL: databaseUrl.value },
      },
      { batch: { partialResponses: true } },
    );

    new sst.aws.Function("Api", {
      handler: "apps/api/src/lambda.handler",
      memory: "1024 MB",
      timeout: "20 seconds",
      logging,
      link: [events],
      environment: {
        NODE_ENV: "production",
        DATABASE_URL: databaseUrl.value,
        EVENTS_QUEUE_URL: events.url,
      },
      url: { router: { instance: router, path: "/api" } },
    });

    new sst.aws.StaticSite("Admin", {
      path: "apps/admin",
      build: { command: "pnpm build", output: "dist" },
      router: { instance: router, path: "/admin" },
    });

    new sst.aws.Nextjs("Storefront", {
      path: "apps/storefront",
      router: { instance: router },
      environment: {
        // Server components call the API through the same public domain.
        API_URL: $interpolate`${router.url}/api`,
      },
    });

    return { url: router.url };
  },
});
