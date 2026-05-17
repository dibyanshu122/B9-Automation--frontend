import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

// Define types for the props
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

// Helper component for input fields
const InputField = ({ id, label, type = 'text', value, onChange, placeholder }: InputFieldProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1">
      <input
        type={type}
        name={id}
        id={id}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  </div>
);

// Define types for state
interface WhatsAppSettings {
  access_token: string;
  phone_number_id: string;
  verify_token: string;
}

export default function WhatsAppIntegration() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    access_token: '',
    phone_number_id: '',
    verify_token: '',
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing settings on component load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Replace with your actual API call function
        const response = await fetch('/api/integrations/whatsapp', {
          headers: {
            // Make sure to include your auth token
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        if (data.is_configured) {
          setSettings({
            access_token: data.access_token,
            phone_number_id: data.phone_number_id,
            verify_token: data.verify_token,
          });
          setIsConfigured(true);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Replace with your actual API call function
      const response = await fetch('/api/integrations/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Make sure to include your auth token
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      setIsConfigured(data.is_configured);
      setSuccess('WhatsApp settings saved successfully!');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium leading-6 text-gray-900">WhatsApp Integration</h3>
        {isConfigured && <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Connected</span>}
      </div>
      <p className="text-sm text-gray-500">Connect your WhatsApp Business Account to send and receive messages.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField id="access_token" label="Access Token" value={settings.access_token} onChange={handleChange} placeholder="EAA..." />
        <InputField id="phone_number_id" label="Phone Number ID" value={settings.phone_number_id} onChange={handleChange} placeholder="1234567890" />
        <InputField id="verify_token" label="Webhook Verify Token" value={settings.verify_token} onChange={handleChange} placeholder="Your custom verify token" />

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save Settings
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </form>
    </div>
  );
}
