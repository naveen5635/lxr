import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const sessions = {
  create:    (name)              => api.post('/sessions', { name }),
  getByCode: (code)              => api.get(`/sessions/${code}`),
  getById:   (id)                => api.get(`/sessions/id/${id}`),
  getQR:     (id)                => api.get(`/sessions/${id}/qr`),
  join:      (code, teamName)    => api.post(`/sessions/${code}/join`, { teamName }),
  setStatus: (id, status)        => api.patch(`/sessions/${id}/status`, { status }),
};

export const checkpoints = {
  add:       (data)              => api.post('/checkpoints', data),
  getBySession: (sessionId)      => api.get(`/checkpoints/session/${sessionId}`),
  update:    (id, data)          => api.put(`/checkpoints/${id}`, data),
  remove:    (id)                => api.delete(`/checkpoints/${id}`),
};

export const tasks = {
  generate:  (checkpointId, teamId) => api.get(`/task/${checkpointId}/${teamId}`),
};

export const hints = {
  get:       (data)              => api.post('/hint', data),
};

export const completions = {
  submit:    (data)              => api.post('/complete', data),
  getByTeam: (teamId)            => api.get(`/completions/${teamId}`),
};

export const reports = {
  generate:  (sessionId)         => api.get(`/report/${sessionId}`),
};
