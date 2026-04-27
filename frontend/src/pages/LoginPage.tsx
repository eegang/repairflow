import { Suspense, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useAuth } from "../features/auth/model/auth";
import { authApi } from "../services/api";
import { ROLE_ROUTE } from "../shared/lib/constants";
import { Button } from "../shared/ui/Button";
import { Input } from "../shared/ui/Input";
import type { Role } from "../shared/types";

function LoginForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Email обязателен";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Неверный формат email";
    if (!password) nextErrors.password = "Пароль обязателен";
    else if (password.length < 6) nextErrors.password = "Минимум 6 символов";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      login(response.user, response.token);

      const params = new URLSearchParams(location.search);
      const callbackUrl = params.get("callbackUrl");
      navigate(callbackUrl || ROLE_ROUTE[response.user.role as Role]);
    } catch (error: any) {
      setFormError(error.response?.data?.detail || "Проверьте данные");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 text-white mb-4">
            <Wrench className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">RepairFlow</h1>
          <p className="text-sm text-neutral-500 mt-1">Система управления ремонтом</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Вход</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Введите данные для входа в систему
            </p>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              id="password"
              type="password"
              label="Пароль"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} className="w-full">
              Войти
            </Button>
          </form>

          <div className="pt-2 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 text-center">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-neutral-900 font-medium hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 bg-neutral-100 rounded-lg p-4 text-xs text-neutral-600 space-y-1">
          <p className="font-medium text-neutral-700">Демо-доступ:</p>
          <p>
            Клиент: <code className="bg-white px-1 rounded">client@test.com</code> /{" "}
            <code className="bg-white px-1 rounded">password123</code>
          </p>
          <p>
            Менеджер: <code className="bg-white px-1 rounded">manager@test.com</code> /{" "}
            <code className="bg-white px-1 rounded">password123</code>
          </p>
          <p>
            Техник: <code className="bg-white px-1 rounded">tech1@test.com</code> /{" "}
            <code className="bg-white px-1 rounded">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}


