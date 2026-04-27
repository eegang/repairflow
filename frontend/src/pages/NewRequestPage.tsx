import { useState } from "react";
import { ArrowLeft, Image, Upload, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Button } from "../shared/ui/Button";
import { Card, CardContent } from "../shared/ui/Card";
import { Input } from "../shared/ui/Input";
import { Select } from "../shared/ui/Select";
import { Textarea } from "../shared/ui/Textarea";
import { filesApi, requestsApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import { cn } from "../shared/lib/utils";

const MACHINE_TYPES = [
  "Токарный станок",
  "Фрезерный станок",
  "Шлифовальный станок",
  "Сверлильный станок",
  "Станок ЧПУ",
  "Зубообрабатывающий",
  "Пресс",
  "Другое",
];

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    machine_name: "",
    machine_type: "",
    serial_number: "",
    description: "",
    contact_person: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const valid = selected.filter(
      (file) =>
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) &&
        file.size <= 10 * 1024 * 1024
    );
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.machine_name.trim()) nextErrors.machine_name = "Название обязательно";
    else if (form.machine_name.length < 3) nextErrors.machine_name = "Минимум 3 символа";
    if (!form.machine_type) nextErrors.machine_type = "Выберите тип";
    if (!form.description.trim()) nextErrors.description = "Описание обязательно";
    else if (form.description.length < 10) nextErrors.description = "Минимум 10 символов";
    if (!form.contact_person.trim()) nextErrors.contact_person = "Контактное лицо обязательно";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !user) return;

    setLoading(true);
    try {
      const created = await requestsApi.create({
        client_id: user.id,
        client_name: user.company_name || user.full_name,
        machine_name: form.machine_name,
        machine_type: form.machine_type,
        serial_number: form.serial_number || undefined,
        description: form.description,
        contact_person: form.contact_person,
      });

      for (const file of files) {
        await filesApi.upload(created.id, file);
      }

      navigate(`/client/requests/${created.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/client/requests"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку заявок
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Новая заявка</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Опишите проблему и приложите фотографии
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="machine_name"
                label="Название станка"
                placeholder="Токарный станок 16К20"
                value={form.machine_name}
                onChange={(event) => update("machine_name", event.target.value)}
                error={errors.machine_name}
              />

              <Select
                id="machine_type"
                label="Тип станка"
                placeholder="Выберите тип..."
                options={MACHINE_TYPES.map((item) => ({ value: item, label: item }))}
                value={form.machine_type}
                onChange={(event) => update("machine_type", event.target.value)}
                error={errors.machine_type}
              />

              <Input
                id="serial_number"
                label="Серийный номер"
                placeholder="Необязательно"
                value={form.serial_number}
                onChange={(event) => update("serial_number", event.target.value)}
              />

              <Textarea
                id="description"
                label="Описание проблемы"
                placeholder="Опишите неисправность, симптомы, когда возникла..."
                rows={4}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                error={errors.description}
              />

              <Input
                id="contact_person"
                label="Контактное лицо"
                placeholder="ФИО ответственного"
                value={form.contact_person}
                onChange={(event) => update("contact_person", event.target.value)}
                error={errors.contact_person}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Фотографии (до 5 файлов, max 10MB)
                </label>
                <label
                  htmlFor="file-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                    files.length > 0
                      ? "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
                      : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                  )}
                >
                  <Upload className="h-6 w-6 text-neutral-400 mb-2" />
                  <span className="text-xs text-neutral-500">
                    Нажмите для загрузки или перетащите файлы
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFiles}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 bg-neutral-100 rounded-lg px-3 py-2 text-sm"
                      >
                        <Image className="h-4 w-4 text-neutral-500" />
                        <span className="text-neutral-700 truncate max-w-[150px]">{file.name}</span>
                        <span className="text-neutral-400 text-xs">
                          ({(file.size / 1024 / 1024).toFixed(1)}MB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                  Отмена
                </Button>
                <Button type="submit" loading={loading}>
                  Создать заявку
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


