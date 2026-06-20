import axios from "axios";
import type {
  MetaResponse,
  OverviewResponse,
  TierResponse,
  PreferenceResponse,
  PnlResponse,
  RetentionResponse,
  MonitorResponse,
  LoginResponse,
  LogsResponse,
  SystemUser,
  Intervention,
  SearchUserResponse,
} from "@/types";

const http = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = http;

function buildParams(params: Record<string, string | number | undefined>) {
  const result: Record<string, string | number> = {};
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") {
      result[k] = v;
    }
  }
  return result;
}

export const api = {
  async meta(): Promise<MetaResponse> {
    const res = await http.get("/meta");
    return res.data;
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await http.post("/auth/login", { username, password });
    return res.data;
  },

  async overview(start?: string, end?: string, tier?: string): Promise<OverviewResponse> {
    const res = await http.get("/overview", { params: buildParams({ start, end, tier }) });
    return res.data;
  },

  async tier(start?: string, end?: string): Promise<TierResponse> {
    const res = await http.get("/tier", { params: buildParams({ start, end }) });
    return res.data;
  },

  async preference(start?: string, end?: string, league?: string): Promise<PreferenceResponse> {
    const res = await http.get("/preference", { params: buildParams({ start, end, league }) });
    return res.data;
  },

  async pnl(start?: string, end?: string, league?: string): Promise<PnlResponse> {
    const res = await http.get("/pnl", { params: buildParams({ start, end, league }) });
    return res.data;
  },

  async retention(start?: string, end?: string, channel?: string): Promise<RetentionResponse> {
    const res = await http.get("/retention", { params: buildParams({ start, end, channel }) });
    return res.data;
  },

  async monitor(start?: string, end?: string): Promise<MonitorResponse> {
    const res = await http.get("/monitor", { params: buildParams({ start, end }) });
    return res.data;
  },

  async intervene(userId: string, action: string, operator: string): Promise<{ ok: boolean; intervention: Intervention }> {
    const res = await http.post("/monitor/intervene", { user_id: userId, action, operator });
    return res.data;
  },

  async interventions(): Promise<{ items: Intervention[] }> {
    const res = await http.get("/monitor/interventions");
    return res.data;
  },

  async users(): Promise<{ items: SystemUser[] }> {
    const res = await http.get("/users");
    return res.data;
  },

  async updateUser(userId: number, body: Record<string, unknown>): Promise<{ ok: boolean; user?: SystemUser; message?: string }> {
    const res = await http.put(`/users/${userId}`, body);
    return res.data;
  },

  async logs(page = 1, size = 20): Promise<LogsResponse> {
    const res = await http.get("/logs", { params: { page, size } });
    return res.data;
  },

  async searchUsers(q: string, limit = 10): Promise<SearchUserResponse> {
    const res = await http.get("/users/search", { params: buildParams({ q, limit }) });
    return res.data;
  },

  getExportUrl(module: string, format = "csv"): string {
    return `/api/export?module=${encodeURIComponent(module)}&format=${format}`;
  },
};
