import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanupLegacyStoreKeys,
  clearCart,
  clearWishlist,
  getCartItems,
  getWishlistItems,
  setCartItems,
  setWishlistItems,
} from "../src/store/storage.js";

function createLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

test.beforeEach(() => {
  globalThis.window = {
    localStorage: createLocalStorage(),
    dispatchEvent() {},
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };

  clearCart();
  clearWishlist();
});

test("setCartItems and clearCart manage in-memory cart state", () => {
  setCartItems([{ id: 1, qty: 2 }]);
  assert.deepEqual(getCartItems(), [{ id: 1, qty: 2 }]);

  clearCart();
  assert.deepEqual(getCartItems(), []);
});

test("setWishlistItems and clearWishlist manage in-memory wishlist state", () => {
  setWishlistItems([{ id: 9, name: "Test" }]);
  assert.deepEqual(getWishlistItems(), [{ id: 9, name: "Test" }]);

  clearWishlist();
  assert.deepEqual(getWishlistItems(), []);
});

test("cleanupLegacyStoreKeys removes old localStorage keys", () => {
  globalThis.window.localStorage = createLocalStorage({
    accessToken: "token",
    user: '{"id":1}',
    neonplay_language: "vi",
    "cart_items:guest": "[]",
    "wishlist_items:guest": "[]",
    demo_reviews: "{}",
    keep_me: "ok",
  });

  cleanupLegacyStoreKeys();

  assert.equal(globalThis.window.localStorage.getItem("accessToken"), null);
  assert.equal(globalThis.window.localStorage.getItem("user"), null);
  assert.equal(
    globalThis.window.localStorage.getItem("neonplay_language"),
    null,
  );
  assert.equal(
    globalThis.window.localStorage.getItem("cart_items:guest"),
    null,
  );
  assert.equal(
    globalThis.window.localStorage.getItem("wishlist_items:guest"),
    null,
  );
  assert.equal(globalThis.window.localStorage.getItem("demo_reviews"), null);
  assert.equal(globalThis.window.localStorage.getItem("keep_me"), "ok");
});
