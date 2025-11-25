import React, { useState, useEffect } from 'react';
import { osConfigAPI } from '../../services/api';

const OSConfiguration = () => {
  const [osPlatform, setOsPlatform] = useState('Linux');
  const [configContent, setConfigContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await osConfigAPI.getByPlatform(osPlatform);
      setConfigContent(response.data.config_content);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osPlatform]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await osConfigAPI.update(osPlatform, { config_content: configContent, os_platform: osPlatform });
      setSuccess('Configuration saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h2>OS Configuration</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="osPlatform">OS Platform</label>
          <select
            id="osPlatform"
            value={osPlatform}
            onChange={(e) => setOsPlatform(e.target.value)}
            disabled={loading}
          >
            <option value="Linux">Linux (RedHat Enterprise Linux)</option>
            <option value="Windows">Windows</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="configContent">
            Configuration Content (all.yml)
            <br />
            <small style={{ color: '#666', fontWeight: 'normal' }}>
              This configuration will be used in the group_vars/all.yml file for all templates
            </small>
          </label>
          <textarea
            id="configContent"
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OSConfiguration;
