import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
} from "@chakra-ui/react";
import {
  LayoutDashboard,
  Users,
  Target,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Settings,
  FileText,
  LogOut,
  Menu as MenuIcon,
  Shield,
  BarChart3,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "总览看板", desc: "核心数据概览" },
  { path: "/tier", icon: Users, label: "用户分层", desc: "鲸鱼/中产/散户分析" },
  { path: "/preference", icon: Target, label: "投注偏好", desc: "联赛与玩法分布" },
  { path: "/profit", icon: TrendingUp, label: "盈亏分析", desc: "赔付率与盈利" },
  { path: "/retention", icon: UserCheck, label: "用户留存", desc: "留存率与渠道" },
  { path: "/monitor", icon: AlertTriangle, label: "问题监控", desc: "异常行为识别" },
  { path: "/logs", icon: FileText, label: "操作日志", desc: "系统操作记录" },
  { path: "/users", icon: Shield, label: "权限管理", desc: "用户与角色管理", requirePerm: "manage" },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout, hasPerm } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !("requirePerm" in item) || hasPerm(item.requirePerm)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <VStack h="100%" align="stretch" spacing={0} bg="rgba(10, 14, 24, 0.95)" backdropFilter="blur(12px)">
      <Box px={5} py={5} borderBottom="1px solid rgba(30, 38, 64, 0.6)">
        <HStack spacing={3}>
          <Box
            w="40px"
            h="40px"
            borderRadius="10px"
            bg="linear-gradient(135deg, #00D9C0 0%, #06B6D4 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 12px rgba(0, 217, 192, 0.3)"
          >
            <BarChart3 size={22} color="#070a13" />
          </Box>
          <VStack align="stretch" spacing={0}>
            <Text fontSize="md" fontWeight={800} color="#e2e8f0">
              博彩分析
            </Text>
            <Text fontSize="10px" color="#64748b" letterSpacing="wide">
              BETTING ANALYTICS
            </Text>
          </VStack>
        </HStack>
      </Box>

      <VStack flex={1} align="stretch" py={4} px={3} spacing={1} overflowY="auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <HStack
                px={3}
                py={2.5}
                borderRadius="10px"
                spacing={3}
                cursor="pointer"
                transition="all 0.2s"
                bg={isActive ? "rgba(0, 217, 192, 0.1)" : "transparent"}
                _hover={{
                  bg: isActive ? "rgba(0, 217, 192, 0.15)" : "rgba(30, 38, 64, 0.4)",
                }}
                position="relative"
              >
                {isActive && (
                  <Box
                    position="absolute"
                    left={0}
                    top="50%"
                    transform="translateY(-50%)"
                    w="3px"
                    h="24px"
                    borderRadius="0 2px 2px 0"
                    bg="#00D9C0"
                  />
                )}
                <item.icon size={18} color={isActive ? "#00D9C0" : "#64748b"} />
                <VStack align="stretch" spacing={0} flex={1}>
                  <Text
                    fontSize="sm"
                    fontWeight={isActive ? 700 : 500}
                    color={isActive ? "#00D9C0" : "#94a3b8"}
                  >
                    {item.label}
                  </Text>
                  <Text fontSize="10px" color="#475569">
                    {item.desc}
                  </Text>
                </VStack>
              </HStack>
            )}
          </NavLink>
        ))}
      </VStack>

      <Box px={3} py={3} borderTop="1px solid rgba(30, 38, 64, 0.6)">
        <Menu>
          <MenuButton
            as={HStack}
            w="100%"
            p={2}
            borderRadius="10px"
            cursor="pointer"
            _hover={{ bg: "rgba(30, 38, 64, 0.4)" }}
            spacing={3}
          >
            <Avatar size="sm" name={user?.displayName || "User"} bg="#00D9C0" color="#070a13" fontSize="12px" fontWeight={700} />
            <VStack align="stretch" spacing={0} flex={1}>
              <Text fontSize="sm" color="#e2e8f0" fontWeight={600} noOfLines={1}>
                {user?.displayName || "未登录"}
              </Text>
              <HStack spacing={2}>
                <Badge
                  bg={user?.role === "admin" ? "rgba(139, 92, 246, 0.2)" : "rgba(6, 182, 212, 0.2)"}
                  color={user?.role === "admin" ? "#8B5CF6" : "#06B6D4"}
                  fontSize="10px"
                  px={1.5}
                  py={0.5}
                  borderRadius="4px"
                >
                  {user?.role === "admin" ? "管理员" : user?.role === "analyst" ? "分析师" : "查看员"}
                </Badge>
              </HStack>
            </VStack>
          </MenuButton>
          <MenuList
            bg="rgba(15, 20, 34, 0.98)"
            borderColor="rgba(30, 38, 64, 0.8)"
            backdropFilter="blur(12px)"
            minW="160px"
          >
            <MenuItem
              onClick={handleLogout}
              color="#ef4444"
              icon={<LogOut size={14} />}
              _hover={{ bg: "rgba(239, 68, 68, 0.1)" }}
            >
              退出登录
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </VStack>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (isMobile) {
    return (
      <Box h="100vh" display="flex" flexDirection="column" bg="#070a13">
        <Box
          as="header"
          h="56px"
          display="flex"
          alignItems="center"
          px={4}
          borderBottom="1px solid rgba(30, 38, 64, 0.6)"
          bg="rgba(10, 14, 24, 0.9)"
          backdropFilter="blur(8px)"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <IconButton
            aria-label="菜单"
            icon={<MenuIcon size={20} />}
            variant="ghost"
            color="#94a3b8"
            onClick={onOpen}
          />
          <Text fontSize="md" fontWeight={700} color="#e2e8f0" ml={3}>
            博彩用户行为分析看板
          </Text>
        </Box>
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="70%">
          <DrawerOverlay backdropFilter="blur(4px)" />
          <DrawerContent bg="transparent" maxW="260px">
            <DrawerBody p={0}>
              <Sidebar onNavigate={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        <Box flex={1} overflowY="auto" p={4}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <HStack h="100vh" spacing={0} align="stretch">
      <Box w="260px" flexShrink={0} borderRight="1px solid rgba(30, 38, 64, 0.6)">
        <Sidebar />
      </Box>
      <Box flex={1} overflowY="auto" p={6} bg="#070a13">
        {children}
      </Box>
    </HStack>
  );
}
