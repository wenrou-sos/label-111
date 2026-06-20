import { useEffect, useState, useCallback } from "react";
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
  Progress,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filter";
import { FilterBar } from "@/components/FilterBar";
import { SectionHeader, ChartCard, ExportButton, LoadingState } from "@/components/ui";
import { formatCurrency, formatNumber, formatCompact } from "@/lib/format";
import type { TierResponse, MetaResponse } from "@/types";

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

const TIER_COLORS: Record<string, string> = {
  whale: "#8B5CF6",
  middle: "#06B6D4",
  retail: "#64748B",
};

export default function Tier() {
  const { start, end } = useFilterStore();
  const [data, setData] = useState<TierResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, m] = await Promise.all([
        api.tier(start, end),
        api.meta(),
      ]);
      setData(t);
      setMeta(m);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 300000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const userPieData = data?.tiers.map((t) => ({
    name: t.name,
    value: t.userCount,
    color: TIER_COLORS[t.key],
    pct: t.userPct,
  })) || [];

  const betPieData = data?.tiers.map((t) => ({
    name: t.name,
    value: t.betAmount,
    color: TIER_COLORS[t.key],
    pct: t.betPct,
  })) || [];

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="用户分层分析"
        subtitle="按月度投注金额划分鲸鱼、中产、散户三个层级"
        rightAction={<ExportButton module="tier" />}
      />

      <FilterBar />

      {loading && !data ? (
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Skeleton h="120px" borderRadius="xl" />
            <Skeleton h="120px" borderRadius="xl" />
            <Skeleton h="120px" borderRadius="xl" />
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <Skeleton h="320px" borderRadius="xl" />
            <Skeleton h="320px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="360px" borderRadius="xl" />
          <Skeleton h="400px" borderRadius="xl" />
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {data.tiers.map((tier) => (
              <Box
                key={tier.key}
                bg="rgba(15, 20, 34, 0.7)"
                border="1px solid rgba(30, 38, 64, 0.8)"
                borderRadius="16px"
                p={5}
                position="relative"
                overflow="hidden"
              >
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  w="100%"
                  h="3px"
                  bg={tier.color}
                />
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="#64748b" fontWeight={500}>
                      {tier.name}
                    </Text>
                    <Text
                      fontSize="10px"
                      bg={tier.color + "20"}
                      color={tier.color}
                      px={2}
                      py={0.5}
                      borderRadius="4px"
                    >
                      {meta?.tiers?.find((x) => x.key === tier.key)?.threshold}
                    </Text>
                  </HStack>
                  <HStack align="baseline" spacing={1}>
                    <Text
                      fontSize="2xl"
                      fontWeight={800}
                      color="#e2e8f0"
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {formatNumber(tier.userCount)}
                    </Text>
                    <Text fontSize="xs" color="#64748b">
                      人
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="#64748b">
                      人数占比
                    </Text>
                    <Text fontSize="xs" color={tier.color} fontWeight={600}>
                      {tier.userPct.toFixed(1)}%
                    </Text>
                  </HStack>
                  <Progress
                    value={tier.userPct}
                    h="4px"
                    borderRadius="2px"
                    bg="rgba(30, 38, 64, 0.8)"
                    sx={{
                      "& > div": { bg: tier.color },
                    }}
                  />
                  <HStack justify="space-between" pt={2}>
                    <VStack align="stretch" spacing={0}>
                      <Text fontSize="10px" color="#64748b">投注总额</Text>
                      <Text fontSize="sm" color="#e2e8f0" fontWeight={700}>
                        {formatCurrency(tier.betAmount)}
                      </Text>
                    </VStack>
                    <VStack align="stretch" spacing={0}>
                      <Text fontSize="10px" color="#64748b">人均投注</Text>
                      <Text fontSize="sm" color="#00D9C0" fontWeight={700}>
                        {formatCurrency(tier.avgBet)}
                      </Text>
                    </VStack>
                    <VStack align="stretch" spacing={0}>
                      <Text fontSize="10px" color="#64748b">投注占比</Text>
                      <Text fontSize="sm" color="#8B5CF6" fontWeight={700}>
                        {tier.betPct.toFixed(1)}%
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <ChartCard title="人数分布" subtitle="各层级用户数占比" height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {userPieData.map((entry, index) => (
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
                          minW="150px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1}>
                            {d.name}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">用户数</Text>
                              <Text fontSize="xs" color="#e2e8f0" fontWeight={700}>
                                {formatNumber(num(d.value))}
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="#94a3b8">占比</Text>
                              <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                                {num(d.pct).toFixed(1)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <VStack spacing={2} position="absolute" bottom="16px" left="0" right="0" px={6}>
                {userPieData.map((item) => (
                  <HStack key={item.name} justify="space-between" w="100%">
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="2px" bg={item.color} />
                      <Text fontSize="xs" color="#94a3b8">{item.name}</Text>
                    </HStack>
                    <Text fontSize="xs" color="#e2e8f0" fontWeight={600}>
                      {item.pct.toFixed(1)}%
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </ChartCard>

            <ChartCard title="投注额分布" subtitle="各层级投注金额占比" height={320}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={betPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {betPieData.map((entry, index) => (
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
                          minW="150px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1}>
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
                              <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                {num(d.pct).toFixed(1)}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <VStack spacing={2} position="absolute" bottom="16px" left="0" right="0" px={6}>
                {betPieData.map((item) => (
                  <HStack key={item.name} justify="space-between" w="100%">
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="2px" bg={item.color} />
                      <Text fontSize="xs" color="#94a3b8">{item.name}</Text>
                    </HStack>
                    <Text fontSize="xs" color="#e2e8f0" fontWeight={600}>
                      {item.pct.toFixed(1)}%
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </ChartCard>
          </SimpleGrid>

          <ChartCard title="层级投注趋势" subtitle="各层级月度投注金额变化趋势" height={360}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
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
                        minW="180px"
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
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}
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

          <ChartCard title="层级数据明细" subtitle="各层级详细数据对比" height={400}>
            <Table variant="unstyled" size="sm">
              <Thead>
                <Tr borderBottom="1px solid rgba(30, 38, 64, 0.8)">
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>层级</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>用户数</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>人数占比</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>活跃用户</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>投注总额</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>投注占比</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>人均投注</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.tiers.map((tier) => (
                  <Tr key={tier.key} borderBottom="1px solid rgba(30, 38, 64, 0.4)">
                    <Td py={3}>
                      <HStack spacing={2}>
                        <Box w="10px" h="10px" borderRadius="2px" bg={tier.color} />
                        <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                          {tier.name}
                        </Text>
                      </HStack>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color="#e2e8f0" fontFamily='"JetBrains Mono", monospace'>
                        {formatNumber(tier.userCount)}
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color={tier.color} fontWeight={600}>
                        {tier.userPct.toFixed(1)}%
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color="#94a3b8">
                        {formatNumber(tier.activeUsers)}
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color="#e2e8f0" fontFamily='"JetBrains Mono", monospace'>
                        {formatCurrency(tier.betAmount)}
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color="#8B5CF6" fontWeight={600}>
                        {tier.betPct.toFixed(1)}%
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color="#00D9C0" fontWeight={600}>
                        {formatCurrency(tier.avgBet)}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ChartCard>
        </>
      )}
    </VStack>
  );
}
