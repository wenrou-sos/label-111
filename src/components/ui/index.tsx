import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Skeleton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  SimpleGrid,
} from "@chakra-ui/react";
import { Download, ChevronDown, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { ReactNode } from "react";

export function ChartCard({
  title,
  subtitle,
  children,
  height = 320,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
  rightAction?: ReactNode;
}) {
  return (
    <Card
      bg="rgba(15, 20, 34, 0.7)"
      border="1px solid rgba(30, 38, 64, 0.8)"
      borderRadius="16px"
      backdropFilter="blur(12px)"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
      overflow="hidden"
    >
      <CardHeader pb={2} pt={5} px={5}>
        <HStack justify="space-between" align="flex-start">
          <VStack align="stretch" spacing={1}>
            <Heading size="sm" fontWeight={700} color="#e2e8f0">
              {title}
            </Heading>
            {subtitle && (
              <Text fontSize="xs" color="#64748b">
                {subtitle}
              </Text>
            )}
          </VStack>
          {rightAction}
        </HStack>
      </CardHeader>
      <CardBody pt={2} pb={4} px={3} h={height}>
        {children}
      </CardBody>
    </Card>
  );
}

export function SectionHeader({
  title,
  subtitle,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}) {
  return (
    <HStack justify="space-between" align="flex-start" wrap="wrap" spacing={4}>
      <VStack align="stretch" spacing={1}>
        <Heading size="lg" fontWeight={700} color="#e2e8f0">
          {title}
        </Heading>
        {subtitle && (
          <Text fontSize="sm" color="#64748b">
            {subtitle}
          </Text>
        )}
      </VStack>
      {rightAction}
    </HStack>
  );
}

export function ExportButton({ module }: { module: string }) {
  const hasPerm = useAuthStore((s) => s.hasPerm("export"));
  if (!hasPerm) return null;

  const handleExport = (format: string) => {
    const url = api.getExportUrl(module, format);
    window.open(url, "_blank");
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        borderColor="rgba(0, 217, 192, 0.3)"
        color="#00D9C0"
        _hover={{ bg: "rgba(0, 217, 192, 0.1)", borderColor: "rgba(0, 217, 192, 0.5)" }}
        rightIcon={<ChevronDown size={14} />}
        leftIcon={<Download size={14} />}
      >
        导出数据
      </MenuButton>
      <MenuList
        bg="rgba(15, 20, 34, 0.95)"
        borderColor="rgba(30, 38, 64, 0.8)"
        backdropFilter="blur(12px)"
        minW="120px"
      >
        <MenuItem
          onClick={() => handleExport("csv")}
          color="#94a3b8"
          _hover={{ bg: "rgba(0, 217, 192, 0.1)", color: "#00D9C0" }}
        >
          导出 CSV
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

export function LoadingState({ text = "加载中..." }: { text?: string }) {
  return (
    <VStack h="200px" justify="center" color="#64748b">
      <Skeleton w="40px" h="40px" borderRadius="full" />
      <Text fontSize="sm">{text}</Text>
    </VStack>
  );
}

export function StatCardSkeleton() {
  return (
    <Card
      bg="rgba(15, 20, 34, 0.7)"
      border="1px solid rgba(30, 38, 64, 0.8)"
      borderRadius="16px"
      p={5}
    >
      <VStack align="stretch" spacing={3}>
        <Skeleton h="14px" w="80px" />
        <Skeleton h="32px" w="120px" />
        <Skeleton h="12px" w="60px" />
        <Skeleton h="40px" w="100%" />
      </VStack>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  unit,
  deltaPct,
  accent,
  spark,
}: {
  label: string;
  value: number;
  unit: string;
  deltaPct: number;
  accent: string;
  spark?: { date: string; value: number }[];
}) {
  const isPositive = deltaPct >= 0;
  const formatValue = (v: number, u: string) => {
    if (u === "%") return v.toFixed(2) + u;
    if (v >= 100000000) return (v / 100000000).toFixed(2) + "亿";
    if (v >= 10000) return (v / 10000).toFixed(2) + "万";
    return v.toLocaleString("zh-CN");
  };

  return (
    <Card
      bg="rgba(15, 20, 34, 0.7)"
      border="1px solid rgba(30, 38, 64, 0.8)"
      borderRadius="16px"
      backdropFilter="blur(12px)"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
      p={5}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        w="3px"
        h="100%"
        bg={accent}
        opacity={0.8}
      />
      <VStack align="stretch" spacing={3}>
        <Text fontSize="sm" color="#64748b" fontWeight={500}>
          {label}
        </Text>
        <HStack align="baseline" spacing={1}>
          <Text
            fontSize="2xl"
            fontWeight={800}
            color="#e2e8f0"
            fontFamily='"JetBrains Mono", monospace'
          >
            {formatValue(value, unit)}
          </Text>
          <Text fontSize="xs" color="#64748b">
            {unit === "%" ? "" : unit}
          </Text>
        </HStack>
        {deltaPct !== 0 && (
          <HStack spacing={1}>
            {isPositive ? (
              <TrendingUp size={14} color="#22c55e" />
            ) : (
              <TrendingDown size={14} color="#ef4444" />
            )}
            <Text fontSize="xs" color={isPositive ? "#22c55e" : "#ef4444"} fontWeight={600}>
              {isPositive ? "+" : ""}
              {deltaPct.toFixed(1)}%
            </Text>
            <Text fontSize="xs" color="#475569">
              较上期
            </Text>
          </HStack>
        )}
        {spark && spark.length > 0 && (
          <Box h="36px" mt={1}>
            <MiniSparkline data={spark} color={accent} />
          </Box>
        )}
      </VStack>
    </Card>
  );
}

function MiniSparkline({
  data,
  color,
}: {
  data: { date: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const width = 100;
  const height = 36;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((d.value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkGrad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function StatusBadge({ status }: { status: "normal" | "warning" | "danger" }) {
  const colors = {
    normal: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e", label: "正常" },
    warning: { bg: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", label: "预警" },
    danger: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", label: "危险" },
  };
  const cfg = colors[status];
  return <Badge bg={cfg.bg} color={cfg.color} px={2} py={0.5} borderRadius="6px" fontSize="xs" fontWeight={600}>{cfg.label}</Badge>;
}

export function AlertCard({
  severity,
  message,
  time,
}: {
  severity: "warning" | "danger";
  message: string;
  time?: string;
}) {
  const colors = {
    warning: { border: "#fbbf24", bg: "rgba(251, 191, 36, 0.08)" },
    danger: { border: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" },
  };
  const cfg = colors[severity];
  return (
    <HStack
      bg={cfg.bg}
      borderLeft="3px solid"
      borderColor={cfg.border}
      p={3}
      borderRadius="8px"
      spacing={3}
    >
      <AlertTriangle size={18} color={cfg.border} />
      <VStack align="stretch" spacing={0} flex={1}>
        <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
          {message}
        </Text>
        {time && (
          <Text fontSize="xs" color="#64748b">
            {time}
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

function formatCompareValue(v: number, unit: string) {
  if (unit === "%") return v.toFixed(2) + unit;
  if (v >= 100000000) return (v / 100000000).toFixed(2) + "亿";
  if (v >= 10000) return (v / 10000).toFixed(2) + "万";
  return v.toLocaleString("zh-CN");
}

function computeDeltaPct(current: number, prev: number): number {
  if (prev === 0) return 0;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export function CompareStatCard({
  label,
  currentValue,
  prevValue,
  unit,
  accent,
}: {
  label: string;
  currentValue: number;
  prevValue: number;
  unit: string;
  accent: string;
}) {
  const delta = computeDeltaPct(currentValue, prevValue);
  const isPositive = delta >= 0;
  const isZero = prevValue === 0 && currentValue === 0;

  return (
    <Card
      bg="rgba(15, 20, 34, 0.7)"
      border="1px solid rgba(30, 38, 64, 0.8)"
      borderRadius="16px"
      backdropFilter="blur(12px)"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
      p={0}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        w="3px"
        h="100%"
        bg={accent}
        opacity={0.8}
      />
      <VStack align="stretch" spacing={0} w="100%" h="100%">
        <Box px={5} pt={4} pb={2}>
          <Text fontSize="sm" color="#64748b" fontWeight={500}>
            {label}
          </Text>
        </Box>

        <SimpleGrid columns={2} spacing={0} w="100%" flex={1}>
          <Box
            p={4}
            borderTop="1px solid rgba(0, 217, 192, 0.15)"
            bg="rgba(0, 217, 192, 0.03)"
            position="relative"
          >
            <HStack justify="space-between" mb={2}>
              <Badge
                fontSize="9px"
                bg="rgba(0, 217, 192, 0.15)"
                color="#00D9C0"
                px={1.5}
                py={0.5}
                borderRadius="4px"
              >
                A 当前
              </Badge>
            </HStack>
            <HStack align="baseline" spacing={1}>
              <Text
                fontSize="2xl"
                fontWeight={800}
                color="#e2e8f0"
                fontFamily='"JetBrains Mono", monospace'
              >
                {formatCompareValue(currentValue, unit)}
              </Text>
              <Text fontSize="xs" color="#64748b">
                {unit === "%" ? "" : unit}
              </Text>
            </HStack>
          </Box>

          <Box
            p={4}
            borderTop="1px solid rgba(245, 158, 11, 0.15)"
            borderLeft="1px solid rgba(30, 38, 64, 0.6)"
            bg="rgba(245, 158, 11, 0.03)"
            position="relative"
          >
            <HStack justify="space-between" mb={2}>
              <Badge
                fontSize="9px"
                bg="rgba(245, 158, 11, 0.15)"
                color="#F59E0B"
                px={1.5}
                py={0.5}
                borderRadius="4px"
              >
                B 对比
              </Badge>
              {!isZero && (
                <HStack spacing={0.5}>
                  {isPositive ? (
                    <TrendingUp size={11} color="#22c55e" />
                  ) : (
                    <TrendingDown size={11} color="#ef4444" />
                  )}
                  <Text
                    fontSize="10px"
                    fontWeight={700}
                    color={isPositive ? "#22c55e" : "#ef4444"}
                    fontFamily='"JetBrains Mono", monospace'
                  >
                    {isPositive ? "+" : ""}
                    {delta.toFixed(1)}%
                  </Text>
                </HStack>
              )}
            </HStack>
            <HStack align="baseline" spacing={1}>
              <Text
                fontSize="2xl"
                fontWeight={800}
                color="#94a3b8"
                fontFamily='"JetBrains Mono", monospace'
              >
                {formatCompareValue(prevValue, unit)}
              </Text>
              <Text fontSize="xs" color="#475569">
                {unit === "%" ? "" : unit}
              </Text>
            </HStack>
          </Box>
        </SimpleGrid>
      </VStack>
    </Card>
  );
}
