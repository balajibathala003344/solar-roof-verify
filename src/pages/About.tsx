import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sun, 
  Target, 
  Leaf, 
  Shield, 
  Cpu, 
  Eye,
  FileCheck,
  Database
} from 'lucide-react';

const About = () => {
  const objectives = [
    {
      icon: Sun,
      title: 'Clean Energy Access',
      description: 'Provide free electricity to 1 crore households through rooftop solar installations'
    },
    {
      icon: Target,
      title: 'Subsidy Distribution',
      description: 'Ensure subsidies reach genuine beneficiaries through remote verification'
    },
    {
      icon: Leaf,
      title: 'Environmental Impact',
      description: 'Reduce carbon footprint and promote sustainable energy practices'
    },
    {
      icon: Shield,
      title: 'Fraud Prevention',
      description: 'AI-powered detection prevents false claims and maintains public trust'
    }
  ];

  const aiCapabilities = [
    {
      icon: Cpu,
      title: 'YOLOv8 Detection',
      description: 'State-of-the-art object detection model trained on rooftop imagery'
    },
    {
      icon: Eye,
      title: 'Panel Quantification',
      description: 'Estimates panel count, area (m²), and capacity (kW) automatically'
    },
    {
      icon: FileCheck,
      title: 'Quality Control',
      description: 'VERIFIABLE/NOT_VERIFIABLE status with detailed reason codes'
    },
    {
      icon: Database,
      title: 'Audit Artifacts',
      description: 'Bounding boxes, confidence scores, and JSON reports for governance'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 hero-gradient opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                About <span className="text-gradient-solar">PM Surya Ghar</span>
              </h1>
              <p className="text-lg text-foreground/80">
                PM Surya Ghar: Muft Bijli Yojana is India's ambitious initiative to provide 
                free electricity to households through rooftop solar installations, 
                launched by Prime Minister Narendra Modi on February 15, 2024.
              </p>
            </div>
          </div>
        </section>

        {/* Scheme Details */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  The <span className="text-gradient-solar">Scheme</span>
                </h2>
                <div className="space-y-4 text-foreground/70">
                  <p>
                    Under this scheme, households are provided subsidies to install solar 
                    panels on their rooftops, enabling them to generate their own electricity 
                    and reduce dependency on the grid.
                  </p>
                  <p>
                    The scheme targets <strong className="text-foreground">1 crore households</strong> across 
                    India and is estimated to save the government approximately 
                    <strong className="text-foreground"> ₹75,000 crore</strong> per year in electricity costs.
                  </p>
                  <p>
                    To ensure subsidies reach genuine beneficiaries, a robust verification 
                    system is essential. Traditional field inspections are slow, costly, 
                    and inconsistent across states and DISCOMs.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {objectives.map((obj, index) => (
                  <Card key={index} variant="solar" className="p-4">
                    <CardContent className="p-0">
                      <obj.icon className="h-8 w-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">{obj.title}</h3>
                      <p className="text-sm text-muted-foreground">{obj.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Verification Challenge */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                The Verification <span className="text-gradient-solar">Challenge</span>
              </h2>
              <p className="text-foreground/70">
                Governance requires verifying rooftop solar installations to ensure subsidies 
                reach genuine beneficiaries. Our AI-powered system answers a simple question:
              </p>
              <div className="mt-6 p-6 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-xl font-semibold text-primary">
                  "Has a rooftop solar system actually been installed here?"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Capabilities */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Our AI <span className="text-gradient-solar">Capabilities</span>
              </h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                We use advanced computer vision and machine learning to provide accurate, 
                auditable solar panel detection across India's diverse roof types.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiCapabilities.map((cap, index) => (
                <Card key={index} className="text-center p-6">
                  <CardContent className="p-0">
                    <div className="w-14 h-14 rounded-xl solar-gradient flex items-center justify-center mx-auto mb-4">
                      <cap.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{cap.title}</h3>
                    <p className="text-sm text-muted-foreground">{cap.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Output Format */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Sample <span className="text-gradient-solar">Output</span>
              </h2>
              
              <Card className="overflow-hidden">
                <CardHeader className="solar-gradient">
                  <CardTitle className="text-primary-foreground">AI Detection Result (JSON)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-6 bg-foreground text-background text-sm overflow-x-auto">
{`{
  "sample_id": "1234",
  "lat": 12.9716,
  "lon": 77.5946,
  "has_solar": true,
  "confidence": 0.92,
  "panel_count_est": 14,
  "pv_area_sqm_est": 23.5,
  "capacity_kw_est": 4.7,
  "qc_status": "VERIFIABLE",
  "qc_notes": [
    "clear roof view",
    "distinct module grid",
    "mounting shadows visible"
  ],
  "bbox_or_mask": "[120,150,80,45];...",
  "image_metadata": {
    "source": "Satellite/Upload",
    "capture_date": "2024-03-15"
  }
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
