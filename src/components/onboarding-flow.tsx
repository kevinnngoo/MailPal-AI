"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  CheckCircle2,
  Mail,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Play,
  Settings,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const mockEmailData = {
  totalEmails: 15847,
  subscriptions: 234,
  promotions: 1456,
  spam: 89,
  potentialSavings: "2.3 GB",
  timeToClean: "12 minutes",
};

export default function OnboardingFlow({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to CleanInbox",
      description: "Let's get your inbox organized in just a few steps",
      icon: <Mail className="w-8 h-8" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold">Ready to clean up your inbox?</h3>
          <p className="text-gray-600">
            We&apos;ll analyze your emails and help you unsubscribe from unwanted lists, delete
            spam, and organize everything automatically.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockEmailData.totalEmails.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Emails</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockEmailData.potentialSavings}
              </div>
              <div className="text-sm text-gray-500">Space to Save</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{mockEmailData.timeToClean}</div>
              <div className="text-sm text-gray-500">Est. Time</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "connect",
      title: "Connect Your Email",
      description: "Securely connect your Gmail or Outlook account",
      icon: <Shield className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your Privacy is Protected</h3>
            <p className="text-gray-600">
              We use OAuth authentication and never store your email content. Only metadata is
              analyzed to categorize your emails.
            </p>
          </div>

          <div className="grid gap-4">
            <Button className="w-full py-6 text-lg" variant="outline">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-6 h-6 mr-3"
              />
              Connect Gmail Account
            </Button>
            <Button className="w-full py-6 text-lg" variant="outline">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                alt="Outlook"
                className="w-6 h-6 mr-3"
              />
              Connect Outlook Account
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What we access:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Email sender information</li>
              <li>• Subject lines for categorization</li>
              <li>• Unsubscribe links</li>
              <li>• Email metadata (dates, folders)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "analyze",
      title: "AI Analysis Complete",
      description: "We've categorized your emails and found cleanup opportunities",
      icon: <Zap className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analysis Complete!</h3>
            <p className="text-gray-600">
              Our AI has categorized your emails and identified cleanup opportunities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {mockEmailData.subscriptions}
                  </div>
                  <div className="text-sm text-gray-500">Subscriptions</div>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Can Unsubscribe</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {mockEmailData.promotions}
                  </div>
                  <div className="text-sm text-gray-500">Promotions</div>
                  <Badge className="mt-2 bg-green-100 text-green-800">Can Delete</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{mockEmailData.spam}</div>
                  <div className="text-sm text-gray-500">Spam</div>
                  <Badge className="mt-2 bg-red-100 text-red-800">Auto Delete</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {mockEmailData.potentialSavings}
                  </div>
                  <div className="text-sm text-gray-500">Space to Save</div>
                  <Badge className="mt-2 bg-purple-100 text-purple-800">Storage</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: "setup",
      title: "Customize Your Cleanup",
      description: "Set your preferences for automated email management",
      icon: <Settings className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Settings className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Customize Your Experience</h3>
            <p className="text-gray-600">
              Set up automated rules and preferences for ongoing email management.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Automatic Cleanup</CardTitle>
                <CardDescription>Run cleanup automatically on a schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Enable weekly cleanup</span>
                  <Button size="sm">Enable</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Unsubscribe</CardTitle>
                <CardDescription>
                  Automatically unsubscribe from detected newsletters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Auto-unsubscribe from promotions</span>
                  <Button size="sm" variant="outline">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spam Protection</CardTitle>
                <CardDescription>Enhanced spam detection and removal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Auto-delete spam emails</span>
                  <Button size="sm">Enable</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsCompleted(true);
    onComplete?.();
  };

  if (isCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
            <p className="text-gray-600">
              Your inbox cleanup is ready to begin. Start managing your emails with AI-powered
              tools.
            </p>
            <Button onClick={onComplete} className="mt-4">
              <Play className="w-4 h-4 mr-2" />
              Start Cleaning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">{currentStepData.icon}</div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>{currentStepData.content}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          <Button variant="ghost" onClick={handleSkip}>
            Skip Setup
          </Button>
        </div>

        <Button onClick={handleNext}>
          {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
          {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
