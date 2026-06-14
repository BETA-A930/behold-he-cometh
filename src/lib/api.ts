export type DbRecord = Record<string, string>;

export interface VaultDatabase {
  id: string;
  name: string;
  fields: string[];
  records: DbRecord[];
  isPublic: boolean;
  isLocked: boolean;
  createdAt: string;
}

type RawDb = {
  id: string;
  name: string;
  fields: string[];
  records: unknown;
  is_public: boolean;
  is_locked?: boolean;
  created_at: string;
};

const rawToVault = (r: RawDb): VaultDatabase => ({
  id: r.id,
  name: r.name,
  fields: r.fields ?? [],
  records: Array.isArray(r.records) ? (r.records as DbRecord[]) : [],
  isPublic: r.is_public,
  isLocked: r.is_locked ?? false,
  createdAt: new Date(r.created_at).toLocaleDateString(),
});

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    credentials: "include",
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
}

export const api = {
  auth: {
    register: (body: {
      username: string;
      email?: string;
      recoveryPin?: string;
      isInstitution?: boolean;
      institutionType?: string;
      institutionName?: string;
    }) =>
      apiFetch<{
        vaultKey: string;
        username: string;
        isInstitution: boolean;
        institutionType: string | null;
      }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (username: string, vaultKey: string) =>
      apiFetch<{ username: string; isInstitution: boolean; institutionType: string | null }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ username, vaultKey }) }
      ),

    logout: () => apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

    recover: (username: string, recoveryPin: string) =>
      apiFetch<{ vaultKey: string }>("/api/auth/recover", {
        method: "POST",
        body: JSON.stringify({ username, recoveryPin }),
      }),

    me: () =>
      apiFetch<{ userId: string; username: string; isInstitution: boolean; institutionType: string | null }>(
        "/api/auth/me"
      ),
  },
  databases: {
    list: async (): Promise<VaultDatabase[]> => {
      const raw = await apiFetch<RawDb[]>("/api/databases");
      return raw.map(rawToVault);
    },
    create: async (name: string, fields: string[], dataKey?: string): Promise<VaultDatabase> => {
      const raw = await apiFetch<RawDb>("/api/databases", {
        method: "POST",
        body: JSON.stringify({ name, fields, dataKey: dataKey || undefined }),
      });
      return rawToVault(raw);
    },
    unlock: (id: string, dataKey: string) =>
      apiFetch<{ ok: boolean }>(`/api/databases/${id}/unlock`, {
        method: "POST",
        body: JSON.stringify({ dataKey }),
      }),
    updateRecords: async (id: string, records: DbRecord[]): Promise<VaultDatabase> => {
      const raw = await apiFetch<RawDb>(`/api/databases/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ records }),
      });
      return rawToVault(raw);
    },
    updateMeta: async (id: string, data: { name?: string; fields?: string[] }): Promise<VaultDatabase> => {
      const raw = await apiFetch<RawDb>(`/api/databases/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return rawToVault(raw);
    },
    delete: (id: string) => apiFetch<{ ok: boolean }>(`/api/databases/${id}`, { method: "DELETE" }),
  },
};
