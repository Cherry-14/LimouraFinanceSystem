<?php

namespace App\Services;

use App\Models\AuditLog;
use Throwable;

class AuditService
{
    /**
     * Audit failures must never block the primary operation.
     */
    public function log(string $action, string $entityType, string $entityId, ?array $payload = null): void
    {
        try {
            AuditLog::create([
                'actor'       => auth()->user()?->email ?? 'admin',
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'payload'     => $payload,
            ]);
        } catch (Throwable $e) {
            logger()->warning('AuditService: failed to write audit log', [
                'error'       => $e->getMessage(),
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
            ]);
        }
    }
}
