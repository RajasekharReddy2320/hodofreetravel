import React from 'react';
import { ItineraryStep } from '@/types/tripPlanner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, Hotel, Camera, Utensils, MapPin, Clock, 
  IndianRupee
} from 'lucide-react';

interface ItineraryCardProps {
  step: ItineraryStep;
}

const categoryIcons: Record<string, React.ReactNode> = {
  transport: <Plane size={18} />,
  accommodation: <Hotel size={18} />,
  activity: <Camera size={18} />,
  food: <Utensils size={18} />,
  sightseeing: <MapPin size={18} />,
};

const categoryColors: Record<string, string> = {
  transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  accommodation: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  activity: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  sightseeing: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
};

const ItineraryCard: React.FC<ItineraryCardProps> = ({ step }) => {
  // Only show price if it's greater than 0
  const showPrice = step.estimatedCost && step.estimatedCost > 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Day & Time Badge */}
          <div className="flex-shrink-0">
            <div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-center min-w-[80px]">
              <div className="text-xs font-medium opacity-80">Day {step.day}</div>
              <div className="text-sm font-bold">{step.time}</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={categoryColors[step.category]}>
                {categoryIcons[step.category]}
                <span className="ml-1 capitalize">{step.category}</span>
              </Badge>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
            <p className="text-muted-foreground text-sm mb-3">{step.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {step.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {step.duration}
              </span>
              {showPrice && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <IndianRupee size={14} />
                  {step.estimatedCost!.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItineraryCard;
