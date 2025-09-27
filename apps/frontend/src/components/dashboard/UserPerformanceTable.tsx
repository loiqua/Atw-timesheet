'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { UserDashboardStats } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Minus, Clock, CheckCircle, AlertCircle, Target } from 'lucide-react';

interface UserPerformanceTableProps {
  users: UserDashboardStats[];
  loading?: boolean;
}

interface MobileUserCardProps {
  user: UserDashboardStats;
  index: number;
  getInitials: (name: string) => string;
  getProductivityBadge: (productivity: number) => React.ReactElement;
}

const MobileUserCard: React.FC<MobileUserCardProps> = ({ 
  user, 
  index, 
  getInitials, 
  getProductivityBadge 
}) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-center space-x-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm">
            {getInitials(user.userName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium text-sm">{user.userName}</div>
          <div className="text-xs text-muted-foreground">{user.userEmail}</div>
        </div>
        {index < 3 && (
          <Badge variant="outline" className="text-xs">
            #{index + 1}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-sm font-medium">{user.totalHoursThisMonth}h</div>
            <div className="text-xs text-muted-foreground">Heures</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-purple-600" />
          <div>
            <div className="text-sm font-medium">{user.productivity}%</div>
            <div className="text-xs text-muted-foreground">Productivité</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-sm font-medium">{user.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Terminées</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <div>
            <div className="text-sm font-medium">{user.pendingTasks}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
        {getProductivityBadge(user.productivity)}
      </div>
    </CardContent>
  </Card>
);

export const UserPerformanceTable: React.FC<UserPerformanceTableProps> = ({
  users,
  loading = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-4 p-4 border-b">
          {['user', 'hours', 'completed', 'pending', 'productivity'].map((field) => (
            <div key={`header-skeleton-${field}`} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
        {['row-1', 'row-2', 'row-3', 'row-4', 'row-5'].map((rowId) => (
          <div key={`loading-${rowId}`} className="grid grid-cols-5 gap-4 p-4">
            {['user', 'hours', 'completed', 'pending', 'productivity'].map((field) => (
              <div key={`loading-cell-${rowId}-${field}`} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-lg font-medium">No user data available</div>
        <div className="text-sm">User performance data will appear here</div>
      </div>
    );
  }

  const getProductivityBadge = (productivity: number) => {
    if (productivity >= 80) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>;
    }
    if (productivity >= 60) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Good</Badge>;
    }
    if (productivity >= 40) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Average</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Improvement</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedUsers = [...users].sort((a, b) => b.productivity - a.productivity);

  if (isMobile) {
    return (
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <Card key={`mobile-loading-${index}`} className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={`mobile-stat-${i}`} className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      <div className="space-y-1">
                        <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                        <div className="h-2 w-12 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          sortedUsers.map((user, index) => (
            <MobileUserCard 
              key={user.userId} 
              user={user} 
              index={index}
              getInitials={getInitials}
              getProductivityBadge={getProductivityBadge}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">User</TableHead>
            <TableHead className="text-center">Hours This Month</TableHead>
            <TableHead className="text-center">Completed Tasks</TableHead>
            <TableHead className="text-center">Pending Tasks</TableHead>
            <TableHead className="text-center">Productivity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user, index) => (
            <TableRow key={user.userId} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.userName}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.userEmail}
                    </div>
                  </div>
                  {index < 3 && (
                    <Badge variant="outline" className="ml-2">
                      #{index + 1}
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="text-center">
                <div className="font-medium">{user.totalHoursThisMonth}h</div>
              </TableCell>
              
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span className="font-medium">{user.completedTasks}</span>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
              </TableCell>
              
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <span className="font-medium">{user.pendingTasks}</span>
                  {(() => {
                    if (user.pendingTasks > 5) {
                      return <TrendingUp className="h-3 w-3 text-orange-600" />;
                    }
                    if (user.pendingTasks > 0) {
                      return <Minus className="h-3 w-3 text-gray-600" />;
                    }
                    return <TrendingDown className="h-3 w-3 text-green-600" />;
                  })()}
                </div>
              </TableCell>
              
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-medium">{user.productivity}%</span>
                  {getProductivityBadge(user.productivity)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
