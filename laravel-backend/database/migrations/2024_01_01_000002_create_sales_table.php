<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number')->unique();
            $table->string('project_name');
            $table->string('service_type');
            $table->foreignUuid('client_id')->constrained('clients');

            // All amounts in cents (integer)
            $table->bigInteger('revenue_cents');
            $table->bigInteger('project_cost_cents')->default(0);
            $table->bigInteger('amount_paid_cents')->default(0);

            $table->enum('payment_status', ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])->default('PENDING');
            $table->string('payment_method')->nullable();

            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();

            $table->text('notes')->nullable();
            $table->string('attachment_url')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('invoice_date');
            $table->index('payment_status');
            $table->index('service_type');
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
