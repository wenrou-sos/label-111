import {
  HStack,
  Select,
  VStack,
  Text,
  Button,
  Box,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Switch,
  Badge,
} from "@chakra-ui/react";
import { Filter, RefreshCw, Calendar, Users, Trophy, UsersRound, GitCompare, Clock } from "lucide-react";
import { useFilterStore } from "@/stores/filter";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MetaResponse } from "@/types";

const RANGE_OPTIONS = [
  { key: "7d", label: "近7天" },
  { key: "30d", label: "近30天" },
  { key: "90d", label: "近90天" },
  { key: "1y", label: "近1年" },
];

export function FilterBar({
  showTier = false,
  showLeague = false,
  showChannel = false,
  showCompare = false,
}: {
  showTier?: boolean;
  showLeague?: boolean;
  showChannel?: boolean;
  showCompare?: boolean;
}) {
  const {
    start,
    end,
    tier,
    league,
    channel,
    compareMode,
    compareStart,
    compareEnd,
    setStart,
    setEnd,
    setTier,
    setLeague,
    setChannel,
    setRange,
    reset,
    setCompareMode,
    setCompareRange,
  } = useFilterStore();
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
  }, []);

  const TimeRangeSection = ({
    title,
    badge,
    badgeColor,
    startDate,
    endDate,
    onRange,
    accent,
  }: {
    title: string;
    badge?: string;
    badgeColor?: string;
    startDate: string;
    endDate: string;
    onRange: (range: string) => void;
    accent?: string;
  }) => (
    <Box
      p={3}
      borderRadius="10px"
      bg="rgba(0, 217, 192, 0.02)"
      border="1px solid rgba(30, 38, 64, 0.6)"
      _hover={{ borderColor: "rgba(0, 217, 192, 0.2)" }}
      transition="border 0.2s"
    >
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Text fontSize="xs" color="#94a3b8" fontWeight={600}>
            {title}
          </Text>
          {badge && (
            <Badge
              fontSize="9px"
              bg={accent + "22"}
              color={accent}
              borderRadius="4px"
              px={1.5}
              py={0.5}
            >
              {badge}
            </Badge>
          )}
        </HStack>
        {badgeColor && (
          <Text fontSize="10px" color={badgeColor} fontFamily='"JetBrains Mono", monospace'>
            {startDate} ~ {endDate}
          </Text>
        )}
      </HStack>
      <HStack spacing={1.5} wrap="wrap">
        {RANGE_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            size="xs"
            variant="ghost"
            onClick={() => onRange(opt.key)}
            fontSize="10px"
            color="#64748b"
            height="26px"
            px={2.5}
            _hover={{ bg: "rgba(0, 217, 192, 0.08)", color: "#00D9C0" }}
            _active={{ bg: "rgba(0, 217, 192, 0.15)" }}
          >
            {opt.label}
          </Button>
        ))}
      </HStack>
      {!badgeColor && (
        <HStack spacing={1} mt={1.5}>
          <Calendar size={11} color="#475569" />
          <Text fontSize="10px" color="#475569" fontFamily='"JetBrains Mono", monospace'>
            {startDate} ~ {endDate}
          </Text>
        </HStack>
      )}
    </Box>
  );

  const FilterContent = () => (
    <VStack align="stretch" spacing={3}>
      <TimeRangeSection
        title="当前时段"
        accent="#00D9C0"
        badge="A"
        badgeColor="#00D9C0"
        startDate={start}
        endDate={end}
        onRange={setRange}
      />

      {showCompare && (
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between" px={0.5}>
            <HStack spacing={2}>
              <GitCompare size={14} color={compareMode ? "#F59E0B" : "#475569"} />
              <Text fontSize="xs" color="#94a3b8" fontWeight={600}>
                对比模式
              </Text>
            </HStack>
            <Switch
              size="sm"
              isChecked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              colorScheme="orange"
              sx={{
                ".chakra-switch__track": {
                  bg: "rgba(30, 38, 64, 0.8)",
                },
              }}
            />
          </HStack>
          {compareMode && (
            <TimeRangeSection
              title="对比时段"
              accent="#F59E0B"
              badge="B"
              badgeColor="#F59E0B"
              startDate={compareStart}
              endDate={compareEnd}
              onRange={setCompareRange}
            />
          )}
        </VStack>
      )}

      {showTier && (
        <Box>
          <Text fontSize="xs" color="#64748b" mb={1.5} fontWeight={600}>
            用户层级
          </Text>
          <Select
            size="sm"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            bg="rgba(15, 20, 34, 0.7)"
            borderColor="rgba(30, 38, 64, 0.8)"
            color="#e2e8f0"
            fontSize="xs"
            height="30px"
            icon={<UsersRound size={13} color="#64748b" />}
          >
            <option value="all">全部层级</option>
            {meta?.tiers?.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </Select>
        </Box>
      )}

      {showLeague && (
        <Box>
          <Text fontSize="xs" color="#64748b" mb={1.5} fontWeight={600}>
            联赛筛选
          </Text>
          <Select
            size="sm"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
            bg="rgba(15, 20, 34, 0.7)"
            borderColor="rgba(30, 38, 64, 0.8)"
            color="#e2e8f0"
            fontSize="xs"
            height="30px"
            icon={<Trophy size={13} color="#64748b" />}
          >
            <option value="all">全部联赛</option>
            {meta?.leagues?.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Box>
      )}

      {showChannel && (
        <Box>
          <Text fontSize="xs" color="#64748b" mb={1.5} fontWeight={600}>
            获客渠道
          </Text>
          <Select
            size="sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            bg="rgba(15, 20, 34, 0.7)"
            borderColor="rgba(30, 38, 64, 0.8)"
            color="#e2e8f0"
            fontSize="xs"
            height="30px"
            icon={<Users size={13} color="#64748b" />}
          >
            <option value="all">全部渠道</option>
            {meta?.channels?.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Box>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={reset}
        leftIcon={<RefreshCw size={13} />}
        color="#64748b"
        height="30px"
        fontSize="xs"
        _hover={{ bg: "rgba(100, 116, 139, 0.1)", color: "#94a3b8" }}
      >
        重置筛选
      </Button>
    </VStack>
  );

  if (isMobile) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Filter size={14} />}
          onClick={onOpen}
          borderColor="rgba(30, 38, 64, 0.8)"
          color="#94a3b8"
        >
          筛选
        </Button>
        <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
          <DrawerOverlay backdropFilter="blur(4px)" />
          <DrawerContent bg="#070a13" color="#e2e8f0">
            <DrawerCloseButton color="#64748b" />
            <DrawerHeader fontSize="sm" fontWeight={700}>
              筛选条件
            </DrawerHeader>
            <DrawerBody>
              <FilterContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Box
      bg="rgba(15, 20, 34, 0.5)"
      border="1px solid rgba(30, 38, 64, 0.6)"
      borderRadius="12px"
      p={4}
      backdropFilter="blur(8px)"
    >
      <HStack spacing={5} align="flex-start" wrap="wrap">
        <FilterContent />
      </HStack>
    </Box>
  );
}
