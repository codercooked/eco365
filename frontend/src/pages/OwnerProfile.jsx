import React from 'react';
import './OwnerProfile.css';

const OwnerProfile = () => {
  return (
    <div className="profile-container">
      <div className="page-header">
        <div className="header-titles">
          <h1>Owner Profile</h1>
          <div className="subtitle">Account & notification preferences</div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <div className="profile-card">
            <h2>Profile Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">Eco365 Owner</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role</span>
                <span className="info-value">Plant Manager</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">+91 XXXXX XXXXX</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">owner@eco365.in</span>
              </div>
            </div>
            <button className="edit-button">Edit Profile</button>
          </div>

          <div className="profile-card">
            <h2>Notification Preferences</h2>
            <ul className="pref-list">
              <li>
                <div className="pref-info">
                  <span className="pref-name">WhatsApp Alerts</span>
                  <span className="pref-desc">Receive instant messages for machine stops</span>
                </div>
                <div className="pref-status enabled">Enabled</div>
              </li>
              <li>
                <div className="pref-info">
                  <span className="pref-name">SMS Alerts</span>
                  <span className="pref-desc">Backup notifications when offline</span>
                </div>
                <div className="pref-status enabled">Enabled</div>
              </li>
              <li>
                <div className="pref-info">
                  <span className="pref-name">Email Reports</span>
                  <span className="pref-desc">Daily and weekly production summaries</span>
                </div>
                <div className="pref-status enabled">Enabled</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="stats-card">
            <h2>Quick Stats</h2>
            <div className="profile-stats">
              <div className="p-stat">
                <span className="p-stat-value">40</span>
                <span className="p-stat-label">Machines Managed</span>
              </div>
              <div className="p-stat">
                <span className="p-stat-value">3</span>
                <span className="p-stat-label">Active Alerts</span>
              </div>
              <div className="p-stat">
                <span className="p-stat-value">92%</span>
                <span className="p-stat-label">Today's Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
