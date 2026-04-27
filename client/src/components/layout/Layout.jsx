import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import AboutSection from "../sections/AboutSection.jsx";
import ScrollToTop from "../common/ScrollToTop.jsx";
import { isAuthenticated } from "../../store/auth.js";
import { loadCart, loadWishlist } from "../../store/actions.js";

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    let active = true;

    const hydrateStore = async () => {
      if (!isAuthenticated()) return;

      try {
        await Promise.all([loadCart(), loadWishlist()]);
      } catch (error) {
        if (active) {
          console.error("Failed to hydrate user store:", error);
        }
      }
    };

    hydrateStore();
    window.addEventListener("auth:changed", hydrateStore);

    return () => {
      active = false;
      window.removeEventListener("auth:changed", hydrateStore);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <ScrollToTop />
      <Header />

      <main className="flex-1 bg-transparent">
        <Outlet />
      </main>

      {isHome && (
        <section id="about">
          <AboutSection />
        </section>
      )}

      <Footer />
    </div>
  );
}
