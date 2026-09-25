import { listProductsQuerySchema } from "@ecom/shared";
import { Hono } from "hono";
import { db } from "../../lib/db";
import { validate } from "../../lib/validate";
import { createProductService } from "./service";

const products = createProductService(db);

/** /api/store/products */
export const productStoreRoutes = new Hono()
  .get("/", validate("query", listProductsQuerySchema), async (c) =>
    c.json(await products.list(c.req.valid("query"))),
  )
  .get("/:handle", async (c) => c.json(await products.retrieveByHandle(c.req.param("handle"))));

/** /api/store/categories */
export const categoryStoreRoutes = new Hono().get("/", async (c) =>
  c.json(await products.listCategories()),
);
