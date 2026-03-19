import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginForm } from "./authSchemas";
import { login } from "../../api/authApi";
import { setAccessToken } from "../../app/auth/authStorage";
import { useNavigate, Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    try {
      setError(null);

      const res = await login(data);
      setAccessToken(res.accessToken);

      navigate("/app");
    } catch {
      setError("Pogrešan email ili lozinka");
    }
  }

  return (
    <Card>
      <h2 className="text-2xl font-semibold">Prijava</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
        <div>
          <Input placeholder="Email" {...register("email")} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Input
            type="password"
            placeholder="Lozinka"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Prijava..." : "Uloguj se"}
        </Button>

        <p className="text-xs text-neutral-400">
          Nemaš nalog?{" "}
          <Link to="/register" className="text-white hover:underline">
            Registruj se
          </Link>
        </p>
      </form>
    </Card>
  );
}