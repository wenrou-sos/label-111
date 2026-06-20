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
  Badge,
  Avatar,
  Switch,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  FormControl,
  FormLabel,
  Checkbox,
  SimpleGrid,
} from "@chakra-ui/react";
import { Shield, Edit3, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { SectionHeader, ChartCard, LoadingState } from "@/components/ui";
import type { SystemUser } from "@/types";

const ROLE_OPTIONS = [
  { key: "admin", label: "管理员", color: "#8B5CF6" },
  { key: "analyst", label: "分析师", color: "#06B6D4" },
  { key: "viewer", label: "查看员", color: "#64748b" },
];

const PERM_OPTIONS = [
  { key: "export", label: "导出数据" },
  { key: "intervene", label: "干预操作" },
  { key: "manage", label: "用户管理" },
];

export default function Users() {
  const [data, setData] = useState<SystemUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [editingRole, setEditingRole] = useState("");
  const [editingPerms, setEditingPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user: currentUser, hasPerm } = useAuthStore();

  const canManage = hasPerm("manage");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.users();
      setData(res.items);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = (u: SystemUser) => {
    setSelectedUser(u);
    setEditingRole(u.role);
    setEditingPerms({ ...u.perms });
    onOpen();
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await api.updateUser(selectedUser.id, {
        role: editingRole,
        perms: editingPerms,
      });
      if (res.ok) {
        toast({ title: "保存成功", status: "success", duration: 2000 });
        fetchData();
        onClose();
      } else {
        toast({ title: res.message || "保存失败", status: "error", duration: 2000 });
      }
    } catch {
      toast({ title: "网络错误", status: "error", duration: 2000 });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u: SystemUser) => {
    try {
      const newStatus = u.status === "active" ? "disabled" : "active";
      const res = await api.updateUser(u.id, { status: newStatus });
      if (res.ok) {
        toast({ title: `已${newStatus === "active" ? "启用" : "禁用"}`, status: "success", duration: 2000 });
        fetchData();
      }
    } catch {
      toast({ title: "操作失败", status: "error", duration: 2000 });
    }
  };

  const getRoleColor = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.key === role)?.color || "#64748b";
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.key === role)?.label || role;
  };

  return (
    <VStack spacing={6} align="stretch">
      <SectionHeader
        title="权限管理"
        subtitle="系统用户与角色权限配置"
      />

      {loading && !data ? (
        <VStack spacing={5} align="stretch">
          <Skeleton h="500px" borderRadius="xl" />
        </VStack>
      ) : !data ? (
        <LoadingState text="暂无数据" />
      ) : (
        <ChartCard
          title={`用户列表 (${data.length})`}
          subtitle="管理系统用户及权限配置"
          height={520}
        >
          <Box overflowX="auto" h="100%">
            <Table variant="unstyled" size="sm">
              <Thead position="sticky" top={0} bg="rgba(15, 20, 34, 0.95)" backdropFilter="blur(8px)" zIndex={1}>
                <Tr borderBottom="1px solid rgba(30, 38, 64, 0.8)">
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>用户</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>角色</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>权限</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>状态</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3}>最后登录</Th>
                  <Th color="#64748b" fontSize="xs" fontWeight={600} py={3} isNumeric>操作</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map((u) => (
                  <Tr key={u.id} borderBottom="1px solid rgba(30, 38, 64, 0.4)" _hover={{ bg: "rgba(0, 217, 192, 0.03)" }}>
                    <Td py={3}>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={u.displayName} bg={getRoleColor(u.role)} color="#070a13" fontSize="12px" fontWeight={700} />
                        <VStack align="stretch" spacing={0}>
                          <Text fontSize="sm" color="#e2e8f0" fontWeight={600}>
                            {u.displayName}
                          </Text>
                          <Text fontSize="10px" color="#64748b" fontFamily='"JetBrains Mono", monospace'>
                            @{u.username}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td py={3}>
                      <Badge
                        bg={getRoleColor(u.role) + "20"}
                        color={getRoleColor(u.role)}
                        px={2}
                        py={0.5}
                        borderRadius="6px"
                        fontSize="11px"
                        fontWeight={600}
                      >
                        {getRoleLabel(u.role)}
                      </Badge>
                    </Td>
                    <Td py={3}>
                      <HStack spacing={1} wrap="wrap">
                        {Object.entries(u.perms)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <Badge
                              key={k}
                              bg="rgba(0, 217, 192, 0.1)"
                              color="#00D9C0"
                              px={1.5}
                              py={0.5}
                              borderRadius="4px"
                              fontSize="10px"
                            >
                              {PERM_OPTIONS.find((p) => p.key === k)?.label || k}
                            </Badge>
                          ))}
                      </HStack>
                    </Td>
                    <Td py={3}>
                      <HStack spacing={2}>
                        <Switch
                          size="sm"
                          isChecked={u.status === "active"}
                          onChange={() => toggleStatus(u)}
                          isDisabled={!canManage || u.username === currentUser?.username}
                          colorScheme="teal"
                        />
                        <Text
                          fontSize="xs"
                          color={u.status === "active" ? "#22c55e" : "#64748b"}
                        >
                          {u.status === "active" ? "启用" : "禁用"}
                        </Text>
                      </HStack>
                    </Td>
                    <Td py={3}>
                      <Text fontSize="xs" color="#64748b">
                        {u.lastLogin}
                      </Text>
                    </Td>
                    <Td isNumeric py={3}>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="#94a3b8"
                        leftIcon={<Edit3 size={12} />}
                        onClick={() => openEdit(u)}
                        isDisabled={!canManage}
                        _hover={{ bg: "rgba(0, 217, 192, 0.1)", color: "#00D9C0" }}
                      >
                        编辑
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </ChartCard>
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
                bg="rgba(6, 182, 212, 0.15)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Settings size={20} color="#06B6D4" />
              </Box>
              <VStack align="stretch" spacing={0}>
                <Text fontSize="md" fontWeight={700}>编辑用户权限</Text>
                <Text fontSize="xs" color="#64748b">{selectedUser?.displayName}</Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="#64748b" />
          <ModalBody>
            <VStack spacing={5}>
              <FormControl>
                <FormLabel fontSize="xs" color="#64748b" fontWeight={600}>
                  用户角色
                </FormLabel>
                <Select
                  value={editingRole}
                  onChange={(e) => setEditingRole(e.target.value)}
                  bg="rgba(7, 10, 19, 0.6)"
                  borderColor="rgba(30, 38, 64, 0.8)"
                  color="#e2e8f0"
                  fontSize="sm"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" color="#64748b" fontWeight={600}>
                  权限配置
                </FormLabel>
                <SimpleGrid columns={1} spacing={3}>
                  {PERM_OPTIONS.map((p) => (
                    <Checkbox
                      key={p.key}
                      isChecked={editingPerms[p.key] || false}
                      onChange={(e) =>
                        setEditingPerms((prev) => ({ ...prev, [p.key]: e.target.checked }))
                      }
                      colorScheme="teal"
                      color="#94a3b8"
                      fontSize="sm"
                    >
                      {p.label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid rgba(30, 38, 64, 0.6)" pt={4}>
            <Button variant="ghost" mr={3} onClick={onClose} color="#64748b" _hover={{ bg: "rgba(100, 116, 139, 0.1)" }}>
              取消
            </Button>
            <Button
              bg="#00D9C0"
              color="#070a13"
              fontWeight={700}
              onClick={handleSave}
              isLoading={saving}
              loadingText="保存中"
              _hover={{ bg: "#00c4ae" }}
            >
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
