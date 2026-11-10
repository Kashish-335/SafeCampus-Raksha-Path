import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

// Initialize MapLibre worker URL globally before any map component renders
setWorkerUrl(maplibreWorkerUrl);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
