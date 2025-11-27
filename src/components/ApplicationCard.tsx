import { Application, ApplicationStatus } from '@/lib/applicationService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, Zap, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
  showUserInfo?: boolean;
}

const statusConfig: Record<ApplicationStatus, { 
  label: string; 
  color: string; 
  icon: React.ElementType;
  bgColor: string;
}> = {
  pending: { 
    label: 'Pending', 
    color: 'text-amber-600', 
    icon: Clock,
    bgColor: 'bg-amber-100'
  },
  processing: { 
    label: 'AI Processing', 
    color: 'text-blue-600', 
    icon: Loader2,
    bgColor: 'bg-blue-100'
  },
  ai_completed: { 
    label: 'Review Required', 
    color: 'text-purple-600', 
    icon: Zap,
    bgColor: 'bg-purple-100'
  },
  approved: { 
    label: 'Approved', 
    color: 'text-green-600', 
    icon: CheckCircle,
    bgColor: 'bg-green-100'
  },
  rejected: { 
    label: 'Rejected', 
    color: 'text-red-600', 
    icon: XCircle,
    bgColor: 'bg-red-100'
  },
};

const ApplicationCard = ({ application, onClick, showUserInfo = false }: ApplicationCardProps) => {
  const status = statusConfig[application.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-300",
        onClick && "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">#{application.sampleId}</span>
              <Badge className={cn(status.bgColor, status.color, "border-0")}>
                <StatusIcon className={cn(
                  "h-3 w-3 mr-1",
                  application.status === 'processing' && "animate-spin"
                )} />
                {status.label}
              </Badge>
            </div>

            {showUserInfo && (
              <p className="text-sm text-muted-foreground">
                {application.userName} • {application.userEmail}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {application.region}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>

            {application.aiResult && (
              <div className="flex items-center gap-2 mt-2">
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  application.aiResult.has_solar 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}>
                  {application.aiResult.has_solar ? 'Solar Detected' : 'No Solar'}
                </div>
                <span className="text-xs text-muted-foreground">
                  Confidence: {Math.round(application.aiResult.confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          {application.imageUrl && (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={application.imageUrl} 
                alt="Rooftop"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
