import { NavLink } from "react-router-dom";

const cls = ({ isActive }) =>
  "px-3 py-2 text-sm border-b-2 " +
  (isActive ? "border-black" : "border-transparent");

export default function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-2 overflow-x-auto">
        <NavLink to="/pc" className={cls}>
          PC
        </NavLink>
        <NavLink to="/pc?tag=deals" className={cls}>
          Deals
        </NavLink>
        <NavLink to="/pc?tag=new" className={cls}>
          New
        </NavLink>
        <NavLink to="/pc?tag=best" className={cls}>
          Best sellers
        </NavLink>
      </div>
    </nav>
  );
}
