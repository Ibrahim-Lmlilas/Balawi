import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6 bg-white border-[4px] border-balawi-bg shadow-[8px_8px_0px_0px_#0B0B0B] text-center w-full max-w-sm mx-auto overflow-visible">
      <!-- Icon -->
      <div class="w-20 h-20 rounded-full border-[3px] border-orange-400 flex items-center justify-center mx-auto mb-6">
        <mat-icon class="!text-orange-400 !text-4xl !w-10 !h-10">priority_high</mat-icon>
      </div>

      <h3 class="font-heading text-2xl text-balawi-bg uppercase tracking-tight mb-4 italic">
        {{ data.title }}
      </h3>

      <p class="font-slogan text-xs text-balawi-bg/70 uppercase tracking-widest font-bold leading-relaxed mb-8">
        {{ data.message }}
      </p>

      <div class="flex flex-col sm:flex-row gap-4">
        <button (click)="onConfirm()"
          class="flex-1 py-4 bg-balawi-neon border-[3px] border-balawi-bg font-heading text-balawi-bg uppercase tracking-widest shadow-[4px_4px_0px_0px_#0B0B0B] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all italic font-bold">
          {{ data.confirmText || 'SUPPRIMER' }}
        </button>
        <button (click)="onCancel()"
          class="flex-1 py-4 bg-balawi-bg border-[3px] border-balawi-bg font-heading text-white uppercase tracking-widest shadow-[4px_4px_0px_0px_#A3FF12] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all italic font-bold">
          {{ data.cancelText || 'ANNULER' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
