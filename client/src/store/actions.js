// client/src/store/actions.js
import {
  getCartItems,
  setCartItems,
  getWishlistItems,
  setWishlistItems,
  clearCart,
  clearWishlist,
} from "./storage.js";

export function addToCart(product, qty = 1) {
  const cart = getCartItems();
  const idx = cart.findIndex((x) => x.id === product.id);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + qty;
  else cart.push({ ...product, qty });
  setCartItems(cart);
  return cart;
}

export function removeFromCart(id) {
  const cart = getCartItems().filter((x) => x.id !== id);
  setCartItems(cart);
  return cart;
}

export function updateCartQty(id, qty) {
  const cart = getCartItems().map((x) =>
    x.id === id ? { ...x, qty: Math.max(1, Number(qty) || 1) } : x,
  );
  setCartItems(cart);
  return cart;
}

export function toggleWishlist(product) {
  const wish = getWishlistItems();
  const exists = wish.some((x) => x.id === product.id);
  const next = exists
    ? wish.filter((x) => x.id !== product.id)
    : [...wish, product];
  setWishlistItems(next);
  return next;
}

export function isWishlisted(id) {
  return getWishlistItems().some((x) => x.id === id);
}

// optional helpers (nếu bạn muốn nút clear)
export function clearMyCart() {
  clearCart();
}

export function clearMyWishlist() {
  clearWishlist();
}
