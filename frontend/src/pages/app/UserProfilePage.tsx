import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi } from "../../api/usersApi";
import type { UserProfileDto, PostDto } from "../../api/types";
import { assetUrl } from "../../api/assets";
import { socialApi } from "../../api/socialApi";
import Button from "../../components/ui/Button";

export default function UserProfilePage() {
  const nav = useNavigate();
  const { username } = useParams();
  const u = useMemo(() => (username ?? "").trim(), [username]);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!u) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const profileData = await usersApi.getProfile(u);
        const postsData = await usersApi.getPosts(u, 24);

        if (cancelled) return;

        setProfile(profileData);

        const visiblePosts = Array.isArray(postsData)
          ? postsData.filter(
              (p) =>
                p.content !== "[deleted]" &&
                !(p.content === null && p.postImg === null)
            )
          : [];

        setPosts(visiblePosts);
      } catch (err) {
        console.log("UserProfilePage error:", err);
        if (!cancelled) {
          setProfile(null);
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [u]);

  async function toggleFollow() {
    if (!profile) return;
    if (followBusy) return;

    const myUsername = localStorage.getItem("username");
    if (profile.username === myUsername) return;

    setFollowBusy(true);

    try {
      if (profile.isFollowedByMe) {
        await socialApi.unfollow(profile.userId);

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByMe: false,
                followersCount: Math.max(0, prev.followersCount - 1),
              }
            : prev
        );
      } else {
        await socialApi.follow(profile.userId);

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByMe: true,
                followersCount: prev.followersCount + 1,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading) return <div className="text-neutral-400">Učitavanje...</div>;
  if (!profile) return <div className="text-neutral-400">Profil nije pronađen.</div>;

  const myUsername = (localStorage.getItem("username") ?? "").trim();
  const isMyProfile =
    myUsername.length > 0 &&
    profile.username.toLowerCase() === myUsername.toLowerCase();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => nav(-1)}>
          ← Nazad
        </Button>
        <div className="text-sm text-neutral-400">Profil</div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {profile.profilePic ? (
              <img
                src={assetUrl(profile.profilePic) ?? undefined}
                className="h-14 w-14 rounded-full object-cover border border-neutral-800"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-neutral-800" />
            )}

            <div>
              <div className="text-lg font-semibold">@{profile.username}</div>
              <div className="text-sm text-neutral-400">ID: {profile.userId}</div>
            </div>
          </div>

          {isMyProfile ? (
          <Button onClick={() => nav("/app/settings")} variant="primary">
            Edit Profile
          </Button>
        ) : (
          <Button
            onClick={toggleFollow}
            disabled={followBusy}
            variant={profile.isFollowedByMe ? "danger" : "primary"}
          >
            {profile.isFollowedByMe ? "Unfollow" : "Follow"}
          </Button>
        )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="text-xs text-neutral-400">Posts</div>
            <div className="mt-1 text-xl font-semibold">{profile.postsCount}</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="text-xs text-neutral-400">Followers</div>
            <div className="mt-1 text-xl font-semibold">
              {profile.followersCount}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="text-xs text-neutral-400">Following</div>
            <div className="mt-1 text-xl font-semibold">
              {profile.followingCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-sm font-semibold">Postovi</div>

        {posts.length === 0 ? (
          <div className="text-sm text-neutral-400">Nema postova.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <div
                key={p.postId}
                onClick={() => nav(`/app/posts/${p.postId}`)}
                className="cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900/40 transition-colors"
              >
                {p.postImg ? (
                  <img
                    src={assetUrl(p.postImg) ?? undefined}
                    className="h-56 w-full rounded-t-2xl object-cover border-b border-neutral-800"
                  />
                ) : (
                  <div className="h-56 w-full rounded-t-2xl bg-neutral-900 border-b border-neutral-800" />
                )}

                <div className="p-4">
                  <div className="text-xs text-neutral-500">
                    {new Date(p.createdAt).toLocaleString("sr-RS")}
                  </div>

                  {p.content ? (
                    <div className="mt-2 text-sm text-neutral-200 line-clamp-3 whitespace-pre-wrap">
                      {p.content}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-neutral-500">—</div>
                  )}

                  <div className="mt-3 text-sm text-neutral-400">
                    ❤️ {p.likeCount} · 💬 {p.commentCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}