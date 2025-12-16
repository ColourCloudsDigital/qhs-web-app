import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
}

interface SMTPConfigFormProps {
  initialData?: Partial<SMTPConfig>;
  onSubmit: (data: SMTPConfig) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  successMessage?: string;
}

export default function SMTPConfigForm({
  initialData,
  onSubmit,
  isLoading = false,
  error,
  successMessage,
}: SMTPConfigFormProps) {
  const [formData, setFormData] = useState<SMTPConfig>({
    host: initialData?.host || '',
    port: initialData?.port || 587,
    username: initialData?.username || '',
    password: '',
    fromEmail: initialData?.fromEmail || '',
    fromName: initialData?.fromName || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="host"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            SMTP Host
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="e.g. smtp.gmail.com"
          />
        </div>
        <div>
          <label
            htmlFor="port"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            SMTP Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="e.g. 587 or 465"
          />
        </div>
        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            SMTP Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="e.g. user@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            SMTP Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder={initialData?.host ? '••••••••' : 'Enter password'}
          />
          {initialData?.host && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave blank to keep the existing password
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="fromEmail"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            From Email
          </label>
          <input
            type="email"
            id="fromEmail"
            name="fromEmail"
            value={formData.fromEmail || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="e.g. noreply@qarashotels.com"
          />
        </div>
        <div>
          <label
            htmlFor="fromName"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            From Name
          </label>
          <input
            type="text"
            id="fromName"
            name="fromName"
            value={formData.fromName || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="e.g. Qaras Hotels"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
          <div className="flex">
            <div className="text-sm text-green-700 dark:text-green-400">
              {successMessage}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
}