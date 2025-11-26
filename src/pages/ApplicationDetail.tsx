import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Application, getApplication } from '@/lib/applicationService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  Calendar,
  Zap,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchApplication = async () => {
      if (id) {
        const app = await getApplication(id);
        setApplication(app);
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, user, navigate]);

  const handleDownloadJSON = () => {
    if (application?.aiResult) {
      const dataStr = JSON.stringify(application.aiResult, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solar-verification-${application.sampleId}.json`;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md text-center p-8">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Application Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The application you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    ai_completed: { label: 'Review Pending', color: 'bg-purple-100 text-purple-700', icon: Zap },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const status = statusConfig[application.status];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">#{application.sampleId}</h1>
                <Badge className={status.color}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${application.status === 'processing' ? 'animate-spin' : ''}`} />
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {application.region}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {application.aiResult && (
              <Button variant="outline" className="gap-2" onClick={handleDownloadJSON}>
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Latitude</p>
                    <p className="font-semibold">{application.latitude}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Longitude</p>
                    <p className="font-semibold">{application.longitude}</p>
                  </div>
                </div>
                {application.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold">{application.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-semibold">{application.region}</p>
                </div>
              </CardContent>
            </Card>

            {/* Image */}
            <Card>
              <CardHeader>
                <CardTitle>Rooftop Image</CardTitle>
              </CardHeader>
              <CardContent>
                {application.imageUrl ? (
                  <img 
                    src={application.imageUrl} 
                    alt="Rooftop"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No image uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Results */}
            {application.aiResult && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    AI Detection Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Solar Detected</p>
                      <Badge 
                        variant={application.aiResult.has_solar ? 'success' : 'destructive'}
                        className="text-lg px-4 py-1"
                      >
                        {application.aiResult.has_solar ? 'YES' : 'NO'}
                      </Badge>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(application.aiResult.confidence * 100)}%
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Panel Count</p>
                      <p className="text-2xl font-bold">
                        {application.aiResult.panel_count_est}
                      </p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Est. Capacity</p>
                      <p className="text-2xl font-bold">
                        {application.aiResult.capacity_kw_est} <span className="text-sm font-normal">kW</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">PV Area Estimate</p>
                      <p className="font-semibold">{application.aiResult.pv_area_sqm_est} m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">QC Status</p>
                      <Badge variant={application.aiResult.qc_status === 'VERIFIABLE' ? 'success' : 'warning'}>
                        {application.aiResult.qc_status}
                      </Badge>
                    </div>
                  </div>

                  {application.aiResult.qc_notes.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-muted-foreground mb-2">Quality Control Notes</p>
                      <ul className="space-y-1">
                        {application.aiResult.qc_notes.map((note, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Officer Notes */}
            {application.officerNotes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Officer Review Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{application.officerNotes}</p>
                  {application.reviewedAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Reviewed on {new Date(application.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApplicationDetail;
