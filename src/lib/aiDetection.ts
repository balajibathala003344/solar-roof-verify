// AI Solar Panel Detection Simulation
// In production, this would connect to a Python/Flask backend running YOLOv8

export interface DetectionResult {
  sample_id: string;
  lat: number;
  lon: number;
  has_solar: boolean;
  confidence: number;
  panel_count_est: number;
  pv_area_sqm_est: number;
  capacity_kw_est: number;
  qc_status: 'VERIFIABLE' | 'NOT_VERIFIABLE';
  qc_notes: string[];
  bbox_or_mask: string;
  image_metadata: {
    source: string;
    capture_date: string;
  };
  processing_time_ms: number;
}

// Simulate AI detection with realistic results
export const runSolarDetection = async (
  sampleId: string,
  lat: number,
  lon: number,
  imageFile?: File
): Promise<DetectionResult> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  // Generate realistic detection results
  const hasSolar = Math.random() > 0.3; // 70% chance of detecting solar
  const confidence = hasSolar 
    ? 0.75 + Math.random() * 0.24 
    : 0.1 + Math.random() * 0.3;
  
  const panelCount = hasSolar ? Math.floor(4 + Math.random() * 20) : 0;
  const avgPanelArea = 1.7; // m² per panel
  const pvArea = panelCount * avgPanelArea;
  const wattPerSqm = 180; // W/m²
  const capacity = (pvArea * wattPerSqm) / 1000; // kW

  const qcNotes: string[] = [];
  let qcStatus: 'VERIFIABLE' | 'NOT_VERIFIABLE' = 'VERIFIABLE';

  if (confidence > 0.85) {
    qcNotes.push('clear roof view');
    qcNotes.push('distinct module grid detected');
    qcNotes.push('mounting shadows visible');
  } else if (confidence > 0.7) {
    qcNotes.push('moderate image quality');
    qcNotes.push('panel array partially visible');
  } else if (confidence > 0.5) {
    qcNotes.push('low resolution imagery');
    qcNotes.push('partial occlusion detected');
    qcStatus = Math.random() > 0.5 ? 'VERIFIABLE' : 'NOT_VERIFIABLE';
  } else {
    qcNotes.push('insufficient image quality');
    qcNotes.push('heavy shadow/cloud cover');
    qcStatus = 'NOT_VERIFIABLE';
  }

  if (hasSolar && panelCount > 10) {
    qcNotes.push('large installation detected');
  }

  return {
    sample_id: sampleId,
    lat,
    lon,
    has_solar: hasSolar,
    confidence: Math.round(confidence * 100) / 100,
    panel_count_est: panelCount,
    pv_area_sqm_est: Math.round(pvArea * 10) / 10,
    capacity_kw_est: Math.round(capacity * 10) / 10,
    qc_status: qcStatus,
    qc_notes: qcNotes,
    bbox_or_mask: hasSolar ? generateMockBboxString(panelCount) : '',
    image_metadata: {
      source: 'Satellite/Manual Upload',
      capture_date: new Date().toISOString().split('T')[0]
    },
    processing_time_ms: Math.floor(2000 + Math.random() * 3000)
  };
};

const generateMockBboxString = (panelCount: number): string => {
  const boxes: string[] = [];
  for (let i = 0; i < Math.min(panelCount, 5); i++) {
    const x = Math.floor(100 + Math.random() * 400);
    const y = Math.floor(100 + Math.random() * 400);
    const w = Math.floor(50 + Math.random() * 100);
    const h = Math.floor(30 + Math.random() * 60);
    boxes.push(`[${x},${y},${w},${h}]`);
  }
  return boxes.join(';');
};

export const generateAuditOverlay = (result: DetectionResult): string => {
  // In production, this would generate actual image overlay
  // For now, return a placeholder
  return `/api/audit-overlay/${result.sample_id}`;
};
