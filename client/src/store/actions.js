import { isAuthenticated } from "./auth.js";
import {
  getCartItems,
  setCartItems,
  getWishlistItems,
  setWishlistItems,
} from "./storage.js";

import {
  fetchMyCart,
  addCartItem,
  removeCartItem,
  updateCartItemQty,
  clearMyCart,
} from "../api/cart.js";

import {
  fetchWishlist,
  addWishlistItem,
  removeWishlistItem,
} from "../api/wishlist.js";

export async function loadCart() {
  if (!isAuthenticated()) {
    return getCartItems();
  }

  const list = await fetchMyCart();
  setCartItems(list);
  return list;
}

export async function addToCart(product, qty = 1) {
  if (!product) return [];

  if (!isAuthenticated()) {
    const list = getCartItems();
    const existing = list.find((item) => item.id === product.id);

    if (existing) existing.qty += qty;
    else list.push({ ...product, qty });

    setCartItems(list);
    return list;
  }

  await addCartItem(product.id, qty);
  return loadCart();
}

export async function removeFromCart(id) {
  if (!isAuthenticated()) {
    const list = getCartItems().filter((item) => item.id !== id);
    setCartItems(list);
    return list;
  }

  await removeCartItem(id);
  return loadCart();
}

export async function updateCartQty(id, qty) {
  if (!isAuthenticated()) {
    const list = getCartItems();
    const item = list.find((entry) => entry.id === id);

    if (item) item.qty = qty;

    setCartItems(list);
    return list;
  }

  await updateCartItemQty(id, qty);
  return loadCart();
}

export async function clearCartAll() {
  if (!isAuthenticated()) {
    setCartItems([]);
    return [];
  }

  await clearMyCart();
  setCartItems([]);
  return [];
}

export async function loadWishlist() {
  if (!isAuthenticated()) {
    return getWishlistItems();
  }

  const list = await fetchWishlist();
  setWishlistItems(list);
  return list;
}

async function getHydratedWishlist() {
  if (!isAuthenticated()) {
    return getWishlistItems();
  }

  const cached = getWishlistItems();
  if (cached.length > 0) {
    return cached;
  }

  return loadWishlist();
}

export async function toggleWishlist(product) {
  if (!product) return [];

  if (!isAuthenticated()) {
    const list = getWishlistItems();
    const exists = list.find((item) => item.id === product.id);

    const next = exists
      ? list.filter((item) => item.id !== product.id)
      : [...list, product];

    setWishlistItems(next);
    return next;
  }

  const current = await getHydratedWishlist();
  const exists = current.some((item) => item.id === product.id);

  if (exists) await removeWishlistItem(product.id);
  else await addWishlistItem(product.id);

  return loadWishlist();
}

export async function removeFromWishlist(id) {
  if (!isAuthenticated()) {
    const next = getWishlistItems().filter((item) => item.id !== id);
    setWishlistItems(next);
    return next;
  }

  await removeWishlistItem(id);
  return loadWishlist();
}

export function isWishlisted(id) {
  return getWishlistItems().some((item) => item.id === id);
}
