import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createApplication, processApplication, createBatchApplications } from '@/lib/applicationService';
import { parseCSV, CSVRow } from '@/lib/exportUtils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageZoomModal from '@/components/ImageZoomModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Upload, 
  MapPin, 
  FileText, 
  Loader2,
  ArrowRight,
  Image as ImageIcon,
  CheckCircle,
  FileSpreadsheet,
  Building2,
  Calendar,
  Zap,
  IndianRupee,
  ZoomIn,
  X
} from 'lucide-react';
import { z } from 'zod';

const applicationSchema = z.object({
  sampleId: z.string().min(1, 'Sample ID is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  region: z.string().min(1, 'Region is required'),
});

const Apply = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  
  // CSV batch upload
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    sampleId: '',
    latitude: '',
    longitude: '',
    address: '',
    region: '',
    // Enhanced fields
    installationType: '',
    installationDate: '',
    systemCapacity: '',
    installerCompany: '',
    panelBrand: '',
    inverterBrand: '',
    subsidyAmount: '',
    electricityProvider: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const regions = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat',
    'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 
    'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Other'
  ];

  const installationTypes = [
    'Residential - Individual',
    'Residential - Society/RWA',
    'Commercial',
    'Industrial',
    'Government/PSU',
    'Agricultural',
    'Institutional (School/Hospital)',
    'Other'
  ];

  const popularPanelBrands = [
    'Tata Power Solar', 'Adani Solar', 'Waaree', 'Vikram Solar', 
    'Luminous', 'Havells', 'Jakson', 'Goldi Solar', 'Premier Energies', 'Other'
  ];

  const popularInverterBrands = [
    'Fronius', 'SMA', 'Growatt', 'Sungrow', 'ABB', 
    'Delta', 'Huawei', 'Goodwe', 'Solax', 'Other'
  ];

  const electricityProviders = [
    'BSES Rajdhani', 'BSES Yamuna', 'Tata Power Delhi', 'MSEDCL',
    'BESCOM', 'TANGEDCO', 'UGVCL', 'JVVNL', 'UPPCL', 'WBSEDCL',
    'APSPDCL', 'TSSPDCL', 'KSEB', 'PSPCL', 'DHBVN', 'Other'
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setCsvData(parsed);
        toast({
          title: 'CSV Loaded',
          description: `Found ${parsed.length} records ready for batch upload.`,
        });
      };
      reader.readAsText(file);
    }
  };

  const validateForm = () => {
    try {
      applicationSchema.parse({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      navigate('/auth');
      return;
    }

    if (!validateForm()) return;

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (!user || !userProfile) return;
    
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const appId = await createApplication(
        user.uid,
        userProfile.name,
        userProfile.email,
        {
          sampleId: formData.sampleId,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          address: formData.address,
          region: formData.region,
          imageFile: imageFile || undefined,
          installationType: formData.installationType,
          installationDate: formData.installationDate,
          systemCapacity: formData.systemCapacity ? parseFloat(formData.systemCapacity) : undefined,
          installerCompany: formData.installerCompany,
          panelBrand: formData.panelBrand,
          inverterBrand: formData.inverterBrand,
          subsidyAmount: formData.subsidyAmount ? parseFloat(formData.subsidyAmount) : undefined,
          electricityProvider: formData.electricityProvider,
        }
      );

      // Automatically start AI processing
      await processApplication(appId);

      toast({
        title: 'Application Submitted!',
        description: 'Your solar verification request is being processed.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Could not submit your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (!user || !userProfile || csvData.length === 0) return;

    setBatchLoading(true);
    try {
      const applicationIds = await createBatchApplications(
        user.uid,
        userProfile.name,
        userProfile.email,
        csvData
      );

      // Process all applications
      for (const appId of applicationIds) {
        await processApplication(appId);
      }

      toast({
        title: 'Batch Upload Complete!',
        description: `${applicationIds.length} applications submitted and processed.`,
      });

      setCsvData([]);
      setCsvFileName('');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Batch submission error:', error);
      toast({
        title: 'Batch Submission Failed',
        description: error?.message || 'Could not process batch upload.',
        variant: 'destructive',
      });
    } finally {
      setBatchLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-4">
                Please login to submit a verification application.
              </p>
              <Button variant="hero" onClick={() => navigate('/auth')}>
                Login / Sign Up
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Submit <span className="text-primary">Verification</span>
            </h1>
            <p className="text-muted-foreground">
              Enter your rooftop details for solar panel verification
            </p>
          </div>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single" className="gap-2">
                <FileText className="h-4 w-4" />
                Single Application
              </TabsTrigger>
              <TabsTrigger value="batch" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                CSV Batch Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Application Form
                  </CardTitle>
                  <CardDescription>
                    All fields marked with * are required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b">
                        <MapPin className="h-5 w-5 text-primary" />
                        Basic Information
                      </h3>
                      
                      {/* Sample ID */}
                      <div className="space-y-2">
                        <Label htmlFor="sampleId">Sample ID *</Label>
                        <Input
                          id="sampleId"
                          placeholder="e.g., SR-2024-001"
                          value={formData.sampleId}
                          onChange={(e) => setFormData({ ...formData, sampleId: e.target.value })}
                        />
                        {errors.sampleId && (
                          <p className="text-sm text-destructive">{errors.sampleId}</p>
                        )}
                      </div>

                      {/* Coordinates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude *</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="latitude"
                              type="number"
                              step="any"
                              placeholder="e.g., 12.9716"
                              className="pl-10"
                              value={formData.latitude}
                              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                          </div>
                          {errors.latitude && (
                            <p className="text-sm text-destructive">{errors.latitude}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude *</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="longitude"
                              type="number"
                              step="any"
                              placeholder="e.g., 77.5946"
                              className="pl-10"
                              value={formData.longitude}
                              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                          </div>
                          {errors.longitude && (
                            <p className="text-sm text-destructive">{errors.longitude}</p>
                          )}
                        </div>
                      </div>

                      {/* Address & Region */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Full Address</Label>
                          <Input
                            id="address"
                            placeholder="Enter your full address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="region">State / Region *</Label>
                          <select
                            id="region"
                            className="flex h-11 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          >
                            <option value="">Select your state</option>
                            {regions.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {errors.region && (
                            <p className="text-sm text-destructive">{errors.region}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Installation Details Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b">
                        <Zap className="h-5 w-5 text-primary" />
                        Installation Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="installationType">Installation Type</Label>
                          <select
                            id="installationType"
                            className="flex h-11 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.installationType}
                            onChange={(e) => setFormData({ ...formData, installationType: e.target.value })}
                          >
                            <option value="">Select type</option>
                            {installationTypes.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="installationDate">Installation Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="installationDate"
                              type="date"
                              className="pl-10"
                              value={formData.installationDate}
                              onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="systemCapacity">System Capacity (kW)</Label>
                          <div className="relative">
                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="systemCapacity"
                              type="number"
                              step="0.1"
                              placeholder="e.g., 5.0"
                              className="pl-10"
                              value={formData.systemCapacity}
                              onChange={(e) => setFormData({ ...formData, systemCapacity: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subsidyAmount">Subsidy Amount (₹)</Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="subsidyAmount"
                              type="number"
                              placeholder="e.g., 78000"
                              className="pl-10"
                              value={formData.subsidyAmount}
                              onChange={(e) => setFormData({ ...formData, subsidyAmount: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Equipment & Provider Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b">
                        <Building2 className="h-5 w-5 text-primary" />
                        Equipment & Provider Details
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="installerCompany">Installer Company</Label>
                          <Input
                            id="installerCompany"
                            placeholder="e.g., Tata Power Solar"
                            value={formData.installerCompany}
                            onChange={(e) => setFormData({ ...formData, installerCompany: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="electricityProvider">DISCOM / Electricity Provider</Label>
                          <select
                            id="electricityProvider"
                            className="flex h-11 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.electricityProvider}
                            onChange={(e) => setFormData({ ...formData, electricityProvider: e.target.value })}
                          >
                            <option value="">Select provider</option>
                            {electricityProviders.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="panelBrand">Panel Brand</Label>
                          <select
                            id="panelBrand"
                            className="flex h-11 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.panelBrand}
                            onChange={(e) => setFormData({ ...formData, panelBrand: e.target.value })}
                          >
                            <option value="">Select brand</option>
                            {popularPanelBrands.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="inverterBrand">Inverter Brand</Label>
                          <select
                            id="inverterBrand"
                            className="flex h-11 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.inverterBrand}
                            onChange={(e) => setFormData({ ...formData, inverterBrand: e.target.value })}
                          >
                            <option value="">Select brand</option>
                            {popularInverterBrands.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label>Rooftop Image (Optional)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                        {imagePreview ? (
                          <div className="space-y-4">
                            <div className="relative inline-block">
                              <img 
                                src={imagePreview} 
                                alt="Preview"
                                className="max-h-48 mx-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setShowImageZoom(true)}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => setShowImageZoom(true)}
                              >
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">{imageFile?.name}</span>
                            </div>
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG up to 10MB
                            </p>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Submit */}
                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg"
                      className="w-full gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="batch">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    CSV Batch Upload
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file with multiple verification records
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* CSV Format Guide */}
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <h4 className="font-semibold">CSV Format Guide</h4>
                    <p className="text-sm text-muted-foreground">
                      Your CSV should include the following columns:
                    </p>
                    <code className="block text-xs bg-card p-3 rounded border overflow-x-auto">
                      sample_id, latitude, longitude, address, region, installation_type, installation_date, system_capacity, installer_company, panel_brand, inverter_brand, subsidy_amount, electricity_provider
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Required: sample_id, latitude, longitude, region
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    {csvFileName ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="h-6 w-6" />
                          <span className="font-medium">{csvFileName}</span>
                        </div>
                        <p className="text-muted-foreground">
                          {csvData.length} records found
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCsvData([]);
                            setCsvFileName('');
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleCSVUpload}
                        />
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">
                          Click to upload CSV file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports .csv files
                        </p>
                      </label>
                    )}
                  </div>

                  {/* Preview Table */}
                  {csvData.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Preview (First 5 Records)</h4>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left">Sample ID</th>
                              <th className="p-2 text-left">Lat</th>
                              <th className="p-2 text-left">Lon</th>
                              <th className="p-2 text-left">Region</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Capacity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{row.sampleId}</td>
                                <td className="p-2">{row.latitude}</td>
                                <td className="p-2">{row.longitude}</td>
                                <td className="p-2">{row.region}</td>
                                <td className="p-2">{row.installationType || '-'}</td>
                                <td className="p-2">{row.systemCapacity || '-'} kW</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvData.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center">
                          ...and {csvData.length - 5} more records
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Batch */}
                  <Button 
                    variant="hero" 
                    size="lg"
                    className="w-full gap-2"
                    disabled={batchLoading || csvData.length === 0}
                    onClick={handleBatchSubmit}
                  >
                    {batchLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing {csvData.length} Records...
                      </>
                    ) : (
                      <>
                        Submit Batch ({csvData.length} Records)
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Image Zoom Modal */}
      {imagePreview && (
        <ImageZoomModal
          imageUrl={imagePreview}
          isOpen={showImageZoom}
          onClose={() => setShowImageZoom(false)}
          title="Rooftop Image Preview"
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Please review your application details before submitting:</p>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm max-h-[300px] overflow-y-auto">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sample ID:</span>
                    <span className="font-medium text-foreground">{formData.sampleId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-medium text-foreground">{formData.latitude}, {formData.longitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region:</span>
                    <span className="font-medium text-foreground">{formData.region}</span>
                  </div>
                  {formData.address && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium text-foreground truncate max-w-[200px]">{formData.address}</span>
                    </div>
                  )}
                  {formData.installationType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-foreground">{formData.installationType}</span>
                    </div>
                  )}
                  {formData.systemCapacity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium text-foreground">{formData.systemCapacity} kW</span>
                    </div>
                  )}
                  {formData.panelBrand && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Panel Brand:</span>
                      <span className="font-medium text-foreground">{formData.panelBrand}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Image:</span>
                    <span className="font-medium text-foreground">{imageFile ? 'Attached' : 'None'}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Once submitted, your application will be processed by our AI verification system.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="solar-gradient">
              Submit Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Apply;
