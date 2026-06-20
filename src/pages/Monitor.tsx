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
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Select,
  Avatar,
  Progress,
  Tag,
  TagLabel,
  TagLeftIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  UserCheck,
  ChevronRight,
  Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFilterStore } from "@/stores/filter";
import { useAuthStore } from "@/stores/auth";
import { FilterBar } from "@/components/FilterBar";
import { SectionHeader, ChartCard, ExportButton, LoadingState } from "@/components/ui";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/format";
import type { MonitorResponse, AnomalyUser, Intervention, MetaResponse } from "@/types";

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v) || 0;
}

const ANOMALY_CONFIG: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  freq: { label: "投注频次异常", color: "#FFB547", icon: Zap },
  spike: { label: "单日金额突增", color: "#ef4444", icon: TrendingUp },
  late: { label: "深夜投注占比高", color: "#8B5CF6", icon: Clock },
};

export default function Monitor() {
  const { start, end } = useFilterStore();
  const { user, hasPerm } = useAuthStore();
  const [data, setData] = useState<MonitorResponse | null>(null);
  const [interventions, setInterventions] = useState<Record<string, Intervention>>({});
  const [selectedUser, setSelectedUser] = useState<AnomalyUser | null>(null);
  const [actionType, setActionType] = useState("短信提醒");
  const [loading, setLoading] = useState(true);
  const [intervening, setIntervening] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, iv] = await Promise.all([
        api.monitor(start, end),
        api.interventions(),
      ]);
      setData(m);
      const ivMap: Record<string, Intervention> = {};
      iv.items.forEach((i) => (ivMap[i.userId] = i));
      setInterventions(ivMap);
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

  const handleIntervene = async () => {
    if (!selectedUser) return;
    setIntervening(true);
    try {
      const res = await api.intervene(selectedUser.userId, actionType, user?.username || "admin");
      if (res.ok) {
        setInterventions((prev) => ({ ...prev, [selectedUser.userId]: res.intervention }));
        toast({ title: "干预已触发", status: "success", duration: 2000 });
        onClose();
      }
    } catch {
      toast({ title: "操作失败", status: "error", duration: 2000 });
    } finally {
      setIntervening(false);
    }
  };

  const openIntervene = (u: AnomalyUser) => {
    setSelectedUser(u);
    setActionType("短信提醒");
    onOpen();
  };

  const canIntervene = hasPerm("intervene");

  const statCards = [
    {
      label: "异常用户总数",
      value: data?.summary.total || 0,
      color: "#ef4444",
      icon: AlertTriangle,
    },
    {
      label: "频次异常",
      value: data?.summary.byType.freq || 0,
      color: "#FFB547",
      icon: Zap,
    },
    {
      label: "金额突增",
      value: data?.summary.byType.spike || 0,
      color: "#ef4444",
      icon: TrendingUp,
    },
    {
      label: "深夜投注",
      value: data?.summary.byType.late || 0,
      color: "#8B5CF6",
      icon: Clock,
    },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="问题投注监控"
        subtitle="识别异常投注行为，支持责任博彩干预流程"
        rightAction={<ExportButton module="monitor" />}
      />

      <FilterBar />

      {loading && !data ? (
        <VStack spacing={5} align="stretch">
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} h="120px" borderRadius="xl" />
            ))}
          </SimpleGrid>
          <Skeleton h="500px" borderRadius="xl" />
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {statCards.map((card) => (
              <Box
                key={card.label}
                bg="rgba(15, 20, 34, 0.7)"
                border="1px solid rgba(30, 38, 64, 0.8)"
                borderRadius="16px"
                p={5}
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={0} left={0} w="100%" h="3px" bg={card.color} />
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="#64748b">
                      {card.label}
                    </Text>
                    <card.icon size={18} color={card.color} />
                  </HStack>
                  <HStack align="baseline" spacing={1}>
                    <Text
                      fontSize="2xl"
                      fontWeight={800}
                      color="#e2e8f0"
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {card.value}
                    </Text>
                    <Text fontSize="xs" color="#64748b">人</Text>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          <Alert
            status="warning"
            bg="rgba(251, 191, 36, 0.1)"
            border="1px solid rgba(251, 191, 36, 0.3)"
            borderRadius="12px"
          >
            <AlertIcon color="#fbbf24" />
            <Box flex={1}>
              <AlertTitle fontSize="sm" color="#fbbf24">
                责任博彩提示
              </AlertTitle>
              <AlertDescription fontSize="xs" color="#94a3b8">
                异常用户数据已脱敏处理，所有干预操作均有日志记录，请谨慎操作。
              </AlertDescription>
            </Box>
          </Alert>

          <ChartCard
            title={`异常用户列表 (${data.users.length})`}
            subtitle="点击操作列可发起责任博彩干预"
            height={520}
          >
            <Box overflowX="auto" h="100%">
              <Table variant="unstyled" size="sm">
                <Thead position="sticky" top={0} bg="rgba(15, 20, 34, 0.95)" backdropFilter="blur(8px)" zIndex={1}>
                  <Tr borderBottom="1px solid rgba(30, 38, 64, 0.8)">
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>用户</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>层级</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>异常类型</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>投注次数</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>投注总额</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>深夜占比</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>状态</Th>
                    <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.users.map((u) => {
                    const iv = interventions[u.userId];
                    return (
                      <Tr
                        key={u.userId}
                        borderBottom="1px solid rgba(30, 38, 64, 0.4)"
                        bg={u.reasons.length >= 2 ? "rgba(255, 181, 71, 0.05)" : "transparent"}
                        _hover={{ bg: "rgba(0, 217, 192, 0.03)" }}
                      >
                        <Td py={3}>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={u.nickname} bg="#00D9C0" color="#070a13" fontSize="12px" fontWeight={700} />
                            <VStack align="stretch" spacing={0}>
                              <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                                {u.nickname}
                              </Text>
                              <Text fontSize="10px" color="#64748b" fontFamily='"JetBrains Mono", monospace'>
                                {u.userId} · {u.channel}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="xs" color="#94a3b8">{u.tierName}</Text>
                        </Td>
                        <Td py={3}>
                          <HStack spacing={1} wrap="wrap">
                            {u.reasons.map((r) => {
                              const cfg = ANOMALY_CONFIG[r];
                              const Icon = cfg.icon;
                              return (
                                <Tag
                                  key={r}
                                  size="sm"
                                  bg={cfg.color + "15"}
                                  color={cfg.color}
                                  borderRadius="6px"
                                >
                                  <TagLeftIcon as={Icon} size={12} />
                                  <TagLabel fontSize="10px">{cfg.label}</TagLabel>
                                </Tag>
                              );
                            })}
                          </HStack>
                        </Td>
                        <Td isNumeric py={3}>
                          <Text fontSize="sm" color="#e2e8f0" fontFamily='"JetBrains Mono", monospace'>
                            {formatNumber(u.betCount)}
                          </Text>
                        </Td>
                        <Td isNumeric py={3}>
                          <Text fontSize="sm" color="#00D9C0" fontWeight={600} fontFamily='"JetBrains Mono", monospace'>
                            {formatCurrency(u.totalAmount)}
                          </Text>
                        </Td>
                        <Td isNumeric py={3}>
                          <VStack align="stretch" spacing={1} w="80px">
                            <HStack justify="space-between">
                              <Text fontSize="xs" color={u.lateNightPct > 40 ? "#8B5CF6" : "#64748b"} fontWeight={500}>
                                {u.lateNightPct.toFixed(1)}%
                              </Text>
                            </HStack>
                            <Progress
                              value={u.lateNightPct}
                              h="3px"
                              borderRadius="2px"
                              bg="rgba(30, 38, 64, 0.8)"
                              sx={{
                                "& > div": { bg: u.lateNightPct > 40 ? "#8B5CF6" : "#64748b" },
                              }}
                            />
                          </VStack>
                        </Td>
                        <Td py={3}>
                          {iv ? (
                            <Badge
                              bg="rgba(34, 197, 94, 0.15)"
                              color="#22c55e"
                              px={2}
                              py={0.5}
                              borderRadius="6px"
                              fontSize="10px"
                              fontWeight={600}
                            >
                              已干预
                            </Badge>
                          ) : (
                            <Badge
                              bg="rgba(251, 191, 36, 0.15)"
                              color="#fbbf24"
                              px={2}
                              py={0.5}
                              borderRadius="6px"
                              fontSize="10px"
                              fontWeight={600}
                              className="glow-amber"
                            >
                              待处理
                            </Badge>
                          )}
                        </Td>
                        <Td isNumeric py={3}>
                          <Button
                            size="xs"
                            variant="ghost"
                            color="#00D9C0"
                            rightIcon={<ChevronRight size={12} />}
                            onClick={() => openIntervene(u)}
                            isDisabled={!canIntervene}
                            _hover={{ bg: "rgba(0, 217, 192, 0.1)" }}
                          >
                            {iv ? "查看" : "干预"}
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </ChartCard>
        </>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="#0f1422" border="1px solid rgba(30, 38, 64, 0.8)" color="#e2e8f0" borderRadius="16px">
          <ModalHeader>
            <HStack spacing={3}>
              <Box
                w="40px"
                h="40px"
                borderRadius="10px"
                bg="rgba(255, 181, 71, 0.15)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Shield size={20} color="#FFB547" />
              </Box>
              <VStack align="stretch" spacing={0}>
                <Text fontSize="md" fontWeight={700}>责任博彩干预</Text>
                <Text fontSize="xs" color="#64748b">对异常用户发起干预措施</Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="#64748b" />
          <ModalBody>
            {selectedUser && (
              <VStack align="stretch" spacing={5}>
                <HStack spacing={4} p={4} bg="rgba(30, 38, 64, 0.4)" borderRadius="12px">
                  <Avatar size="md" name={selectedUser.nickname} bg="#00D9C0" color="#070a13" fontSize="16px" fontWeight={700} />
                  <VStack align="stretch" spacing={1} flex={1}>
                    <Text fontSize="sm" fontWeight={700}>{selectedUser.nickname}</Text>
                    <Text fontSize="xs" color="#64748b" fontFamily='"JetBrains Mono", monospace'>
                      {selectedUser.userId}
                    </Text>
                    <HStack spacing={2} mt={1}>
                      <Badge bg="rgba(6, 182, 212, 0.2)" color="#06B6D4" fontSize="10px" px={2} py={0.5} borderRadius="4px">
                        {selectedUser.tierName}
                      </Badge>
                      <Badge bg="rgba(100, 116, 139, 0.2)" color="#94a3b8" fontSize="10px" px={2} py={0.5} borderRadius="4px">
                        {selectedUser.channel}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>

                <SimpleGrid columns={3} spacing={3}>
                  <Box p={3} bg="rgba(30, 38, 64, 0.4)" borderRadius="10px" textAlign="center">
                    <Text fontSize="10px" color="#64748b" mb={1}>投注次数</Text>
                    <Text fontSize="lg" fontWeight={700} color="#e2e8f0" fontFamily='"JetBrains Mono", monospace'>
                      {formatNumber(selectedUser.betCount)}
                    </Text>
                  </Box>
                  <Box p={3} bg="rgba(30, 38, 64, 0.4)" borderRadius="10px" textAlign="center">
                    <Text fontSize="10px" color="#64748b" mb={1}>投注总额</Text>
                    <Text fontSize="lg" fontWeight={700} color="#00D9C0" fontFamily='"JetBrains Mono", monospace'>
                      {formatCurrency(selectedUser.totalAmount)}
                    </Text>
                  </Box>
                  <Box p={3} bg="rgba(30, 38, 64, 0.4)" borderRadius="10px" textAlign="center">
                    <Text fontSize="10px" color="#64748b" mb={1}>深夜占比</Text>
                    <Text fontSize="lg" fontWeight={700} color="#8B5CF6" fontFamily='"JetBrains Mono", monospace'>
                      {selectedUser.lateNightPct.toFixed(1)}%
                    </Text>
                  </Box>
                </SimpleGrid>

                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" color="#64748b" fontWeight={600}>
                    异常原因
                  </Text>
                  {selectedUser.reasons.map((r) => {
                    const cfg = ANOMALY_CONFIG[r];
                    const Icon = cfg.icon;
                    return (
                      <HStack
                        key={r}
                        p={3}
                        bg={cfg.color + "10"}
                        borderLeft="3px solid"
                        borderColor={cfg.color}
                        borderRadius="8px"
                        spacing={3}
                      >
                        <Icon size={16} color={cfg.color} />
                        <VStack align="stretch" spacing={0} flex={1}>
                          <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                            {cfg.label}
                          </Text>
                        </VStack>
                      </HStack>
                    );
                  })}
                </VStack>

                {interventions[selectedUser.userId] ? (
                  <Box p={4} bg="rgba(34, 197, 94, 0.1)" borderRadius="12px" border="1px solid rgba(34, 197, 94, 0.3)">
                    <HStack spacing={3}>
                      <UserCheck size={18} color="#22c55e" />
                      <VStack align="stretch" spacing={0} flex={1}>
                        <Text fontSize="sm" color="#22c55e" fontWeight={600}>已发起干预</Text>
                        <Text fontSize="xs" color="#64748b">
                          干预方式：{interventions[selectedUser.userId].action}
                        </Text>
                        <Text fontSize="xs" color="#64748b">
                          操作人：{interventions[selectedUser.userId].operator}
                        </Text>
                        <Text fontSize="xs" color="#64748b">
                          时间：{interventions[selectedUser.userId].time}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="xs" color="#64748b" fontWeight={600}>
                      选择干预方式
                    </Text>
                    <Select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      bg="rgba(7, 10, 19, 0.6)"
                      borderColor="rgba(30, 38, 64, 0.8)"
                      color="#e2e8f0"
                      fontSize="sm"
                    >
                      <option value="短信提醒">短信提醒</option>
                      <option value="电话回访">电话回访</option>
                      <option value="限额设置">投注限额</option>
                      <option value="临时冻结">临时冻结</option>
                    </Select>
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid rgba(30, 38, 64, 0.6)" pt={4}>
            <Button variant="ghost" mr={3} onClick={onClose} color="#64748b" _hover={{ bg: "rgba(100, 116, 139, 0.1)" }}>
              关闭
            </Button>
            {!interventions[selectedUser?.userId || ""] && (
              <Button
                bg="#FFB547"
                color="#070a13"
                fontWeight={700}
                onClick={handleIntervene}
                isLoading={intervening}
                loadingText="处理中"
                _hover={{ bg: "#ffc970" }}
              >
                确认干预
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
