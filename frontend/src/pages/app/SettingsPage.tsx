import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { AxiosError } from "axios";
import { usersApi } from "../../api/usersApi";
import type { MyProfileDto } from "../../api/types";
import { assetUrl } from "../../api/assets";
import Button from "../../components/ui/Button";

type FormState = {
  firstName: string;
  lastName: string;
  gender: string;
  bio: string;
  profilePic: string;
};

type ApiError = {
  message?: string;
};

export default function SettingsPage() {
  const [me, setMe] = useState<MyProfileDto | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    gender: "",
    bio: "",
    profilePic: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    const value = form.profilePic.trim();
    if (!value) return null;

    if (value.startsWith("blob:")) {
      return value;
    }

    return assetUrl(value);
  }, [form.profilePic]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await usersApi.getMe();
        if (cancelled) return;

        setMe(data);
        setForm({
          firstName: data.first_Name ?? "",
          lastName: data.last_Name ?? "",
          gender: data.gender ?? "",
          bio: data.bio ?? "",
          profilePic: data.profile_Pic ?? "",
        });
      } catch (err) {
        console.error("Settings load error:", err);
        if (!cancelled) {
          setError("Neuspešno učitavanje profila.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (form.profilePic.startsWith("blob:")) {
        URL.revokeObjectURL(form.profilePic);
      }
    };
  }, [form.profilePic]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) return;

    setMessage(null);
    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError("Max veličina slike je 5MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Dozvoljeni formati su JPG, PNG i WEBP.");
      return;
    }

    if (form.profilePic.startsWith("blob:")) {
      URL.revokeObjectURL(form.profilePic);
    }

    const preview = URL.createObjectURL(file);

    setSelectedFile(file);
    setForm((prev) => ({
      ...prev,
      profilePic: preview,
    }));
  }

  async function saveProfile() {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const gender = form.gender.trim();
    const bio = form.bio.trim();

    setMessage(null);
    setError(null);

    if (!firstName) {
      setError("First name je obavezan.");
      return;
    }

    if (!lastName) {
      setError("Last name je obavezan.");
      return;
    }

    if (firstName.length > 40) {
      setError("First name može imati najviše 40 karaktera.");
      return;
    }

    if (lastName.length > 60) {
      setError("Last name može imati najviše 60 karaktera.");
      return;
    }

    if (gender && !["Male", "Female", "Other"].includes(gender)) {
      setError("Gender mora biti Male, Female ili Other.");
      return;
    }

    if (bio.length > 160) {
      setError("Bio može imati najviše 160 karaktera.");
      return;
    }

    try {
      setSavingProfile(true);

      await usersApi.updateMe({
        firstName,
        lastName,
        gender: gender || null,
        bio: bio || null,
      });

      const fresh = await usersApi.getMe();
      setMe(fresh);

      setForm((prev) => ({
        ...prev,
        firstName: fresh.first_Name ?? "",
        lastName: fresh.last_Name ?? "",
        gender: fresh.gender ?? "",
        bio: fresh.bio ?? "",
      }));

      setMessage("Profil je uspešno sačuvan.");
    } catch (err) {
      const error = err as AxiosError<ApiError>;

      console.error("saveProfile error:", error);

      setError(
        error.response?.data?.message ?? "Greška pri čuvanju profila."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveProfilePhoto() {
    setMessage(null);
    setError(null);

    if (!selectedFile) {
      setError("Izaberi sliku.");
      return;
    }

    try {
      setSavingPhoto(true);

      const upload = await usersApi.uploadProfilePhoto(selectedFile);
      await usersApi.updateProfilePic(upload.relativePath);

      const fresh = await usersApi.getMe();
      setMe(fresh);

      if (form.profilePic.startsWith("blob:")) {
        URL.revokeObjectURL(form.profilePic);
      }

      setForm((prev) => ({
        ...prev,
        profilePic: fresh.profile_Pic ?? "",
      }));

      setSelectedFile(null);
      setMessage("Profilna slika je uspešno sačuvana.");
    } catch (err) {
      const error = err as AxiosError<ApiError>;

      console.error("saveProfilePhoto error:", error);

      setError(
        error.response?.data?.message ?? "Greška pri upload-u slike."
      );
    } finally {
      setSavingPhoto(false);
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Učitavanje settings stranice...</div>;
  }

  if (!me) {
    return <div className="text-neutral-400">Profil nije učitan.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <div className="text-2xl font-semibold text-white">Settings</div>
        <div className="mt-1 text-sm text-neutral-400">
          Upravljaj svojim profilom i podacima naloga.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-sm font-semibold text-white">Account</div>

          <div className="mt-4 flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full border border-neutral-800 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full border border-neutral-800 bg-neutral-900" />
            )}

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                @{me.username}
              </div>
              <div className="truncate text-xs text-neutral-400">{me.email}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-white">
              Edit Profile
            </div>
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950 px-4 py-3 text-neutral-500">
              Privacy
            </div>
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950 px-4 py-3 text-neutral-500">
              Security
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {message ? (
            <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
            <div className="mb-5">
              <div className="text-lg font-semibold text-white">Profile photo</div>
              <div className="mt-1 text-sm text-neutral-400">
                Izaberi novu profilnu sliku i sačuvaj izmene.
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[120px_minmax(0,1fr)] md:items-start">
              <div>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-24 w-24 rounded-full border border-neutral-800 object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full border border-neutral-800 bg-neutral-900" />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-200">
                  Upload profile picture
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onFileChange}
                  className="block w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300 file:mr-4 file:rounded-xl file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-neutral-700"
                />

                <div className="mt-2 text-xs text-neutral-500">
                  Dozvoljeni formati: JPG, PNG, WEBP. Maksimalno 5MB.
                </div>

                <div className="mt-4">
                  <Button onClick={saveProfilePhoto} disabled={savingPhoto}>
                    {savingPhoto ? "Uploading..." : "Save profile picture"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
            <div className="mb-5">
              <div className="text-lg font-semibold text-white">Edit profile</div>
              <div className="mt-1 text-sm text-neutral-400">
                Ažuriraj svoje osnovne informacije.
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-200">
                  First name
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  maxLength={40}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-neutral-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-200">
                  Last name
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  maxLength={60}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-neutral-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-200">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-neutral-700"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-200">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  maxLength={160}
                  rows={4}
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-neutral-700 resize-none"
                  placeholder="Write something about yourself..."
                />
                <div className="mt-2 text-right text-xs text-neutral-500">
                  {form.bio.length}/160
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}