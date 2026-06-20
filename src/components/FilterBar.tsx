import { HStack, Select, VStack, Text, Button, Box, useBreakpointValue, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure } from "@chakra-ui/react";
import { Filter, RefreshCw, Calendar, Users, Trophy, UsersRound } from "lucide-react";
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
}: {
  showTier?: boolean;
  showLeague?: boolean;
  showChannel?: boolean;
}) {
  const { start, end, tier, league, channel, setStart, setEnd, setTier, setLeague, setChannel, setRange, reset } = useFilterStore();
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
  }, []);

  const FilterContent = () => (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Text fontSize="xs" color="#64748b" mb={2} fontWeight={600}>
          时间范围
        </Text>
        <HStack spacing={2} wrap="wrap">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant="ghost"
              onClick={() => setRange(opt.key)}
              fontSize="xs"
              color="#94a3b8"
              _hover={{ bg: "rgba(0, 217, 192, 0.1)", color: "#00D9C0" }}
            >
              {opt.label}
            </Button>
          ))}
        </HStack>
        <HStack spacing={2} mt={2}>
          <Calendar size={14} color="#64748b" />
          <Text fontSize="xs" color="#64748b">
            {start} ~ {end}
          </Text>
        </HStack>
      </Box>

      {showTier && (
        <Box>
          <Text fontSize="xs" color="#64748b" mb={2} fontWeight={600}>
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
            icon={<UsersRound size={14} color="#64748b" />}
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
          <Text fontSize="xs" color="#64748b" mb={2} fontWeight={600}>
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
            icon={<Trophy size={14} color="#64748b" />}
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
          <Text fontSize="xs" color="#64748b" mb={2} fontWeight={600}>
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
            icon={<Users size={14} color="#64748b" />}
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
        leftIcon={<RefreshCw size={14} />}
        color="#64748b"
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
          leftIcon={<Filter size={16} />}
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
      <HStack spacing={6} align="flex-start" wrap="wrap">
        <FilterContent />
      </HStack>
    </Box>
  );
}
