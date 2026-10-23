// src/context/ShopContext.jsx
import { createContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../Api/axios.js";
import { useNavigate } from "react-router-dom";

export const ShopContext = createContext();
export const backend_URL = import.meta.env.VITE_BACKEND_URL;

const ShopCartProvider = ({ children }) => {
  const currency = "₹";
  const delivery_fee = 10;
  const backend_URL = import.meta.env.VITE_BACKEND_URL;

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const isInitialSync = useRef(true);
  const cartItemsRef = useRef({});
  const navigate = useNavigate();

  const replaceCartItems = (nextCart) => {
    const safeCart = nextCart && typeof nextCart === "object" ? nextCart : {};
    cartItemsRef.current = safeCart;
    setCartItems(safeCart);
  };

  // All cart writes go through this helper so rapid clicks never calculate from
  // a stale React render.
  const changeCart = (updater) => {
    const nextCart = updater(structuredClone(cartItemsRef.current || {}));
    replaceCartItems(nextCart);
    return nextCart;
  };

  const addToCart = (itemId, size = "standard", amount = 1) => {
    if (!itemId) return;
    const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
    changeCart((cartData) => {
      if (!cartData[itemId]) cartData[itemId] = {};
      cartData[itemId][size] = (Number(cartData[itemId][size]) || 0) + safeAmount;
      return cartData;
    });
  };

  const updateQuantity = (itemId, size = "standard", quantity = 0) => {
    if (!itemId) return;
    const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    changeCart((cartData) => {
      if (safeQuantity === 0) {
        if (cartData[itemId]) {
          delete cartData[itemId][size];
          if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
        }
      } else {
        if (!cartData[itemId]) cartData[itemId] = {};
        cartData[itemId][size] = safeQuantity;
      }
      return cartData;
    });
  };

  const getCartCount = () => {
    let total = 0;
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) total += Number(cartItems[productId][size]) || 0;
    }
    return total;
  };

  // CART TOTAL AMOUNT
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const productId in cartItems) {
      const itemInfo = products.find((p) => p._id === productId);
      if (!itemInfo) continue;

      for (const size in cartItems[productId]) {
        const qty = cartItems[productId][size];
        if (qty > 0) totalAmount += itemInfo.price * qty;
      }
    }
    return totalAmount;
  };

  // FETCH PRODUCT DATA
  const getProductData = async () => {
    try {
      setProductsLoading(true);
      setProductsError("");
      const res = await api.get("/api/products/list");
      if (res.data?.success) {
        setProducts(res.data.products || []);
      } else {
        setProductsError(res.data?.message || "Failed to load products");
      }
    } catch (err) {
      console.log(err);
      setProductsError("Could not load products. Please try again.");
    } finally {
      setProductsLoading(false);
    }
  };

  // GET USER CART FROM BACKEND
  const getUserCart = async (tokenParam) => {
    try {
      // console.log("CALLING GET CART WITH TOKEN:", tokenParam);

      const response = await api.post(
        "/api/cart/get",
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenParam}`,
          },
        }
      );

      if (response.data.success) {
        replaceCartItems(response.data.cartData || {});
        // mark initial server load complete so subsequent cart changes sync
        isInitialSync.current = false;
      }
    } catch (err) {
      console.log("GET CART ERROR:", err);

      if (err.response?.status === 401) {
        // token invalid or expired → clear it
        localStorage.removeItem("token");
        setToken("");
        replaceCartItems({});
        toast.info("Session expired, please login again.");
      } else {
        toast.error(err.response?.data?.message || "Failed to load cart");
      }
    }
  };

  // load products once
  useEffect(() => {
    getProductData();
  }, []);

  // load guest cart from localStorage when no token
  useEffect(() => {
    if (!token) {
      try {
        const stored =
          localStorage.getItem("cartItems") || localStorage.getItem("cart") || "{}";
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") replaceCartItems(parsed);
      } catch (err) {
        console.log("Error parsing stored cart:", err);
      }
    }
  }, []);

  // persist guest cart to localStorage when not logged in
  useEffect(() => {
    if (!token) {
      try {
        localStorage.setItem("cartItems", JSON.stringify(cartItems || {}));
      } catch (err) {
        console.log("Failed to persist cartItems:", err);
      }
    }
  }, [cartItems, token]);

  // sync cart whenever we have a token
  useEffect(() => {
    if (token) {
      getUserCart(token);
    }
  }, [token]);

  // when logged in, sync whole cart to DB whenever cartItems change (skip initial load)
  useEffect(() => {
    if (!token) return;
    if (isInitialSync.current) return;

    const sync = async () => {
      try {
        await api.post(
          "/api/cart/set",
          { cartData: cartItems },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.log("Failed to sync full cart:", err?.response?.data || err.message);
      }
    };

    const syncDelay = setTimeout(sync, 300);
    return () => clearTimeout(syncDelay);
  }, [cartItems, token]);

  // Merge guest cart (localStorage) into user's backend cart
  const mergeGuestCart = async (tokenParam) => {
    try {
      const stored = localStorage.getItem("cartItems") || localStorage.getItem("cart") || "{}";
      const guest = JSON.parse(stored);

      if (!guest || typeof guest !== "object") return;

      // fetch existing server cart
      let existing = {};
      try {
        const res = await api.post(
          "/api/cart/get",
          {},
          { headers: { Authorization: `Bearer ${tokenParam}` } }
        );
        if (res.data?.success) existing = res.data.cartData || {};
      } catch (err) {
        console.log("Failed to fetch existing cart for merge:", err?.response?.data || err.message);
      }

      // build merged map (sum quantities)
      const merged = { ...existing };

      for (const itemId in guest) {
        const sizes = guest[itemId];
        if (!sizes) continue;
        if (!merged[itemId]) merged[itemId] = {};

        for (const size in sizes) {
          const gQty = Number(sizes[size] || 0);
          if (gQty <= 0) continue;
          const eQty = Number((existing[itemId] && existing[itemId][size]) || 0);
          merged[itemId][size] = eQty + gQty;
        }
      }

      // push merged quantities to server using update endpoint
      for (const itemId in merged) {
        const sizes = merged[itemId];
        for (const size in sizes) {
          const quantity = Number(sizes[size] || 0);
          try {
            await api.post(
              "/api/cart/update",
              { itemId, size, quantity },
              { headers: { Authorization: `Bearer ${tokenParam}` } }
            );
          } catch (err) {
            console.log("Failed to sync merged item", itemId, size, err?.response?.data || err.message);
          }
        }
      }

      // clear guest cart after merge and refresh from backend
      localStorage.removeItem("cartItems");
      localStorage.removeItem("cart");
      await getUserCart(tokenParam);
    } catch (err) {
      console.log("mergeGuestCart error:", err);
    }
  };

  const value = {
    products,
    productsLoading,
    productsError,
    getProductData,
    cartDrawerOpen,
    setCartDrawerOpen,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems: replaceCartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backend_URL,
    setToken,
    token,
    mergeGuestCart,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopCartProvider;
