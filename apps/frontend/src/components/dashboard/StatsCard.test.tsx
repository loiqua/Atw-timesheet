import React from 'react';
import { render, screen } from '@testing-library/react';
import { Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Total Hours"
        value="120"
        icon={Clock}
      />
    );

    expect(screen.getByText('Total Hours')).toBeDefined();
    expect(screen.getByText('120')).toBeDefined();
  });

  it('should render description when provided', () => {
    render(
      <StatsCard
        title="Tasks"
        value="45"
        description="Completed this month"
        icon={Clock}
      />
    );

    expect(screen.getByText('Completed this month')).toBeDefined();
  });

  it('should render trend when provided', () => {
    render(
      <StatsCard
        title="Performance"
        value="95%"
        trend={{ value: 12, isPositive: true }}
        icon={Clock}
      />
    );

    expect(screen.getByText(/12/)).toBeDefined();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatsCard
        title="Custom"
        value="100"
        className="custom-class"
        icon={Clock}
      />
    );

    const element = container.firstChild as HTMLElement;
    expect(element.className).toContain('custom-class');
  });

  it('should render loading state', () => {
    const { container } = render(
      <StatsCard
        title="Loading"
        value="..."
        loading={true}
        icon={Clock}
      />
    );

    // En mode loading, le composant affiche des skeletons avec animation pulse
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
