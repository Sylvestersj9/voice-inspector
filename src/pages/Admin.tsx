import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Upload, FileText, Trash2, Loader2 } from "lucide-react";

interface Document {
  id: string;
  title: string;
  source: string;
  created_at: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<"SCCIF" | "Regulations" | "Internal Guidance">("SCCIF");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, source, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Missing fields", description: "Please fill in title and content", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, source, content }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      toast({ 
        title: "Document uploaded", 
        description: `Created ${data.chunksCreated} searchable chunks` 
      });
      
      setTitle("");
      setContent("");
      loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "Unknown error", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document deleted" });
      loadDocuments();
    }
  };

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Knowledge Base Admin</h1>
            <p className="text-sm text-muted-foreground">Upload framework documents for grounded evaluation</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Questions? <a className="text-primary underline" href="mailto:reports@ziantra.co.uk">reports@ziantra.co.uk</a>
          </div>
        </div>

        {/* Upload Form */}
        <div className="card-elevated p-6 mb-8 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Add New Document</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., SCCIF Children's Homes Guide"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as typeof source)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="SCCIF">SCCIF</option>
                <option value="Regulations">Regulations</option>
                <option value="Internal Guidance">Internal Guidance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the framework document content here..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Content will be automatically chunked and embedded for semantic search
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
          <h2 className="font-display text-lg font-semibold text-foreground">
            Uploaded Documents ({documents.length})
          </h2>

          {loading ? (
            <div className="card-elevated p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="card-elevated p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{doc.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.source} - {new Date(doc.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


