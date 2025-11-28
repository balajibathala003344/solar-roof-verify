import { Application } from './applicationService';

// Export single application as JSON
export const exportApplicationJSON = (application: Application) => {
  const exportData = {
    sample_id: application.sampleId,
    user: {
      name: application.userName,
      email: application.userEmail,
    },
    location: {
      latitude: application.latitude,
      longitude: application.longitude,
      address: application.address,
      region: application.region,
    },
    installation: {
      type: application.installationType || '',
      date: application.installationDate || '',
      capacity_kw: application.systemCapacity || 0,
      installer: application.installerCompany || '',
      panel_brand: application.panelBrand || '',
      inverter_brand: application.inverterBrand || '',
      subsidy_amount: application.subsidyAmount || 0,
      electricity_provider: application.electricityProvider || '',
    },
    verification: {
      status: application.status,
      ai_result: application.aiResult || null,
      officer_notes: application.officerNotes || '',
      reviewed_by: application.reviewedBy || '',
      reviewed_at: application.reviewedAt || '',
    },
    timestamps: {
      created_at: application.createdAt,
      updated_at: application.updatedAt,
    },
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `solar-verification-${application.sampleId}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export multiple applications as JSON
export const exportAllApplicationsJSON = (applications: Application[]) => {
  const exportData = applications.map(app => ({
    sample_id: app.sampleId,
    user_name: app.userName,
    user_email: app.userEmail,
    latitude: app.latitude,
    longitude: app.longitude,
    address: app.address,
    region: app.region,
    installation_type: app.installationType || '',
    installation_date: app.installationDate || '',
    system_capacity_kw: app.systemCapacity || 0,
    installer_company: app.installerCompany || '',
    panel_brand: app.panelBrand || '',
    inverter_brand: app.inverterBrand || '',
    subsidy_amount: app.subsidyAmount || 0,
    electricity_provider: app.electricityProvider || '',
    status: app.status,
    has_solar: app.aiResult?.has_solar ?? null,
    confidence: app.aiResult?.confidence ?? null,
    panel_count: app.aiResult?.panel_count_est ?? null,
    pv_area_sqm: app.aiResult?.pv_area_sqm_est ?? null,
    capacity_kw_est: app.aiResult?.capacity_kw_est ?? null,
    qc_status: app.aiResult?.qc_status ?? null,
    qc_notes: app.aiResult?.qc_notes?.join('; ') ?? '',
    officer_notes: app.officerNotes || '',
    reviewed_at: app.reviewedAt || '',
    created_at: app.createdAt,
  }));

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `all-verifications-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export applications as CSV
export const exportApplicationsCSV = (applications: Application[]) => {
  const headers = [
    'Sample ID',
    'User Name',
    'User Email',
    'Latitude',
    'Longitude',
    'Address',
    'Region',
    'Installation Type',
    'Installation Date',
    'System Capacity (kW)',
    'Installer Company',
    'Panel Brand',
    'Inverter Brand',
    'Subsidy Amount',
    'Electricity Provider',
    'Status',
    'Solar Detected',
    'Confidence',
    'Panel Count',
    'PV Area (sqm)',
    'Est. Capacity (kW)',
    'QC Status',
    'QC Notes',
    'Officer Notes',
    'Reviewed At',
    'Created At',
  ];

  const rows = applications.map(app => [
    app.sampleId,
    app.userName,
    app.userEmail,
    app.latitude,
    app.longitude,
    `"${(app.address || '').replace(/"/g, '""')}"`,
    app.region,
    app.installationType || '',
    app.installationDate || '',
    app.systemCapacity || '',
    app.installerCompany || '',
    app.panelBrand || '',
    app.inverterBrand || '',
    app.subsidyAmount || '',
    app.electricityProvider || '',
    app.status,
    app.aiResult?.has_solar ?? '',
    app.aiResult?.confidence ?? '',
    app.aiResult?.panel_count_est ?? '',
    app.aiResult?.pv_area_sqm_est ?? '',
    app.aiResult?.capacity_kw_est ?? '',
    app.aiResult?.qc_status ?? '',
    `"${(app.aiResult?.qc_notes?.join('; ') || '').replace(/"/g, '""')}"`,
    `"${(app.officerNotes || '').replace(/"/g, '""')}"`,
    app.reviewedAt || '',
    app.createdAt,
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `solar-verifications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Parse CSV for batch upload
export interface CSVRow {
  sampleId: string;
  latitude: number;
  longitude: number;
  address?: string;
  region: string;
  installationType?: string;
  installationDate?: string;
  systemCapacity?: number;
  installerCompany?: string;
  panelBrand?: string;
  inverterBrand?: string;
  subsidyAmount?: number;
  electricityProvider?: string;
}

export const parseCSV = (csvText: string): CSVRow[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Map to expected format
    rows.push({
      sampleId: row.sample_id || row.sampleid || row.id || `BATCH-${Date.now()}-${i}`,
      latitude: parseFloat(row.latitude || row.lat) || 0,
      longitude: parseFloat(row.longitude || row.lon || row.lng) || 0,
      address: row.address || '',
      region: row.region || row.state || 'Other',
      installationType: row.installation_type || row.installationtype || row.type || '',
      installationDate: row.installation_date || row.installationdate || row.date || '',
      systemCapacity: parseFloat(row.system_capacity || row.capacity_kw || row.capacity) || 0,
      installerCompany: row.installer_company || row.installer || row.company || '',
      panelBrand: row.panel_brand || row.panelbrand || row.panel || '',
      inverterBrand: row.inverter_brand || row.inverterbrand || row.inverter || '',
      subsidyAmount: parseFloat(row.subsidy_amount || row.subsidy) || 0,
      electricityProvider: row.electricity_provider || row.provider || row.discom || '',
    });
  }

  return rows;
};
