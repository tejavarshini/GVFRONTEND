// components/CorporateJourneyCycle.tsx
// Visual representation of Corporate Rewards lifecycle
import { ArrowRight } from "lucide-react";

export default function CorporateJourneyCycle() {
  const employerSteps = [
    "Select Voucher",
    "Select Denomination",
    "Add to Employee Batch",
    "Upload Employee Excel",
    "Redeem Rewards"
  ];

  const employeeSteps = [
    "Employee logs into gif360.io",
    "Selects gift voucher",
    "Selects denomination",
    "Clicks redeem"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-8 text-gray-900">
        Corporate Rewards Journey
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Left Card - Employer Journey */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
              <h3 className="text-base font-bold text-purple-700">
                Corporate Scheme Rollout
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            {employerSteps.map((step, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center Circle - SabbPe Platform Hub */}
        <div className="flex justify-center items-center relative">
          {/* Arrow Left (hidden on mobile) */}
          <div className="hidden lg:block absolute -left-8 text-purple-400">
            <ArrowRight className="h-8 w-8" />
          </div>
          
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 shadow-xl flex flex-col items-center justify-center text-white p-6 relative z-10">
            <div className="text-center space-y-2">
              <p className="text-lg font-bold">SabbPe Platform</p>
              <div className="w-12 h-0.5 bg-white mx-auto"></div>
              <p className="text-xs opacity-90">Wallet Top-Up</p>
              <p className="text-xs opacity-90">Credential Release</p>
            </div>
          </div>
          
          {/* Arrow Right (hidden on mobile) */}
          <div className="hidden lg:block absolute -right-8 text-purple-400">
            <ArrowRight className="h-8 w-8" />
          </div>
        </div>

        {/* Right Card - Employee Journey */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-pink-100 rounded-lg">
              <h3 className="text-base font-bold text-indigo-700">
                Employee Redemption
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            {employeeSteps.map((step, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
