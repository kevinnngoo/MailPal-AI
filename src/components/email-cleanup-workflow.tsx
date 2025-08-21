"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Mail,
  Trash2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "./ui/input";

// Mock email data for demonstration
const mockEmails = [
  {
    id: "1",
    sender: "newsletter@techcrunch.com",
    subject: "Daily Tech News Digest",
    category: "newsletter",
    unsubscribeUrl: "https://techcrunch.com/unsubscribe",
    count: 45,
    lastReceived: "2024-01-15",
    canUnsubscribe: true,
  },
  {
    id: "2",
    sender: "promotions@amazon.com",
    subject: "Daily Deals and Offers",
    category: "promotion",
    unsubscribeUrl: "https://amazon.com/unsubscribe",
    count: 123,
    lastReceived: "2024-01-14",
    canUnsubscribe: true,
  },
  {
    id: "3",
    sender: "noreply@facebook.com",
    subject: "Social Media Notifications",
    category: "social",
    unsubscribeUrl: null,
    count: 67,
    lastReceived: "2024-01-13",
    canUnsubscribe: false,
  },
  {
    id: "4",
    sender: "spam@suspicious.com",
    subject: "Suspicious Offers",
    category: "spam",
    unsubscribeUrl: "https://suspicious.com/fake-unsubscribe",
    count: 23,
    lastReceived: "2024-01-12",
    canUnsubscribe: false,
  },
  {
    id: "5",
    sender: "updates@github.com",
    subject: "Repository Activity",
    category: "newsletter",
    unsubscribeUrl: "https://github.com/settings/notifications",
    count: 89,
    lastReceived: "2024-01-11",
    canUnsubscribe: true,
  },
];

const categoryColors = {
  newsletter: "bg-blue-100 text-blue-800",
  promotion: "bg-green-100 text-green-800",
  social: "bg-purple-100 text-purple-800",
  spam: "bg-red-100 text-red-800",
};

const categoryIcons = {
  newsletter: Mail,
  promotion: "💰",
  social: "👥",
  spam: AlertCircle,
};

export default function EmailCleanupWorkflow() {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedEmails, setProcessedEmails] = useState<string[]>([]);

  const filteredEmails = mockEmails.filter((email) => {
    const matchesSearch =
      email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || email.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredEmails.map((email) => email.id));
    }
  };

  const handleBulkUnsubscribe = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessedEmails((prev) => [...prev, ...selectedEmails]);
    setSelectedEmails([]);
    setIsProcessing(false);
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessedEmails((prev) => [...prev, ...selectedEmails]);
    setSelectedEmails([]);
    setIsProcessing(false);
  };

  return (
    <div className="bg-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Email Cleanup</h2>
          <p className="text-gray-600">Manage your subscriptions and unwanted emails</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleBulkUnsubscribe}
            disabled={selectedEmails.length === 0 || isProcessing}
            className="flex items-center gap-2"
          >
            <Unlink className="w-4 h-4" />
            {isProcessing ? "Processing..." : `Unsubscribe (${selectedEmails.length})`}
          </Button>
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedEmails.length === 0 || isProcessing}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selectedEmails.length})
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search emails by sender or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "newsletter" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("newsletter")}
              >
                Newsletters
              </Button>
              <Button
                variant={selectedCategory === "promotion" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("promotion")}
              >
                Promotions
              </Button>
              <Button
                variant={selectedCategory === "spam" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("spam")}
              >
                Spam
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Found {filteredEmails.length} email senders
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedEmails.length === filteredEmails.length && filteredEmails.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEmails.map((email) => {
              const IconComponent = categoryIcons[email.category as keyof typeof categoryIcons];
              const isProcessed = processedEmails.includes(email.id);

              return (
                <div
                  key={email.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                    isProcessed ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                  }`}
                >
                  <Checkbox
                    checked={selectedEmails.includes(email.id)}
                    onCheckedChange={() => handleSelectEmail(email.id)}
                    disabled={isProcessed}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {typeof IconComponent === "string" ? (
                          <span className="text-lg">{IconComponent}</span>
                        ) : (
                          <IconComponent className="w-4 h-4" />
                        )}
                        <span className="font-medium truncate">{email.sender}</span>
                      </div>
                      <Badge
                        className={categoryColors[email.category as keyof typeof categoryColors]}
                      >
                        {email.category}
                      </Badge>
                      {isProcessed && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Processed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{email.subject}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{email.count} emails</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {email.lastReceived}
                      </span>
                      {email.canUnsubscribe ? (
                        <span className="text-green-600">✓ Can unsubscribe</span>
                      ) : (
                        <span className="text-red-600">⚠ Manual removal needed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {mockEmails.reduce((sum, email) => sum + email.count, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Emails</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {mockEmails.filter((email) => email.canUnsubscribe).length}
            </div>
            <p className="text-sm text-gray-600">Can Unsubscribe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {mockEmails.filter((email) => !email.canUnsubscribe).length}
            </div>
            <p className="text-sm text-gray-600">Manual Removal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{processedEmails.length}</div>
            <p className="text-sm text-gray-600">Processed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
