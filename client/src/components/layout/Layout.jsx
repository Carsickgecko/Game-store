import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import AboutSection from "../sections/AboutSection.jsx";
import ScrollToTop from "../common/ScrollToTop.jsx";

export default function Layout() {
  return (
  <div className="min-h-screen flex flex-col">
    <ScrollToTop />
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>

    <AboutSection />
    <Footer />
  </div>
);
}
