import test from "node:test";
import assert from "node:assert/strict";
import productRouter from "./product.route.js";
import categoryRouter from "./category.route.js";
import bannerV1Router from "./bannerV1.route.js";
import campaignRouter from "./campaign.route.js";

function assertAdminProtected(router, method, path) {
  const route = router.stack
    .map((layer) => layer.route)
    .find((candidate) => candidate?.path === path && candidate.methods[method]);

  assert.ok(route, `${method.toUpperCase()} ${path} should be registered`);
  assert.ok(
    route.stack.some((layer) => layer.handle.name === "adminAuth"),
    `${method.toUpperCase()} ${path} should require adminAuth`,
  );
}

test("catalog, banner, and campaign mutations require an administrator", () => {
  const protectedRoutes = [
    [productRouter, "post", "/uploadImages"],
    [productRouter, "post", "/uploadBannerImages"],
    [productRouter, "post", "/create"],
    [productRouter, "post", "/productRAM/create"],
    [productRouter, "post", "/productSIZE/create"],
    [productRouter, "post", "/productWEIGHT/create"],
    [productRouter, "post", "/generateVariantCombinations"],
    [productRouter, "put", "/updateProduct/:id"],
    [productRouter, "put", "/updateProductRAM/:id"],
    [productRouter, "put", "/updateProductWEIGHT/:id"],
    [productRouter, "put", "/updateProductSIZE/:id"],
    [productRouter, "delete", "/deleteImage"],
    [productRouter, "delete", "/deleteMultipleProduct"],
    [productRouter, "delete", "/deleteMultipleProductRAM"],
    [productRouter, "delete", "/deleteMultipleProductWEIGHT"],
    [productRouter, "delete", "/deleteMultipleProductSIZE"],
    [productRouter, "delete", "/:id"],
    [productRouter, "delete", "/productRAM/:id"],
    [productRouter, "delete", "/productWEIGHT/:id"],
    [productRouter, "delete", "/productSIZE/:id"],
    [categoryRouter, "post", "/uploadImages"],
    [categoryRouter, "post", "/create"],
    [categoryRouter, "put", "/:id"],
    [categoryRouter, "delete", "/deleteImage"],
    [categoryRouter, "delete", "/:id"],
    [bannerV1Router, "post", "/uploadImages"],
    [bannerV1Router, "post", "/create"],
    [bannerV1Router, "put", "/:id"],
    [bannerV1Router, "delete", "/deleteImage"],
    [bannerV1Router, "delete", "/:id"],
    [campaignRouter, "post", "/create"],
    [campaignRouter, "get", "/getAll"],
    [campaignRouter, "get", "/analytics-overview"],
    [campaignRouter, "get", "/analytics/:campaignId"],
  ];

  for (const [router, method, path] of protectedRoutes) {
    assertAdminProtected(router, method, path);
  }
});
