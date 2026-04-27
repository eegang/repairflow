import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useAuth } from "../features/auth/model/auth";
import { authApi } from "../services/api";
import { Button } from "../shared/ui/Button";
import { Input } from "../shared/ui/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuth((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.full_name.trim()) nextErrors.full_name = "ФИО обязательно";
    if (!form.company_name.trim()) nextErrors.company_name = "Название компании обязательно";
    if (!form.email.trim()) nextErrors.email = "Email обязателен";
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = "Неверный формат email";
    if (form.phone && !/^[+\d\s()-]{7,}$/.test(form.phone)) {
      nextErrors.phone = "Неверный формат телефона";
    }
    if (!form.password) nextErrors.password = "Пароль обязателен";
    else if (form.password.length < 6) nextErrors.password = "Минимум 6 символов";
    if (form.password !== form.confirm_password) {
      nextErrors.confirm_password = "Пароли не совпадают";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        company_name: form.company_name,
        phone: form.phone || undefined,
      });
      login(response.user, response.token);
      navigate("/client/dashboard");
    } catch (error: any) {
      setFormError(error.response?.data?.detail || "Попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 text-white mb-4">
            <Wrench className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">RepairFlow</h1>
          <p className="text-sm text-neutral-500 mt-1">Регистрация предприятия</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Создание аккаунта</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Заполните данные вашей организации
            </p>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="full_name"
              label="Контактное лицо"
              placeholder="Иванов Иван Иванович"
              value={form.full_name}
              onChange={(event) => update("full_name", event.target.value)}
              error={errors.full_name}
            />
            <Input
              id="company_name"
              label="Название компании"
              placeholder='ООО "ПромТех"'
              value={form.company_name}
              onChange={(event) => update("company_name", event.target.value)}
              error={errors.company_name}
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              error={errors.email}
            />
            <Input
              id="phone"
              label="Телефон"
              placeholder="+7 (999) 123-45-67"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              error={errors.phone}
            />
            <Input
              id="password"
              type="password"
              label="Пароль"
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              error={errors.password}
            />
            <Input
              id="confirm_password"
              type="password"
              label="Подтверждение пароля"
              placeholder="Повторите пароль"
              value={form.confirm_password}
              onChange={(event) => update("confirm_password", event.target.value)}
              error={errors.confirm_password}
            />

            <Button type="submit" loading={loading} className="w-full">
              Зарегистрироваться
            </Button>
          </form>

          <div className="pt-2 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 text-center">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-neutral-900 font-medium hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


