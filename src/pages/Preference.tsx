import { useEffect, useState, useCallback } from "react";
import { VStack, SimpleGrid, Skeleton, Box, Text, HStack } from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filter";
import { formatCurrency, formatNumber, formatCompact } from "@/lib/format";
import { ChartCard, SectionHeader, ExportButton, LoadingState } from "@/components/ui";
import type { PreferenceResponse, MetaResponse } from "@/types";

const BET_TYPE_COLORS: Record<string, string> = {
  让球: "#00D9C0",
  大小: "#06B6D4",
  胜平负: "#8B5CF6",
  波胆: "#FFB547",
};

interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

function ChartTooltip({
  active,
  payload,
  label,
  rows,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  label?: string | number;
  rows: (d: Record<string, unknown>) => TooltipRow[];
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload as Record<string, unknown>;
  const items = rows(d);
  if (!items.length) return null;
  return (
    <Box
      bg="rgba(15,20,34,0.95)"
      border="1px solid rgba(0,217,192,0.25)"
      borderRadius="12px"
      p={3}
      minW="170px"
      boxShadow="0 8px 24px rgba(0,0,0,0.4)"
    >
      {label !== undefined && label !== "" && (
        <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
          {label}
        </Text>
      )}
      <VStack spacing={1} align="stretch">
        {items.map((it, i) => (
          <HStack key={i} spacing={2} justify="space-between">
            <HStack spacing={2}>
              <Box w="8px" h="8px" borderRadius="2px" bg={it.color || "#00D9C0"} />
              <Text fontSize="xs" color="#94a3b8">
                {it.label}
              </Text>
            </HStack>
            <Text
              fontSize="xs"
              color="#e2e8f0"
              fontFamily='"JetBrains Mono", monospace'
              fontWeight={700}
            >
              {it.value}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
export default function Preference() {
  const { start, end, league } = useFilterStore();
  const [data, setData] = useState<PreferenceResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.preference(start, end, league);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end, league]);

  const fetchMeta = useCallback(async () => {
    try {
      setMeta(await api.meta());
    } catch {
      setMeta(null);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 300000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const betTypes = meta?.betTypes ?? data?.types.map((t) => t.type) ?? [];

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="投注偏好分析"
        subtitle="联赛与玩法的投注金额及频次分布"
        rightAction={<ExportButton module="preference" />}
      />

      {loading && !data ? (
        <VStack spacing={6} align="stretch">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <Skeleton h="340px" borderRadius="xl" />
            <Skeleton h="340px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="360px" borderRadius="xl" />
          <Skeleton h="360px" borderRadius="xl" />
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <ChartCard title="联赛投注额分布" subtitle="各联赛投注金额对比" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.leagues}
                  margin={{ top: 8, right: 20, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => formatCompact(v)}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="league"
                    width={48}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,217,192,0.06)" }}
                    content={
                      <ChartTooltip
                        rows={(d) => [
                          {
                            label: "投注额",
                            value: formatCurrency(num(d.amount)),
                            color: "#00D9C0",
                          },
                          {
                            label: "投注笔数",
                            value: formatNumber(num(d.count)),
                            color: "#475569",
                          },
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="amount" fill="#00D9C0" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="投注类型偏好" subtitle="各玩法投注金额分布" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.types} margin={{ top: 8, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                  <XAxis
                    dataKey="type"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => formatCompact(v)}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,217,192,0.06)" }}
                    content={
                      <ChartTooltip
                        rows={(d) => [
                          {
                            label: "投注额",
                            value: formatCurrency(num(d.amount)),
                            color: BET_TYPE_COLORS[String(d.type)] || "#00D9C0",
                          },
                          {
                            label: "投注笔数",
                            value: formatNumber(num(d.count)),
                            color: "#475569",
                          },
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.types.map((t) => (
                      <Cell key={t.type} fill={BET_TYPE_COLORS[t.type] || "#00D9C0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </SimpleGrid>
          <ChartCard
            title="联赛×玩法投注额矩阵"
            subtitle="各联赛不同玩法的投注金额构成"
            height={360}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.matrix} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                <XAxis
                  dataKey="league"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => formatCompact(v)}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,217,192,0.06)" }}
                  content={
                    <ChartTooltip
                      rows={(d) =>
                        betTypes
                          .filter((t) => num(d[t]) > 0)
                          .map((t) => ({
                            label: t,
                            value: formatCurrency(num(d[t])),
                            color: BET_TYPE_COLORS[t] || "#00D9C0",
                          }))
                      }
                    />
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}
                />
                {betTypes.map((t) => (
                  <Bar
                    key={t}
                    dataKey={t}
                    stackId="a"
                    fill={BET_TYPE_COLORS[t] || "#00D9C0"}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="投注金额 vs 频次对比"
            subtitle="各玩法投注金额（柱）与笔数（线）对照"
            height={360}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.types} margin={{ top: 8, right: 10, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                <XAxis
                  dataKey="type"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <YAxis
                  yAxisId="amount"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => formatCompact(v)}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,217,192,0.06)" }}
                  content={
                    <ChartTooltip
                      rows={(d) => [
                        {
                          label: "投注额",
                          value: formatCurrency(num(d.amount)),
                          color: "#00D9C0",
                        },
                        {
                          label: "投注笔数",
                          value: formatNumber(num(d.count)),
                          color: "#FFB547",
                        },
                      ]}
                    />
                  }
                />
                <Bar
                  yAxisId="amount"
                  dataKey="amount"
                  name="投注额"
                  fill="#00D9C0"
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
                <Line
                  yAxisId="count"
                  dataKey="count"
                  name="投注笔数"
                  type="monotone"
                  stroke="#FFB547"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#FFB547", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </VStack>
  );
}