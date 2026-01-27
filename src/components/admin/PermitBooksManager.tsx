import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, FileText, Trash2, RefreshCw, Loader2, Download, Eye,
  BookOpen, Search, CheckCircle, XCircle, Clock, Play
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PDFViewerDialog } from "@/components/ui/PDFViewerDialog";

interface TrainingBook {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  category: string;
  target_county: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number | null;
  page_count: number | null;
  is_active: boolean;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "fbc_code", label: "Florida Building Code (FBC)" },
  { value: "permitting_process", label: "Permitting Process Guides" },
  { value: "building_dept", label: "Building Department Procedures" },
  { value: "form_tutorials", label: "Form Completion Tutorials" },
  { value: "inspection", label: "Inspection Checklists" },
  { value: "trade_specific", label: "Trade-Specific Requirements" },
  { value: "hvhz", label: "HVHZ Compliance" },
  { value: "noa_product", label: "NOA/Product Approval Guides" },
  { value: "general", label: "General Reference" },
];

const COUNTIES = [
  { value: "all", label: "All Florida" },
  { value: "palm_beach", label: "Palm Beach County" },
  { value: "broward", label: "Broward County" },
  { value: "miami_dade", label: "Miami-Dade County" },
  { value: "martin", label: "Martin County" },
  { value: "st_lucie", label: "St. Lucie County" },
];

const STATUS_BADGES: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-3 w-3" /> },
  processing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

export default function PermitBooksManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [viewingBook, setViewingBook] = useState<{ url: string; title: string } | null>(null);
  
  // Form state for new upload
  const [newBook, setNewBook] = useState({
    title: "",
    description: "",
    author: "",
    category: "general",
    target_county: "all",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch books
  const { data: books = [], isLoading, refetch } = useQuery({
    queryKey: ["permit-training-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_training_books")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TrainingBook[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (book: TrainingBook) => {
      // Delete file from storage using the stored file path
      const filePath = book.file_url.includes('/') 
        ? book.file_url.split("/").pop() 
        : book.file_url;
      
      if (filePath) {
        await supabase.storage.from("permit-training-books").remove([filePath]);
      }
      
      // Delete database record
      const { error } = await supabase
        .from("permit_training_books")
        .delete()
        .eq("id", book.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permit-training-books"] });
      toast.success("Book deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
  
  // Process book mutation
  const processMutation = useMutation({
    mutationFn: async (book: TrainingBook) => {
      const { data, error } = await supabase.functions.invoke("process-training-book", {
        body: { bookId: book.id },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["permit-training-books"] });
      toast.success(data?.message || "Processing started");
    },
    onError: (error: any) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });

  // File dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!newBook.title) {
        const titleFromFile = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        setNewBook(prev => ({ ...prev, title: titleFromFile }));
      }
    }
  }, [newBook.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile || !newBook.title) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("permit-training-books")
        .upload(fileName, selectedFile);
      
      if (uploadError) throw uploadError;

      // Store just the file path (not full URL) for private bucket access
      // Insert database record with file path
      const { error: dbError } = await supabase
        .from("permit_training_books")
        .insert({
          title: newBook.title,
          description: newBook.description || null,
          author: newBook.author || null,
          category: newBook.category,
          target_county: newBook.target_county,
          file_url: fileName, // Store path, not public URL
          file_name: selectedFile.name,
          file_type: fileExt || "unknown",
          file_size_bytes: selectedFile.size,
          processing_status: "pending",
        });
      
      if (dbError) throw dbError;

      // Reset form
      setNewBook({
        title: "",
        description: "",
        author: "",
        category: "general",
        target_county: "all",
      });
      setSelectedFile(null);
      
      queryClient.invalidateQueries({ queryKey: ["permit-training-books"] });
      toast.success("Book uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || book.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Educational Material
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              ${selectedFile ? "bg-green-50 border-green-300" : ""}
            `}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <FileText className="h-8 w-8" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isDragActive ? "Drop the file here..." : "Drag & drop a PDF, DOC, or TXT file here"}
                </p>
                <p className="text-sm text-muted-foreground">or click to browse (max 50MB)</p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Florida Building Code 8th Edition"
                value={newBook.title}
                onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="e.g., Florida Building Commission"
                value={newBook.author}
                onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newBook.category} 
                onValueChange={(value) => setNewBook(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="county">Target County</Label>
              <Select 
                value={newBook.target_county} 
                onValueChange={(value) => setNewBook(prev => ({ ...prev, target_county: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTIES.map(county => (
                    <SelectItem key={county.value} value={county.value}>{county.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the content and what it covers..."
              value={newBook.description}
              onChange={(e) => setNewBook(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !newBook.title || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Material
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Library Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Training Library ({books.length} materials)
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No training materials found.</p>
              <p className="text-sm">Upload your first guide or PDF above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">County</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Uploaded</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium truncate max-w-xs">{book.title}</p>
                          {book.author && (
                            <p className="text-sm text-muted-foreground">by {book.author}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {CATEGORIES.find(c => c.value === book.category)?.label || book.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {COUNTIES.find(c => c.value === book.target_county)?.label || book.target_county}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatFileSize(book.file_size_bytes)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${STATUS_BADGES[book.processing_status]?.color || "bg-gray-100"} border flex items-center gap-1 w-fit`}>
                          {STATUS_BADGES[book.processing_status]?.icon}
                          {book.processing_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(book.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              // Generate signed URL for private bucket access
                              const { data, error } = await supabase.storage
                                .from('permit-training-books')
                                .createSignedUrl(book.file_url, 3600); // 1-hour expiry
                              
                              if (error) {
                                toast.error("Failed to load document: " + error.message);
                                return;
                              }
                              
                              if (data?.signedUrl) {
                                setViewingBook({ url: data.signedUrl, title: book.title });
                              }
                            }}
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(book.processing_status === 'pending' || book.processing_status === 'failed') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => processMutation.mutate(book)}
                              disabled={processMutation.isPending}
                              title="Process Now"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {processMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(book)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        open={!!viewingBook}
        onOpenChange={(open) => !open && setViewingBook(null)}
        url={viewingBook?.url || ''}
        title={viewingBook?.title || 'Training Book'}
        filename={`${viewingBook?.title || 'book'}.pdf`}
      />
    </div>
  );
}
