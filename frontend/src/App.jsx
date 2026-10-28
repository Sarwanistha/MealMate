import { lazy, Suspense, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import CartSheet from "@/components/CartSheet";

import Home from "@/pages/Home";
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const Storefront = lazy(() => import("@/pages/Storefront"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const SellerDashboard = lazy(() => import("@/pages/seller/Dashboard"));
const SellerListings = lazy(() => import("@/pages/seller/Listings"));
const ListingForm = lazy(() => import("@/pages/seller/ListingForm"));
const SellerOrders = lazy(() => import("@/pages/seller/SellerOrders"));
const SellerProfile = lazy(() => import("@/pages/seller/SellerProfile"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Gate by login and (optionally) role. Sellers are sent to /seller, customers to /. */
function RequireAuth({ role }) {
  const { user, loading, isSeller } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="p-10 text-center text-muted-foreground">Loading…</div>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (role === "seller" && !isSeller) return <Navigate to="/" replace />;
  if (role === "customer" && isSeller) return <Navigate to="/seller" replace />;
  return <Outlet />;
}

function Shell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[2000px] flex-1 px-4 pt-4 sm:px-6 lg:px-10 xl:px-14 pb-24 md:pb-10">
        <Suspense
          fallback={
            <div className="p-10 text-center text-muted-foreground">
              Loading…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
      <CartSheet />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" richColors />
      <Suspense fallback={null}>
        <Routes>
          {/* Auth pages have their own full-screen layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/seller/:id/store" element={<Storefront />} />

            <Route element={<RequireAuth role="customer" />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderTracking />} />
            </Route>

            <Route element={<RequireAuth role="seller" />}>
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/seller/listings" element={<SellerListings />} />
              <Route path="/seller/listings/new" element={<ListingForm />} />
              <Route
                path="/seller/listings/:id/edit"
                element={<ListingForm />}
              />
              <Route path="/seller/orders" element={<SellerOrders />} />
              <Route path="/seller/profile" element={<SellerProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
