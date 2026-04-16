'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Provider = 'paystack' | 'flutterwave' | 'opay';

type GatewayForm = {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  webhookSecret: string;
  merchantId: string;
  isActive: boolean;
  isDefault: boolean;
  isTest: boolean;
};

const EMPTY_FORM: GatewayForm = {
  publicKey: '', secretKey: '', encryptionKey: '',
  webhookSecret: '', merchantId: '',
  isActive: false, isDefault: false, isTest: true,
};

const PROVIDERS: { key: Provider; name: string; logo: string; color: string; docs: string; fields: (keyof GatewayForm)[]; webhookNote: string }[] = [
  {
    key: 'paystack',
    name: 'Paystack',
    logo: '🟢',
    color: 'border-green-200 bg-green-50 dark:bg-green-900/10',
    docs: 'https://paystack.com/docs/api/',
    fields: ['publicKey', 'secretKey', 'webhookSecret', 'isTest'],
    webhookNote: 'Register webhook URL in Paystack Dashboard → Settings → API Keys & Webhooks',
  },
  {
    key: 'flutterwave',
    name: 'Flutterwave',
    logo: '🟠',
    color: 'border-orange-200 bg-orange-50 dark:bg-orange-900/10',
    docs: 'https://developer.flutterwave.com/docs/',
    fields: ['publicKey', 'secretKey', 'encryptionKey', 'webhookSecret', 'isTest'],
    webhookNote: 'Set webhook URL in Flutterwave Dashboard → Settings → Webhooks. The "verif-hash" is your webhook secret.',
  },
  {
    key: 'opay',
    name: 'OPay',
    logo: '🔵',
    color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/10',
    docs: 'https://documentation.opayweb.com/',
    fields: ['secretKey', 'merchantId', 'isTest'],
    webhookNote: 'Register webhook URL in OPay Merchant Dashboard → Developer → Webhook.',
  },
];

const FIELD_LABELS: Record<string, string> = {
  publicKey: 'Public Key',
  secretKey: 'Secret Key',
  encryptionKey: 'Encryption Key (Flutterwave)',
  webhookSecret: 'Webhook Secret / Verif-Hash',
  merchantId: 'Merchant ID (OPay)',
};

export default function VendorPaymentSettingsPage() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<Record<Provider, any>>({} as any);
  const [forms, setForms] = useState<Record<Provider, GatewayForm>>({
    paystack: { ...EMPTY_FORM },
    flutterwave: { ...EMPTY_FORM },
    opay: { ...EMPTY_FORM },
  });
  const [saving, setSaving] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    fetch('/api/vendor/payment-gateways')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, any> = {};
        (d.gateways || []).forEach((g: any) => { map[g.provider] = g; });
        setGateways(map as any);
        // Pre-fill forms with existing (non-secret) data
        setForms(prev => {
          const next = { ...prev };
          (d.gateways || []).forEach((g: any) => {
            next[g.provider as Provider] = {
              ...EMPTY_FORM,
              publicKey: g.publicKey || '',
              merchantId: g.merchantId || '',
              isActive: !!g.isActive,
              isDefault: !!g.isDefault,
              isTest: !!g.isTest,
              // secrets not returned from GET — user must re-enter to update
              secretKey: '', encryptionKey: '', webhookSecret: '',
            };
          });
          return next;
        });
      })
      .catch(() => toast({ title: 'Failed to load payment settings', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const save = async (provider: Provider) => {
    const form = forms[provider];
    if (!form.secretKey) {
      toast({ title: 'Secret key is required', variant: 'destructive' }); return;
    }
    setSaving(provider);
    try {
      const r = await fetch('/api/vendor/payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, ...form }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      toast({ title: `${provider} gateway saved`, description: d.message });
      // Refresh
      const gr = await fetch('/api/vendor/payment-gateways');
      const gd = await gr.json();
      const map: Record<string, any> = {};
      (gd.gateways || []).forEach((g: any) => { map[g.provider] = g; });
      setGateways(map as any);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const toggleSecret = (key: string) => setShowSecret(p => ({ ...p, [key]: !p[key] }));

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Gateway Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure payment providers for POS transfers. Webhook URLs to register with each provider are shown below.</p>
      </div>

      {PROVIDERS.map(p => {
        const existing = gateways[p.key];
        const form = forms[p.key];
        const isSaving = saving === p.key;

        return (
          <Card key={p.key} className={`border-2 ${p.color}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p.logo}</span>
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription>
                      <a href={p.docs} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs hover:underline">
                        Documentation <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {existing?.isActive
                    ? <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
                    : <Badge variant="outline" className="text-gray-500">Inactive</Badge>}
                  {existing?.isDefault && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webhook URL info */}
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Webhook URL for {p.name}</p>
                <code className="text-xs text-primary break-all">{appUrl}/api/webhooks/{p.key}</code>
                <p className="text-xs text-gray-500">{p.webhookNote}</p>
              </div>

              {/* Form fields */}
              <div className="grid gap-3">
                {p.fields.filter(f => typeof EMPTY_FORM[f] === 'string').map(field => (
                  <div key={field}>
                    <Label className="text-sm">{FIELD_LABELS[field] || field}</Label>
                    <div className="relative mt-1">
                      <Input
                        type={['secretKey', 'encryptionKey', 'webhookSecret'].includes(field) && !showSecret[`${p.key}-${field}`] ? 'password' : 'text'}
                        value={form[field] as string}
                        onChange={e => setForms(prev => ({ ...prev, [p.key]: { ...prev[p.key], [field]: e.target.value } }))}
                        placeholder={field === 'secretKey' ? (existing ? '••••••• (enter to update)' : 'Enter secret key') : `Enter ${FIELD_LABELS[field] || field}`}
                        className="pr-10"
                      />
                      {['secretKey', 'encryptionKey', 'webhookSecret'].includes(field) && (
                        <button type="button" onClick={() => toggleSecret(`${p.key}-${field}`)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showSecret[`${p.key}-${field}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                {[
                  { key: 'isActive', label: 'Active' },
                  { key: 'isDefault', label: 'Set as Default' },
                  { key: 'isTest', label: 'Test Mode' },
                ].map(toggle => (
                  <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[toggle.key as keyof GatewayForm] as boolean}
                      onChange={e => setForms(prev => ({ ...prev, [p.key]: { ...prev[p.key], [toggle.key]: e.target.checked } }))}
                      className="rounded"
                    />
                    <span className="text-sm">{toggle.label}</span>
                  </label>
                ))}
              </div>

              <Button onClick={() => save(p.key)} disabled={isSaving} className="w-full">
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : `Save ${p.name} Settings`}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-900/10">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Security Note</p>
              <p>Secret keys are stored encrypted and never returned in API responses. You must re-enter them to update. Always use test mode keys during development.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
