<?php

namespace App\Controllers;

use App\Models\Document;
use App\Core\Response;

class DocumentController
{
    private Document $model;

    public function __construct()
    {
        $this->model = new Document();
    }

    /**
     * GET /api/documents — list all documents (metadata only)
     */
    public function index($request): void
    {
        $filters = [
            'document_type' => $request->query('type'),
            'asset_code'    => $request->query('asset_code'),
            'search'        => $request->query('search'),
        ];

        $docs = $this->model->getAll($filters);

        foreach ($docs as &$doc) {
            $doc['file_size_display'] = $this->formatFileSize((int)$doc['file_size']);
        }

        Response::success($docs, 'Documents retrieved');
    }

    /**
     * GET /api/documents/{id} — get document metadata
     */
    public function show($request): void
    {
        $id = (int) $request->param('id');
        $doc = $this->model->getMeta($id);

        if (!$doc) {
            Response::notFound('Document not found');
            return;
        }

        $doc['file_size_display'] = $this->formatFileSize((int)$doc['file_size']);
        Response::success($doc, 'Document retrieved');
    }

    /**
     * GET /api/documents/{id}/download — download the actual file as base64
     */
    public function download($request): void
    {
        $id = (int) $request->param('id');
        $doc = $this->model->getWithData($id);

        if (!$doc) {
            Response::notFound('Document not found');
            return;
        }

        $fileData = $doc['file_data'];

        // Handle PostgreSQL bytea resource stream
        if (is_resource($fileData)) {
            $fileData = stream_get_contents($fileData);
        }

        Response::success([
            'id'                => $doc['id'],
            'original_filename' => $doc['original_filename'],
            'mime_type'         => $doc['mime_type'],
            'file_size'         => $doc['file_size'],
            'file_data'         => base64_encode($fileData),
        ], 'File data retrieved');
    }

    /**
     * POST /api/documents — upload a new document
     * Accepts multipart/form-data
     */
    public function store($request): void
    {
        $errors = [];

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $errors['file'] = ['A valid file is required'];
        }

        $documentType = $_POST['document_type'] ?? '';
        if (!in_array($documentType, ['invoice', 'service_bill', 'warranty', 'other'])) {
            $errors['document_type'] = ['Must be: invoice, service_bill, warranty, or other'];
        }

        $title = trim($_POST['title'] ?? '');
        if (empty($title)) {
            $errors['title'] = ['Title is required'];
        }

        if ($errors) {
            Response::validationError($errors);
            return;
        }

        $file = $_FILES['file'];

        // Validate MIME type
        $allowedMimes = [
            'application/pdf',
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedMimes)) {
            Response::validationError(['file' => ['File type not allowed. Accepted: PDF, images, Word, Excel']]);
            return;
        }

        // Max 10MB
        if ($file['size'] > 10 * 1024 * 1024) {
            Response::validationError(['file' => ['File size exceeds 10MB limit']]);
            return;
        }

        $fileContent = file_get_contents($file['tmp_name']);
        $user = $request->user();

        $data = [
            'asset_code'        => !empty($_POST['asset_code']) ? $_POST['asset_code'] : null,
            'document_type'     => $documentType,
            'title'             => $title,
            'original_filename' => $file['name'],
            'mime_type'         => $mimeType,
            'file_size'         => $file['size'],
            'file_data'         => $fileContent,
            'notes'             => $_POST['notes'] ?? null,
            'uploaded_by'       => $user['sub'] ?? null,
        ];

        $doc = $this->model->store($data);
        $doc['file_size_display'] = $this->formatFileSize((int)$doc['file_size']);

        Response::success($doc, 'Document uploaded successfully', 201);
    }

    /**
     * DELETE /api/documents/{id}
     */
    public function destroy($request): void
    {
        $id = (int) $request->param('id');
        $doc = $this->model->getMeta($id);

        if (!$doc) {
            Response::notFound('Document not found');
            return;
        }

        $this->model->destroy($id);
        Response::success(null, 'Document deleted successfully');
    }

    /**
     * GET /api/documents/stats
     */
    public function stats($request): void
    {
        $stats = $this->model->getStats();
        Response::success($stats, 'Document statistics');
    }

    private function formatFileSize(int $bytes): string
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}
