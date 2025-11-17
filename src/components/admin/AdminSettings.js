import React, { useState } from 'react';
import {
  Settings, Shield, Bell, Mail, Globe, Database,
  Key, Save, AlertCircle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: 'CampusNest',
    unlockFee: 200,
    maxPropertyImages: 10,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    registrationOpen: true,
    requireEmailVerification: true,
    autoApproveProperties: false
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Settings</h2>
      
      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Globe className="inline h-5 w-5 mr-2" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Unlock Fee (KSh)
              </label>
              <input
                type="number"
                value={settings.unlockFee}
                onChange={(e) => setSettings({...settings, unlockFee: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Maintenance Mode
              </span>
              <button
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Shield className="inline h-5 w-5 mr-2" />
            Security Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Require Email Verification
              </span>
              <button
                onClick={() => setSettings({...settings, requireEmailVerification: !settings.requireEmailVerification})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.requireEmailVerification ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Registration Open
              </span>
              <button
                onClick={() => setSettings({...settings, registrationOpen: !settings.registrationOpen})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings.registrationOpen ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.registrationOpen ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
