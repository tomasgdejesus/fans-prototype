import { NavLink, Outlet } from "react-router";

export default function DashboardLayout() {
  return (
    <div className="space-y-6 p-6">
      <nav aria-label="Dashboard" className="flex flex-wrap gap-4">
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/courses">Courses</NavLink>
        <NavLink to="/dashboard/organizations">Organizations</NavLink>
        <NavLink to="/dashboard/orders">Orders</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
