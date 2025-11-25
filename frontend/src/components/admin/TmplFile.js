import React, { useState, useEffect } from 'react';
import { tmplFilesAPI } from '../../services/api';

const TmplFile = () => {
  const [environment, setEnvironment] = useState('dev');
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTmplFile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await tmplFilesAPI.getByEnvironment(environment);
      setFileContent(response.data.file_content);
    } catch (err) {
      setError('Failed to load TMPL file');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTmplFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await tmplFilesAPI.update(environment, { file_content: fileContent, environment });
      setSuccess('TMPL file saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save TMPL file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h2>TMPL File Configuration</h2>
      
      <p style={{ color: '#666', marginBottom: '20px' }}>
        The requirements.tmpl file is used to specify Ansible role dependencies. 
        It is the same for all roles but can be different for each environment.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="environment">Environment</label>
          <select
            id="environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            disabled={loading}
          >
            <option value="dev">Development</option>
            <option value="it">Integration Testing</option>
            <option value="uat">User Acceptance Testing</option>
            <option value="prod">Production</option>
            <option value="all">All Environments</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fileContent">
            requirements.tmpl Content *
            <br />
            <small style={{ color: '#666', fontWeight: 'normal' }}>
              This file will be placed in ansible/roles/requirements.tmpl
            </small>
          </label>
          <textarea
            id="fileContent"
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            disabled={loading}
            required
            style={{ minHeight: '250px' }}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save TMPL File'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TmplFile;
