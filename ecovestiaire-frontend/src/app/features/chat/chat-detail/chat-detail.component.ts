import {
  Component, OnInit, OnDestroy, inject, signal,
  ViewChild, ElementRef, AfterViewChecked, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../services/chat.service';
import { MessageResponse } from '../../../models/chat.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const EMOJI_LIST = [
  '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎',
  '❤️', '🔥', '💯', '🙌', '👏', '🎉', '✅', '❌', '💪', '🤝',
  '😊', '😇', '🤩', '😜', '😴', '🥶', '😷', '🤗', '😏', '🙃',
  '👀', '💀', '🫡', '🙏', '💬', '📦', '⭐', '🛍️', '💸', '🎁'
];

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatDialogModule],
  template: `
    <div class="min-h-screen bg-white flex flex-col h-screen w-full border-t-[4px] border-balawi-bg">

      <!-- ══ HEADER ══ -->
      <div class="h-20 bg-white border-b-[6px] border-balawi-bg px-4 md:px-10 flex items-center gap-6 shrink-0 z-20 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <button routerLink="/messages"
          class="w-12 h-12 border-[3px] border-balawi-bg text-balawi-bg flex items-center justify-center hover:bg-balawi-neon transition-all shadow-[4px_4px_0px_0px_#A3FF12] active:translate-x-1 active:translate-y-1 active:shadow-none shrink-0 italic font-bold">
          <mat-icon>arrow_back</mat-icon>
        </button>

        <div class="flex items-center gap-5 flex-1 min-w-0">
          <!-- Avatar -->
          <div class="w-12 h-12 border-[3px] border-balawi-bg flex items-center justify-center overflow-hidden shrink-0 bg-white shadow-[3px_3px_0px_0px_#0B0B0B]">
            <img *ngIf="authService.hasPhoto(otherUserPhoto()); else noPhotoHeader"
              [src]="otherUserPhoto()" class="w-full h-full object-cover" [alt]="otherUserName()">
            <ng-template #noPhotoHeader>
              <mat-icon class="text-balawi-bg">person</mat-icon>
            </ng-template>
          </div>

          <!-- Admin Style Navigation Alert -->
          <div class="border-l-[6px] border-balawi-neon pl-5 py-1 min-w-0">
            <h1 class="font-heading text-lg md:text-xl text-balawi-bg uppercase tracking-tight leading-none truncate font-black italic">
              {{ otherUserName() }}
            </h1>
            <p *ngIf="itemTitle()"
              class="font-slogan text-[10px] text-balawi-bg/40 uppercase tracking-[0.2em] mt-1.5 truncate font-bold italic">
              {{ itemTitle() }}
            </p>
          </div>
        </div>
      </div>

      <!-- ══ MESSAGES AREA ══ -->
      <div #scrollContainer class="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-6 space-y-4 no-scrollbar">

        <!-- Loading -->
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20 gap-6">
          <div class="brutalist-loader">
            <div class="loader-box bg-balawi-neon"></div>
            <div class="loader-box bg-balawi-neon"></div>
            <div class="loader-box bg-balawi-neon"></div>
          </div>
          <p class="font-heading text-balawi-bg uppercase tracking-[0.3em] text-[10px] animate-pulse italic">SYNC EN COURS...</p>
        </div>

        <!-- Empty state -->
        <div *ngIf="!isLoading() && messages().length === 0" class="flex flex-col items-center justify-center py-20 gap-6 text-center">
          <div class="w-16 h-16 bg-balawi-bg text-balawi-neon flex items-center justify-center shadow-[8px_8px_0px_0px_#A3FF12] rotate-12">
            <mat-icon class="!text-3xl">chat_bubble</mat-icon>
          </div>
          <div class="space-y-2">
            <p class="font-heading text-balawi-bg uppercase tracking-widest text-sm italic">DÉBUT DU FIL</p>
            <div class="w-20 h-1.5 bg-balawi-neon mx-auto"></div>
          </div>
        </div>

        <!-- Messages -->
        <div
          *ngFor="let msg of messages()"
          class="flex items-end gap-3"
          [class.flex-row-reverse]="isFromMe(msg)"
        >
          <!-- Bubble -->
          <div class="max-w-[85%] sm:max-w-[75%] flex flex-col gap-1" [class.items-end]="isFromMe(msg)">

            <!-- Context menu button (show on hover) + bubble -->
            <div class="group relative">
              <!-- Options button (only for own messages) -->
              <div *ngIf="isFromMe(msg)"
                class="absolute -top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                <button (click)="startEdit(msg)"
                  class="w-8 h-8 bg-white border-[2px] border-balawi-bg text-balawi-bg flex items-center justify-center hover:bg-balawi-neon transition-all shadow-[3px_3px_0px_0px_#0B0B0B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  title="Modifier">
                  <mat-icon style="font-size:14px;width:14px;height:14px;" class="!flex !items-center !justify-center">edit</mat-icon>
                </button>
                <button (click)="confirmDelete(msg)"
                  class="w-8 h-8 bg-white border-[2px] border-balawi-bg text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-[3px_3px_0px_0px_#0B0B0B] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  title="Supprimer">
                  <mat-icon style="font-size:14px;width:14px;height:14px;" class="!flex !items-center !justify-center">delete</mat-icon>
                </button>
              </div>

              <!-- Message bubble -->
              <div
                class="px-5 py-3 border-[3px] transition-all"
                [ngClass]="isFromMe(msg)
                  ? 'bg-balawi-bg text-white border-balawi-bg shadow-[6px_6px_0px_0px_#A3FF12] rounded-tl-xl rounded-tr-xl rounded-bl-xl'
                  : 'bg-white text-balawi-bg border-balawi-bg shadow-[6px_6px_0px_0px_#0B0B0B] rounded-tl-xl rounded-tr-xl rounded-br-xl'"
              >
                <p class="font-slogan text-sm md:text-base leading-relaxed break-words italic">{{ msg.content }}</p>

                <div class="flex items-center gap-3 mt-2 border-t border-current/10 pt-1.5" [class.justify-end]="isFromMe(msg)">
                  <span *ngIf="msg.editedAt"
                    class="font-heading text-[7px] uppercase tracking-widest opacity-40 italic font-bold">MODIFIÉ</span>
                  <span class="font-heading text-[8px] uppercase tracking-[0.2em] opacity-40 italic font-bold">
                    {{ msg.createdAt | date:'HH:mm' }}
                  </span>
                  <mat-icon *ngIf="isFromMe(msg)"
                    class="!text-[10px] !w-3.5 !h-3.5 flex items-center justify-center"
                    [class.text-balawi-neon]="msg.read"
                    [class.opacity-40]="!msg.read">
                    {{ msg.read ? 'done_all' : 'done' }}
                  </mat-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ EDIT BANNER ══ -->
      <div *ngIf="editingMsg()" class="border-t-[4px] border-balawi-neon bg-balawi-neon/20 px-6 py-3 flex items-center gap-4 shrink-0 z-10">
        <div class="w-8 h-8 bg-balawi-bg text-balawi-neon flex items-center justify-center shrink-0">
          <mat-icon class="!text-sm">edit</mat-icon>
        </div>
        <span class="font-heading text-[10px] text-balawi-bg uppercase tracking-widest flex-1 truncate italic font-bold">
          MODIFIER: {{ editingMsg()?.content }}
        </span>
        <button (click)="cancelEdit()" class="w-8 h-8 bg-balawi-bg text-balawi-neon flex items-center justify-center hover:bg-black transition-all active:scale-90">
          <mat-icon style="font-size:16px;width:16px;height:16px;" class="!flex !items-center !justify-center">close</mat-icon>
        </button>
      </div>

      <!-- ══ INPUT AREA ══ -->
      <div class="border-t-[4px] border-balawi-bg bg-white px-4 py-4 md:px-6 md:py-6 shrink-0 z-20">

        <!-- Emoji Picker -->
        <div *ngIf="showEmojis()"
          class="mb-4 border-[4px] border-balawi-bg bg-white p-4 shadow-[10px_10px_0px_0px_#A3FF12] flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar">
          <button
            *ngFor="let emoji of emojiList"
            (click)="insertEmoji(emoji)"
            class="w-10 h-10 text-xl flex items-center justify-center hover:bg-balawi-neon transition-all border-[2px] border-transparent hover:border-balawi-bg active:scale-90">
            {{ emoji }}
          </button>
        </div>

        <form (ngSubmit)="send()" class="flex items-center gap-4">

          <!-- Emoji button -->
          <button type="button" (click)="toggleEmojis()"
            class="w-12 h-12 md:w-14 md:h-14 border-[3px] flex items-center justify-center transition-all shrink-0 shadow-[4px_4px_0px_0px_#0B0B0B] active:translate-x-1 active:translate-y-1 active:shadow-none"
            [ngClass]="showEmojis() ? 'bg-balawi-neon border-balawi-bg' : 'bg-white border-balawi-bg text-balawi-bg hover:bg-balawi-neon'">
            <mat-icon class="!text-2xl !w-8 !h-8 !flex !items-center !justify-center">sentiment_satisfied</mat-icon>
          </button>

          <!-- Input -->
          <div class="flex-1 relative">
            <input
              #messageInput
              type="text"
              [(ngModel)]="newMessage"
              name="message"
              [placeholder]="editingMsg() ? 'Modifier message...' : 'ÉCRIRE UN MESSAGE...'"
              class="w-full border-[3px] border-balawi-bg bg-white font-heading text-sm md:text-base text-balawi-bg uppercase tracking-widest py-3 md:py-4 px-6 focus:outline-none focus:border-balawi-neon transition-all italic"
              autocomplete="off"
              (keydown.escape)="cancelEdit()"
            >
          </div>

          <!-- Send / Save button -->
          <button
            type="submit"
            [disabled]="!newMessage.trim() || isSending()"
            class="w-12 h-12 md:w-14 md:h-14 border-[3px] border-balawi-bg flex items-center justify-center transition-all shrink-0 shadow-[4px_4px_0px_0px_#0B0B0B] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
            [ngClass]="editingMsg() ? 'bg-balawi-neon text-balawi-bg' : 'bg-balawi-bg text-balawi-neon'">
            <mat-icon *ngIf="!isSending()" class="!text-2xl !w-8 !h-8 !flex !items-center !justify-center">{{ editingMsg() ? 'check' : 'send' }}</mat-icon>
            <div *ngIf="isSending()" class="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
          </button>
        </form>
      </div>

    </div>
  `
})
export class ChatDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  public authService = inject(AuthService);
  private dialog = inject(MatDialog);

  messages = signal<MessageResponse[]>([]);
  isLoading = signal(true);
  isSending = signal(false);
  newMessage = '';
  conversationId: number = 0;

  otherUserName = signal('');
  otherUserPhoto = signal('');
  itemTitle = signal('');

  editingMsg = signal<MessageResponse | null>(null);
  showEmojis = signal(false);
  emojiList = EMOJI_LIST;

  private msgSubscription?: Subscription;
  private shouldScroll = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.conversationId = +params['id'];
      this.loadMessages();
      this.loadConversationInfo();
    });

    // Écouter les nouveaux messages via WebSocket
    this.msgSubscription = this.chatService.message$.subscribe(msg => {
      if (msg && msg.conversationId === this.conversationId) {

        // Cas suppression (content === null)
        if (msg.content === null) {
          this.messages.update(current => current.filter(m => m.id !== msg.id));
          return;
        }

        // Cas édition (message existant)
        const existingIndex = this.messages().findIndex(m => m.id === msg.id);
        if (existingIndex >= 0) {
          this.messages.update(current => {
            const updated = [...current];
            updated[existingIndex] = msg;
            return updated;
          });
          return;
        }

        // Cas nouveau message (dédupliquer)
        this.messages.update(current => [...current, msg]);
        this.shouldScroll = true;
      }
    });
  }

  ngOnDestroy() {
    this.msgSubscription?.unsubscribe();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadMessages() {
    this.isLoading.set(true);
    this.chatService.getConversationMessages(this.conversationId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.isLoading.set(false);
        this.shouldScroll = true;
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadConversationInfo() {
    this.chatService.getConversations().subscribe(convs => {
      const current = convs.find(c => c.id === this.conversationId);
      if (current) {
        this.otherUserName.set(`${current.otherUserFirstName} ${current.otherUserLastName}`);
        this.otherUserPhoto.set(this.authService.toAbsoluteUrl(current.otherUserProfilePhotoUrl) || '');
        this.itemTitle.set(current.itemTitle);
      }
    });
  }

  isFromMe(msg: MessageResponse): boolean {
    const user = this.authService.getCurrentUser();
    return msg.senderId === user?.id;
  }

  // ── SEND / EDIT ──

  send() {
    const content = this.newMessage.trim();
    if (!content || this.isSending()) return;

    const editing = this.editingMsg();
    if (editing) {
      this.saveEdit(editing, content);
    } else {
      this.sendNew(content);
    }
  }

  private sendNew(content: string) {
    this.isSending.set(true);
    this.chatService.sendMessage(this.conversationId, content).subscribe({
      next: (msg) => {
        this.messages.update(current => [...current, msg]);
        this.newMessage = '';
        this.isSending.set(false);
        this.shouldScroll = true;
        this.chatService.getConversations().subscribe();
      },
      error: () => this.isSending.set(false)
    });
  }

  startEdit(msg: MessageResponse) {
    this.editingMsg.set(msg);
    this.newMessage = msg.content ?? '';
    this.showEmojis.set(false);
    setTimeout(() => this.messageInput?.nativeElement.focus(), 50);
  }

  private saveEdit(msg: MessageResponse, content: string) {
    this.isSending.set(true);
    this.chatService.updateMessage(msg.id, content).subscribe({
      next: (updated) => {
        this.messages.update(current =>
          current.map(m => m.id === updated.id ? updated : m)
        );
        this.newMessage = '';
        this.editingMsg.set(null);
        this.isSending.set(false);
      },
      error: () => this.isSending.set(false)
    });
  }

  cancelEdit() {
    this.editingMsg.set(null);
    this.newMessage = '';
  }

  // ── DELETE ──

  confirmDelete(msg: MessageResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'SUPPRIMER MESSAGE ?',
        message: 'CETTE ACTION EST IRRÉVERSIBLE. LE MESSAGE SERA DÉFINITIVEMENT SUPPRIMÉ.',
        confirmText: 'SUPPRIMER',
        cancelText: 'ANNULER'
      },
      panelClass: 'brutalist-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.chatService.deleteMessage(msg.id).subscribe({
          next: () => {
            this.messages.update(current => current.filter(m => m.id !== msg.id));
          },
          error: (err) => console.error('Erreur suppression', err)
        });
      }
    });
  }

  // ── EMOJI ──

  toggleEmojis() {
    this.showEmojis.update(v => !v);
  }

  insertEmoji(emoji: string) {
    this.newMessage += emoji;
    this.messageInput?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showEmojis()) this.showEmojis.set(false);
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
