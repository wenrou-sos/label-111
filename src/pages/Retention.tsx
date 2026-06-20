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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
} from "recharts";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filter";
import { FilterBar } from "@/components/FilterBar";
import { SectionHeader, ChartCard, ExportButton, LoadingState } from "@/components/ui";
import { formatNumber, formatCompact } from "@/lib/format";
import type { RetentionResponse, MetaResponse } from "@/types";

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

const COLORS = {
  d1: "#00D9C0",
  d7: "#06B6D4",
  d30: "#8B5CF6",
};

export default function Retention() {
  const { start, end, channel } = useFilterStore();
  const [data, setData] = useState<RetentionResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        api.retention(start, end, channel),
        api.meta(),
      ]);
      setData(r);
      setMeta(m);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end, channel]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 300000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const getDelta = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="用户留存分析"
        subtitle="新用户次日/7日/30日留存率与渠道效果分析"
        rightAction={<ExportButton module="retention" />}
      />

      <FilterBar showChannel />

      {loading && !data ? (
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Skeleton h="140px" borderRadius="xl" />
            <Skeleton h="140px" borderRadius="xl" />
            <Skeleton h="140px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="360px" borderRadius="xl" />
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <Skeleton h="340px" borderRadius="xl" />
            <Skeleton h="340px" borderRadius="xl" />
          </SimpleGrid>
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {data.rates.map((rate) => {
              const color = rate.key === "d1" ? COLORS.d1 : rate.key === "d7" ? COLORS.d7 : COLORS.d30;
              const delta = getDelta(rate.value, rate.prev);
              return (
                <Box
                  key={rate.key}
                  bg="rgba(15, 20, 34, 0.7)"
                  border="1px solid rgba(30, 38, 64, 0.8)"
                  borderRadius="16px"
                  p={6}
                  position="relative"
                  overflow="hidden"
                >
                  <Box position="absolute" top={0} left={0} w="100%" h="3px" bg={color} />
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="sm" color="#64748b" fontWeight={500}>
                      {rate.label}
                    </Text>
                    <HStack align="baseline" spacing={2}>
                      <Text
                        fontSize="4xl"
                        fontWeight={800}
                        color="#e2e8f0"
                        fontFamily='"JetBrains Mono", monospace'
                      >
                        {rate.value.toFixed(1)}
                      </Text>
                      <Text fontSize="lg" color="#64748b" fontWeight={600}>
                        %
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xs" color="#64748b">
                        较上期
                      </Text>
                      <Text
                        fontSize="xs"
                        color={delta >= 0 ? "#22c55e" : "#ef4444"}
                        fontWeight={600}
                      >
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(1)}%
                      </Text>
                      <Text fontSize="xs" color="#475569">
                        ({rate.prev.toFixed(1)}%)
                      </Text>
                    </HStack>
                    <Progress
                      value={rate.value}
                      max={100}
                      h="6px"
                      borderRadius="3px"
                      bg="rgba(30, 38, 64, 0.8)"
                      sx={{ "& > div": { bg: color } }}
                    />
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>

          <ChartCard title="留存率趋势" subtitle="月度留存率变化趋势" height={360}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={{ stroke: "#1e2640" }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => v.toFixed(0) + "%"}
                  axisLine={{ stroke: "#1e2640" }}
                  domain={[0, 80]}
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
                            <HStack spacing={2}>
                              <Box w="8px" h="8px" borderRadius="2px" bg={COLORS.d1} />
                              <Text fontSize="xs" color="#94a3b8">次日留存</Text>
                            </HStack>
                            <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                              {num(d.d1).toFixed(1)}%
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <HStack spacing={2}>
                              <Box w="8px" h="8px" borderRadius="2px" bg={COLORS.d7} />
                              <Text fontSize="xs" color="#94a3b8">7日留存</Text>
                            </HStack>
                            <Text fontSize="xs" color="#06B6D4" fontWeight={700}>
                              {num(d.d7).toFixed(1)}%
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <HStack spacing={2}>
                              <Box w="8px" h="8px" borderRadius="2px" bg={COLORS.d30} />
                              <Text fontSize="xs" color="#94a3b8">30日留存</Text>
                            </HStack>
                            <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                              {num(d.d30).toFixed(1)}%
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
                <Line
                  type="monotone"
                  dataKey="d1"
                  name="次日留存"
                  stroke={COLORS.d1}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.d1, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="d7"
                  name="7日留存"
                  stroke={COLORS.d7}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.d7, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="d30"
                  name="30日留存"
                  stroke={COLORS.d30}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.d30, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <ChartCard title="渠道用户数" subtitle="各渠道新增用户数对比" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byChannel.slice().sort((a, b) => a.users - b.users)}
                  layout="vertical"
                  margin={{ top: 8, right: 20, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => formatNumber(v)}
                    axisLine={{ stroke: "#1e2640" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="channel"
                    width={64}
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
                          minW="160px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1}>
                            {d.channel}
                          </Text>
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="#94a3b8">新增用户</Text>
                            <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                              {formatNumber(num(d.users))}
                            </Text>
                          </HStack>
                        </Box>
                      );
                    }}
                  />
                  <Bar dataKey="users" fill="#00D9C0" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="渠道留存对比" subtitle="各渠道不同周期留存率对比" height={340}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byChannel} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" vertical={false} />
                  <XAxis
                    dataKey="channel"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={{ stroke: "#1e2640" }}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(v) => v.toFixed(0) + "%"}
                    axisLine={{ stroke: "#1e2640" }}
                    domain={[0, 80]}
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
                          minW="160px"
                          boxShadow="0 8px 24px rgba(0,0,0,0.4)"
                        >
                          <Text fontSize="xs" color="#e2e8f0" fontWeight={700} mb={1.5}>
                            {d.channel}
                          </Text>
                          <VStack spacing={1} align="stretch">
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Box w="6px" h="6px" borderRadius="1px" bg={COLORS.d1} />
                                <Text fontSize="xs" color="#94a3b8">次日</Text>
                              </HStack>
                              <Text fontSize="xs" color="#00D9C0" fontWeight={700}>
                                {num(d.d1).toFixed(1)}%
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Box w="6px" h="6px" borderRadius="1px" bg={COLORS.d7} />
                                <Text fontSize="xs" color="#94a3b8">7日</Text>
                              </HStack>
                              <Text fontSize="xs" color="#06B6D4" fontWeight={700}>
                                {num(d.d7).toFixed(1)}%
                              </Text>
                            </HStack>
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Box w="6px" h="6px" borderRadius="1px" bg={COLORS.d30} />
                                <Text fontSize="xs" color="#94a3b8">30日</Text>
                              </HStack>
                              <Text fontSize="xs" color="#8B5CF6" fontWeight={700}>
                                {num(d.d30).toFixed(1)}%
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
                    wrapperStyle={{ fontSize: 11, color: "#94a3b8", paddingTop: 4 }}
                  />
                  <Bar dataKey="d1" name="次日留存" fill={COLORS.d1} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="d7" name="7日留存" fill={COLORS.d7} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="d30" name="30日留存" fill={COLORS.d30} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </SimpleGrid>

          <ChartCard title="渠道明细" subtitle="各渠道留存效果详细对比" height={380}>
            <Table variant="unstyled" size="sm">
              <Thead>
                <Tr borderBottom="1px solid rgba(30, 38, 64, 0.8)">
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>渠道</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>新增用户</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>次日留存</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>7日留存</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>30日留存</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.byChannel.map((ch) => (
                  <Tr key={ch.channel} borderBottom="1px solid rgba(30, 38, 64, 0.4)">
                    <Td py={3}>
                      <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                        {ch.channel}
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color="#e2e8f0" fontFamily='"JetBrains Mono", monospace'>
                        {formatNumber(ch.users)}
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color={COLORS.d1} fontWeight={600}>
                        {ch.d1.toFixed(1)}%
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color={COLORS.d7} fontWeight={600}>
                        {ch.d7.toFixed(1)}%
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Text fontSize="sm" color={COLORS.d30} fontWeight={600}>
                        {ch.d30.toFixed(1)}%
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
