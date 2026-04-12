import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterForm } from "./authSchemas";
import { register as registerApi } from "../../api/authApi";
import { setAccessToken } from "../../app/auth/authStorage";
import { useNavigate, Link } from "react-router-dom";
import type { RegisterRequest } from "../../api/types";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
  try {
    setError(null);

    const payload: RegisterRequest = {
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender as "Male" | "Female" | "Other",
      email: data.email,
      password: data.password,
    };

    const res = await registerApi(payload);
    setAccessToken(res.accessToken);
    navigate("/app");
  } catch (e: unknown) {
    // ako backend vrati validation errors, ovo će ih lepo prikazati
    const maybeAxios = e as { response?: { data?: unknown } };
    setError(
      maybeAxios?.response?.data
        ? JSON.stringify(maybeAxios.response.data)
        : "Greška pri registraciji"
    );
  }
}


  return (
    <Card>
      <h2 className="text-2xl font-semibold">Registracija</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
        <div>
          <Input placeholder="Korisničko ime" {...register("username")} />
          {errors.username && (
            <p className="mt-1 text-xs text-red-400">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
        <Input placeholder="Ime" {...register("firstName")} />
        {errors.firstName && (
            <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
        )}
        </div>

        <div>
        <Input placeholder="Prezime" {...register("lastName")} />
        {errors.lastName && (
            <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
        )}
        </div>

        <div>
        <p className="mb-2 text-sm text-neutral-300">Pol</p>

        <div className="grid grid-cols-3 gap-2">
            {/* Muški */}
            <label className="cursor-pointer">
            <input
                type="radio"
                value="Male"
                {...register("gender")}
                className="peer hidden"
            />
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300 transition
                peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-white
                hover:border-white/20">
                Muški
            </div>
            </label>

            {/* Ženski */}
            <label className="cursor-pointer">
            <input
                type="radio"
                value="Female"
                {...register("gender")}
                className="peer hidden"
            />
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300 transition
                peer-checked:border-pink-500 peer-checked:bg-pink-500/10 peer-checked:text-white
                hover:border-white/20">
                Ženski
            </div>
            </label>

            {/* Drugo */}
            <label className="cursor-pointer">
            <input
                type="radio"
                value="Other"
                {...register("gender")}
                className="peer hidden"
            />
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-300 transition
                peer-checked:border-purple-500 peer-checked:bg-purple-500/10 peer-checked:text-white
                hover:border-white/20">
                Drugo
            </div>
            </label>
        </div>

        {errors.gender && (
            <p className="mt-1 text-xs text-red-400">{errors.gender.message}</p>
        )}
        </div>

        <div>
          <Input placeholder="Email" {...register("email")} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">
              {errors.email.message}
            </p>
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
          {isSubmitting ? "Registracija..." : "Kreiraj nalog"}
        </Button>

        <p className="text-xs text-neutral-400">
          Imaš nalog?{" "}
          <Link to="/login" className="text-white hover:underline">
            Prijavi se
          </Link>
        </p>
      </form>
    </Card>
  );
}
