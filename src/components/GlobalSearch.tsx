import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Text,
  Badge,
  useOutsideClick,
  Spinner,
  Avatar,
} from "@chakra-ui/react";
import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { SearchUserResult } from "@/types";

const DEBOUNCE_MS = 300;

export function GlobalSearch({ size = "md" }: { size?: "sm" | "md" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useOutsideClick({
    ref: wrapperRef,
    handler: () => setOpen(false),
  });

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.searchUsers(q);
      setResults(res.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      fetchResults(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [query, fetchResults]);

  const handlePick = (userId: string) => {
    setOpen(false);
    setQuery("");
    navigate(`/monitor?userId=${encodeURIComponent(userId)}`);
  };

  return (
    <Box ref={wrapperRef} position="relative" w="100%" maxW={size === "sm" ? "220px" : "360px"}>
      <InputGroup size={size}>
        <InputLeftElement pointerEvents="none">
          <Search size={16} color="#64748b" />
        </InputLeftElement>
        <Input
          placeholder="搜索用户ID或昵称…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          bg="rgba(7, 10, 19, 0.6)"
          borderColor="rgba(30, 38, 64, 0.8)"
          color="#e2e8f0"
          _hover={{ borderColor: "rgba(0, 217, 192, 0.4)" }}
          _focus={{
            borderColor: "#00D9C0",
            boxShadow: "0 0 0 1px rgba(0, 217, 192, 0.3)",
            bg: "rgba(7, 10, 19, 0.85)",
          }}
          _placeholder={{ color: "#475569" }}
        />
      </InputGroup>

      {open && (query.trim() || loading) && (
        <Box
          position="absolute"
          top="calc(100% + 6px)"
          left={0}
          right={0}
          bg="rgba(15, 20, 34, 0.98)"
          border="1px solid rgba(30, 38, 64, 0.8)"
          backdropFilter="blur(12px)"
          borderRadius="10px"
          overflow="hidden"
          zIndex={50}
          boxShadow="0 12px 32px rgba(0, 0, 0, 0.5)"
        >
          {loading ? (
            <HStack justify="center" py={5} spacing={2}>
              <Spinner size="xs" color="#00D9C0" />
              <Text fontSize="xs" color="#64748b">搜索中…</Text>
            </HStack>
          ) : results.length === 0 ? (
            <VStack py={5} spacing={1}>
              <User size={18} color="#475569" />
              <Text fontSize="xs" color="#64748b">未找到匹配用户</Text>
            </VStack>
          ) : (
            <VStack align="stretch" spacing={0} maxH="340px" overflowY="auto">
              {results.map((u) => (
                <HStack
                  key={u.userId}
                  as="button"
                  type="button"
                  w="100%"
                  px={3}
                  py={2.5}
                  spacing={3}
                  justify="stretch"
                  onClick={() => handlePick(u.userId)}
                  _hover={{ bg: "rgba(0, 217, 192, 0.08)" }}
                  transition="background 0.15s"
                  borderBottom="1px solid rgba(30, 38, 64, 0.4)"
                  _last={{ borderBottom: "none" }}
                >
                  <Avatar size="xs" name={u.nickname} bg="#00D9C0" color="#070a13" fontSize="11px" fontWeight={700} />
                  <VStack align="stretch" spacing={0} flex={1}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                        {u.nickname}
                      </Text>
                      <Badge
                        bg="rgba(100, 116, 139, 0.15)"
                        color="#94a3b8"
                        fontSize="10px"
                        px={1.5}
                        py={0.5}
                        borderRadius="4px"
                        fontFamily='"JetBrains Mono", monospace'
                      >
                        {u.userId}
                      </Badge>
                    </HStack>
                    <HStack spacing={2} mt={0.5}>
                      <Text fontSize="10px" color="#64748b">{u.tierName}</Text>
                      <Text fontSize="10px" color="#475569">·</Text>
                      <Text fontSize="10px" color="#64748b">{u.channel}</Text>
                    </HStack>
                  </VStack>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
}
