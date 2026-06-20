import { useEffect, useState, useCallback } from "react";
import {
  VStack,
  SimpleGrid,
  HStack,
  Text,
  Box,
  Skeleton,
  Badge,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filter";
import { FilterBar } from "@/components/FilterBar";
import { SectionHeader, StatCard, StatCardSkeleton, ChartCard, LoadingState } from "@/components/ui";
import { formatCurrency, formatNumber, formatCompact, formatPercent } from "@/lib/format";
import type { OverviewResponse, TierResponse, PnlResponse, MetaResponse } from "@/types";

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

const TIER_COLORS: Record<string, string> = {
  whale: "#8B5CF6",
  middle: "#06B6D4",
  retail: "#64748B",
};

export default function Home() {
  const { start, end, tier } = useFilterStore();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [tierData, setTierData] = useState<TierResponse | null>(null);
  const [pnl, setPnl] = useState<PnlResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [o, t, p, m] = await Promise.all([
        api.overview(start, end, tier),
        api.tier(start, end),
        api.pnl(start, end),
        api.meta(),
      ]);
      setOverview(o);
      setTierData(t);
      setPnl(p);
      setMeta(m);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [start, end, tier]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 300000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const pieData = tierData?.tiers.map((t) => ({
    name: t.name,
    value: t.betAmount,
    color: TIER_COLORS[t.key],
    userPct: t.userPct,
    betPct: t.betPct,
  })) || [];

  const trendData = tierData?.trend || [];

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="总览看板"
        subtitle="博彩用户行为分析核心指标概览"
      />

      <FilterBar showTier />

      {loading && !overview ? (
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <Skeleton h="340px" borderRadius="xl" />
            <Skeleton h="340px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="360px" borderRadius="xl" />
        </VStack>
      ) : !overview ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {overview.cards.map((card) => (
              <StatCard
                key={card.id}
                label={card.label}
                value={card.value}
                unit={card.unit}
                deltaPct={card.deltaPct}
                accent={card.accent}
                spark={card.spark}
              />
            ))}
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <ChartCard title="赔付率趋势" subtitle="月度赔付率变化走势" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnl?.trend || []} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => (v * 100).toFixed(0) + "%"}
                    axisLine={{ stroke: "#1e2640" }}
                    domain={[0.75, 1.05]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as Record<string, string | number>;
                      return (
                        <Box
                          bg="rgba(15,20,34,0.95)"
                          border="1px solid rgba(0,217,192,0.25)"
                          borderRadius="12px"
                          p={3}
                          minW="170px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                            {label}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">赔付率</Text>
                              <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                {(num(d.ratio) * 100).toFixed(2)}%
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">投注额</Text>
                              <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                                {formatCompact(num(d.bet))}
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="用户层级分布" subtitle="各层级投注额占比" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as Record<string, string | number>;
                      return (
                        <Box
                          bg="rgba(15,20,34,0.95)"
                          border="1px solid rgba(0,217,192,0.25)"
                          borderRadius="12px"
                          p={3}
                          minW="170px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                            {d.name}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">投注额</Text>
                              <Text fontSize="xs" color="#e2e8f0" fontWeight={700}>
                                {formatCurrency(num(d.value))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">占比</Text>
                              <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                                {num(d.betPct).toFixed(1)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <VStack spacing={2} position="absolute" bottom="20px" left="0" right="0" px={6}>
                {pieData.map((item) => (
                  <HStack key={item.name} justify="space-between" w="100%">
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="2px" bg={item.color} />
                      <Text fontSize="xs" color="#94a3b8">{item.name}</Text>
                    </HStack>
                    <Text fontSize="xs" color="#e2e8f0" fontWeight={600}>
                      {item.betPct.toFixed(1)}%
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </ChartCard>
          </SimpleGrid>

          <ChartCard title="各层级投注趋势" subtitle="月度各层级投注金额变化" height={360}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => formatCompact(v)}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as Record<string, string | number>;
                    return (
                      <Box
                        bg="rgba(15,20,34,0.95)"
                        border="1px solid rgba(0,217,192,0.25)"
                        borderRadius="12px"
                        p={3}
                        minW="170px"
                        boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                      >
                        <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                          {label}
                        </Text>
                        <VStack spacing={1} align="stretch">
                          {["whale", "middle", "retail"].map((key) => {
                            const names: Record<string, string> = { whale: "鲸鱼用户", middle: "中产用户", retail: "散户" };
                            return (
                              <HStack key={key} justify="space-between">
                                <HStack spacing={2}>
                                  <Box w="8px" h="8px" borderRadius="2px" bg={TIER_COLORS[key]} />
                                  <Text fontSize="xs" color="#94a3b8">{names[key]}</Text>
                                </HStack>
                                <Text fontSize="xs" color="#e2e8f0" fontWeight={700}>
                                  {formatCompact(num(d[key]))}
                                </Text>
                              </HStack>
                            );
                          })}
                        </VStack>
                      </Box>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="whale"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="rgba(139, 92, 246, 0.5)"
                  name="鲸鱼用户"
                />
                <Area
                  type="monotone"
                  dataKey="middle"
                  stackId="1"
                  stroke="#06B6D4"
                  fill="rgba(6, 182, 212, 0.5)"
                  name="中产用户"
                />
                <Area
                  type="monotone"
                  dataKey="retail"
                  stackId="1"
                  stroke="#64748B"
                  fill="rgba(100, 116, 139, 0.5)"
                  name="散户"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="联赛投注排行" subtitle="各联赛投注金额排行" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={pnl?.byLeague?.slice().sort((a, b) => a.bet - b.bet) || []}
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
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as Record<string, string | number>;
                    return (
                      <Box
                        bg="rgba(15,20,34,0.95)"
                        border="1px solid rgba(0,217,192,0.25)"
                        borderRadius="12px"
                        p={3}
                        minW="170px"
                        boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                      >
                        <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                          {d.league}
                        </Text>
                        <VStack spacing={1} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="#94a3b8">投注额</Text>
                            <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                              {formatCurrency(num(d.bet))}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="#94a3b8">赔付率</Text>
                            <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                              {(num(d.ratio) * 100).toFixed(2)}%
                            </Text>
                          </HStack>
                        </VStack>
                      </Box>
                    );
                  }}
                />
                <Bar dataKey="bet" fill="#00D9C0" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </VStack>
  );
}
