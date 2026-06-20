import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  Button,
  Card,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  useToast,
} from "@chakra-ui/react";
import { User, Lock, BarChart3, Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "请输入账号和密码", status: "warning", duration: 2000 });
      return;
    }
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.ok) {
        toast({ title: "登录成功", status: "success", duration: 2000 });
        setTimeout(() => navigate("/"), 300);
      } else {
        toast({ title: res.message || "登录失败", status: "error", duration: 3000 });
      }
    } catch {
      toast({ title: "网络错误，请稍后重试", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    try {
      const res = await login(u, p);
      if (res.ok) {
        toast({ title: "登录成功", status: "success", duration: 2000 });
        setTimeout(() => navigate("/"), 300);
      } else {
        toast({ title: res.message || "登录失败", status: "error", duration: 3000 });
      }
    } catch {
      toast({ title: "网络错误，请稍后重试", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="#070a13"
      position="relative"
      overflow="hidden"
      px={4}
    >
      <Box
        position="absolute"
        top="-10%"
        left="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0,217,192,0.15) 0%, transparent 70%)"
        filter="blur(40px)"
      />
      <Box
        position="absolute"
        bottom="-15%"
        right="-5%"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)"
        filter="blur(60px)"
      />
      <Box
        position="absolute"
        top="40%"
        right="20%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)"
        filter="blur(30px)"
      />

      <Card
        w="100%"
        maxW="420px"
        bg="rgba(15, 20, 34, 0.85)"
        border="1px solid rgba(30, 38, 64, 0.8)"
        borderRadius="20px"
        backdropFilter="blur(20px)"
        boxShadow="0 20px 60px rgba(0, 0, 0, 0.4)"
        p={8}
        position="relative"
        zIndex={1}
      >
        <VStack align="stretch" spacing={6}>
          <VStack align="center" spacing={3}>
            <Box
              w="60px"
              h="60px"
              borderRadius="16px"
              bg="linear-gradient(135deg, #00D9C0 0%, #06B6D4 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 8px 24px rgba(0, 217, 192, 0.3)"
            >
              <BarChart3 size={30} color="#070a13" />
            </Box>
            <VStack align="center" spacing={1}>
              <Heading size="md" color="#e2e8f0" fontWeight={800}>
                博彩用户行为分析看板
              </Heading>
              <Text fontSize="xs" color="#64748b">
                Betting User Behavior Analytics Dashboard
              </Text>
            </VStack>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs" color="#64748b" fontWeight={600}>
                  账号
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <User size={16} color="#475569" />
                  </InputLeftElement>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入账号"
                    bg="rgba(7, 10, 19, 0.6)"
                    borderColor="rgba(30, 38, 64, 0.8)"
                    color="#e2e8f0"
                    fontSize="sm"
                    _focus={{
                      borderColor: "#00D9C0",
                      boxShadow: "0 0 0 3px rgba(0, 217, 192, 0.15)",
                    }}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" color="#64748b" fontWeight={600}>
                  密码
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Lock size={16} color="#475569" />
                  </InputLeftElement>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    bg="rgba(7, 10, 19, 0.6)"
                    borderColor="rgba(30, 38, 64, 0.8)"
                    color="#e2e8f0"
                    fontSize="sm"
                    _focus={{
                      borderColor: "#00D9C0",
                      boxShadow: "0 0 0 3px rgba(0, 217, 192, 0.15)",
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right={2}
                    top="50%"
                    transform="translateY(-50%)"
                    onClick={() => setShowPassword(!showPassword)}
                    color="#64748b"
                    minW="32px"
                    h="32px"
                    _hover={{ bg: "transparent", color: "#94a3b8" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                mt={2}
                bg="linear-gradient(135deg, #00D9C0 0%, #06B6D4 100%)"
                color="#070a13"
                fontWeight={700}
                h="44px"
                borderRadius="10px"
                fontSize="sm"
                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                _active={{ transform: "translateY(0)" }}
                isLoading={loading}
                loadingText="登录中"
              >
                登 录
              </Button>
            </VStack>
          </form>

          <VStack align="stretch" spacing={3}>
            <HStack spacing={2}>
              <Shield size={14} color="#64748b" />
              <Text fontSize="xs" color="#64748b">
                数据已脱敏处理 · 仅用于分析展示
              </Text>
            </HStack>

            <Box
              pt={4}
              borderTop="1px dashed rgba(30, 38, 64, 0.6)"
            >
              <Text fontSize="xs" color="#475569" mb={2}>
                快速体验账号：
              </Text>
              <VStack align="stretch" spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="rgba(139, 92, 246, 0.3)"
                  color="#8B5CF6"
                  justifyContent="space-between"
                  onClick={() => quickLogin("admin", "admin123")}
                  _hover={{ bg: "rgba(139, 92, 246, 0.1)" }}
                >
                  <Text>管理员 admin</Text>
                  <Text fontSize="10px" opacity={0.7}>admin123</Text>
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="rgba(6, 182, 212, 0.3)"
                  color="#06B6D4"
                  justifyContent="space-between"
                  onClick={() => quickLogin("analyst", "analyst123")}
                  _hover={{ bg: "rgba(6, 182, 212, 0.1)" }}
                >
                  <Text>分析师 analyst</Text>
                  <Text fontSize="10px" opacity={0.7}>analyst123</Text>
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="rgba(100, 116, 139, 0.3)"
                  color="#64748b"
                  justifyContent="space-between"
                  onClick={() => quickLogin("viewer", "viewer123")}
                  _hover={{ bg: "rgba(100, 116, 139, 0.1)" }}
                >
                  <Text>查看员 viewer</Text>
                  <Text fontSize="10px" opacity={0.7}>viewer123</Text>
                </Button>
              </VStack>
            </Box>
          </VStack>
        </VStack>
      </Card>
    </Box>
  );
}
