import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

describe('AuthService - Tests Simples (Explication pour le Jury)', () => {

  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: API_BASE_URL, useValue: 'http://localhost:8080/api' } // Fausse URL pour le test
      ]
    });
    service = TestBed.inject(AuthService);
  });

  // --- TEST N°1 ---
  it('1. Doit vérifier que le service AuthService est bien créé', () => {
    expect(service).toBeTruthy();
  });

  // --- TEST N°2 ---
  it('2. hasPhoto() doit retourner FAUX si on ne donne pas de photo (null ou vide)', () => {
    const resultatNull = service.hasPhoto(null);
    const resultatVide = service.hasPhoto('');

    expect(resultatNull).toBe(false);
    expect(resultatVide).toBe(false);
  });

  // --- TEST N°3 ---
  it('3. hasPhoto() doit retourner VRAI si on lui donne un vrai lien de photo', () => {
    // vérifie que la methode connait bien une image existante
    const vraiCheminPhoto = '/uploads/mon-image-de-profil.jpg';
    
    const resultat = service.hasPhoto(vraiCheminPhoto);

    expect(resultat).toBe(true); 
  });

  // --- TEST N°4 ---
  it('4. hasPhoto() doit retourner FAUX si c\'est l\'image par défaut (placeholder)', () => {
    //Si user a l'avatar par defaut de lapp, on considère qu'il n'a pas de photo personaliser
    const cheminImageParDefaut = 'default-avatar.png';
    
    const resultat = service.hasPhoto(cheminImageParDefaut);

    expect(resultat).toBe(false); // On s'attend à ce que ce soit Faux
  });

});
