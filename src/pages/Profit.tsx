import { useEffect, useState, useCallback, useMemo } from "react";
import {
  VStack,
  SimpleGrid,
  HStack,
  Text,
  Box,
  Skeleton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Area,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filter";
import { FilterBar } from "@/components/FilterBar";
import {
  SectionHeader,
  ChartCard,
  ExportButton,
  LoadingState,
  StatusBadge,
  AlertCard,
  CompareStatCard,
} from "@/components/ui";
import { formatCurrency, formatNumber, formatCompact, formatPercent } from "@/lib/format";
import type { PnlResponse, MetaResponse } from "@/types";

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

const STATUS_COLORS: Record<string, string> = {
  normal: "#22c55e",
  warning: "#fbbf24",
  danger: "#ef4444",
};

const BET_TYPE_COLORS: Record<string, string> = {
  让球: "#00D9C0",
  大小: "#06B6D4",
  胜平负: "#8B5CF6",
  波胆: "#FFB547",
};

const CURRENT_COLOR = "#00D9C0";
const COMPARE_COLOR = "#F59E0B";

function mergeTrend(a: PnlResponse["trend"], b: PnlResponse["trend"]) {
  const maxLen = Math.max(a.length, b.length);
  const result: Record<string, string | number>[] = [];
  for (let i = 0; i < maxLen; i++) {
    const item: Record<string, string | number> = {
      month: `第${i + 1}月`,
    };
    if (a[i]) {
      item.month_A = a[i].month;
      item.bet_A = a[i].bet;
      item.payout_A = a[i].payout;
      item.ratio_A = a[i].ratio;
    }
    if (b[i]) {
      item.month_B = b[i].month;
      item.bet_B = b[i].bet;
      item.payout_B = b[i].payout;
      item.ratio_B = b[i].ratio;
    }
    result.push(item);
  }
  return result;
}

export default function Profit() {
  const { start, end, compareMode, compareStart, compareEnd, league } = useFilterStore();
  const [data, setData] = useState<PnlResponse | null>(null);
  const [cmpData, setCmpData] = useState<PnlResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([api.pnl(start, end, league), api.meta()]);
      setData(p);
      setMeta(m);

      if (compareMode) {
        const [cp] = await Promise.all([api.pnl(compareStart, compareEnd, league)]);
        setCmpData(cp);
      } else {
        setCmpData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end, league, compareMode, compareStart, compareEnd]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 300000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const getStatusColor = (ratio: number) => {
    if (ratio > 0.98) return "#ef4444";
    if (ratio > 0.93) return "#fbbf24";
    return "#22c55e";
  };

  const mergedTrend = useMemo(
    () => (cmpData ? mergeTrend(data?.trend || [], cmpData?.trend || []) : data?.trend || []),
    [data, cmpData]
  );

  const showCompare = compareMode && data && cmpData;

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="盈亏分析"
        subtitle="平台整体赔付率、各联赛与玩法盈亏分析"
        rightAction={<ExportButton module="pnl" />}
      />

      <FilterBar showLeague showCompare />

      {loading && !data ? (
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Skeleton h="120px" borderRadius="xl" />
            <Skeleton h="120px" borderRadius="xl" />
            <Skeleton h="120px" borderRadius="xl" />
            <Skeleton h="120px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="340px" borderRadius="xl" />
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <Skeleton h="340px" borderRadius="xl" />
            <Skeleton h="340px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="400px" borderRadius="xl" />
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          {showCompare ? (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
              <CompareStatCard
                label="总投注额"
                currentValue={data.summary.totalBet}
                prevValue={cmpData.summary.totalBet}
                unit="元"
                accent={CURRENT_COLOR}
              />
              <CompareStatCard
                label="总派彩"
                currentValue={data.summary.totalPayout}
                prevValue={cmpData.summary.totalPayout}
                unit="元"
                accent="#8B5CF6"
              />
              <CompareStatCard
                label="赔付率"
                currentValue={+(data.summary.payoutRatio * 100).toFixed(2)}
                prevValue={+(cmpData.summary.payoutRatio * 100).toFixed(2)}
                unit="%"
                accent={STATUS_COLORS[data.summary.status]}
              />
              <CompareStatCard
                label="平台盈利"
                currentValue={data.summary.netResult}
                prevValue={cmpData.summary.netResult}
                unit="元"
                accent={data.summary.netResult >= 0 ? "#22c55e" : "#ef4444"}
                showSign
              />
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Box
                bg="rgba(15, 20, 34, 0.7)"
                border="1px solid rgba(30, 38, 64, 0.8)"
                borderRadius="16px"
                p={5}
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} w="100%" h="3px" bg={CURRENT_COLOR} />
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" color="#64748b">总投注额</Text>
                  <HStack align="baseline" spacing={1}>
                    <Text
                      fontSize="2xl"
                      fontWeight={800}
                      color="#e2e8f0"
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {formatCurrency(data.summary.totalBet)}
                    </Text>
                    <Text fontSize="xs" color="#64748b">元</Text>
                  </HStack>
                </VStack>
              </Box>
              <Box
                bg="rgba(15, 20, 34, 0.7)"
                border="1px solid rgba(30, 38, 64, 0.8)"
                borderRadius="16px"
                p={5}
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} w="100%" h="3px" bg="#8B5CF6" />
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" color="#64748b">总派彩</Text>
                  <HStack align="baseline" spacing={1}>
                    <Text
                      fontSize="2xl"
                      fontWeight={800}
                      color="#e2e8f0"
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {formatCurrency(data.summary.totalPayout)}
                    </Text>
                    <Text fontSize="xs" color="#64748b">元</Text>
                  </HStack>
                </VStack>
              </Box>
              <Box
                bg="rgba(15, 20, 34, 0.7)"
                border="1px solid rgba(30, 38, 64, 0.8)"
                borderRadius="16px"
                p={5}
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} w="100%" h="3px" bg={STATUS_COLORS[data.summary.status]} />
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between" align="center">
                    <Text fontSize="xs" color="#64748b">赔付率</Text>
                    <StatusBadge status={data.summary.status} />
                  </HStack>
                  <HStack align="baseline" spacing={1}>
                    <Text
                      fontSize="2xl"
                      fontWeight={800}
                      color={STATUS_COLORS[data.summary.status]}
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {(data.summary.payoutRatio * 100).toFixed(2)}
                    </Text>
                    <Text fontSize="xs" color="#64748b">%</Text>
                  </HStack>
                </VStack>
              </Box>
              <Box
                bg="rgba(15, 20, 34, 0.7)"
                border="1px solid rgba(30, 38, 64, 0.8)"
                borderRadius="16px"
                p={5}
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} w="100%" h="3px" bg="#22c55e" />
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" color="#64748b">平台盈利</Text>
                  <HStack align="baseline" spacing={1}>
                    <Text
                      fontSize="2xl"
                      fontWeight={800}
                      color={data.summary.netResult >= 0 ? "#22c55e" : "#ef4444"}
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {data.summary.netResult >= 0 ? "+" : ""}
                      {formatCurrency(Math.abs(data.summary.netResult))}
                    </Text>
                    <Text fontSize="xs" color="#64748b">元</Text>
                  </HStack>
                </VStack>
              </Box>
            </SimpleGrid>
          )}

          {data.alerts.length > 0 && (
            <VStack spacing={2}>
              {data.alerts.slice(0, 3).map((alert, i) => (
                <AlertCard
                  key={i}
                  severity={alert.severity}
                  message={`${alert.month}：${alert.message}（赔付率 ${(alert.ratio * 100).toFixed(2)}%）`}
                />
              ))}
            </VStack>
          )}

          <ChartCard
            title={compareMode ? "赔付率趋势（对比模式）" : "赔付率趋势"}
            subtitle={compareMode ? "A = 当前时段，B = 对比时段" : "月度赔付率与投注额变化"}
            height={380}
            rightAction={
              compareMode ? (
                <HStack spacing={2}>
                  <HStack spacing={1}>
                    <Box w="10px" h="10px" borderRadius="2px" bg={CURRENT_COLOR} />
                    <Text fontSize="10px" color="#94a3b8">A</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Box w="10px" h="10px" borderRadius="2px" bg={COMPARE_COLOR} />
                    <Text fontSize="10px" color="#94a3b8">B</Text>
                  </HStack>
                </HStack>
              ) : undefined
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              {compareMode ? (
                <LineChart data={mergedTrend} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => formatCompact(v)}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
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
                          minW="220px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                            {label}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            {d.bet_A !== undefined && (
                              <>
                                <Text fontSize="10px" color={CURRENT_COLOR} fontWeight={600}>
                                  A · {d.month_A}
                                </Text>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="#94a3b8">投注额</Text>
                                  <Text fontSize="xs" color="#e2e8f0" fontWeight={700}>
                                    {formatCurrency(num(d.bet_A))}
                                  </Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="#475569" pl={3}>派彩</Text>
                                  <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                    {formatCurrency(num(d.payout_A))}
                                  </Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="#475569" pl={3}>赔付率</Text>
                                  <Text
                                    fontSize="xs"
                                    color={getStatusColor(num(d.ratio_A))}
                                    fontWeight={700}
                                  >
                                    {(num(d.ratio_A) * 100).toFixed(2)}%
                                  </Text>
                                </HStack>
                              </>
                            )}
                            {d.bet_B !== undefined && (
                              <>
                                <Box h="1px" w="100%" bg="rgba(30, 38, 64, 0.6)" my={1} />
                                <Text fontSize="10px" color={COMPARE_COLOR} fontWeight={600}>
                                  B · {d.month_B}
                                </Text>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="#94a3b8">投注额</Text>
                                  <Text fontSize="xs" color="#94a3b8" fontWeight={700}>
                                    {formatCurrency(num(d.bet_B))}
                                  </Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="#475569" pl={3}>派彩</Text>
                                  <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                    {formatCurrency(num(d.payout_B))}
                                  </Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="#475569" pl={3}>赔付率</Text>
                                  <Text
                                    fontSize="xs"
                                    color={getStatusColor(num(d.ratio_B))}
                                    fontWeight={700}
                                  >
                                    {(num(d.ratio_B) * 100).toFixed(2)}%
                                  </Text>
                                </HStack>
                              </>
                            )}
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ratio_A"
                    name="A 赔付率"
                    stroke={CURRENT_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: CURRENT_COLOR, strokeWidth: 0 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ratio_B"
                    name="B 赔付率"
                    stroke={COMPARE_COLOR}
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={{ r: 4, fill: COMPARE_COLOR, strokeWidth: 0 }}
                  />
                </LineChart>
              ) : (
                <ComposedChart data={data.trend} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => formatCompact(v)}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
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
                          minW="180px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                            {label}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">投注额</Text>
                              <Text fontSize="xs" color={CURRENT_COLOR} fontWeight={700}>
                                {formatCurrency(num(d.bet))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">派彩</Text>
                              <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                {formatCurrency(num(d.payout))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">赔付率</Text>
                              <Text
                                fontSize="xs"
                                color={getStatusColor(num(d.ratio))}
                                fontWeight={700}
                              >
                                {(num(d.ratio) * 100).toFixed(2)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="bet"
                    name="投注额"
                    fill={CURRENT_COLOR}
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="payout"
                    name="派彩"
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                    opacity={0.6}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ratio"
                    name="赔付率"
                    stroke="#FFB547"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#FFB547", strokeWidth: 0 }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <ChartCard title="联赛赔付率" subtitle="各联赛投注额与赔付率对比" height={360}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.byLeague.slice().sort((a, b) => a.bet - b.bet)}
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
                              <Text fontSize="xs" color={CURRENT_COLOR} fontWeight={700}>
                                {formatCurrency(num(d.bet))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">派彩</Text>
                              <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                {formatCurrency(num(d.payout))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">赔付率</Text>
                              <Text
                                fontSize="xs"
                                color={getStatusColor(num(d.ratio))}
                                fontWeight={700}
                              >
                                {(num(d.ratio) * 100).toFixed(2)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="bet" radius={[0, 4, 4, 0]} barSize={18}>
                    {data.byLeague.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getStatusColor(entry.ratio) === "#22c55e" ? CURRENT_COLOR : getStatusColor(entry.ratio)}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="玩法赔付率" subtitle="各投注类型赔付率对比" height={360}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byType} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
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
                            {d.type}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">投注额</Text>
                              <Text fontSize="xs" color={CURRENT_COLOR} fontWeight={700}>
                                {formatCurrency(num(d.bet))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">派彩</Text>
                              <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                {formatCurrency(num(d.payout))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">赔付率</Text>
                              <Text
                                fontSize="xs"
                                color={getStatusColor(num(d.ratio))}
                                fontWeight={700}
                              >
                                {(num(d.ratio) * 100).toFixed(2)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="bet" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.byType.map((entry) => (
                      <Cell key={entry.type} fill={BET_TYPE_COLORS[entry.type] || CURRENT_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </SimpleGrid>

          <ChartCard title="盈亏明细" subtitle="各联赛与玩法盈亏数据明细" height={420}>
            <Table variant="unstyled" size="sm">
              <Thead>
                <Tr borderBottom="1px solid rgba(30, 38, 64, 0.8)">
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>联赛</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>投注额</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>派彩</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>盈利</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>赔付率</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>状态</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.byLeague.map((row) => {
                  const net = row.bet - row.payout;
                  const ratioPct = (row.ratio * 100).toFixed(2);
                  const status = row.ratio > 0.98 ? "danger" : row.ratio > 0.93 ? "warning" : "normal";
                  return (
                    <Tr key={row.league} borderBottom="1px solid rgba(30, 38, 64, 0.4)">
                      <Td py={3}>
                        <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                          {row.league}
                        </Text>
                      </Td>
                      <Td isNumeric py={3}>
                        <Text fontSize="sm" color="#e2e8f0" fontFamily='"JetBrains Mono", monospace'>
                          {formatCurrency(row.bet)}
                        </Text>
                      </Td>
                      <Td isNumeric py={3}>
                        <Text fontSize="sm" color="#8B5CF6" fontFamily='"JetBrains Mono", monospace'>
                          {formatCurrency(row.payout)}
                        </Text>
                      </Td>
                      <Td isNumeric py={3}>
                        <Text
                          fontSize="sm"
                          color={net >= 0 ? "#22c55e" : "#ef4444"}
                          fontWeight={600}
                          fontFamily='"JetBrains Mono", monospace'
                        >
                          {net >= 0 ? "+" : ""}
                          {formatCurrency(net)}
                        </Text>
                      </Td>
                      <Td isNumeric py={3}>
                        <Text
                          fontSize="sm"
                          color={getStatusColor(row.ratio)}
                          fontWeight={600}
                          fontFamily='"JetBrains Mono", monospace'
                        >
                          {ratioPct}%
                        </Text>
                      </Td>
                      <Td isNumeric py={3}>
                        <StatusBadge status={status as "normal" | "warning" | "danger"} />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </ChartCard>
        </>
      )}
    </VStack>
  );
}
