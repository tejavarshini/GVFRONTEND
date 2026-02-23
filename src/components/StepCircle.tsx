// components/StepCircle.tsx
// Vertical workflow steps with icons and descriptions
import { ReactNode } from 'react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
}

interface StepCircleProps {
  steps: Step[];
}

export default function StepCircle({ steps }: StepCircleProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Steps */}
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Left side - Number badge with connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              {/* Number badge */}
              <div className="px-5 py-3 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center text-xl font-bold shadow-lg z-10">
                {step.id}
              </div>
              
              {/* Dotted connector line */}
              {index < steps.length - 1 && (
                <div className="w-0.5 h-full border-l-2 border-dotted border-purple-300 mt-2" />
              )}
            </div>

            {/* Right side - Step card */}
            <div className="flex-1 bg-white rounded-xl shadow-md hover:shadow-lg transition-all px-4 py-3 border border-gray-100">
              <div className="flex items-center justify-between gap-3">
                {/* Text content */}
                <div className="flex-1 space-y-0.5">
                  <h3 className="text-base font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {step.description}
                  </p>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  {step.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
