import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import heroImage from '@/assets/hero-solar.jpg';
import { 
  Sun, 
  Shield, 
  Zap, 
  MapPin, 
  CheckCircle, 
  ArrowRight,
  Users,
  Building2,
  TrendingUp
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Detection',
      description: 'Advanced YOLOv8 model for accurate solar panel detection from satellite imagery'
    },
    {
      icon: Shield,
      title: 'Audit-Ready Results',
      description: 'Complete verification reports with confidence scores and quality control status'
    },
    {
      icon: MapPin,
      title: 'Location-Based',
      description: 'Precise coordinate-based verification with buffer search capabilities'
    },
    {
      icon: CheckCircle,
      title: 'Transparent Process',
      description: 'Real-time status tracking from application to final approval'
    }
  ];

  const stats = [
    { value: '1 Cr+', label: 'Target Households', icon: Users },
    { value: '₹75,000 Cr', label: 'Annual Savings', icon: TrendingUp },
    { value: '36', label: 'States Covered', icon: Building2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[80vh] flex items-center">
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Indian rooftops with solar panels"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          </div>
          <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
            <div className="max-w-2xl animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Sun className="h-4 w-4" />
                <span className="text-sm font-medium">PM Surya Ghar: Muft Bijli Yojana</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-gradient-solar">Smart Solar</span>
                <br />
                <span className="text-foreground">Verification System</span>
              </h1>
              
              <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl leading-relaxed">
                AI-powered remote verification of rooftop solar installations. 
                Ensuring genuine beneficiaries receive subsidies under India's largest solar mission.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?mode=signup">
                  <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                    Apply for Verification
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <Card key={index} variant="glass" className="text-center p-8">
                  <CardContent className="p-0">
                    <stat.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <div className="text-4xl font-bold text-gradient-solar mb-2">
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It <span className="text-gradient-solar">Works</span>
              </h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Our AI-powered system provides fast, accurate, and auditable verification 
                of rooftop solar installations across India.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  variant="solar"
                  className="p-6 group hover:scale-105 transition-transform duration-300"
                >
                  <CardContent className="p-0">
                    <div className="w-14 h-14 rounded-xl solar-gradient flex items-center justify-center mb-4 group-hover:shadow-solar transition-all duration-300">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Verification <span className="text-gradient-solar">Process</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Submit Application', desc: 'Enter coordinates and upload rooftop image' },
                { step: '02', title: 'AI Analysis', desc: 'YOLOv8 model detects solar panels' },
                { step: '03', title: 'Officer Review', desc: 'DISCOM officer verifies AI results' },
                { step: '04', title: 'Approval', desc: 'Subsidy released to beneficiary' },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full solar-gradient flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="solar-gradient p-8 md:p-12 text-center">
              <CardContent className="p-0">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Ready to Verify Your Solar Installation?
                </h2>
                <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                  Join India's clean energy revolution. Apply now and get your rooftop solar 
                  installation verified for PM Surya Ghar subsidy.
                </p>
                <Link to="/auth?mode=signup">
                  <Button variant="glass" size="xl" className="gap-2">
                    Get Started Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
