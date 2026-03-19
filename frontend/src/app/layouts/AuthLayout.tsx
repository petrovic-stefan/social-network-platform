import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Left: branding */}
        <div className="hidden lg:flex flex-col justify-between p-10">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/10" />
            <div>
              <div className="text-lg font-semibold tracking-tight">SocialNetwork</div>
              <div className="text-sm text-neutral-400">Serious UI • Tailwind v4</div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight">
              Dobrodošao nazad.
              <span className="block text-neutral-400">Prijavi se i nastavi.</span>
            </h1>
            <p className="max-w-md text-neutral-400">
              Login/register layout spreman za validacije, API, dark mode i ozbiljan design.
            </p>
          </div>

          <div className="text-xs text-neutral-500">
            © {new Date().getFullYear()} SocialNetwork • Stefan
          </div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
