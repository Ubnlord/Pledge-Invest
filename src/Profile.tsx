import { useEffect, useRef, useState } from 'react';
import { api } from './lib/platform';
import { Camera, CheckCircle2, Lock, Save, ShieldCheck, UserRound, X } from 'lucide-react';

type ProfileData = {
  avatar?: string;
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  dateOfBirth: string;
  investorId: string;
  accountStatus: string;
  registrationDate: string;
  preferredCurrency: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingNotifications: boolean;
};

const emptyProfile = (account: any, user: any): ProfileData => ({
  avatar: '',
  fullName: account?.name || user?.name || '',
  displayName: account?.name || user?.name || '',
  email: account?.email || user?.email || '',
  phone: '',
  country: '',
  address: '',
  dateOfBirth: '',
  investorId: account?.investor_id || '',
  accountStatus: 'Active',
  registrationDate: '',
  preferredCurrency: 'USD',
  emailNotifications: true,
  smsNotifications: false,
  marketingNotifications: false,
});

export default function Profile({
  account,
  user,
  onSaved,
  onSignOut,
}: {
  account: any;
  user: any;
  onSaved: () => Promise<void> | void;
  onSignOut: () => Promise<void>;
}) {
  const [p, setP] = useState<ProfileData>(() => emptyProfile(account, user));
  const [saved, setSaved] = useState<ProfileData>(() => emptyProfile(account, user));
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError('');
    api
      .get('/api/profile')
      .then((r) => {
        if (cancelled) return;
        const v = { ...emptyProfile(account, user), ...r.data };
        setP(v);
        setSaved(v);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = emptyProfile(account, user);
        setP(fallback);
        setSaved(fallback);
        setError('Unable to load saved profile. You can still edit and save.');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account?.id, user?.userId]);

  const set = (k: keyof ProfileData, v: string | boolean) => setP((x) => ({ ...x, [k]: v }));

  const onPickPhoto = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('');
      setError('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setMessage('');
      setError('Image is too large. Please use a photo under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      set('avatar', dataUrl);
      setError('');
      setMessage('Photo selected. Click Save Changes to apply.');
    };
    reader.onerror = () => {
      setError('Unable to read that image. Try another file.');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const r = await api.put('/api/profile', p);
      const v = { ...p, ...r.data };
      setP(v);
      setSaved(v);
      setMessage('Profile saved successfully.');
      await onSaved();
    } catch {
      setError('Unable to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setP(saved);
    setMessage('Changes cancelled.');
    setError('');
  };

  if (busy) {
    return (
      <Page title="Profile" subtitle="Manage your investor account profile, preferences and security.">
        <div className="rounded-2xl border bg-white p-8 text-slate-500">Loading profile...</div>
      </Page>
    );
  }

  return (
    <Page title="Profile" subtitle="Manage your investor account profile, preferences and security.">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-indigo-50 text-3xl font-black text-indigo-600 ring-2 ring-indigo-100"
              title="Upload profile photo"
            >
              {p.avatar ? (
                <img src={p.avatar} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                <UserRound size={38} />
              )}
              <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-white shadow">
                <Camera size={14} />
              </span>
            </button>
            <div>
              <h2 className="text-xl font-black">Investor profile</h2>
              <p className="text-sm text-slate-500">Keep your personal information up to date.</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-sm font-bold text-indigo-600 hover:underline"
              >
                {p.avatar ? 'Change photo' : 'Upload photo'}
              </button>
              {p.avatar && (
                <button
                  type="button"
                  onClick={() => {
                    set('avatar', '');
                    setMessage('Photo removed. Click Save Changes to apply.');
                  }}
                  className="ml-3 text-sm font-bold text-slate-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={cancel} className="rounded-xl border px-4 py-2.5 font-bold">
              <X className="mr-2 inline" size={16} />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              <Save className="mr-2 inline" size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            onPickPhoto(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Profile photo URL (optional)"
            value={p.avatar?.startsWith('data:') ? '' : p.avatar || ''}
            onChange={(v) => set('avatar', v)}
            placeholder="https://... or upload a file above"
          />
          <Field label="Full name" value={p.fullName} onChange={(v) => set('fullName', v)} />
          <Field label="Display name" value={p.displayName} onChange={(v) => set('displayName', v)} />
          <Field label="Email address" value={p.email} disabled onChange={() => {}} />
          <Field label="Phone number" value={p.phone} onChange={(v) => set('phone', v)} />
          <Field label="Country" value={p.country} onChange={(v) => set('country', v)} />
          <Field label="Address" value={p.address} onChange={(v) => set('address', v)} />
          <Field label="Date of birth" type="date" value={p.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
          <Field label="Investor ID" value={p.investorId} disabled onChange={() => {}} />
          <Field label="Account status" value={p.accountStatus} disabled onChange={() => {}} />
          <Field label="Registration date" value={p.registrationDate} disabled onChange={() => {}} />
          <label>
            <span className="mb-1 block text-sm font-semibold">Wallet currency</span>
            <select
              value="USD"
              disabled
              aria-label="Wallet currency is fixed to USD"
              className="w-full rounded-xl border px-4 py-3 disabled:cursor-not-allowed disabled:bg-stone-100"
            >
              <option value="USD">USD — US Dollar (fixed)</option>
            </select>
            <span className="mt-1 block text-xs text-slate-500">PLEDGE INVEST wallet balances are maintained in USD only.</span>
          </label>
        </div>

        <div className="mt-7 border-t pt-6">
          <h3 className="font-black">Notification preferences</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Toggle label="Email notifications" checked={p.emailNotifications} onChange={(v) => set('emailNotifications', v)} />
            <Toggle label="SMS notifications" checked={p.smsNotifications} onChange={(v) => set('smsNotifications', v)} />
            <Toggle
              label="Marketing notifications"
              checked={p.marketingNotifications}
              onChange={(v) => set('marketingNotifications', v)}
            />
          </div>
        </div>

        <div className="mt-7 border-t pt-6">
          <h3 className="font-black">Password & security</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMessage('Password changes are handled through your authenticated account provider.')}
              className="rounded-xl border p-4 text-left font-semibold"
            >
              <Lock className="mr-2 inline" size={18} />
              Change password
            </button>
            <button
              onClick={() => setMessage('Your authenticated session and protected account data are active.')}
              className="rounded-xl border p-4 text-left font-semibold"
            >
              <ShieldCheck className="mr-2 inline" size={18} />
              Security settings
            </button>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3 border-t pt-6">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            <Save className="mr-2 inline" size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={cancel} className="rounded-xl border px-5 py-3 font-bold">
            Cancel
          </button>
          <button onClick={onSignOut} className="rounded-xl border px-5 py-3 font-bold text-rose-600">
            Sign out
          </button>
        </div>
      </div>
    </Page>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: any }) {
  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-slate-500">{subtitle}</p>
      </div>
      {children}
    </>
  );
}
