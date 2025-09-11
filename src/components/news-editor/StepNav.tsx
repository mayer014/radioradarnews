import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  key: string;
  label: string;
  hidden?: boolean;
}

interface StepNavProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (index: number) => void;
}

const StepNav: React.FC<StepNavProps> = ({ steps, currentStep, onStepChange }) => {
  const visibleSteps = steps.filter((s) => !s.hidden);
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
        <div
          className="h-2 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {visibleSteps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <button
              type="button"
              key={step.key}
              onClick={() => onStepChange(idx)}
              className={[
                'group flex items-center gap-3 px-3 py-2 rounded-md border transition-colors',
                isActive
                  ? 'border-primary bg-primary/10'
                  : isCompleted
                  ? 'border-primary/40 hover:bg-primary/10'
                  : 'border-muted/40 hover:bg-muted/10',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isCompleted
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-muted-foreground/30 text-muted-foreground',
                ].join(' ')}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{idx + 1}</span>
                )}
              </span>
              <span className="text-sm font-medium text-left">
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepNav;
