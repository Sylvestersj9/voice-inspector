import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChevronLeft,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Users,
  MessageSquare,
  BarChart3,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  source: string;
  created_at: string;
}

interface User {
  id: string;
  name: string | null;
  role: string | null;
  home_name: string | null;
  created_at: string;
}

interface Subscription {
  user_id: string;
  status: string;
  stripe_subscription_id: string | null;
}

interface Feedback {
  id: string;
  name: string | null;
  email: string;
  message: string;
  rating: number | null;
  status: string;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  paidSubscribers: number;
  trialUsers: number;
  totalSessions: number;
  sessionsToday: number;
  totalResponses: number;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Knowledge Base state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<string>("Ofsted report");
  const [content, setContent] = useState("");

  // Overview state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(0);

  // Feedback state
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // General loading
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, source, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/get-admin-stats`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
      toast({
        title: "Failed to load stats",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const [{ data: usersData, error: usersErr }, { data: subsData, error: subsErr }] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, role, home_name, created_at")
          .order("created_at", { ascending: false })
          .range(usersPage * 20, usersPage * 20 + 19),
        supabase.from("subscriptions").select("user_id, status, stripe_subscription_id"),
      ]);

      if (usersErr || subsErr) throw new Error("Failed to load users");
      setUsers(usersData || []);
      setSubscriptions(subsData || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast({
        title: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  }, [toast, usersPage]);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error("Failed to load feedback:", err);
      toast({
        title: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setFeedbackLoading(false);
    }
  }, [toast]);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and content",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ title, source, content }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      toast({
        title: "Document uploaded",
        description: `Created ${data.chunksCreated} searchable chunks`,
      });

      setTitle("");
      setContent("");
      loadDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, usersPage]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Mark loading as done when all initial data is loaded
  useEffect(() => {
    if (!uploading && !statsLoading && !usersLoading && !feedbackLoading) {
      setLoading(false);
    }
  }, [uploading, statsLoading, usersLoading, feedbackLoading]);

  // Auth guard - after all hooks
  if (user?.user_metadata?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  const handleDelete = async (docId: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", docId);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Document deleted" });
      loadDocuments();
    }
  };

  const getSubStatus = (userId: string) => {
    const sub = subscriptions.find(s => s.user_id === userId);
    if (!sub) return "No subscription";
    if (sub.status === "active" || (sub.status === "trialing" && sub.stripe_subscription_id)) {
      return "Paid";
    }
    return "Trial";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1 mb-4">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="font-display text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">Platform overview, user management, feedback, and knowledge base.</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <FileText className="h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Users", value: stats.totalUsers },
                  { label: "Paid Subscribers", value: stats.paidSubscribers },
                  { label: "Trial Users", value: stats.trialUsers },
                  { label: "Total Sessions", value: stats.totalSessions },
                  { label: "Sessions Today", value: stats.sessionsToday },
                  { label: "Total Responses", value: stats.totalResponses },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-teal-700 mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-teal-600">
                        <th className="px-6 py-3 text-left font-semibold text-teal-50">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-teal-50">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-teal-50">Home</th>
                        <th className="px-6 py-3 text-left font-semibold text-teal-50">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-teal-50">Signed up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{u.name || "—"}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{u.role || "—"}</td>
                          <td className="px-6 py-3 text-slate-600">{u.home_name || "—"}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                getSubStatus(u.id) === "Paid"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : getSubStatus(u.id) === "Trial"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                            >
                              {getSubStatus(u.id)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-sm">
                            {new Date(u.created_at).toLocaleDateString("en-GB")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Showing {usersPage * 20 + 1}–{Math.min((usersPage + 1) * 20, stats?.totalUsers || 0)} of{" "}
                    {stats?.totalUsers || 0} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                      disabled={usersPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsersPage(p => p + 1)}
                      disabled={(usersPage + 1) * 20 >= (stats?.totalUsers || 0)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No users yet</p>
              </div>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : feedback.length > 0 ? (
              <div className="space-y-3">
                {feedback.map(f => (
                  <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900">{f.name || "Anonymous"}</p>
                          {f.rating && (
                            <span className="text-sm text-amber-600">★ {f.rating}/5</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{f.email}</p>
                        <p className="text-sm text-slate-700">{f.message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(f.created_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 ${
                          f.status === "received"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : f.status === "sent"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No feedback yet</p>
              </div>
            )}
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            {/* Upload Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Add reference document</h2>
              <p className="text-sm text-slate-600">
                Paste the text from your document (e.g., latest Ofsted report, action plan, policies, evidence logs). The
                content will be chunked and embedded for retrieval in evaluations.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Title</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., 2024 Ofsted Full Inspection Report"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">Document type</label>
                  <select
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
                  >
                    <option value="Ofsted report">Ofsted report</option>
                    <option value="Inspection action plan">Inspection action plan</option>
                    <option value="Policy/Procedure">Policy/Procedure</option>
                    <option value="Evidence/Logs">Evidence/Logs</option>
                    <option value="Internal Guidance">Internal Guidance</option>
                    <option value="SCCIF/Regulations">SCCIF/Regulations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Content</label>
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste the full text from your report/policy/evidence. Remove names or personal identifiers."
                  className="min-h-[200px]"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Content is automatically chunked and embedded for semantic search. Do not include personal identifiers.
                </p>
              </div>

              <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Embed
                  </>
                )}
              </Button>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Knowledge base documents ({documents.length})
              </h2>

              {documents.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{doc.title}</p>
                        <p className="text-sm text-slate-600">
                          {doc.source} - {new Date(doc.created_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
