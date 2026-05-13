<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'project_name',
        'service_type',
        'client_id',
        'revenue_cents',
        'project_cost_cents',
        'amount_paid_cents',
        'payment_status',
        'payment_method',
        'invoice_date',
        'due_date',
        'paid_date',
        'notes',
        'attachment_url',
    ];

    protected $casts = [
        'invoice_date'        => 'date',
        'due_date'            => 'date',
        'paid_date'           => 'date',
        'revenue_cents'       => 'integer',
        'project_cost_cents'  => 'integer',
        'amount_paid_cents'   => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    // Computed accessor
    public function getProfitCentsAttribute(): int
    {
        return $this->revenue_cents - $this->project_cost_cents;
    }
}
