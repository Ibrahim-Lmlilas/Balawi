import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      overflow-x: hidden;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    profilePicture: [null]
  });

  errorMessage: string = '';
  isLoading: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const formData = new FormData();
      formData.append('firstName', this.registerForm.get('firstName')?.value);
      formData.append('lastName', this.registerForm.get('lastName')?.value);
      formData.append('email', this.registerForm.get('email')?.value);
      formData.append('password', this.registerForm.get('password')?.value);
      
      if (this.selectedFile) {
        formData.append('profilePicture', this.selectedFile);
      }
      
      this.authService.register(formData).subscribe({
        next: () => {
          const email = this.registerForm.get('email')?.value as string;
          const password = this.registerForm.get('password')?.value as string;
          
          this.authService.login({ email, password }).subscribe({
            next: (response) => {
              this.authService.handleAuthentication(response, false);
              this.router.navigate(['/']);
            },
            error: () => {
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 409) {
            this.errorMessage = "Cet email est déjà utilisé. Veuillez vous connecter.";
          } else {
            this.errorMessage = "Une erreur est survenue lors de l'inscription.";
          }
          console.error('Register error', err);
        }
      });
    }
  }
}
