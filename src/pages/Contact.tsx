import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Globe
} from 'lucide-react';

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: 'Message Sent!',
      description: 'We will get back to you within 24-48 hours.',
    });

    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'support@toproofsolar.in',
      description: 'For general queries',
    },
    {
      icon: Phone,
      title: 'Helpline',
      value: '1800-XXX-XXXX',
      description: 'Toll-free (Mon-Sat, 9 AM - 6 PM)',
    },
    {
      icon: MapPin,
      title: 'Address',
      value: 'MNRE, CGO Complex',
      description: 'Lodhi Road, New Delhi - 110003',
    },
    {
      icon: Globe,
      title: 'Official Portal',
      value: 'pmsuryaghar.gov.in',
      description: 'PM Surya Ghar Scheme',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 hero-gradient opacity-10" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-2xl mx-auto text-center animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get in <span className="text-gradient-solar">Touch</span>
              </h1>
              <p className="text-lg text-foreground/80">
                Have questions about solar verification? We're here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What is this regarding?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your query in detail..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg"
                      className="w-full gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                  <p className="text-foreground/70 mb-6">
                    Reach out to us through any of the following channels. 
                    Our support team is available Monday through Saturday.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {contactInfo.map((info, index) => (
                    <Card key={index} variant="solar" className="p-4">
                      <CardContent className="p-0 flex items-start gap-4">
                        <div className="p-3 rounded-lg solar-gradient">
                          <info.icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">{info.title}</p>
                          <p className="text-sm text-primary">{info.value}</p>
                          <p className="text-xs text-muted-foreground">{info.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Response Time */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6 flex items-center gap-4">
                    <Clock className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">Expected Response Time</h3>
                      <p className="text-sm text-muted-foreground">
                        We typically respond within 24-48 business hours. For urgent matters, 
                        please call our helpline.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Frequently Asked <span className="text-gradient-solar">Questions</span>
            </h2>
            <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
              Check our FAQ section for quick answers to common questions about the 
              PM Surya Ghar scheme and solar verification process.
            </p>
            <Button variant="outline" size="lg">
              View FAQs
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
