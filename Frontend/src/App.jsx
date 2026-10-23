import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import Home from "./pages/Home.jsx";
import Navbar from "./pages/common/Navbar.jsx";
import CartDrawer from "./pages/common/CartDrawer.jsx";
import Footer from "./pages/common/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Cart = lazy(() => import("./pages/common/Cart.jsx"));
const Products = lazy(() => import("./pages/user/Products.jsx"));
const ProductDetails = lazy(() => import("./pages/user/ProductDetails.jsx"));
const PlaceOrder = lazy(() => import("./pages/user/placeOrder.jsx"));
const Orders = lazy(() => import("./pages/user/Orders.jsx"));
const Profile = lazy(() => import("./pages/common/Profile.jsx"));
const EditProfile = lazy(() => import("./pages/common/EditProfile.jsx"));
const Unauthorized = lazy(() => import("./pages/Unauthorized.jsx"));
const LayoutUser = lazy(() => import("./pages/user/LayoutUser.jsx"));
const UserDash = lazy(() => import("./pages/user/UserDash.jsx"));
const LayoutAdmin = lazy(() => import("./pages/admin/LayoutAdmin.jsx"));
const AdminDash = lazy(() => import("./pages/admin/AdminDash.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/Products.jsx"));
const ProductsList = lazy(() => import("./pages/admin/ProductsList.jsx"));
const ProductsEdit = lazy(() => import("./pages/admin/ProductsEdit.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.jsx"));
const AdminDeliveryAgents = lazy(() => import("./pages/admin/DeliveryAgents.jsx"));
const UserDetails = lazy(() => import("./pages/admin/UserDetails.jsx"));
const AgentDetails = lazy(() => import("./pages/admin/AgentDetails.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/Orders.jsx"));
const LayoutDelivery = lazy(() => import("./pages/delivery/LayoutDelivery.jsx"));
const DeliveryDash = lazy(() => import("./pages/delivery/DeliveryDash.jsx"));
const AvailableOrders = lazy(() => import("./pages/delivery/AvailableOrders.jsx"));
const ActiveDelivery = lazy(() => import("./pages/delivery/ActiveDelivery.jsx"));
const DeliveryHistory = lazy(() => import("./pages/delivery/DeliveryHistory.jsx"));
const Earnings = lazy(() => import("./pages/delivery/Earnings.jsx"));

function App() {
  const location = useLocation();
  const isAuthPage = ["/signin", "/signup", "/forgot-password"].includes(location.pathname);
  const isShopperPage = !isAuthPage && !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/delivery");

  return (
    <>
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <CartDrawer />}

      <Suspense fallback={<div className="grid min-h-[50vh] place-items-center bg-slate-50 text-sm text-slate-500">Loading page…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<Login initialMode="forgot" />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/products" element={<Products />} />
        <Route path="/shop" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route
          path="/place-order"
          element={
            <ProtectedRoute role="user">
              <PlaceOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute role="user">
              <Orders />
            </ProtectedRoute>
          }
        />
        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <LayoutAdmin />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDash />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/add" element={<AdminProducts />} />
          <Route path="products/edit/:id" element={<ProductsEdit />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="user/:userId" element={<UserDetails />} />
          <Route path="delivery-agents" element={<AdminDeliveryAgents />} />
          <Route path="agent/:agentId" element={<AgentDetails />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>

        {/* USER */}
        <Route
          path="/user"
          element={
            <ProtectedRoute role="user">
              <LayoutUser />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/" replace />} />
        </Route>

        {/* DELIVERY */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute role={["deliveryBoy", "delivery"]}>
              <LayoutDelivery />
            </ProtectedRoute>
          }
        >
          <Route index element={<DeliveryDash />} />
          <Route path="active-delivery" element={<ActiveDelivery />} />
          <Route path="available" element={<AvailableOrders />} />
          <Route path="history" element={<DeliveryHistory />} />
          <Route path="earnings" element={<Earnings />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
      </Suspense>
      {isShopperPage && <Footer />}
    </>
  );
}

export default App;
