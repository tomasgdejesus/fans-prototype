import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import honoLogo from "./assets/hono.svg";

const logos = [
  { name: "Vite", src: viteLogo, href: "https://vite.dev" },
  { name: "React", src: reactLogo, href: "https://react.dev" },
  { name: "Hono", src: honoLogo, href: "https://hono.dev/" },
  {
    name: "Cloudflare",
    src: cloudflareLogo,
    href: "https://workers.cloudflare.com/",
  },
];

const buttonClasses =
  "cursor-pointer rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600";

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <div className="w-full max-w-3xl text-center">
        <div className="flex flex-wrap items-center justify-center gap-8">
          {logos.map(({ name, src, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <img
                src={src}
                alt={`${name} logo`}
                className="h-16 w-20 object-contain transition-transform motion-safe:group-hover:scale-110"
              />
            </a>
          ))}
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Vite + React + Hono + Cloudflare
        </h1>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setCount((count) => count + 1)}
              aria-label="increment"
              className={buttonClasses}
            >
              count is {count}
            </button>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Edit{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                src/react-app/App.tsx
              </code>{" "}
              and save to test HMR
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => {
                fetch("/api/")
                  .then((res) => res.json() as Promise<{ name: string }>)
                  .then((data) => setName(data.name));
              }}
              aria-label="get name"
              className={buttonClasses}
            >
              Name from API is: {name}
            </button>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Edit{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                src/worker/index.ts
              </code>{" "}
              to change the name
            </p>
          </section>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Click on the logos to learn more
        </p>
      </div>
    </main>
  );
}

export default App;