import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { FeedbackFormData, FeedbackType, FeedbackOutcome } from "@/types/feedback";
import { supabase } from "@/lib/supabase";

export default function FeedbackSubmission() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || undefined;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: "inspection",
    title: "",
    description: "",
    outcome: undefined,
    keyLearning: "",
    homeSetting: "",
    roleAtTime: "",
    sessionId,
    isAnonymised: true,
    consentToShare: false,
  });

  const handleChange = (field: keyof FeedbackFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!session?.access_token) {
        throw new Error("No session token available");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-inspection-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      setSubmitted(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/app/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Feedback submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank you!</h1>
          <p className="text-slate-600 mb-6">
            Your feedback has been submitted successfully. We'll review it and may feature it in our public gallery.
          </p>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Share Your Experience</h1>
          <p className="text-slate-600">
            Help other childcare leaders by sharing feedback from your inspection or interview.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                What type of feedback?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["inspection", "fit_person", "practice"] as FeedbackType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("feedbackType", type)}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                      formData.feedbackType === type
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="E.g., 'What I learned from my Ofsted inspection'"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
                Your experience *
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Share what happened, what you learned, and what helped you prepare (or would have helped)..."
                rows={6}
                className="resize-none"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Minimum 50 characters</p>
            </div>

            {/* Outcome */}
            <div>
              <label htmlFor="outcome" className="block text-sm font-semibold text-slate-900 mb-2">
                Outcome (optional)
              </label>
              <select
                id="outcome"
                value={formData.outcome || ""}
                onChange={(e) => handleChange("outcome", e.target.value || undefined)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select outcome...</option>
                <option value="outstanding">Outstanding</option>
                <option value="good">Good</option>
                <option value="requires_improvement">Requires Improvement</option>
                <option value="inadequate">Inadequate</option>
                <option value="passed">Passed (Interview)</option>
                <option value="needs_work">Needs Work</option>
                <option value="preparing">Still Preparing</option>
              </select>
            </div>

            {/* Key Learning */}
            <div>
              <label htmlFor="keyLearning" className="block text-sm font-semibold text-slate-900 mb-2">
                Key learning (optional)
              </label>
              <input
                id="keyLearning"
                type="text"
                value={formData.keyLearning || ""}
                onChange={(e) => handleChange("keyLearning", e.target.value)}
                placeholder="E.g., 'Safeguarding documentation was the biggest gap'"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Home Setting & Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="homeSetting" className="block text-sm font-semibold text-slate-900 mb-2">
                  Setting type (optional)
                </label>
                <input
                  id="homeSetting"
                  type="text"
                  value={formData.homeSetting || ""}
                  onChange={(e) => handleChange("homeSetting", e.target.value)}
                  placeholder="E.g., Residential, Supported Living"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="roleAtTime" className="block text-sm font-semibold text-slate-900 mb-2">
                  Your role (optional)
                </label>
                <input
                  id="roleAtTime"
                  type="text"
                  value={formData.roleAtTime || ""}
                  onChange={(e) => handleChange("roleAtTime", e.target.value)}
                  placeholder="E.g., Manager, Deputy, Staff"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnonymised}
                  onChange={(e) => handleChange("isAnonymised", e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm text-slate-900">Keep my identity private</p>
                  <p className="text-xs text-slate-600">Your name and home won't be published</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentToShare}
                  onChange={(e) => handleChange("consentToShare", e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm text-slate-900">Share in public gallery</p>
                  <p className="text-xs text-slate-600">Help other leaders by sharing (anonymised)</p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </button>

            {/* Help Text */}
            <p className="text-xs text-slate-500 text-center">
              Your feedback helps us improve MockOfsted and supports other care leaders.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
