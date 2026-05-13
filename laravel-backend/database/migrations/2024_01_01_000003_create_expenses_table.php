<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('category');
            $table->string('subcategory')->nullable();
            $table->string('vendor')->nullable();
            $table->text('description')->nullable();
            $table->bigInteger('amount_cents');
            $table->date('expense_date');
            $table->string('receipt_url')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('category');
            $table->index('expense_date');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
