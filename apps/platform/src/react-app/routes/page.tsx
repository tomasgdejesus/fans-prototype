import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { apiClient } from "../lib/api-client";

export default function HomePage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.api.health.$get();
      if (!response.ok) throw new Error("API health check failed");
      return response.json();
    },
    retry: false,
  });

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">FANS</h1>
      <p>
        API: {health.isPending ? "checking" : health.isError ? "unavailable" : health.data.status}
      </p>
      <nav aria-label="Main" className="flex gap-4">
        <Link to="/login">Log in</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </main>
  );
}
