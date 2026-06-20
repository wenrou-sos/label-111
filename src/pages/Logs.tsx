import { useEffect, useState, useCallback } from "react";
import {
  VStack,
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
  Button,
  SimpleGrid,
  Badge,
} from "@chakra-ui/react";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { SectionHeader, ChartCard, LoadingState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { LogsResponse } from "@/types";

export default function Logs() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.logs(page, pageSize);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const getActionColor = (action: string) => {
    if (action.includes("登录")) return "#00D9C0";
    if (action.includes("导出")) return "#8B5CF6";
    if (action.includes("干预")) return "#FFB547";
    if (action.includes("修改")) return "#ef4444";
    return "#64748b";
  };

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="操作日志"
        subtitle="系统所有操作记录审计追踪"
      />

      {loading && !data ? (
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Skeleton h="100px" borderRadius="xl" />
          </SimpleGrid>
          <Skeleton h="500px" borderRadius="xl" />
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color="#64748b">
              共 <Text as="span" color="#e2e8f0" fontWeight={600}>{data.total}</Text> 条记录
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                isDisabled={page <= 1}
                color="#94a3b8"
                leftIcon={<ChevronLeft size={14} />}
                _hover={{ bg: "rgba(0, 217, 192, 0.1)", color: "#00D9C0" }}
              >
                上一页
              </Button>
              <Text fontSize="xs" color="#64748b" minW="60px" textAlign="center">
                {page} / {totalPages || 1}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage((p) => p + 1)}
                isDisabled={page >= totalPages}
                color="#94a3b8"
                rightIcon={<ChevronRight size={14} />}
                _hover={{ bg: "rgba(0, 217, 192, 0.1)", color: "#00D9C0" }}
              >
                下一页
              </Button>
            </HStack>
          </HStack>

          <ChartCard title="" subtitle="" height={520}>
            <Box overflowX="auto" h="100%">
              <Table variant="unstyled" size="sm">
                <Thead position="sticky" top={0} bg="rgba(15, 20, 34, 0.95)" backdropFilter="blur(8px)" zIndex={1}>
                  <Tr borderBottom="1px solid rgba(30, 38, 64, 0.8)">
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} w="60px">#</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>操作人</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>操作类型</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>操作对象</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>IP地址</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>操作时间</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.logs.map((log) => (
                    <Tr key={log.id} borderBottom="1px solid rgba(30, 38, 64, 0.4)" _hover={{ bg: "rgba(0, 217, 192, 0.03)" }}>
                      <Td py={3}>
                        <Text fontSize="xs" color="#64748b" fontFamily='"JetBrains Mono", monospace'>
                          {log.id}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="sm" color="#e2e8f0" fontWeight={500}>
                          {log.user}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Badge
                          bg={getActionColor(log.action) + "20"}
                          color={getActionColor(log.action)}
                          px={2}
                          py={0.5}
                          borderRadius="6px"
                          fontSize="11px"
                          fontWeight={500}
                        >
                          {log.action}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="sm" color="#94a3b8">
                          {log.target}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="xs" color="#64748b" fontFamily='"JetBrains Mono", monospace'>
                          {log.ip}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="xs" color="#64748b">
                          {log.time}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </ChartCard>
        </>
      )}
    </VStack>
  );
}
