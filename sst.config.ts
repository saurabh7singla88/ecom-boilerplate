/// <reference path="./.sst/platform/config.d.ts" />

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

    const web = new sst.aws.Nextjs("Web", {
      environment: {
        DATABASE_URL: databaseUrl.value,
      },
    });

    return { url: web.url };
  },
});
