import { api } from "@/lib/api";

export type UpdateProfileResponse = {
  id: number;
  name: string;
  headline: string;
  avatarUrl?: string;
  email?: string;
};

export async function updateProfile(form: {
  name: string;
  headline: string;
  avatarFile?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", form.name);
  fd.append("headline", form.headline);

  // avatar optional
  if (form.avatarFile) {
    fd.append("avatar", form.avatarFile);
  }

  const res = await api.patch<UpdateProfileResponse>("/users/profile", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}
