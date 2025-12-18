import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Application, getAllApplications } from '@/lib/applicationService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RegionHeatmap from '@/components/RegionHeatmap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  MapPin,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Sun,
  Activity,
  Target,
  IndianRupee
} from 'lucide-react';

const COLORS = {
  primary: '#f59e0b',
  secondary: '#22c55e',
  accent: '#3b82f6',
  warning: '#eab308',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  ai_completed: '#8b5cf6',
  approved: '#22c55e',
  rejected: '#ef4444',
};

const Analytics = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const unsubscribe = getAllApplications((apps) => {
      setApplications(apps);
      setLoading(false);
      setLastUpdated(new Date());
    });
    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const processing = applications.filter(a => a.status === 'processing').length;
    const aiCompleted = applications.filter(a => a.status === 'ai_completed').length;
    
    const solarDetected = applications.filter(a => a.aiResult?.has_solar).length;
    const totalCapacity = applications.reduce((sum, a) => sum + (a.aiResult?.capacity_kw_est || 0), 0);
    const totalPanels = applications.reduce((sum, a) => sum + (a.aiResult?.panel_count_est || 0), 0);
    const totalSubsidy = applications.reduce((sum, a) => sum + (a.subsidyAmount || 0), 0);
    const avgConfidence = applications.filter(a => a.aiResult).length > 0
      ? applications.reduce((sum, a) => sum + (a.aiResult?.confidence || 0), 0) / applications.filter(a => a.aiResult).length
      : 0;

    return {
      total,
      approved,
      rejected,
      pending,
      processing,
      aiCompleted,
      solarDetected,
      totalCapacity: Math.round(totalCapacity * 10) / 10,
      totalPanels,
      totalSubsidy,
      avgConfidence: Math.round(avgConfidence * 100),
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      detectionRate: total > 0 ? Math.round((solarDetected / total) * 100) : 0,
    };
  }, [applications]);

  // Region-wise data
  const regionData = useMemo(() => {
    const regionMap = new Map<string, { 
      region: string; 
      total: number; 
      approved: number; 
      rejected: number;
      capacity: number;
      panels: number;
    }>();

    applications.forEach(app => {
      const region = app.region || 'Unknown';
      const existing = regionMap.get(region) || { 
        region, total: 0, approved: 0, rejected: 0, capacity: 0, panels: 0 
      };
      
      existing.total++;
      if (app.status === 'approved') existing.approved++;
      if (app.status === 'rejected') existing.rejected++;
      existing.capacity += app.aiResult?.capacity_kw_est || 0;
      existing.panels += app.aiResult?.panel_count_est || 0;
      
      regionMap.set(region, existing);
    });

    return Array.from(regionMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [applications]);

  // Status distribution
  const statusData = useMemo(() => [
    { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
    { name: 'Processing', value: stats.processing, color: STATUS_COLORS.processing },
    { name: 'Review', value: stats.aiCompleted, color: STATUS_COLORS.ai_completed },
    { name: 'Approved', value: stats.approved, color: STATUS_COLORS.approved },
    { name: 'Rejected', value: stats.rejected, color: STATUS_COLORS.rejected },
  ].filter(d => d.value > 0), [stats]);

  // Daily applications trend
  const trendData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; count: number; approved: number; detected: number }>();
    
    applications.forEach(app => {
      const date = new Date(app.createdAt).toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric' 
      });
      const existing = dailyMap.get(date) || { date, count: 0, approved: 0, detected: 0 };
      existing.count++;
      if (app.status === 'approved') existing.approved++;
      if (app.aiResult?.has_solar) existing.detected++;
      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.values()).slice(-14);
  }, [applications]);

  // Installation type distribution
  const installationTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    applications.forEach(app => {
      const type = app.installationType || 'Not Specified';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name: name.split(' - ')[0], value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [applications]);

  // Capacity by region
  const capacityByRegion = useMemo(() => {
    return regionData.map(r => ({
      region: r.region.length > 10 ? r.region.substring(0, 10) + '...' : r.region,
      capacity: Math.round(r.capacity * 10) / 10,
      panels: r.panels,
    }));
  }, [regionData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
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
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Real-time solar installation statistics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Sun className="h-8 w-8 mx-auto mb-2 text-amber-600" />
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{stats.total}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Total Applications</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.approved}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Approved</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.detectionRate}%</p>
              <p className="text-xs text-purple-600 dark:text-purple-500">Solar Detection</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.totalCapacity}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Total kW Capacity</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-teal-600" />
              <p className="text-3xl font-bold text-teal-700 dark:text-teal-400">{stats.totalPanels}</p>
              <p className="text-xs text-teal-600 dark:text-teal-500">Panels Detected</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-rose-600" />
              <p className="text-3xl font-bold text-rose-700 dark:text-rose-400">{stats.avgConfidence}%</p>
              <p className="text-xs text-rose-600 dark:text-rose-500">Avg Confidence</p>
            </CardContent>
          </Card>
        </div>

        {/* Region Heatmap */}
        <div className="mb-8">
          <RegionHeatmap applications={applications} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Applications by Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Applications by Region
              </CardTitle>
              <CardDescription>Top 10 regions by application count</CardDescription>
            </CardHeader>
            <CardContent>
              {regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="region" 
                      type="category" 
                      width={80} 
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="total" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Total" />
                    <Bar dataKey="approved" fill={COLORS.secondary} radius={[0, 4, 4, 0]} name="Approved" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Application Trend
              </CardTitle>
              <CardDescription>Last 14 days activity</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                      name="Total"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="detected" 
                      stroke={COLORS.secondary} 
                      fill={COLORS.secondary}
                      fillOpacity={0.3}
                      name="Solar Detected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacity by Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Capacity by Region
              </CardTitle>
              <CardDescription>Estimated solar capacity (kW) per region</CardDescription>
            </CardHeader>
            <CardContent>
              {capacityByRegion.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={capacityByRegion}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="capacity" fill={COLORS.accent} radius={[4, 4, 0, 0]} name="Capacity (kW)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No capacity data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Installation Types */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Installation Types
            </CardTitle>
            <CardDescription>Distribution of solar installation categories</CardDescription>
          </CardHeader>
          <CardContent>
            {installationTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={installationTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill={COLORS.purple} radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No installation type data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approval Rate</p>
                  <p className="text-4xl font-bold text-amber-600">{stats.approvalRate}%</p>
                </div>
                <div className="p-4 rounded-full bg-amber-500/20">
                  <CheckCircle className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.approvalRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Solar Detection Rate</p>
                  <p className="text-4xl font-bold text-green-600">{stats.detectionRate}%</p>
                </div>
                <div className="p-4 rounded-full bg-green-500/20">
                  <Sun className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.detectionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                  <p className="text-4xl font-bold text-blue-600">{stats.aiCompleted + stats.pending}</p>
                </div>
                <div className="p-4 rounded-full bg-blue-500/20">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {stats.pending} pending AI • {stats.aiCompleted} awaiting officer review
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
