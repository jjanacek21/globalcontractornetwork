
# Plan: Consolidate AI Training Tab and Add Educational Materials Upload

## Overview

This plan addresses two requests:
1. **Remove the "AI Training" tab** from the Permit Expediting section and add it to the main AI Training Center
2. **Add the ability to upload books/texts** for training people on how to pull construction permits in South Florida

## Current State Analysis

Based on the screenshots and codebase exploration:

| Location | Current Tabs |
|----------|--------------|
| **Permit Expediting** (`PermitExpeditingTab.tsx`) | Permit Queue, AI Training, Analytics |
| **AI Training Center** (`AITrainingCenter.tsx`) | Analytics, Ground Truth, Report Upload, Extracted Products, PDF Sourcing, Templates, Rejections, Smart Docs, Property Data |

The "AI Training" tab in Permit Expediting contains:
- Batch/Single upload mode toggle
- `PermitBatchUploader` component (AI auto-detection for permit packets)
- `PermitTrainingUploader` component (single file upload)
- `TrainingSamplesTable` component (list of training samples with retry logic)

## Implementation Plan

### Phase 1: Move Permit Training Tab to AI Training Center

**File Changes:**

| File | Action |
|------|--------|
| `src/components/admin/AITrainingCenter.tsx` | Add new "Permit Packets" tab with the content from Permit Expediting |
| `src/components/admin/PermitExpeditingTab.tsx` | Remove the "AI Training" tab, change tabs to 2-column layout (Queue + Analytics only) |

**New Tab Structure in AI Training Center:**
```text
[Analytics] [Ground Truth] [Report Upload] [Extracted Products] [PDF Sourcing]
[Templates] [Rejections] [Smart Docs] [Property Data] [Permit Packets] [Books & Guides]
```

### Phase 2: Create Educational Materials Upload Feature

**New Database Table: `permit_training_books`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Book/guide title |
| `description` | TEXT | Description of the content |
| `author` | TEXT | Author name (optional) |
| `category` | TEXT | Category (FBC Code, Permitting Process, Forms Guide, etc.) |
| `target_county` | TEXT | Specific county if applicable, or "all" |
| `file_url` | TEXT | Storage URL |
| `file_name` | TEXT | Original file name |
| `file_type` | TEXT | PDF, EPUB, etc. |
| `file_size_bytes` | INTEGER | File size |
| `page_count` | INTEGER | Number of pages (if known) |
| `is_active` | BOOLEAN | Whether visible to users |
| `processing_status` | TEXT | pending, processing, completed, failed |
| `extracted_text` | TEXT | AI-extracted text for RAG |
| `extracted_chapters` | JSONB | Structured chapter breakdown |
| `created_at` | TIMESTAMPTZ | Upload timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |
| `uploaded_by` | UUID | Admin who uploaded |

**New Component: `PermitBooksManager.tsx`**

Features:
- Drag-and-drop upload zone for PDFs and text files
- Category selector (FBC Code, Permitting Process, Building Departments, etc.)
- County targeting (All Florida, Palm Beach, Broward, Miami-Dade, etc.)
- AI processing to extract text and generate chapter summaries
- Table view of uploaded books with status indicators
- Preview/download functionality
- Delete/archive options

**New Storage Bucket:**
- `permit-training-books` - Private bucket for educational materials

**Categories for South Florida Permit Training:**
1. Florida Building Code (FBC)
2. Permitting Process Guides
3. Building Department Procedures
4. Form Completion Tutorials
5. Inspection Checklists
6. Trade-Specific Requirements
7. HVHZ Compliance
8. NOA/Product Approval Guides

### Phase 3: AI Text Extraction (Optional Enhancement)

Add capability to extract and index text from uploaded books for future RAG-based AI assistance:

- Parse PDF documents using existing document parsing infrastructure
- Store extracted text in the database for full-text search
- Generate chapter summaries using AI

## Technical Details

### File Modifications

**1. `src/components/admin/AITrainingCenter.tsx`**
- Import new components: `PermitBatchUploader`, `PermitTrainingUploader`, `TrainingSamplesTable`, `PermitBooksManager`
- Add new tab triggers for "Permit Packets" and "Books & Guides"
- Add corresponding `TabsContent` sections
- Add state management for upload mode toggle and refresh triggers

**2. `src/components/admin/PermitExpeditingTab.tsx`**
- Remove the "training" tab trigger and content
- Change `TabsList` from 3 columns to 2 columns
- Remove unused imports (`Brain`, `Upload`, `PermitBatchUploader`, `PermitTrainingUploader`, `TrainingSamplesTable`)
- Remove state variables: `trainingRefresh`, `trainingMode`

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/PermitBooksManager.tsx` | Main component for books/guides upload and management |

### Database Migration

```sql
-- Create permit_training_books table
CREATE TABLE IF NOT EXISTS permit_training_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  target_county TEXT DEFAULT 'all',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes INTEGER,
  page_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  processing_status TEXT DEFAULT 'pending',
  extracted_text TEXT,
  extracted_chapters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE permit_training_books ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to permit books" 
  ON permit_training_books FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin management of permit books" 
  ON permit_training_books FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM permit_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Update trigger
CREATE TRIGGER update_permit_training_books_updated_at
  BEFORE UPDATE ON permit_training_books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## UI Preview

After implementation, the AI Training Center will have:

```text
+------------------------------------------------------------------+
| AI Training Center                                                |
+------------------------------------------------------------------+
| [Analytics] [Ground Truth] [Report Upload] [Extracted Products]  |
| [PDF Sourcing] [Templates] [Rejections] [Smart Docs]             |
| [Property Data] [Permit Packets] [Books & Guides]                |
+------------------------------------------------------------------+
```

The "Permit Packets" tab will contain the existing batch/single uploader and samples table.

The "Books & Guides" tab will contain:
- Upload zone for educational PDFs
- Category and county selectors
- Table of uploaded materials with processing status
- Preview and management actions

## Expected Outcomes

1. Cleaner separation of concerns - Permit Expediting focuses on the queue workflow only
2. All AI training features consolidated in one location
3. New capability to upload educational materials for permit training
4. Database storage for extracted text enables future AI-powered search and Q&A

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/components/admin/AITrainingCenter.tsx` |
| Modify | `src/components/admin/PermitExpeditingTab.tsx` |
| Create | `src/components/admin/PermitBooksManager.tsx` |
| Create | Database migration for `permit_training_books` table |
