import { Activity, CheckCircle2, CloudCog, Database, Rocket, Server, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createDeployment, Deployment, getHealth, listDeployments, ServiceHealth } from './api';

const statusStyles: Record<Deployment['status'], string> = {
  queued: 'bg-slate-100 text-slate-700 ring-slate-200',
  running: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  succeeded: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-red-50 text-red-700 ring-red-200'
};

export function App() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestDeployment = useMemo(() => deployments[0], [deployments]);

  async function refresh() {
    try {
      const [nextHealth, nextDeployments] = await Promise.all([getHealth(), listDeployments()]);
      setHealth(nextHealth);
      setDeployments(nextDeployments);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      await createDeployment({
        service: String(formData.get('service')),
        environment: String(formData.get('environment')),
        version: String(formData.get('version'))
      });
      event.currentTarget.reset();
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-ink">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ocean">
              <CloudCog size={18} />
              DevOps Practice Stack
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal md:text-5xl">
              Full-stack deployment lab with containers, proxy, health checks, and MySQL.
            </h1>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
            onClick={refresh}
            type="button"
          >
            <Activity size={18} />
            Refresh
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 md:grid-cols-3">
        <Metric
          icon={<Server size={22} />}
          label="API"
          value={health?.status ?? 'loading'}
          tone={health?.status === 'ok' ? 'good' : 'neutral'}
        />
        <Metric
          icon={<Database size={22} />}
          label="Database"
          value={health?.database.status ?? 'loading'}
          subValue={health?.database.latencyMs ? `${health.database.latencyMs} ms` : undefined}
          tone={health?.database.status === 'ok' ? 'good' : 'neutral'}
        />
        <Metric
          icon={<Rocket size={22} />}
          label="Latest deploy"
          value={latestDeployment?.version ?? 'none'}
          subValue={latestDeployment?.environment}
          tone="neutral"
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[360px_1fr]">
        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold">Create Deployment</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Service" name="service" placeholder="backend-api" />
            <Field label="Environment" name="environment" placeholder="staging" />
            <Field label="Version" name="version" placeholder="v1.4.2" />
          </div>
          <button
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ocean px-4 text-sm font-semibold text-white transition hover:bg-[#006b75] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            <Rocket size={18} />
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
          {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </form>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold">Deployments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Environment</th>
                  <th className="px-5 py-3">Version</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deployments.map((deployment) => (
                  <tr key={deployment.id}>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{deployment.service}</td>
                    <td className="whitespace-nowrap px-5 py-4">{deployment.environment}</td>
                    <td className="whitespace-nowrap px-5 py-4">{deployment.version}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[deployment.status]}`}>
                        {deployment.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <input
        className="h-11 rounded-md border border-slate-300 px-3 text-sm font-normal outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
        name={name}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function Metric({
  icon,
  label,
  value,
  subValue,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
  tone: 'good' | 'neutral';
}) {
  const Icon = tone === 'good' ? CheckCircle2 : XCircle;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-ocean">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        <Icon className={tone === 'good' ? 'text-leaf' : 'text-slate-400'} size={24} />
      </div>
      {subValue ? <p className="mt-3 text-sm text-slate-500">{subValue}</p> : null}
    </article>
  );
}
