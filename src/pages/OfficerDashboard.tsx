import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Application, getAllApplications, reviewApplication, processApplication } from '@/lib/applicationService';
import { exportAllApplicationsJSON, exportApplicationsCSV, exportApplicationJSON } from '@/lib/exportUtils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ApplicationCard from '@/components/ApplicationCard';
import ImageZoomModal from '@/components/ImageZoomModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Search,
  Filter,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileJson,
  FileSpreadsheet,
  ZoomIn
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || userProfile?.role !== 'officer')) {
      navigate('/auth');
    }
  }, [user, userProfile, authLoading, navigate]);

  useEffect(() => {
    const unsubscribe = getAllApplications((apps) => {
      setApplications(apps);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = [...applications];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const sampleId = app.sampleId?.toLowerCase() || '';
        const userName = app.userName?.toLowerCase() || '';
        const userEmail = app.userEmail?.toLowerCase() || '';
        const address = app.address?.toLowerCase() || '';
        const region = app.region?.toLowerCase() || '';
        
        return sampleId.includes(term) ||
          userName.includes(term) ||
          userEmail.includes(term) ||
          address.includes(term) ||
          region.includes(term);
      });
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (regionFilter !== 'all') {
      filtered = filtered.filter(app => app.region === regionFilter);
    }
    
    setFilteredApps(filtered);
  }, [applications, searchTerm, statusFilter, regionFilter]);

  const handleRunAI = async (appId: string) => {
    setProcessingId(appId);
    try {
      await processApplication(appId);
      toast({
        title: 'AI Processing Complete',
        description: 'Solar panel detection analysis is ready for review.',
      });
    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Could not process the application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReview = async (appId: string, status: 'approved' | 'rejected', notes?: string) => {
    setReviewingId(appId);
    try {
      await reviewApplication(appId, status, user!.uid, notes);
      toast({
        title: status === 'approved' ? 'Application Approved' : 'Application Rejected',
        description: `The application has been ${status}.`,
      });
      setSelectedApp(null);
    } catch (error) {
      toast({
        title: 'Review Failed',
        description: 'Could not update the application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReviewingId(null);
    }
  };

  const handleExportJSON = () => {
    if (filteredApps.length === 0) {
      toast({
        title: 'No Data',
        description: 'No applications to export.',
        variant: 'destructive',
      });
      return;
    }
    exportAllApplicationsJSON(filteredApps);
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredApps.length} applications as JSON.`,
    });
  };

  const handleExportCSV = () => {
    if (filteredApps.length === 0) {
      toast({
        title: 'No Data',
        description: 'No applications to export.',
        variant: 'destructive',
      });
      return;
    }
    exportApplicationsCSV(filteredApps);
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredApps.length} applications as CSV.`,
    });
  };

  const handleExportSingleJSON = (app: Application) => {
    exportApplicationJSON(app);
    toast({
      title: 'Export Complete',
      description: `Exported verification result for ${app.sampleId}.`,
    });
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    aiCompleted: applications.filter(a => a.status === 'ai_completed').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const regions = [...new Set(applications.map(a => a.region))].filter(Boolean);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg solar-gradient">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Officer Dashboard</h1>
              <p className="text-muted-foreground">
                Review and approve solar verification applications
              </p>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center">
                    <div className="h-6 w-6 mx-auto mb-2 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-12 mx-auto mb-1 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 mx-auto bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending AI</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.aiCompleted}</p>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
            </>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name, or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  className="h-11 rounded-lg border-2 border-input bg-card px-4 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="ai_completed">Needs Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <select
                  className="h-11 rounded-lg border-2 border-input bg-card px-4 text-sm"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <option value="all">All Regions</option>
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Applications ({filteredApps.length})</span>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                          <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
                        </div>
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                        <div className="flex gap-4">
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                      <div className="w-20 h-20 bg-muted animate-pulse rounded-lg flex-shrink-0" />
                    </div>
                  </Card>
                ))
              ) : filteredApps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No applications found
                </p>
              ) : (
                filteredApps.map((app) => (
                  <div 
                    key={app.id}
                    className={`cursor-pointer transition-all ${selectedApp?.id === app.id ? 'ring-2 ring-primary rounded-xl' : ''}`}
                    onClick={() => setSelectedApp(app)}
                  >
                    <ApplicationCard application={app} showUserInfo />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Application Detail */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApp ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sample ID</p>
                      <p className="font-semibold">#{selectedApp.sampleId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applicant</p>
                      <p className="font-semibold">{selectedApp.userName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coordinates</p>
                      <p className="font-semibold">{selectedApp.latitude}, {selectedApp.longitude}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Region</p>
                      <p className="font-semibold">{selectedApp.region}</p>
                    </div>
                    {selectedApp.installationType && (
                      <div>
                        <p className="text-muted-foreground">Installation Type</p>
                        <p className="font-semibold">{selectedApp.installationType}</p>
                      </div>
                    )}
                    {selectedApp.systemCapacity > 0 && (
                      <div>
                        <p className="text-muted-foreground">System Capacity</p>
                        <p className="font-semibold">{selectedApp.systemCapacity} kW</p>
                      </div>
                    )}
                    {selectedApp.panelBrand && (
                      <div>
                        <p className="text-muted-foreground">Panel Brand</p>
                        <p className="font-semibold">{selectedApp.panelBrand}</p>
                      </div>
                    )}
                    {selectedApp.installerCompany && (
                      <div>
                        <p className="text-muted-foreground">Installer</p>
                        <p className="font-semibold">{selectedApp.installerCompany}</p>
                      </div>
                    )}
                  </div>

                  {/* Image with Zoom */}
                  {selectedApp.imageUrl && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Rooftop Image</p>
                      <div className="relative group">
                        <img 
                          src={selectedApp.imageUrl} 
                          alt="Rooftop"
                          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setShowImageZoom(true)}
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setShowImageZoom(true)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* AI Results */}
                  {selectedApp.aiResult && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          AI Detection Results
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleExportSingleJSON(selectedApp)}
                        >
                          <Download className="h-3 w-3" />
                          JSON
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Solar Detected</p>
                          <Badge variant={selectedApp.aiResult.has_solar ? 'success' : 'destructive'}>
                            {selectedApp.aiResult.has_solar ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-semibold">{Math.round(selectedApp.aiResult.confidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Panel Count</p>
                          <p className="font-semibold">{selectedApp.aiResult.panel_count_est}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. Capacity</p>
                          <p className="font-semibold">{selectedApp.aiResult.capacity_kw_est} kW</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">PV Area</p>
                          <p className="font-semibold">{selectedApp.aiResult.pv_area_sqm_est} m²</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">QC Status</p>
                          <Badge variant={selectedApp.aiResult.qc_status === 'VERIFIABLE' ? 'success' : 'warning'}>
                            {selectedApp.aiResult.qc_status}
                          </Badge>
                        </div>
                      </div>
                      {selectedApp.aiResult.qc_notes && selectedApp.aiResult.qc_notes.length > 0 && (
                        <div className="mt-3">
                          <p className="text-muted-foreground text-sm mb-1">QC Notes:</p>
                          <ul className="text-sm list-disc list-inside">
                            {selectedApp.aiResult.qc_notes.map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {selectedApp.status === 'pending' && (
                      <Button 
                        variant="accent" 
                        className="flex-1 gap-2"
                        onClick={() => handleRunAI(selectedApp.id)}
                        disabled={processingId === selectedApp.id}
                      >
                        {processingId === selectedApp.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Run AI Detection
                      </Button>
                    )}
                    
                    {selectedApp.status === 'ai_completed' && (
                      <>
                        <Button 
                          variant="success" 
                          className="flex-1 gap-2"
                          onClick={() => handleReview(selectedApp.id, 'approved')}
                          disabled={reviewingId === selectedApp.id}
                        >
                          {reviewingId === selectedApp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ThumbsUp className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 gap-2"
                          onClick={() => handleReview(selectedApp.id, 'rejected')}
                          disabled={reviewingId === selectedApp.id}
                        >
                          {reviewingId === selectedApp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ThumbsDown className="h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {(selectedApp.status === 'approved' || selectedApp.status === 'rejected') && (
                      <div className="flex-1 text-center py-2">
                        <Badge 
                          variant={selectedApp.status === 'approved' ? 'success' : 'destructive'}
                          className="text-sm"
                        >
                          {selectedApp.status === 'approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                        {selectedApp.reviewedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            on {new Date(selectedApp.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select an application to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Image Zoom Modal */}
      {selectedApp?.imageUrl && (
        <ImageZoomModal
          imageUrl={selectedApp.imageUrl}
          isOpen={showImageZoom}
          onClose={() => setShowImageZoom(false)}
          title={`Rooftop - ${selectedApp.sampleId}`}
        />
      )}
    </div>
  );
};

export default OfficerDashboard;
