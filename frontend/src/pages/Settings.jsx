import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    alertThreshold: 5,
    notifyWhatsApp: true,
    notifySMS: true,
    notifyEmail: true,
    refreshInterval: 10,
    timeFormat: '12h',
    mqttUrl: 'mqtt://broker.emqx.io:1883',
    apiUrl: 'http://localhost:5001/api'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Settings saved successfully (demo)');
  };

  return (
    <div className="settings-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>Settings</h1>
          <div className="subtitle">System configuration</div>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-section">
          <h2>Notification Settings</h2>
          
          <div className="form-group">
            <label htmlFor="alertThreshold">Alert Threshold (minutes)</label>
            <div className="input-with-hint">
              <input 
                type="number" 
                id="alertThreshold" 
                name="alertThreshold" 
                value={settings.alertThreshold} 
                onChange={handleChange} 
                min="1"
              />
              <span className="hint">Time a machine must be stopped before triggering an alert.</span>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>Notification Channels</label>
            <div className="checkboxes">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="notifyWhatsApp" 
                  checked={settings.notifyWhatsApp} 
                  onChange={handleChange} 
                />
                WhatsApp
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="notifySMS" 
                  checked={settings.notifySMS} 
                  onChange={handleChange} 
                />
                SMS
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  name="notifyEmail" 
                  checked={settings.notifyEmail} 
                  onChange={handleChange} 
                />
                Email
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Display Settings</h2>
          
          <div className="form-group">
            <label htmlFor="refreshInterval">Dashboard Refresh Interval (seconds)</label>
            <select 
              id="refreshInterval" 
              name="refreshInterval" 
              value={settings.refreshInterval} 
              onChange={handleChange}
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="timeFormat">Time Format</label>
            <select 
              id="timeFormat" 
              name="timeFormat" 
              value={settings.timeFormat} 
              onChange={handleChange}
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>System Configuration</h2>
          
          <div className="form-group">
            <label htmlFor="mqttUrl">MQTT Broker URL</label>
            <input 
              type="text" 
              id="mqttUrl" 
              name="mqttUrl" 
              value={settings.mqttUrl} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiUrl">API Endpoint</label>
            <input 
              type="text" 
              id="apiUrl" 
              name="apiUrl" 
              value={settings.apiUrl} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
