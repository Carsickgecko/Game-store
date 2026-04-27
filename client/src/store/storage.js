let cartItems = [];
let wishlistItems = [];

function emitStoreChange() {
  window.dispatchEvent(new CustomEvent("store:changed"));
}

export function getCartItems() {
  return Array.isArray(cartItems) ? cartItems : [];
}

export function setCartItems(items) {
  cartItems = Array.isArray(items) ? [...items] : [];
  emitStoreChange();
}

export function clearCart() {
  cartItems = [];
  emitStoreChange();
}

export function getWishlistItems() {
  return Array.isArray(wishlistItems) ? wishlistItems : [];
}

export function setWishlistItems(items) {
  wishlistItems = Array.isArray(items) ? [...items] : [];
  emitStoreChange();
}

export function clearWishlist() {
  wishlistItems = [];
  emitStoreChange();
}

export function cleanupLegacyStoreKeys() {
  try {
    const storage = window.localStorage || {};
    const indexedKeys = [];

    if (typeof storage.length === "number" && typeof storage.key === "function") {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key) {
          indexedKeys.push(key);
        }
      }
    }

    const keys = [...new Set([...Object.keys(storage), ...indexedKeys])];

    keys.forEach((key) => {
      if (
        key === "cart_items" ||
        key === "wishlist_items" ||
        key === "demo_reviews" ||
        key === "accessToken" ||
        key === "user" ||
        key === "neonplay_language" ||
        key.startsWith("cart_items:") ||
        key.startsWith("wishlist_items:")
      ) {
        storage.removeItem(key);
      }
    });
  } catch {
    // Ignore cleanup failures.
  }
}
