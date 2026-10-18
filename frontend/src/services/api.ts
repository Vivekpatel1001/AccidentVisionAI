import axios from 'axios';
import type {
  OverviewStats,
  AccidentGeoPoint,
  HotspotsResponse,
  TemporalAnalyticsResponse,
  SeverityAnalyticsResponse,
  ModelMetadataResponse,
  ModelEvaluationResponse,
  PredictRequest,
  PredictResponse,
  DataQualityResponse,
  AccidentListResponse,
  MetadataResponse,
} from '../types/api';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async (): Promise<{ status: string; records_loaded: number; model_loaded: boolean }> => {
  const { data } = await api.get('/health');
  return data;
};

export const getMetadata = async (): Promise<MetadataResponse> => {
  const { data } = await api.get('/metadata');
  return data;
};

export const getOverview = async (city?: string): Promise<OverviewStats> => {
  const { data } = await api.get('/overview', { params: { city } });
  return data;
};

export const getGeoAccidents = async (
  city?: string,
  severity?: string,
  limit: number = 3000
): Promise<AccidentGeoPoint[]> => {
  const { data } = await api.get('/geo/accidents', {
    params: { city, severity, limit },
  });
  return Array.isArray(data) ? data : (data?.points || []);
};

export const getHotspots = async (
  city?: string,
  min_points: number = 12,
  eps_km: number = 0.6
): Promise<HotspotsResponse> => {
  const { data } = await api.get('/geo/hotspots', {
    params: { city, min_points, eps_km },
  });
  return data;
};

export const getTemporalAnalytics = async (city?: string): Promise<TemporalAnalyticsResponse> => {
  const { data } = await api.get('/analytics/temporal', { params: { city } });
  return data;
};

export const getSeverityAnalytics = async (city?: string): Promise<SeverityAnalyticsResponse> => {
  const { data } = await api.get('/analytics/severity', { params: { city } });
  return data;
};

export const getModelMetadata = async (): Promise<ModelMetadataResponse> => {
  const { data } = await api.get('/model/metadata');
  return data;
};

export const getModelEvaluation = async (): Promise<ModelEvaluationResponse> => {
  const { data } = await api.get('/model/evaluation');
  return data;
};

export const predictSeverity = async (input: PredictRequest): Promise<PredictResponse> => {
  const { data } = await api.post('/model/predict', input);
  return data;
};

export const getDataQuality = async (): Promise<DataQualityResponse> => {
  const { data } = await api.get('/data-quality');
  return data;
};

export const getAccidents = async (params: {
  page?: number;
  page_size?: number;
  city?: string;
  severity?: string;
  road_type?: string;
  weather?: string;
  search?: string;
}): Promise<AccidentListResponse> => {
  const { data } = await api.get('/accidents', { params });
  return data;
};

export default api;
