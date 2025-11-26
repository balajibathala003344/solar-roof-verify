import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createApplication, processApplication } from '@/lib/applicationService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  MapPin, 
  FileText, 
  Loader2,
  ArrowRight,
  Image as ImageIcon,
  CheckCircle
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    sampleId: '',
    latitude: '',
    longitude: '',
    address: '',
    region: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const regions = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat',
    'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 
    'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab', 'Haryana', 'Other'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      navigate('/auth');
      return;
    }

    if (!validateForm()) return;

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
        }
      );

      // Automatically start AI processing
      await processApplication(appId);

      toast({
        title: 'Application Submitted!',
        description: 'Your solar verification request is being processed.',
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Could not submit your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Submit <span className="text-gradient-solar">Verification</span>
            </h1>
            <p className="text-muted-foreground">
              Enter your rooftop details for solar panel verification
            </p>
          </div>

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

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Region */}
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

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Rooftop Image (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg"
                        />
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Apply;
