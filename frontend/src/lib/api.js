const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const parseError = async (res) => {
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  const message =
    body.error ||
    body.message ||
    `Request failed: ${res.status} ${res.statusText}`;
  const err = new Error(message);
  err.status = res.status;
  err.details = body.details;
  return err;
};

const request = async (path, init = {}) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error(
      `Could not reach backend at ${BASE_URL}. Is it running?`
    );
  }
  if (!res.ok) {
    throw await parseError(res);
  }
  try {
    return await res.json();
  } catch {
    throw new Error('Backend returned an invalid JSON response.');
  }
};

const buildRunFormData = (config) => {
  const fd = new FormData();
  const file = config?.process?.bpmnFile;
  const configCopy = {
    ...config,
    process: {
      ...config.process,
      bpmnFile: file
        ? { name: file.name, size: file.size }
        : null,
    },
  };
  fd.append('config', JSON.stringify(configCopy));
  if (file?.content) {
    fd.append(
      'bpmn',
      new Blob([file.content], { type: 'application/xml' }),
      file.name || 'process.bpmn'
    );
  }
  return fd;
};

export const createRun = async (config) => {
  return request('/api/runs', {
    method: 'POST',
    body: buildRunFormData(config),
  });
};

export const listRuns = async () => {
  const data = await request('/api/runs');
  return Array.isArray(data?.runs) ? data.runs : [];
};

export const getRun = async (id) => {
  return request(`/api/runs/${encodeURIComponent(id)}`);
};

export const sendChatMessage = async (messages) => {
  return request('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });
};

export const deleteRuns = async (ids) => {
  return request('/api/runs', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ids),
  });
};
