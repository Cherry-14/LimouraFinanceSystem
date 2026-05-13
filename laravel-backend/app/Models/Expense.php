<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'category', 'subcategory', 'vendor', 'description',
        'amount_cents', 'expense_date', 'receipt_url',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount_cents' => 'integer',
    ];
}
