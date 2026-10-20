import assert from "node:assert/strict";
import { afterEach, describe, mock, test } from "node:test";
import ProductModel from "../models/product.model.js";
import { decrementStock, restoreStock } from "../services/stock.service.js";

const productsById = new Map();

const mockProducts = (updates) => {
  mock.method(ProductModel, "findById", (productId) => ({
    select: async () => productsById.get(String(productId)),
  }));
  mock.method(ProductModel, "findOneAndUpdate", async (...args) => {
    return updates(...args);
  });
};

afterEach(() => {
  productsById.clear();
  mock.restoreAll();
});

describe("stock service", () => {
  test("aggregates duplicate product lines before decrementing stock", async () => {
    productsById.set("product-1", {
      hasVariants: false,
      useVariantStock: false,
    });
    let updateCall;
    mockProducts((...args) => {
      updateCall = args;
      return {};
    });

    await decrementStock([
      { productId: "product-1", quantity: 1 },
      { productId: "product-1", quantity: 2, selectedVariants: {} },
    ]);

    assert.deepEqual(updateCall[0], {
      _id: "product-1",
      countIntStock: { $gte: 3 },
      $or: [
        { hasVariants: { $ne: true } },
        { useVariantStock: { $ne: true } },
      ],
    });
    assert.deepEqual(updateCall[1].$inc, { countIntStock: -3 });
  });

  test("decrements the selected active variant with an atomic stock condition", async () => {
    productsById.set("product-variant", {
      hasVariants: true,
      useVariantStock: true,
    });
    let updateCall;
    mockProducts((...args) => {
      updateCall = args;
      return {};
    });

    await decrementStock([
      {
        productId: "product-variant",
        quantity: 2,
        selectedVariants: new Map([["Color", "Blue"]]),
      },
    ]);

    assert.deepEqual(updateCall[0].variantCombinations, {
      $elemMatch: {
        "combination.Color": "Blue",
        isActive: true,
        stock: { $gte: 2 },
      },
    });
    assert.deepEqual(updateCall[1].$inc, {
      countIntStock: -2,
      "variantCombinations.$.stock": -2,
    });
  });

  test("rejects insufficient stock without applying a movement", async () => {
    productsById.set("product-1", {
      hasVariants: false,
      useVariantStock: false,
    });
    let updateCount = 0;
    mockProducts(() => {
      updateCount += 1;
      return null;
    });

    await assert.rejects(
      decrementStock([{ productId: "product-1", quantity: 1 }]),
      (error) => error.status === 409,
    );
    assert.equal(updateCount, 1);
  });

  test("rolls back earlier movements when a later product has insufficient stock", async () => {
    productsById.set("product-1", {
      hasVariants: false,
      useVariantStock: false,
    });
    productsById.set("product-2", {
      hasVariants: false,
      useVariantStock: false,
    });
    const updates = [];
    mockProducts((filter, update) => {
      updates.push({ filter, update });
      return updates.length === 2 ? null : {};
    });

    await assert.rejects(
      decrementStock([
        { productId: "product-1", quantity: 1 },
        { productId: "product-2", quantity: 1 },
      ]),
      (error) => error.status === 409,
    );

    assert.equal(updates.length, 3);
    assert.equal(updates[0].update.$inc.countIntStock, -1);
    assert.equal(updates[1].update.$inc.countIntStock, -1);
    assert.equal(updates[2].filter._id, "product-1");
    assert.equal(updates[2].update.$inc.countIntStock, 1);
  });

  test("restores an inactive variant without requiring it to be active", async () => {
    productsById.set("product-variant", {
      hasVariants: true,
      useVariantStock: true,
    });
    let updateCall;
    mockProducts((...args) => {
      updateCall = args;
      return {};
    });

    await restoreStock([
      {
        productId: "product-variant",
        quantity: 1,
        selectedVariants: { Color: "Blue" },
      },
    ]);

    assert.deepEqual(updateCall[0].variantCombinations, {
      $elemMatch: { "combination.Color": "Blue" },
    });
    assert.deepEqual(updateCall[1].$inc, {
      countIntStock: 1,
      "variantCombinations.$.stock": 1,
    });
  });
});
